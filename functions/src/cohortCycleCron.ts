/**
 * reOfferDeferredOnCohortStart — daily cron that batches the
 * "your spot is open again" re-offer to deferred applicants when a
 * new cohort is approaching its start date.
 *
 * The manual workflow already works: staff filters the admin queue
 * by response=deferred and uses the bulk "Re-offer deferred" button.
 * This cron exists for the case where staff misses the window — at
 * STAIJA's cycle volume (a handful of cohorts per year) that's
 * unlikely, but a missed cycle is the kind of thing that costs an
 * applicant their spot when a quiet email could have saved it.
 *
 * Trigger window: planned cohorts whose startDate falls within the
 * next TRIGGER_WINDOW_DAYS (default 21). Each cohort is processed at
 * most once via the `deferredsAutoReOffered` marker on the cohort
 * doc — same idempotency pattern the application-drafts reaper uses
 * for tombstones.
 *
 * Multi-cohort interaction: when two cohorts in the same program are
 * both within the trigger window, the first to process clears the
 * deferred responses, and the second sees no deferred-response apps
 * to re-offer (a no-op). Both end up marked `deferredsAutoReOffered`
 * which is the right state — neither will re-fire on subsequent
 * cron runs.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import { sendMailgun, spotReOfferedEmail } from './emailTemplates'

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_DOMAIN = defineSecret('MAILGUN_DOMAIN')

const TRIGGER_WINDOW_DAYS = 21

function programLabel(program: string): string {
  if (program === 'stepup_scholars') return 'StepUp Scholars'
  if (program === 'dynamerge') return 'Dynamerge'
  return 'STAIJA'
}

interface CohortShape {
  program?: string
  startDate?: admin.firestore.Timestamp | Date
  status?: string
  deferredsAutoReOffered?: boolean
}

interface DeferredApplicationShape {
  userId?: string
  program?: string
  personalInfo?: { firstName?: string; email?: string }
}

/** Coerce Firestore Timestamp / Date into ms epoch. The Cohort
 *  schema stores startDate as a Timestamp; we normalise once so the
 *  arithmetic below is straightforward. */
function toMs(value: admin.firestore.Timestamp | Date | undefined): number | null {
  if (!value) return null
  if (value instanceof Date) return value.getTime()
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as admin.firestore.Timestamp).toMillis()
  }
  return null
}

export const reOfferDeferredOnCohortStart = onSchedule(
  {
    schedule: 'every day 04:30',
    timeZone: 'Africa/Lagos',
    memory: '512MiB',
    timeoutSeconds: 300,
    secrets: [MAILGUN_API_KEY, MAILGUN_DOMAIN],
  },
  async () => {
    const db = admin.firestore()
    const now = Date.now()
    const windowEndMs = now + TRIGGER_WINDOW_DAYS * 24 * 60 * 60 * 1000

    // Pull every planned cohort that hasn't been auto-processed yet.
    // We filter the start-date window client-side rather than via
    // Firestore range queries because cohorts are low-volume (dozens
    // at most) and we'd want a composite index for the multi-where
    // version. Cheap to skim them all.
    const snap = await db
      .collection('cohorts')
      .where('status', '==', 'planned')
      .get()

    const dueCohorts = snap.docs.filter((d) => {
      const c = d.data() as CohortShape
      if (c.deferredsAutoReOffered === true) return false
      const startMs = toMs(c.startDate)
      if (startMs === null) return false
      // Trigger when startDate is within the window — including
      // past-due cohorts (negative delta) so a planned cohort that
      // never flipped to active still gets its deferreds opened.
      return startMs <= windowEndMs
    })

    if (dueCohorts.length === 0) {
      console.log('[reOfferDeferredOnCohortStart] no cohorts in trigger window')
      return
    }

    let cohortsProcessed = 0
    let appsReOffered = 0
    let emailFailures = 0

    for (const cohortDoc of dueCohorts) {
      const cohort = cohortDoc.data() as CohortShape
      if (!cohort.program) continue

      // Find deferred applications scoped to this cohort's program.
      // Deferred is per-application, not per-cohort; the spot was
      // offered for the program in general, not a specific cohort.
      const appsSnap = await db
        .collection('applications')
        .where('program', '==', cohort.program)
        .where('status', '==', 'accepted')
        .where('spotResponse', '==', 'deferred')
        .get()

      for (const appDoc of appsSnap.docs) {
        const app = appDoc.data() as DeferredApplicationShape
        try {
          // Clear the response fields so the applicant sees the
          // three CTAs on their next visit — same shape the manual
          // reOfferToDeferredApplicant callable produces.
          await appDoc.ref.update({
            spotResponse: admin.firestore.FieldValue.delete(),
            spotRespondedAt: admin.firestore.FieldValue.delete(),
            spotResponseNote: admin.firestore.FieldValue.delete(),
            updatedAt: new Date(),
          })

          // Best-effort email. A Mailgun outage shouldn't halt the
          // batch — the state change already happened; applicant
          // will discover the open offer on their next visit.
          let to = app.personalInfo?.email
          if (!to && app.userId) {
            const userSnap = await db.collection('users').doc(app.userId).get()
            to = (userSnap.data()?.email as string | undefined) ?? undefined
          }
          if (to) {
            try {
              const firstName = app.personalInfo?.firstName?.trim() || 'there'
              const { html, text } = spotReOfferedEmail({
                firstName,
                programLabel: programLabel(cohort.program),
                applicationId: appDoc.id,
              })
              await sendMailgun({
                apiKey: MAILGUN_API_KEY.value(),
                domain: MAILGUN_DOMAIN.value(),
                to,
                subject: `Your ${programLabel(cohort.program)} spot is open again`,
                text,
                html,
              })
            } catch (err) {
              emailFailures += 1
              console.warn(
                `[reOfferDeferredOnCohortStart] email send failed for ${appDoc.id}:`,
                err instanceof Error ? err.message : String(err),
              )
            }
          }
          appsReOffered += 1
        } catch (err) {
          console.warn(
            `[reOfferDeferredOnCohortStart] re-offer ${appDoc.id} failed:`,
            err instanceof Error ? err.message : String(err),
          )
        }
      }

      // Mark the cohort processed so the next cron run sees this
      // value and skips. Set even when appsSnap was empty — there's
      // nothing more to do here regardless.
      await cohortDoc.ref.update({
        deferredsAutoReOffered: true,
        deferredsAutoReOfferedAt: now,
      })
      cohortsProcessed += 1
    }

    console.log(
      `[reOfferDeferredOnCohortStart] processed ${cohortsProcessed} cohorts, ` +
        `re-offered ${appsReOffered} applications, email failures: ${emailFailures}`,
    )
  },
)

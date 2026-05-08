/**
 * Transactional email via Mailgun + Firestore triggers.
 *
 * - `onApplicationStatusChange` fires when an `applications/{id}` doc is
 *   written. Sends:
 *     - "We got your application" when status flips to `submitted`
 *     - "Your application was accepted" when status flips to `accepted`
 *     - "Your application status update" when status flips to `declined`
 *       or `waitlisted` (kept neutral; rejection wording is the staff's job)
 *
 * - `retryApplicationEmail` is a callable for staff/admin to re-send the
 *   applicant-facing email when the original send failed (Mailgun outage,
 *   bad address, transient network). The button only surfaces when the
 *   application doc has `lastEmailFailure` set — see below.
 *
 * Failure tracking: when `sendMailgun` throws, we persist a
 * `lastEmailFailure: { kind, to, attemptedAt, error }` field on the
 * application doc. Writing this field does NOT change `status`, so the
 * trigger that fires on the resulting write short-circuits at the
 * `beforeStatus === afterStatus` check below — no infinite loop.
 *
 * Secrets:
 *   - MAILGUN_API_KEY  — Mailgun "Sending" API key
 *   - MAILGUN_DOMAIN   — Sending domain (e.g. mg.staija.org)
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import { sendMailgun, newApplicationStaffNotificationEmail } from './emailTemplates'
import {
  buildApplicantEmail,
  labelForProgram,
  type ApplicationDoc,
  type ApplicantStatus,
  type BuiltEmail,
} from './applicantEmail'

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_DOMAIN = defineSecret('MAILGUN_DOMAIN')
const STAFF_NOTIFY_EMAIL = defineSecret('STAFF_NOTIFY_EMAIL')

/**
 * Send the applicant email and reconcile `lastEmailFailure`. On success,
 * clears any stale failure marker so the admin-side retry banner
 * dismisses. On failure, writes the marker so admin can retry.
 */
async function sendApplicantEmail(opts: {
  applicationId: string
  to: string
  kind: ApplicantStatus
  email: BuiltEmail
  apiKey: string
  domain: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = admin.firestore()
  const ref = db.collection('applications').doc(opts.applicationId)
  try {
    await sendMailgun({
      apiKey: opts.apiKey,
      domain: opts.domain,
      to: opts.to,
      subject: opts.email.subject,
      text: opts.email.text,
      html: opts.email.html,
    })
    // Clear any prior failure marker so the admin banner dismisses on
    // a successful retry. FieldValue.delete() removes the key entirely
    // rather than leaving a `null` behind.
    await ref.update({
      lastEmailFailure: admin.firestore.FieldValue.delete(),
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] Mailgun send failed', message, {
      applicationId: opts.applicationId,
      kind: opts.kind,
    })
    // Persist the failure so admin can retry from the application page.
    // This write doesn't touch `status`, so the resulting trigger
    // invocation short-circuits at the beforeStatus === afterStatus
    // check — no loop. ServerTimestamp keeps clocks honest across
    // function instances.
    await ref.update({
      lastEmailFailure: {
        kind: opts.kind,
        to: opts.to,
        attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: message.slice(0, 500), // cap error string for storage sanity
      },
    })
    return { ok: false, error: message }
  }
}

export const onApplicationStatusChange = onDocumentWritten(
  {
    document: 'applications/{applicationId}',
    secrets: [MAILGUN_API_KEY, MAILGUN_DOMAIN, STAFF_NOTIFY_EMAIL],
    region: 'us-central1',
  },
  async (event) => {
    const before = event.data?.before.data() as ApplicationDoc | undefined
    const after = event.data?.after.data() as ApplicationDoc | undefined

    if (!after) return // deleted — no email

    const beforeStatus = before?.status
    const afterStatus = after.status

    // Only act on status transitions, not every field write. This is
    // also what prevents loops when we write `lastEmailFailure` from
    // inside this same trigger — that write doesn't change status, so
    // the next invocation lands here and returns immediately.
    if (beforeStatus === afterStatus) return

    const email = after.personalInfo?.email
    if (!email) {
      console.warn('[email] application has no personalInfo.email; skipping', {
        applicationId: event.params.applicationId,
      })
      return
    }

    const applicationId = event.params.applicationId
    const built = buildApplicantEmail(after, applicationId)
    if (!built) return

    await sendApplicantEmail({
      applicationId,
      to: email,
      kind: built.kind,
      email: built.email,
      apiKey: MAILGUN_API_KEY.value(),
      domain: MAILGUN_DOMAIN.value(),
    })

    // Staff notification on new submission. Independent send — failure
    // here doesn't get tracked on the application doc (it's not the
    // applicant's email; retry would notify staff again, not help the
    // applicant). Logged for ops only.
    if (afterStatus === 'submitted') {
      const staffTo = STAFF_NOTIFY_EMAIL.value()
      if (staffTo) {
        const programLabel = labelForProgram(after.program)
        const applicantName =
          [after.personalInfo?.firstName, after.personalInfo?.lastName].filter(Boolean).join(' ') ||
          'an applicant'
        const staff = newApplicationStaffNotificationEmail({
          applicantName,
          applicantEmail: email,
          programLabel,
          applicationId,
        })
        try {
          await sendMailgun({
            apiKey: MAILGUN_API_KEY.value(),
            domain: MAILGUN_DOMAIN.value(),
            to: staffTo,
            subject: `New application: ${applicantName} — ${programLabel}`,
            text: staff.text,
            html: staff.html,
          })
        } catch (err) {
          console.error('[email] Staff notification failed', err, { applicationId })
        }
      }
    }
  },
)

/**
 * Admin/staff-only callable that re-sends the applicant-facing email
 * for an application. Re-derives content from the application's
 * current status — so if a staff member fixed a typo'd email address
 * since the original failure, the retry picks it up automatically.
 *
 * Throws `failed-precondition` if the application's current status
 * doesn't map to an emailable state (e.g. someone retries while the
 * doc is back in `draft`).
 */
export const retryApplicationEmail = onCall<{ applicationId?: string }>(
  {
    secrets: [MAILGUN_API_KEY, MAILGUN_DOMAIN],
    region: 'us-central1',
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const callerUid = request.auth.uid
    const db = admin.firestore()
    const callerSnap = await db.collection('users').doc(callerUid).get()
    const callerRole = (callerSnap.data() as { role?: string } | undefined)?.role
    if (callerRole !== 'admin' && callerRole !== 'staff') {
      throw new HttpsError('permission-denied', 'Admin or staff role required.')
    }

    const applicationId = request.data.applicationId
    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'applicationId is required.')
    }

    const ref = db.collection('applications').doc(applicationId)
    const snap = await ref.get()
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Application not found.')
    }
    const after = snap.data() as ApplicationDoc

    const to = after.personalInfo?.email
    if (!to) {
      throw new HttpsError(
        'failed-precondition',
        'Application has no email address on personalInfo.',
      )
    }

    const built = buildApplicantEmail(after, applicationId)
    if (!built) {
      throw new HttpsError(
        'failed-precondition',
        `Application status ${after.status ?? 'unknown'} doesn't trigger an applicant email.`,
      )
    }

    const result = await sendApplicantEmail({
      applicationId,
      to,
      kind: built.kind,
      email: built.email,
      apiKey: MAILGUN_API_KEY.value(),
      domain: MAILGUN_DOMAIN.value(),
    })
    if (!result.ok) {
      throw new HttpsError(
        'unavailable',
        `Mailgun rejected the message: ${result.error}`,
      )
    }
    return { ok: true, kind: built.kind, to }
  },
)


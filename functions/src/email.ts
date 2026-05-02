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
 * Secrets:
 *   - MAILGUN_API_KEY  — Mailgun "Sending" API key
 *   - MAILGUN_DOMAIN   — Sending domain (e.g. mg.staija.org)
 *
 * No retries beyond Firestore's built-in (it retries failed triggers a
 * few times). If Mailgun is down for >15 minutes, the email is dropped;
 * staff still see the application in the queue, so it's not silent loss.
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import {
  sendMailgun,
  applicationReceivedEmail,
  applicationAcceptedEmail,
  applicationRejectedEmail,
} from './emailTemplates'

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_DOMAIN = defineSecret('MAILGUN_DOMAIN')

interface ApplicationDoc {
  userId?: string
  program?: 'stepup_scholars' | 'dynamerge'
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  personalInfo?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  submittedAt?: { toDate?: () => Date } | string | null
}

export const onApplicationStatusChange = onDocumentWritten(
  {
    document: 'applications/{applicationId}',
    secrets: [MAILGUN_API_KEY, MAILGUN_DOMAIN],
    region: 'us-central1',
  },
  async (event) => {
    const before = event.data?.before.data() as ApplicationDoc | undefined
    const after = event.data?.after.data() as ApplicationDoc | undefined

    if (!after) return // deleted — no email

    const beforeStatus = before?.status
    const afterStatus = after.status

    // Only act on status transitions, not every field write.
    if (beforeStatus === afterStatus) return

    const email = after.personalInfo?.email
    if (!email) {
      console.warn('[email] application has no personalInfo.email; skipping', {
        applicationId: event.params.applicationId,
      })
      return
    }

    const programLabel = labelForProgram(after.program)
    const firstName = after.personalInfo?.firstName ?? 'there'
    const applicationId = event.params.applicationId

    const tplParams = { firstName, programLabel, applicationId }
    let subject: string | null = null
    let emailContent: { html: string; text: string } | null = null

    if (afterStatus === 'submitted') {
      subject = `Your ${programLabel} application is in`
      emailContent = applicationReceivedEmail(tplParams)
    } else if (afterStatus === 'accepted') {
      subject = `You've been accepted to ${programLabel}`
      emailContent = applicationAcceptedEmail(tplParams)
    } else if (afterStatus === 'rejected') {
      subject = `An update on your ${programLabel} application`
      emailContent = applicationRejectedEmail(tplParams)
    }

    if (!subject || !emailContent) return

    try {
      await sendMailgun({
        apiKey: MAILGUN_API_KEY.value(),
        domain: MAILGUN_DOMAIN.value(),
        to: email,
        subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    } catch (err) {
      console.error('[email] Mailgun send failed', err, {
        applicationId,
        afterStatus,
      })
    }
  },
)

function labelForProgram(p?: ApplicationDoc['program']): string {
  if (p === 'stepup_scholars') return 'StepUp Scholars'
  if (p === 'dynamerge') return 'Dynamerge'
  return 'STAIJA'
}

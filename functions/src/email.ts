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

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_DOMAIN = defineSecret('MAILGUN_DOMAIN')

const FROM_ADDRESS = 'STAIJA <hello@staija.org>'

interface ApplicationDoc {
  userId?: string
  program?: 'stepup_scholars' | 'dynamerge'
  status?: 'draft' | 'submitted' | 'under-review' | 'accepted' | 'declined' | 'waitlisted'
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

    let subject: string | null = null
    let body: string | null = null

    if (afterStatus === 'submitted') {
      subject = `We got your ${programLabel} application`
      body = [
        `Hi ${firstName},`,
        ``,
        `Thanks for applying to ${programLabel}. We've received your application and our team will review it within 5 business days.`,
        ``,
        `Reference: ${applicationId}`,
        ``,
        `If anything in your application changes, sign in to https://staija.org/applicant/applications and update it.`,
        ``,
        `— STAIJA`,
      ].join('\n')
    } else if (afterStatus === 'accepted') {
      subject = `You're in: ${programLabel}`
      body = [
        `Hi ${firstName},`,
        ``,
        `Congratulations — you've been accepted to ${programLabel}. A program coordinator will email you within 48 hours with next steps, including the orientation date and your scholar agreement.`,
        ``,
        `Reference: ${applicationId}`,
        ``,
        `Welcome aboard.`,
        `— STAIJA`,
      ].join('\n')
    } else if (afterStatus === 'declined' || afterStatus === 'waitlisted') {
      subject = `An update on your ${programLabel} application`
      body = [
        `Hi ${firstName},`,
        ``,
        `Thanks for putting in the work to apply to ${programLabel}. Your application has been reviewed — please sign in to https://staija.org/applicant/applications for the full update.`,
        ``,
        `Reference: ${applicationId}`,
        ``,
        `— STAIJA`,
      ].join('\n')
    }

    if (!subject || !body) return

    try {
      await sendMailgun({
        apiKey: MAILGUN_API_KEY.value(),
        domain: MAILGUN_DOMAIN.value(),
        to: email,
        subject,
        text: body,
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

interface MailgunSend {
  apiKey: string
  domain: string
  to: string
  subject: string
  text: string
}

async function sendMailgun(params: MailgunSend): Promise<void> {
  const auth = Buffer.from(`api:${params.apiKey}`).toString('base64')
  const form = new URLSearchParams()
  form.set('from', FROM_ADDRESS)
  form.set('to', params.to)
  form.set('subject', params.subject)
  form.set('text', params.text)

  const res = await fetch(`https://api.mailgun.net/v3/${params.domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Mailgun ${res.status}: ${detail}`)
  }
}

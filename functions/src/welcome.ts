/**
 * Welcome email on signup.
 *
 * Fires when a new user profile doc is created in `users/{uid}` —
 * AuthService.createUserProfile is the only writer, so this trigger
 * fires exactly once per applicant signup.
 *
 * Skips staff/admin auto-created accounts (role !== 'applicant') so the
 * welcome copy doesn't go to internal users.
 *
 * Secrets: MAILGUN_API_KEY, MAILGUN_DOMAIN
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import { sendMailgun, welcomeEmail } from './emailTemplates'

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_DOMAIN = defineSecret('MAILGUN_DOMAIN')

interface UserDoc {
  email?: string
  displayName?: string
  role?: string
}

export const onUserCreated = onDocumentCreated(
  {
    document: 'users/{uid}',
    secrets: [MAILGUN_API_KEY, MAILGUN_DOMAIN],
    region: 'us-central1',
  },
  async (event) => {
    const data = event.data?.data() as UserDoc | undefined
    if (!data) return
    if (!data.email) return
    // Skip non-applicant roles. The role-elevation flow in auth.ts updates the
    // doc rather than recreating it, so this trigger never fires for them anyway,
    // but this is defence in depth.
    if (data.role && data.role !== 'applicant') return

    const firstName = (data.displayName ?? '').trim().split(/\s+/)[0] || 'there'

    const { html, text } = welcomeEmail({ firstName })

    try {
      await sendMailgun({
        apiKey: MAILGUN_API_KEY.value(),
        domain: MAILGUN_DOMAIN.value(),
        to: data.email,
        subject: 'Welcome to STAIJA',
        text,
        html,
      })
    } catch (err) {
      console.error('[welcome] Failed to send', err, { uid: event.params.uid })
    }
  },
)

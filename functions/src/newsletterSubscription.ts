/**
 * Authenticated newsletter subscribe/unsubscribe — driven by the
 * Settings page email-preferences toggle.
 *
 * Distinct from the public subscribeNewsletter onRequest which the
 * footer form posts to: that one's anonymous and protected by a
 * honeypot. This callable is signed-in-user-only and uses their auth
 * email, so we don't need to validate format.
 *
 * Uses Mailgun's members upsert (PUT) so toggling off doesn't error if
 * the address was never on the list, and toggling on after a previous
 * unsubscribe re-enables in place.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_LIST_ADDRESS = defineSecret('MAILGUN_LIST_ADDRESS')

export const setNewsletterSubscription = onCall<{ subscribed: boolean }>(
  {
    secrets: [MAILGUN_API_KEY, MAILGUN_LIST_ADDRESS],
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const email = request.auth.token.email
    if (!email) {
      throw new HttpsError('failed-precondition', 'Account has no email on file.')
    }
    const subscribed = request.data?.subscribed
    if (typeof subscribed !== 'boolean') {
      throw new HttpsError('invalid-argument', 'subscribed must be a boolean.')
    }

    const list = MAILGUN_LIST_ADDRESS.value()
    const auth = Buffer.from(`api:${MAILGUN_API_KEY.value()}`).toString('base64')
    const form = new URLSearchParams()
    form.set('address', email)
    form.set('subscribed', subscribed ? 'yes' : 'no')
    form.set('upsert', 'yes')

    const res = await fetch(
      `https://api.mailgun.net/v3/lists/${encodeURIComponent(list)}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      },
    )

    if (!res.ok) {
      const detail = await res.text()
      console.error('[setNewsletterSubscription] Mailgun rejected', res.status, detail, { email })
      throw new HttpsError('internal', 'Newsletter service is having trouble. Try again in a minute.')
    }

    return { ok: true, subscribed }
  },
)

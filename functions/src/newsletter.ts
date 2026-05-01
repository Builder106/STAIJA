/**
 * Newsletter signup via Mailgun mailing list.
 *
 * Public HTTP endpoint that adds an email to STAIJA's Mailgun mailing
 * list. Configure the list with "subscription confirmation" enabled in
 * Mailgun for double opt-in (Decision in PRD §4.11).
 *
 * Secrets:
 *   - MAILGUN_API_KEY     — same key used by transactional email
 *   - MAILGUN_LIST_ADDRESS — e.g. newsletter@mg.staija.org
 *
 * Light protection:
 *   - CORS restricted to staija.org + localhost
 *   - Email format validation
 *   - Source/honeypot field rejected if filled (basic spam shield)
 *
 * Heavier abuse mitigation (rate limit per IP, captcha) deferred until
 * we see actual abuse — at current scale a basic shield is fine.
 */

import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const MAILGUN_API_KEY = defineSecret('MAILGUN_API_KEY')
const MAILGUN_LIST_ADDRESS = defineSecret('MAILGUN_LIST_ADDRESS')

const ALLOWED_ORIGINS = [
  'https://staija.org',
  'https://www.staija.org',
  'http://localhost:5190',
  'http://localhost:5173',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const subscribeNewsletter = onRequest(
  {
    secrets: [MAILGUN_API_KEY, MAILGUN_LIST_ADDRESS],
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    const origin = req.header('origin') || ''
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin)
      res.set('Vary', 'Origin')
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.set('Access-Control-Allow-Headers', 'Content-Type')
    }

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed')
      return
    }

    const body = req.body as { email?: unknown; source?: unknown; trap?: unknown }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const source = typeof body.source === 'string' ? body.source : 'unknown'

    // Honeypot: real users won't fill this hidden field.
    if (typeof body.trap === 'string' && body.trap.length > 0) {
      res.status(200).json({ ok: true }) // pretend success, drop the request
      return
    }

    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email.' })
      return
    }

    try {
      const auth = Buffer.from(`api:${MAILGUN_API_KEY.value()}`).toString('base64')
      const form = new URLSearchParams()
      form.set('address', email)
      form.set('subscribed', 'yes')
      form.set('upsert', 'yes')
      form.set('vars', JSON.stringify({ source, signed_up_at: new Date().toISOString() }))

      const mgRes = await fetch(
        `https://api.mailgun.net/v3/lists/${encodeURIComponent(MAILGUN_LIST_ADDRESS.value())}/members`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        },
      )

      if (!mgRes.ok) {
        const detail = await mgRes.text()
        console.error('[subscribeNewsletter] Mailgun rejected', mgRes.status, detail, { email, source })
        res.status(502).json({ error: 'Subscription service is having trouble. Try again in a minute.' })
        return
      }

      res.status(200).json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[subscribeNewsletter] Failed', msg, { email, source })
      res.status(500).json({ error: 'Subscription failed. Try again in a minute.' })
    }
  },
)

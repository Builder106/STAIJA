/**
 * STAIJA Firebase Functions entrypoint.
 *
 * - contentfulWebhook → src/contentful.ts: mirror Contentful → Firestore
 * - paystackWebhook   → src/paystack.ts:   record donations idempotently
 *
 * Deployment:
 *   1. cd functions && npm install
 *   2. firebase functions:secrets:set CONTENTFUL_WEBHOOK_SECRET
 *   3. firebase functions:secrets:set PAYSTACK_SECRET_KEY
 *   4. firebase deploy --only functions
 *   5. Configure webhooks in Contentful + Paystack dashboards
 *      (see docs/M2-CHECKLIST.md and docs/M3-CHECKLIST.md).
 */

import * as admin from 'firebase-admin'

admin.initializeApp()

export { contentfulWebhook } from './contentful'
export { onApplicationStatusChange } from './email'
export {
  inviteReferencesOnSubmit,
  validateReferenceToken,
  submitReferenceLetter,
} from './references'
export { onUserCreated } from './welcome'
export { sendReferenceReminders } from './referenceReminders'
export { deleteAccount } from './account'

// paystack.ts and newsletter.ts are intentionally NOT re-exported here.
//
// - Paystack: donations are gated behind src/config/features.ts:donationsEnabled
//   while compliance is pending. Re-export `paystackWebhook` and
//   `cancelSubscription` once PAYSTACK_SECRET_KEY is set in Secret
//   Manager and the live webhook URL is configured in Paystack.
//
// - Newsletter: requires a Mailgun mailing list to exist (and
//   MAILGUN_LIST_ADDRESS to be set). The footer signup form falls back
//   to a "fake success" state when VITE_NEWSLETTER_ENDPOINT is unset,
//   so leaving this off doesn't break the UI. Re-export
//   `subscribeNewsletter` once the list is created.
//
// Skipping the re-exports keeps the modules un-imported, which means
// their module-level `defineSecret(...)` calls don't run, which means
// the deploy doesn't gate on PAYSTACK_SECRET_KEY / MAILGUN_LIST_ADDRESS.

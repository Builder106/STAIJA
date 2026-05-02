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
export { paystackWebhook, cancelSubscription } from './paystack'
export { onApplicationStatusChange } from './email'
export { subscribeNewsletter } from './newsletter'
export {
  inviteReferencesOnSubmit,
  validateReferenceToken,
  submitReferenceLetter,
} from './references'

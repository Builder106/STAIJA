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
export { onApplicationStatusChange, retryApplicationEmail } from './email'
export {
  inviteReferencesOnSubmit,
  validateReferenceToken,
  submitReferenceLetter,
} from './references'
export { onUserCreated } from './welcome'
export { sendReferenceReminders } from './referenceReminders'
export { reapApplicationDraftTombstones } from './applicationDraftsCron'
export { reapApplicationStagedFiles } from './applicationStagedFilesCron'
export { deleteAccount } from './account'
export { adminListUsers } from './adminUsers'
export { signOutEverywhere } from './security'
export { exportUserData } from './dataExport'

// LMS callables (Phase 1).
export { enrollStudent, completeLesson, submitAssignment, gradeSubmission } from './lms'
export { scheduleSession, rsvpSession } from './sessions'

// AI-powered course outliner (Groq-backed). Requires GROQ_API_KEY,
// CONTENTFUL_MANAGEMENT_TOKEN, and CONTENTFUL_SPACE_ID in Secret Manager.
export { outlineCourse } from './aiOutline'

// AI lesson media enrichment (Groq-backed). Suggests YouTube/image
// search queries, a narration script, and key-concept bullets — staff
// curates from there. Only requires GROQ_API_KEY.
export { lessonMediaAssist } from './aiLessonMedia'

// Server-side proxy for every Contentful Management API call the admin
// LMS surface makes. Replaces the previous client-side path that
// exposed the management token in the browser bundle. Requires
// CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID in Secret Manager.
export { lmsContentAdmin } from './lmsContentAdmin'

// Asset upload bridge: client stages bytes in Firebase Storage at
// cms/<uid>/..., then calls this function to copy them into Contentful
// as a published Asset. Uses the same secrets as lmsContentAdmin.
export { lmsAssetUpload } from './lmsAssetUpload'

// Application submit finalize: copies staged uploads
// (`applicationStaging/<uid>/<program>/...`) into the canonical
// per-application Storage folder and patches the application doc's
// `documents` field with the final paths. See applicationFinalize.ts.
export { finalizeApplicationFiles } from './applicationFinalize'

// setNewsletterSubscription is intentionally not re-exported until
// MAILGUN_LIST_ADDRESS is set in Secret Manager and a Mailgun mailing
// list exists. Same gating pattern as subscribeNewsletter above.

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

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

import { getFirebaseConfig } from '../utils/env.ts'

// Get Firebase configuration from environment variables
const firebaseConfig = getFirebaseConfig()

// Log environment info in development
// logEnvironmentInfo()

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize App Check (browser only — App Check has no Node equivalent and
// would crash SSR or test runs). Uses reCAPTCHA Enterprise.
//
// In dev, App Check is forced into debug mode: on the first load, Firebase
// prints a fresh debug token to the console. Copy it once and register it in
// Firebase Console → App Check → Apps → ⋮ → Manage debug tokens. To pin a
// specific token (so it survives reloads without re-registering), set
// VITE_FIREBASE_APPCHECK_DEBUG_TOKEN in .env.
if (typeof window !== 'undefined') {
  if (import.meta.env.DEV) {
    const pinnedToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined
    ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = pinnedToken ?? true
  }
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined
  if (recaptchaSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } else if (import.meta.env.DEV) {
    console.warn('[firebase] VITE_RECAPTCHA_ENTERPRISE_SITE_KEY not set — App Check skipped')
  }
}

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
// Default bucket — used for application uploads (transcripts, IDs,
// reference letters). Lives in the project's data region (africa-south1)
// since those are private files served only to the applicant + staff.
export const storage = getStorage(app)
// Public bucket — used for program editor assets (hero, mentor, feature
// images) which need a no-cost-tier-eligible region. If
// VITE_FIREBASE_PUBLIC_BUCKET is unset we fall back to the default bucket
// so the app keeps working without it.
const publicBucket = import.meta.env.VITE_FIREBASE_PUBLIC_BUCKET as string | undefined
export const publicStorage = publicBucket
  ? getStorage(app, `gs://${publicBucket}`)
  : storage
export const functions = getFunctions(app)

// Initialize analytics and performance monitoring (only in production)
let analytics: any = null
let performance: any = null

if (typeof window !== 'undefined' && import.meta.env.NODE_ENV === 'production') {
  analytics = getAnalytics(app)
  performance = getPerformance(app)
}

export { analytics, performance }

// Export the app instance
export default app

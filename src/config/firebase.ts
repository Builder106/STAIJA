import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
  type AppCheck,
} from 'firebase/app-check'

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
// On localhost, App Check is forced into debug mode: on the first load,
// Firebase prints a fresh debug token to the console. Copy it once and
// register it in Firebase Console → App Check → Apps → ⋮ → Manage debug
// tokens. To pin a specific token (so it survives reloads without
// re-registering), set VITE_FIREBASE_APPCHECK_DEBUG_TOKEN in .env.
//
// We gate this on hostname rather than import.meta.env.DEV because the
// build flag can be wrong (e.g. NODE_ENV misconfigured on the host),
// which would silently ship debug-mode App Check to production.
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

let appCheck: AppCheck | null = null
if (typeof window !== 'undefined') {
  if (isLocalhost) {
    const pinnedToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined
    ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = pinnedToken ?? true
  }
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined
  if (recaptchaSiteKey) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } else if (isLocalhost) {
    console.warn('[firebase] VITE_RECAPTCHA_ENTERPRISE_SITE_KEY not set — App Check skipped')
  }
}

// Fetch an App Check token for plain fetch() calls. onCall functions don't
// need this — the Firebase SDK auto-attaches the token. Use only for raw
// HTTPS endpoints (e.g. file uploads via multipart). Returns null if App
// Check isn't initialized (e.g. site key missing).
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) return null
  try {
    const result = await getToken(appCheck, /* forceRefresh */ false)
    return result.token
  } catch {
    return null
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

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app)
  performance = getPerformance(app)
}

export { analytics, performance }

// Export the app instance
export default app

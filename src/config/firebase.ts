import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
  type AppCheck,
} from 'firebase/app-check'
// Type-only imports don't trigger SDK runtime load — they're erased at
// compile time. The runtime imports happen inside the async getters
// below, so the firestore / storage / functions SDKs (~310 KB gzipped
// combined) only ship in chunks that the browser doesn't fetch until
// a consumer actually calls one of them. Mobile applicants landing on
// the home page never download these chunks.
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import type { Functions } from 'firebase/functions'

import { getFirebaseConfig } from '../utils/env.ts'

const firebaseConfig = getFirebaseConfig()

const app = initializeApp(firebaseConfig)

// Initialize App Check (browser only — App Check has no Node equivalent and
// would crash SSR or test runs). Uses reCAPTCHA Enterprise.
//
// On debug-allowed environments (localhost, staging.staija.org), App Check
// is forced into debug mode: on the first load, Firebase prints a fresh
// debug token to the console. Copy it once and register it in Firebase
// Console → App Check → Apps → ⋮ → Manage debug tokens. To pin a specific
// token (so it survives reloads without re-registering), set
// VITE_FIREBASE_APPCHECK_DEBUG_TOKEN in .env / Vercel scope.
//
// We gate this on hostname rather than import.meta.env.DEV because the
// build flag can be wrong (e.g. NODE_ENV misconfigured on the host),
// which would silently ship debug-mode App Check to production. Adding a
// hostname here is an explicit allowlist; staija.org (prod) is not in
// the list, so prod always uses real reCAPTCHA Enterprise verification.
const isDebugAppCheckEnv =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'staging.staija.org')

let appCheck: AppCheck | null = null
if (typeof window !== 'undefined') {
  if (isDebugAppCheckEnv) {
    const pinnedToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined
    ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = pinnedToken ?? true
  }
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined
  if (recaptchaSiteKey) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } else if (isDebugAppCheckEnv) {
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

// Auth is eagerly initialized — main.ts gates app mount on
// onAuthStateChanged, so the auth SDK must be available before first
// render. The firebase/auth chunk (~150 KB gzipped) is unavoidable on
// initial page load.
export const auth = getAuth(app)

// Lazy Firestore. initializeFirestore (not getFirestore) so we can pass
// transport options. experimentalAutoDetectLongPolling probes the default
// WebChannel streaming transport at startup, and on failure transparently
// falls back to plain HTTP long polling.
//
// Why long-polling fallback: Firestore's default transport is a streaming
// "Listen/channel" URL with a very specific query-string signature
// (VER=8, TYPE=xmlhttp, etc). Safari content blockers, school WiFi
// captive portals, corporate proxies, and some mobile carriers in our
// recruiting regions all flag that as suspicious traffic and 4xx it —
// manifesting as the cryptic "Fetch API cannot load ... due to access
// control checks" console error and silent data hangs. The long-polling
// fallback looks like ordinary HTTPS requests and gets through everywhere.
// "Auto-detect" (vs. forceLongPolling) preserves WebChannel for users
// whose networks allow it — those get the lower-latency transport — and
// only degrades for the ones that need it.
let _db: Firestore | null = null
export async function getDb(): Promise<Firestore> {
  if (_db) return _db
  const { initializeFirestore } = await import('firebase/firestore')
  _db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  })
  return _db
}

// Lazy Storage. Default bucket — used for application uploads
// (transcripts, IDs, reference letters). Lives in the project's data
// region (africa-south1) since those are private files served only to
// the applicant + staff.
let _storage: FirebaseStorage | null = null
export async function getStorageBucket(): Promise<FirebaseStorage> {
  if (_storage) return _storage
  const { getStorage } = await import('firebase/storage')
  _storage = getStorage(app)
  return _storage
}

// Public bucket — used for program editor assets (hero, mentor, feature
// images) which need a no-cost-tier-eligible region. If
// VITE_FIREBASE_PUBLIC_BUCKET is unset we fall back to the default bucket
// so the app keeps working without it.
const publicBucket = import.meta.env.VITE_FIREBASE_PUBLIC_BUCKET as string | undefined
let _publicStorage: FirebaseStorage | null = null
export async function getPublicStorageBucket(): Promise<FirebaseStorage> {
  if (_publicStorage) return _publicStorage
  if (!publicBucket) {
    _publicStorage = await getStorageBucket()
    return _publicStorage
  }
  const { getStorage } = await import('firebase/storage')
  _publicStorage = getStorage(app, `gs://${publicBucket}`)
  return _publicStorage
}

// Lazy Functions. The SDK is ~30 KB gzipped — small relative to firestore
// but adds up when combined with storage. Both load only on routes that
// actually call a Cloud Function (most routes don't).
let _functions: Functions | null = null
export async function getFns(): Promise<Functions> {
  if (_functions) return _functions
  const { getFunctions } = await import('firebase/functions')
  _functions = getFunctions(app)
  return _functions
}

// Initialize analytics and performance monitoring (only in production).
// These remain eager because they wire up SDK-side observability that
// needs to start on first paint to capture early metrics — and they're
// small (~30 KB gzipped combined).
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'

let analytics: any = null
let performance: any = null

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app)
  performance = getPerformance(app)
}

export { analytics, performance }

// Export the app instance
export default app
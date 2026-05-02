import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'

import { getFirebaseConfig } from '../utils/env.ts'

// Get Firebase configuration from environment variables
const firebaseConfig = getFirebaseConfig()

// Log environment info in development
// logEnvironmentInfo()

// Initialize Firebase
const app = initializeApp(firebaseConfig)

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

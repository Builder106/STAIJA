import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'

import { getFirebaseConfig, logEnvironmentInfo } from '../utils/env.ts'

// Get Firebase configuration from environment variables
const firebaseConfig = getFirebaseConfig()

// Log environment info in development
logEnvironmentInfo()

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
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

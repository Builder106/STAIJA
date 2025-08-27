// Alternative Firebase configuration using direct URL imports for Deno
// This approach imports Firebase directly from URLs instead of using import maps

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js"
import { getPerformance } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-performance.js"

import { getFirebaseConfig, logEnvironmentInfo } from '../utils/env'

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

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app)
  performance = getPerformance(app)
}

export { analytics, performance }

// Export the app instance
export default app

// Environment configuration utility for STAIJA
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

export interface AppConfig {
  firebase: FirebaseConfig
  appUrl: string
  isDevelopment: boolean
  isProduction: boolean
  contentful?: {
    spaceId: string
    environmentId: string
    deliveryToken: string
    previewToken?: string
  }
}

// Required environment variables
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const

// Optional environment variables
const OPTIONAL_ENV_VARS = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_APP_URL',
  'VITE_CONTENTFUL_SPACE_ID',
  'VITE_CONTENTFUL_ENV_ID',
  'VITE_CONTENTFUL_DELIVERY_TOKEN',
  'VITE_CONTENTFUL_PREVIEW_TOKEN'
] as const

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironment(): void {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    const errorMessage = [
      'Missing required environment variables:',
      ...missingVars.map(varName => `  - ${varName}`),
      '',
      'Please check your .env file and ensure all required variables are set.'
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}

/**
 * Gets the Firebase configuration from environment variables
 */
export function getFirebaseConfig(): FirebaseConfig {
  validateEnvironment()
  
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  }
}

/**
 * Gets the complete application configuration
 */
export function getAppConfig(): AppConfig {
  const firebase = getFirebaseConfig()
  
  return {
    firebase,
    appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    isDevelopment: !!import.meta.env.DEV,
    isProduction: !!import.meta.env.PROD,
              contentful: import.meta.env.VITE_CONTENTFUL_SPACE_ID && import.meta.env.VITE_CONTENTFUL_DELIVERY_TOKEN
            ? {
                spaceId: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
                environmentId: import.meta.env.VITE_CONTENTFUL_ENV_ID || 'master',
                deliveryToken: import.meta.env.VITE_CONTENTFUL_DELIVERY_TOKEN,
                previewToken: import.meta.env.VITE_CONTENTFUL_PREVIEW_TOKEN,
                managementToken: import.meta.env.VITE_CONTENTFUL_MANAGEMENT_TOKEN
              }
            : undefined
  }
}

/**
 * Logs environment information (for debugging)
 */
export function logEnvironmentInfo(): void {
  if (import.meta.env.DEV) {
    console.log('🔧 Environment Configuration:')
    console.log('  Mode:', import.meta.env.MODE)
    console.log('  Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
    console.log('  App URL:', import.meta.env.VITE_APP_URL || 'http://localhost:5173')
    if (import.meta.env.VITE_CONTENTFUL_SPACE_ID) {
      console.log('  Contentful Space:', import.meta.env.VITE_CONTENTFUL_SPACE_ID)
      console.log('  Contentful Env:', import.meta.env.VITE_CONTENTFUL_ENV_ID || 'master')
    }
    console.log('  Development:', import.meta.env.DEV)
    console.log('  Production:', import.meta.env.PROD)
  }
}

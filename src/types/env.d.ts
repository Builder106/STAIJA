/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_APP_URL?: string
  readonly VITE_CONTENTFUL_SPACE_ID?: string
  readonly VITE_CONTENTFUL_ENV_ID?: string
  readonly VITE_CONTENTFUL_DELIVERY_TOKEN?: string
  readonly VITE_CONTENTFUL_PREVIEW_TOKEN?: string
  readonly VITE_CONTENTFUL_MANAGEMENT_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

import { createApp } from 'vue'
// Legacy first so Tailwind's responsive utilities (loaded second) win
// when they overlap. legacy.css defines unscoped `.grid-cols-2` etc.
// for the dashboard tree; if loaded after Tailwind it would override
// `lg:grid-cols-*` and break footer / hero / other responsive grids.
import './styles/legacy.css'
import './style.css'
import './styles/page-transition.css'
import App from './App.vue'
import router from './router'
import { auth } from './config/firebase.ts'
import { onAuthStateChanged } from 'firebase/auth'
import { installAnalyticsRouter } from './services/analytics'
import { i18n, currentLocale } from './i18n'
import { startVersionWatcher } from './services/versionCheck'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Inject Vercel Analytics
inject()
// Inject Vercel Speed Insights
injectSpeedInsights()

// Auto-reload long-lived tabs when a new deploy ships. Without this,
// a tab that loaded its HTML at 9 AM keeps referencing the 9-AM chunk
// hashes forever — and any deploy in between leaves silently broken
// route navigations. The watcher fetches /version.txt on tab focus
// and reloads when the SHA no longer matches the bundle's own SHA.
startVersionWatcher()

// Wait for Firebase Auth to initialize before mounting the app
let app: ReturnType<typeof createApp> | undefined

onAuthStateChanged(auth, () => {
   if (!app) {
      app = createApp(App)
      app.use(router)
      app.use(i18n)
      if (typeof document !== 'undefined') {
         document.documentElement.lang = currentLocale()
      }
      installAnalyticsRouter(router)
      app.mount('#app')
   }
})

import { createApp } from 'vue'
import './style.css'
import './styles/legacy.css'
import App from './App.vue'
import router from './router'
import { auth } from './config/firebase.ts'
import { onAuthStateChanged } from 'firebase/auth'
import { installAnalyticsRouter } from './services/analytics'
import { i18n, currentLocale } from './i18n'

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

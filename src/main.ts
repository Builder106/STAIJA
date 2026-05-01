import { createApp } from 'vue'
import './style.css'
import './styles/legacy.css'
import App from './App.vue'
import router from './router'
import { auth } from './config/firebase.ts'
import { onAuthStateChanged } from 'firebase/auth'

// Wait for Firebase Auth to initialize before mounting the app
let app: ReturnType<typeof createApp> | undefined

onAuthStateChanged(auth, () => {
  if (!app) {
    app = createApp(App)
    app.use(router)
    app.mount('#app')
  }
})

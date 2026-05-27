import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth'
import { auth } from '../config/firebase'
// AuthService and DatabaseService are dynamically imported below.
// Pulling them eagerly would drag the firestore SDK chunk into main
// on every page load (both services have top-level `firebase/firestore`
// imports). useAuth is wired into SiteHeader, which renders on every
// route, so the eager pull-through would defeat the lazy-load split.
// We do the work with the bare `auth` object + lazy imports for the
// profile fetch path that's already async.
import type { UserProfile } from '../services/types'

const user = ref<User | null>(null)
const userProfile = ref<UserProfile | null>(null)
const loading = ref(true)

let subscriberCount = 0
let unsubscribe: (() => void) | null = null

function startListening() {
  if (unsubscribe) return

  unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) {
      try {
        const { DatabaseService } = await import('../services/database')
        userProfile.value = await DatabaseService.getUserProfile(firebaseUser.uid)
      } catch {
        userProfile.value = null
      }
    } else {
      userProfile.value = null
    }
    loading.value = false
  })
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

export function useAuth() {
  onMounted(() => {
    subscriberCount++
    startListening()
  })

  onUnmounted(() => {
    subscriberCount--
    if (subscriberCount <= 0) {
      subscriberCount = 0
      stopListening()
    }
  })

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => userProfile.value?.role ?? null)
  const displayName = computed(() =>
    userProfile.value?.displayName || user.value?.displayName || user.value?.email || null
  )

  async function refreshProfile() {
    if (!user.value) return
    const { DatabaseService } = await import('../services/database')
    userProfile.value = await DatabaseService.getUserProfile(user.value.uid)
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  return {
    user,
    userProfile,
    loading,
    isAuthenticated,
    role,
    displayName,
    refreshProfile,
    signOut,
  }
}

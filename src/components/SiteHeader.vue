<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import UiButton from './ui/UiButton.vue'
import Container from './ui/Container.vue'
import { useAuth } from '../composables/useAuth'
import { usePermissions } from '../composables/usePermissions'
import { donationsEnabled } from '../config/features'

const isScrolled = ref(false)
const mobileOpen = ref(false)
const route = useRoute()
const router = useRouter()
const { isAuthenticated, displayName, signOut } = useAuth()
const { isStaff, isMentor, isStudent, isAlumni } = usePermissions()

// Where the "Dashboard" link in the header points, by role. Mirrors the
// router's post-login redirect cascade in src/router/index.ts so an
// authenticated user lands at the same place via the header link as via
// the post-login fallback.
const dashboardPath = computed(() => {
  if (isStaff.value) return '/admin'
  // Students land in the LMS directly. The legacy /student dashboard
  // is kept around with quick-link buttons that all point to /learn,
  // but going straight there is the better UX for active learners.
  if (isStudent.value) return '/learn'
  if (isAlumni.value) return '/alumni'
  if (isMentor.value) return '/mentor'
  return '/applicant'
})

const navLinks = [
  { name: 'StepUp Scholars', href: '/programs/stepup-scholars' },
  { name: 'Dynamerge', href: '/programs/dynamerge' },
  { name: 'Events', href: '/events' },
  { name: 'Stories', href: '/blog' },
  { name: 'About', href: '/about' },
]

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

async function handleSignOut() {
  await signOut()
  router.push('/')
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
watch(() => route.fullPath, () => { mobileOpen.value = false })
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full transition-all duration-200 bg-paper"
    :class="isScrolled ? 'border-b hairline-ink py-4' : 'py-6'"
  >
    <Container>
      <div class="flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 focus-ring-brand rounded-sm" aria-label="STAIJA — home">
          <img
            src="/STAIJA.png"
            alt="STAIJA"
            width="40"
            height="40"
            class="h-10 w-10 rounded-md"
          />
        </RouterLink>

        <nav class="hidden lg:flex items-center gap-8">
          <RouterLink
            v-for="link in navLinks"
            :key="link.name"
            :to="link.href"
            class="text-sm font-medium text-ink/80 hover:text-ink transition-colors focus-ring-brand rounded-sm"
          >
            {{ link.name }}
          </RouterLink>
        </nav>

        <div class="hidden lg:flex items-center gap-4">
          <template v-if="isAuthenticated">
            <RouterLink
              v-if="donationsEnabled"
              to="/donor"
              class="text-sm font-medium text-ink/70 hover:text-brand-violet transition-colors focus-ring-brand rounded-sm"
            >
              My donations
            </RouterLink>
            <RouterLink
              :to="dashboardPath"
              class="text-sm font-semibold text-ink hover:text-brand-violet transition-colors focus-ring-brand rounded-sm flex items-center gap-2"
            >
              <Icon icon="lucide:layout-dashboard" width="16" />
              <span class="hidden xl:inline">{{ displayName || 'Dashboard' }}</span>
              <span class="xl:hidden">Dashboard</span>
            </RouterLink>
            <RouterLink
              to="/account/settings"
              class="text-sm font-medium text-ink/70 hover:text-ink transition-colors focus-ring-brand rounded-sm"
            >
              Settings
            </RouterLink>
            <button
              type="button"
              class="text-sm font-medium text-ink/70 hover:text-ink transition-colors focus-ring-brand rounded-sm"
              @click="handleSignOut"
            >
              Sign out
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="text-sm font-semibold text-ink hover:text-ink/70 transition-colors focus-ring-brand rounded-sm"
            >
              Sign in
            </RouterLink>
          </template>
          <UiButton v-if="donationsEnabled" variant="primary" :to="'/donate'">Donate</UiButton>
        </div>

        <button
          type="button"
          class="lg:hidden p-2 -mr-2 text-ink focus-ring-brand rounded-md"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon :icon="mobileOpen ? 'lucide:x' : 'lucide:menu'" width="24" height="24" />
        </button>
      </div>
    </Container>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileOpen"
        class="absolute top-full left-0 w-full bg-paper border-b hairline-ink shadow-xl shadow-ink/5 lg:hidden overflow-hidden"
      >
        <Container>
          <div class="flex flex-col py-6 gap-4">
            <RouterLink
              v-for="link in navLinks"
              :key="link.name"
              :to="link.href"
              class="text-lg font-medium text-ink py-2 border-b hairline-ink"
            >
              {{ link.name }}
            </RouterLink>
            <div class="flex flex-col gap-3 mt-4">
              <template v-if="isAuthenticated">
                <UiButton variant="primary" class="w-full justify-center" :to="dashboardPath">
                  Go to dashboard
                </UiButton>
                <UiButton variant="secondary" class="w-full justify-center" :to="'/account/settings'">
                  Settings
                </UiButton>
                <UiButton variant="secondary" class="w-full justify-center" @click="handleSignOut">
                  Sign out
                </UiButton>
              </template>
              <UiButton v-else variant="secondary" class="w-full justify-center" :to="'/login'">
                Sign in
              </UiButton>
              <UiButton v-if="donationsEnabled" variant="primary" class="w-full justify-center" :to="'/donate'">
                Donate
              </UiButton>
            </div>
          </div>
        </Container>
      </div>
    </Transition>
  </header>
</template>

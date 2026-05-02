<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from './ui/Container.vue'
import UiButton from './ui/UiButton.vue'
import LocaleSwitcher from './LocaleSwitcher.vue'
import { trackNewsletterSignup } from '../services/analytics'
import { getAppConfig } from '../utils/env'
import { donationsEnabled } from '../config/features'

const year = computed(() => new Date().getFullYear())

const newsletterEmail = ref('')
const honeypot = ref('') // bots that auto-fill every field will trip this
const newsletterStatus = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const newsletterError = ref<string | null>(null)

async function handleNewsletter(e: Event) {
  e.preventDefault()
  if (newsletterStatus.value === 'submitting') return
  if (honeypot.value) return // silent drop

  newsletterStatus.value = 'submitting'
  newsletterError.value = null

  const endpoint = getAppConfig().newsletterEndpoint
  if (!endpoint) {
    // Endpoint not configured yet — track the intent but explain.
    trackNewsletterSignup('footer')
    newsletterStatus.value = 'success'
    return
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newsletterEmail.value, source: 'footer' }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? 'Subscription failed')
    }
    trackNewsletterSignup('footer')
    newsletterStatus.value = 'success'
    newsletterEmail.value = ''
  } catch (err) {
    newsletterStatus.value = 'error'
    newsletterError.value = err instanceof Error ? err.message : 'Subscription failed'
  }
}
</script>

<template>
  <footer class="bg-ink text-paper py-16 md:py-20">
    <Container>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-y-12 gap-x-8 lg:gap-x-12">
        <!-- Brand + tagline + social + newsletter -->
        <div class="col-span-2 lg:col-span-2 flex flex-col gap-6 max-w-md">
          <RouterLink to="/" class="inline-block focus-ring-brand rounded-sm">
            <span class="font-display font-bold text-2xl tracking-tighter text-gradient-brand">
              STAIJA
            </span>
          </RouterLink>
          <p class="text-paper/70 text-sm leading-relaxed m-0">
            Nurturing Africa's next generation of scientist-leaders through research,
            mentorship, and community.
          </p>
          <div class="flex items-center gap-3">
            <a
              href="https://www.threads.com/@staija_ng"
              target="_blank"
              rel="noopener"
              aria-label="Follow us on Threads"
              class="w-9 h-9 rounded-full bg-paper/5 border border-paper/10 flex items-center justify-center text-paper/70 hover:text-paper hover:bg-paper/10 hover:border-paper/20 transition-colors"
            >
              <Icon icon="simple-icons:threads" width="16" height="16" />
            </a>
            <a
              href="https://www.instagram.com/staija_ng/"
              target="_blank"
              rel="noopener"
              aria-label="Follow us on Instagram"
              class="w-9 h-9 rounded-full bg-paper/5 border border-paper/10 flex items-center justify-center text-paper/70 hover:text-paper hover:bg-paper/10 hover:border-paper/20 transition-colors"
            >
              <Icon icon="mdi:instagram" width="18" height="18" />
            </a>
            <a
              href="https://www.linkedin.com/company/staija-ng/"
              target="_blank"
              rel="noopener"
              aria-label="Follow us on LinkedIn"
              class="w-9 h-9 rounded-full bg-paper/5 border border-paper/10 flex items-center justify-center text-paper/70 hover:text-paper hover:bg-paper/10 hover:border-paper/20 transition-colors"
            >
              <Icon icon="mdi:linkedin" width="18" height="18" />
            </a>
          </div>
          <div class="mt-2">
            <span class="block text-[11px] uppercase tracking-wider text-paper/70 mb-3 font-semibold">
              Stay in the loop
            </span>
            <form
              v-if="newsletterStatus !== 'success'"
              class="flex gap-2"
              @submit="handleNewsletter"
            >
              <input
                v-model="newsletterEmail"
                type="email"
                placeholder="you@example.com"
                aria-label="Email address"
                :disabled="newsletterStatus === 'submitting'"
                class="bg-paper/10 border border-paper/15 rounded-xl px-4 py-2.5 text-sm w-full text-paper placeholder:text-paper/50 focus:outline-none focus:border-brand-sky focus:bg-paper/15 focus:ring-1 focus:ring-brand-sky transition-all disabled:opacity-50"
                required
              />
              <input
                v-model="honeypot"
                type="text"
                name="trap"
                tabindex="-1"
                autocomplete="off"
                aria-hidden="true"
                class="sr-only"
              />
              <UiButton
                variant="primary"
                type="submit"
                class="shrink-0 px-4"
                :disabled="newsletterStatus === 'submitting'"
                aria-label="Subscribe"
              >
                <Icon
                  :icon="newsletterStatus === 'submitting' ? 'lucide:loader-2' : 'lucide:arrow-right'"
                  width="18"
                  height="18"
                  :class="newsletterStatus === 'submitting' && 'animate-spin'"
                />
              </UiButton>
            </form>
            <p v-else class="text-sm text-paper/85 bg-paper/10 border border-paper/15 rounded-xl px-4 py-2.5 m-0">
              Thanks — check your inbox to confirm your subscription.
            </p>
            <p v-if="newsletterError" role="alert" class="mt-2 text-xs text-red-300 m-0">
              {{ newsletterError }}
            </p>
          </div>
        </div>

        <!-- Programs -->
        <div class="lg:col-span-1">
          <h3 class="font-sans text-[11px] uppercase tracking-wider text-paper/70 mb-5 font-semibold m-0">
            Programs
          </h3>
          <ul class="flex flex-col gap-3 text-sm text-paper/85 list-none p-0 m-0">
            <li><RouterLink to="/programs/stepup-scholars" class="hover:text-white transition-colors">StepUp Scholars</RouterLink></li>
            <li><RouterLink to="/programs/dynamerge" class="hover:text-white transition-colors">Dynamerge</RouterLink></li>
            <li><RouterLink to="/events" class="hover:text-white transition-colors">Events</RouterLink></li>
            <li><RouterLink to="/blog" class="hover:text-white transition-colors">Stories</RouterLink></li>
          </ul>
        </div>

        <!-- Organization -->
        <div class="lg:col-span-1">
          <h3 class="font-sans text-[11px] uppercase tracking-wider text-paper/70 mb-5 font-semibold m-0">
            Organization
          </h3>
          <ul class="flex flex-col gap-3 text-sm text-paper/85 list-none p-0 m-0">
            <li><RouterLink to="/about" class="hover:text-white transition-colors">About</RouterLink></li>
            <li><RouterLink to="/get-involved" class="hover:text-white transition-colors">Get Involved</RouterLink></li>
            <li><RouterLink to="/contact" class="hover:text-white transition-colors">Contact</RouterLink></li>
            <li><RouterLink to="/press" class="hover:text-white transition-colors">Press</RouterLink></li>
            <li v-if="donationsEnabled"><RouterLink to="/donate" class="hover:text-white transition-colors">Donate</RouterLink></li>
          </ul>
        </div>

        <!-- Account -->
        <div class="lg:col-span-1">
          <h3 class="font-sans text-[11px] uppercase tracking-wider text-paper/70 mb-5 font-semibold m-0">
            Account
          </h3>
          <ul class="flex flex-col gap-3 text-sm text-paper/85 list-none p-0 m-0">
            <li><RouterLink to="/login" class="hover:text-white transition-colors">Sign in</RouterLink></li>
            <li><RouterLink to="/signup" class="hover:text-white transition-colors">Apply</RouterLink></li>
            <li v-if="donationsEnabled"><RouterLink to="/donor" class="hover:text-white transition-colors">My donations</RouterLink></li>
          </ul>
        </div>
      </div>

      <div class="mt-16 pt-8 border-t border-paper/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-paper/55">
        <p class="m-0">© {{ year }} STAIJA. All rights reserved.</p>
        <div class="flex items-center gap-6">
          <a href="#" class="hover:text-paper transition-colors">Privacy</a>
          <a href="#" class="hover:text-paper transition-colors">Terms</a>
          <LocaleSwitcher />
        </div>
      </div>
    </Container>
  </footer>
</template>

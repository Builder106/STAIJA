<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from './ui/Container.vue'
import UiButton from './ui/UiButton.vue'

const year = computed(() => new Date().getFullYear())

function handleNewsletter(e: Event) {
  e.preventDefault()
  // TODO: wire to newsletter backend
}
</script>

<template>
  <footer class="bg-ink text-paper py-16 md:py-24">
    <Container>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
        <div class="lg:col-span-4 flex flex-col gap-6">
          <RouterLink to="/" class="inline-block focus-ring-brand rounded-sm">
            <span class="font-display font-bold text-2xl tracking-tighter text-gradient-brand">
              STAIJA
            </span>
          </RouterLink>
          <p class="text-paper/70 text-sm max-w-sm leading-relaxed">
            Nurturing Africa's next generation of scientist-leaders through research,
            mentorship, and community.
          </p>
          <div class="flex items-center gap-4">
            <a
              href="https://www.threads.com/@staija_ng"
              target="_blank"
              rel="noopener"
              aria-label="Follow us on Threads"
              class="text-paper/60 hover:text-paper transition-colors"
            >
              <Icon icon="simple-icons:threads" width="20" height="20" />
            </a>
            <a
              href="https://www.instagram.com/staija_ng/"
              target="_blank"
              rel="noopener"
              aria-label="Follow us on Instagram"
              class="text-paper/60 hover:text-paper transition-colors"
            >
              <Icon icon="mdi:instagram" width="22" height="22" />
            </a>
            <a
              href="https://www.linkedin.com/company/staija-ng/"
              target="_blank"
              rel="noopener"
              aria-label="Follow us on LinkedIn"
              class="text-paper/60 hover:text-paper transition-colors"
            >
              <Icon icon="mdi:linkedin" width="22" height="22" />
            </a>
          </div>
          <div class="mt-2">
            <span class="block text-xs uppercase tracking-[0.12em] text-paper/50 mb-4 font-semibold">
              Newsletter
            </span>
            <form class="flex gap-2" @submit="handleNewsletter">
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                class="bg-paper/5 border border-paper/10 rounded-xl px-4 py-2.5 text-sm w-full text-paper placeholder:text-paper/40 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky transition-all"
                required
              />
              <UiButton variant="primary" type="submit" class="shrink-0 px-4" aria-label="Subscribe">
                <Icon icon="lucide:arrow-right" width="18" height="18" />
              </UiButton>
            </form>
          </div>
        </div>

        <div class="lg:col-span-2 lg:col-start-6">
          <span class="block text-xs uppercase tracking-[0.12em] text-paper/50 mb-6 font-semibold">
            Programs
          </span>
          <ul class="flex flex-col gap-4 text-sm text-paper/80 list-none p-0 m-0">
            <li><RouterLink to="/programs/stepup-scholars" class="hover:text-white transition-colors">StepUp Scholars</RouterLink></li>
            <li><RouterLink to="/programs/dynamerge" class="hover:text-white transition-colors">Dynamerge</RouterLink></li>
            <li><RouterLink to="/events" class="hover:text-white transition-colors">All Events</RouterLink></li>
            <li><RouterLink to="/blog" class="hover:text-white transition-colors">Stories</RouterLink></li>
          </ul>
        </div>

        <div class="lg:col-span-2">
          <span class="block text-xs uppercase tracking-[0.12em] text-paper/50 mb-6 font-semibold">
            Organization
          </span>
          <ul class="flex flex-col gap-4 text-sm text-paper/80 list-none p-0 m-0">
            <li><RouterLink to="/about" class="hover:text-white transition-colors">About Us</RouterLink></li>
            <li><RouterLink to="/get-involved" class="hover:text-white transition-colors">Get Involved</RouterLink></li>
            <li><RouterLink to="/contact" class="hover:text-white transition-colors">Contact</RouterLink></li>
            <li><RouterLink to="/donate" class="hover:text-white transition-colors">Donate</RouterLink></li>
          </ul>
        </div>

        <div class="lg:col-span-2">
          <span class="block text-xs uppercase tracking-[0.12em] text-paper/50 mb-6 font-semibold">
            Resources
          </span>
          <ul class="flex flex-col gap-4 text-sm text-paper/80 list-none p-0 m-0">
            <li><RouterLink to="/login" class="hover:text-white transition-colors">Sign in</RouterLink></li>
            <li><RouterLink to="/signup" class="hover:text-white transition-colors">Apply</RouterLink></li>
          </ul>
        </div>
      </div>

      <div class="mt-16 pt-8 border-t border-paper/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-paper/40">
        <p>© {{ year }} STAIJA. All rights reserved.</p>
        <div class="flex gap-6">
          <a href="#" class="hover:text-paper transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-paper transition-colors">Terms of Service</a>
        </div>
      </div>
    </Container>
  </footer>
</template>

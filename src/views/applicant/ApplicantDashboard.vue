<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiChip from '../../components/ui/UiChip.vue'
import { AuthService, DatabaseService } from '../../services/firebase'
import type { Application } from '../../services/types'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { displayName } = useAuth()

const applications = ref<Application[]>([])
const loading = ref(true)
const error = ref('')

const firstName = computed(() => {
  const name = displayName.value ?? ''
  return name.split(/[\s@]/)[0] || 'there'
})

const sortedApplications = computed(() =>
  [...applications.value].sort((a, b) => {
    const aDate = toDate(a.updatedAt ?? a.createdAt).getTime()
    const bDate = toDate(b.updatedAt ?? b.createdAt).getTime()
    return bDate - aDate
  }),
)

const hasApplications = computed(() => applications.value.length > 0)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    applications.value = await DatabaseService.getUserApplications(currentUser.uid)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load your applications.'
  } finally {
    loading.value = false
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return new Date(0)
}

function programLabel(p: Application['program']) {
  return p === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge'
}

function statusLabel(s: Application['status']) {
  switch (s) {
    case 'draft': return 'Draft'
    case 'submitted': return 'Submitted'
    case 'under_review': return 'Under review'
    case 'accepted': return 'Accepted'
    case 'rejected': return 'Decision sent'
  }
}

function statusTone(s: Application['status']): 'neutral' | 'progress' | 'success' | 'closed' {
  if (s === 'draft') return 'neutral'
  if (s === 'submitted' || s === 'under_review') return 'progress'
  if (s === 'accepted') return 'success'
  return 'closed'
}

function timeAgo(d: Date): string {
  const ms = Date.now() - d.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function continueRoute(app: Application): string {
  if (app.status === 'draft') return `/applicant/applications/${app.id}/edit`
  return `/applicant/applications/${app.id}`
}

onMounted(loadData)
</script>

<template>
  <Section class="!pt-12 !pb-24">
    <Container>
      <!-- Greeting -->
      <div class="flex flex-col gap-3 mb-12">
        <Eyebrow class="text-brand-violet">Applicant dashboard</Eyebrow>
        <Heading :level="1">Hi, {{ firstName }}.</Heading>
        <Body v-if="!loading && !hasApplications" class="text-ink/70 max-w-xl">
          You haven't started an application yet. Pick a program below to begin —
          it takes about 20 minutes and your progress saves automatically.
        </Body>
        <Body v-else-if="!loading" class="text-ink/70 max-w-xl">
          Pick up where you left off, or start a new application for the other program.
        </Body>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center gap-3 text-ink/60">
        <Icon icon="lucide:loader-2" width="18" class="animate-spin" />
        Loading your applications…
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-6"
      >
        <div class="flex items-center gap-3 text-red-700">
          <Icon icon="lucide:alert-circle" width="20" />
          <span class="font-semibold">Couldn't load your applications.</span>
        </div>
        <p class="text-sm text-ink/70 m-0">{{ error }}</p>
        <UiButton variant="secondary" @click="loadData" class="self-start">
          Try again
        </UiButton>
      </div>

      <!-- Empty state: no applications -->
      <template v-else-if="!hasApplications">
        <div class="grid md:grid-cols-2 gap-6 mb-12">
          <UiCard hoverable class="h-full flex flex-col relative pt-[4px]">
            <div class="absolute top-0 left-0 right-0 h-[4px] bg-gradient-brand" />
            <div class="p-8 flex flex-col h-full gap-5">
              <div class="flex justify-between items-start gap-4">
                <Heading :level="3">StepUp Scholars</Heading>
                <UiChip>In-person</UiChip>
              </div>
              <Body class="flex-1 text-ink/75">
                A six-month research incubator in Nigeria for high-school and
                gap-year students. Lab access, a stipend, and mentorship toward
                a first publication.
              </Body>
              <div class="flex items-center justify-between gap-4 pt-4 border-t hairline-ink">
                <span class="text-xs font-semibold tracking-wide text-ink/55 uppercase">
                  Ages 15–19 · Nigeria
                </span>
                <UiButton variant="primary" :to="'/apply/stepup-scholars'">
                  Apply
                </UiButton>
              </div>
            </div>
          </UiCard>

          <UiCard hoverable class="h-full flex flex-col relative pt-[4px]">
            <div class="absolute top-0 left-0 right-0 h-[4px] bg-gradient-brand" />
            <div class="p-8 flex flex-col h-full gap-5">
              <div class="flex justify-between items-start gap-4">
                <Heading :level="3">Dynamerge</Heading>
                <UiChip>Virtual</UiChip>
              </div>
              <Body class="flex-1 text-ink/75">
                A four-week pan-African virtual bootcamp — project-based work
                with global mentors across coding, data, biotech, and clean
                energy tracks.
              </Body>
              <div class="flex items-center justify-between gap-4 pt-4 border-t hairline-ink">
                <span class="text-xs font-semibold tracking-wide text-ink/55 uppercase">
                  Ages 15–20 · Pan-African
                </span>
                <UiButton variant="primary" :to="'/apply/dynamerge'">
                  Apply
                </UiButton>
              </div>
            </div>
          </UiCard>
        </div>

        <!-- What you'll need -->
        <div class="rounded-2xl border hairline-ink p-6 md:p-8 max-w-3xl">
          <Eyebrow class="text-brand-violet mb-3 block">Before you start</Eyebrow>
          <Heading :level="3" class="mb-4">What you'll need</Heading>
          <ul class="grid sm:grid-cols-2 gap-y-3 gap-x-8 list-none p-0 m-0">
            <li class="flex items-start gap-3">
              <Icon icon="lucide:file-text" width="18" class="text-brand-violet mt-0.5 shrink-0" />
              <span class="text-sm text-ink/80">A short personal essay (300–500 words)</span>
            </li>
            <li class="flex items-start gap-3">
              <Icon icon="lucide:users" width="18" class="text-brand-violet mt-0.5 shrink-0" />
              <span class="text-sm text-ink/80">Two references — we'll email them a link</span>
            </li>
            <li class="flex items-start gap-3">
              <Icon icon="lucide:graduation-cap" width="18" class="text-brand-violet mt-0.5 shrink-0" />
              <span class="text-sm text-ink/80">A transcript or grade summary (PDF or image)</span>
            </li>
            <li class="flex items-start gap-3">
              <Icon icon="lucide:clock" width="18" class="text-brand-violet mt-0.5 shrink-0" />
              <span class="text-sm text-ink/80">About 20 minutes — your progress saves as you go</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Has applications: list view -->
      <template v-else>
        <div class="flex items-center justify-between gap-4 mb-6">
          <Eyebrow class="text-brand-violet">Your applications</Eyebrow>
          <UiButton variant="secondary" :to="'/applicant/applications/new'">
            <Icon icon="lucide:plus" width="16" class="mr-1.5" />
            New application
          </UiButton>
        </div>

        <div class="flex flex-col gap-4">
          <RouterLink
            v-for="app in sortedApplications"
            :key="app.id"
            :to="continueRoute(app)"
            class="block group focus-ring-brand rounded-2xl"
          >
            <UiCard hoverable class="p-6 flex items-center gap-6">
              <div class="flex-1 flex flex-col gap-1.5 min-w-0">
                <div class="flex items-center gap-3 flex-wrap">
                  <h3 class="font-display text-xl font-semibold m-0 truncate">
                    {{ programLabel(app.program) }}
                  </h3>
                  <span
                    :class="[
                      'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full',
                      statusTone(app.status) === 'neutral' && 'bg-ink/10 text-ink/70',
                      statusTone(app.status) === 'progress' && 'bg-brand-violet/10 text-brand-violet',
                      statusTone(app.status) === 'success' && 'bg-emerald-500/10 text-emerald-700',
                      statusTone(app.status) === 'closed' && 'bg-ink/15 text-ink/65',
                    ]"
                  >
                    {{ statusLabel(app.status) }}
                  </span>
                </div>
                <p class="text-sm text-ink/60 m-0">
                  <template v-if="app.status === 'draft'">
                    Last edited {{ timeAgo(toDate(app.updatedAt ?? app.createdAt)) }}
                  </template>
                  <template v-else-if="app.submittedAt">
                    Submitted {{ timeAgo(toDate(app.submittedAt)) }}
                  </template>
                  <template v-else>
                    Created {{ timeAgo(toDate(app.createdAt)) }}
                  </template>
                </p>
              </div>
              <div class="flex items-center gap-2 text-sm font-semibold text-brand-violet shrink-0">
                <span class="hidden sm:inline">
                  {{ app.status === 'draft' ? 'Continue' : 'View status' }}
                </span>
                <Icon
                  icon="lucide:arrow-right"
                  width="18"
                  class="transition-transform group-hover:translate-x-1"
                />
              </div>
            </UiCard>
          </RouterLink>
        </div>

        <!-- "Apply to the other program" nudge: only show if exactly one program is covered -->
        <div
          v-if="applications.length === 1"
          class="mt-12 rounded-2xl border hairline-ink bg-paper p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <Heading :level="3" class="mb-1">Apply to the other program too?</Heading>
            <p class="text-sm text-ink/70 m-0">
              StepUp and Dynamerge are independent — you can apply to both.
            </p>
          </div>
          <UiButton
            v-if="applications[0].program === 'stepup_scholars'"
            variant="secondary"
            :to="'/apply/dynamerge'"
          >
            Apply to Dynamerge
          </UiButton>
          <UiButton
            v-else
            variant="secondary"
            :to="'/apply/stepup-scholars'"
          >
            Apply to StepUp
          </UiButton>
        </div>
      </template>
    </Container>
  </Section>
</template>

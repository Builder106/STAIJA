<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import { DatabaseService } from '../../services/database'
import type { Application } from '../../services/types'

const route = useRoute()
const application = ref<Application | null>(null)
const loading = ref(true)
const notFound = ref(false)
const error = ref<string | null>(null)

async function load() {
  const id = route.params.id as string
  loading.value = true
  notFound.value = false
  try {
    const result = await DatabaseService.getApplication(id)
    if (!result) {
      notFound.value = true
    } else {
      application.value = result
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load application'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const programLabel = computed(() => {
  const p = application.value?.program
  if (p === 'stepup_scholars') return 'StepUp Scholars'
  if (p === 'dynamerge') return 'Dynamerge'
  return 'STAIJA'
})

const programSlug = computed(() => {
  if (application.value?.program === 'stepup_scholars') return 'stepup-scholars'
  if (application.value?.program === 'dynamerge') return 'dynamerge'
  return ''
})

const statusInfo = computed(() => {
  const s = application.value?.status
  if (s === 'submitted') return { label: 'Under review', tone: 'amber', desc: 'We have your application. A reviewer will get to it within 5 business days.' }
  if (s === 'under-review') return { label: 'In active review', tone: 'sky', desc: "A reviewer is reading through it now. You'll hear from us soon." }
  if (s === 'accepted') return { label: 'Accepted', tone: 'emerald', desc: "You're in. Check your inbox for next steps." }
  if (s === 'declined') return { label: 'Decision made', tone: 'rose', desc: 'A decision has been made. Check your inbox for the message from the team.' }
  if (s === 'waitlisted') return { label: 'Waitlisted', tone: 'violet', desc: "You're on the waitlist. We may reach out if a spot opens." }
  return { label: 'Draft', tone: 'ink', desc: 'You have an unfinished application. Pick up where you left off.' }
})

const statusPillClass = computed(() => {
  const t = statusInfo.value.tone
  return ({
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-brand-violet/10 text-brand-violet border-brand-violet/20',
    ink: 'bg-ink/5 text-ink/70 border-ink/15',
  })[t] ?? 'bg-ink/5 text-ink/70 border-ink/15'
})

function formatDate(d: Date | string | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface ReferenceWithStatus {
  name: string
  email: string
  institution?: string
  relationship?: string
  status?: 'pending' | 'invited' | 'received'
}

const referenceList = computed<ReferenceWithStatus[]>(() => {
  const refs = application.value?.references ?? []
  return refs.map((r) => ({ ...r, status: (r as ReferenceWithStatus).status ?? 'pending' }))
})

function refStatusLabel(s: ReferenceWithStatus['status']) {
  if (s === 'received') return 'Letter received'
  if (s === 'invited') return 'Invite sent · awaiting'
  return 'Not yet invited'
}
function refStatusClass(s: ReferenceWithStatus['status']) {
  if (s === 'received') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s === 'invited') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-ink/5 text-ink/60 border-ink/15'
}
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section v-if="loading" class="!py-24">
      <Container class="max-w-3xl flex flex-col gap-6">
        <div class="h-4 w-32 bg-ink/5 rounded animate-pulse" />
        <div class="h-12 w-3/4 bg-ink/5 rounded animate-pulse" />
        <div class="h-32 w-full bg-ink/5 rounded-2xl animate-pulse" />
      </Container>
    </Section>

    <Section v-else-if="notFound || error" class="!py-24 text-center">
      <Container class="max-w-xl flex flex-col items-center gap-6">
        <Heading :level="2">{{ error ? 'Something went wrong.' : 'Application not found.' }}</Heading>
        <Body>{{ error || "That application doesn't exist or you don't have access to it." }}</Body>
        <UiButton variant="primary" :to="'/applicant'">My applications</UiButton>
      </Container>
    </Section>

    <template v-else-if="application">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container class="max-w-3xl">
        <RouterLink to="/applicant" class="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-brand-violet transition-colors mb-6 focus-ring-brand rounded-sm">
          <Icon icon="lucide:arrow-left" width="16" /> All applications
        </RouterLink>

        <Eyebrow class="text-brand-violet mb-3 block">{{ programLabel }} application</Eyebrow>
        <Heading :level="1" class="mb-4">
          {{ application.personalInfo?.firstName }} {{ application.personalInfo?.lastName }}
        </Heading>

        <div class="flex flex-wrap items-center gap-3">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border"
            :class="statusPillClass"
          >
            {{ statusInfo.label }}
          </span>
          <span class="text-sm text-ink/60">
            Submitted {{ formatDate(application.submittedAt ?? application.createdAt) }}
          </span>
          <span class="text-sm text-ink/40 font-mono">
            {{ route.params.id }}
          </span>
        </div>

        <Body class="text-ink/70 mt-6">{{ statusInfo.desc }}</Body>

        <div v-if="application.status === 'draft'" class="mt-6">
          <UiButton variant="gradient" :to="`/apply/${programSlug}`">
            Resume application
          </UiButton>
        </div>
      </Container>
    </Section>

    <Section class="!py-12">
      <Container class="max-w-3xl flex flex-col gap-6">
        <!-- References -->
        <UiCard class="p-6 md:p-8 bg-white">
          <div class="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 class="font-display text-xl font-semibold m-0 text-ink">References</h2>
              <p class="text-sm text-ink/60 m-0 mt-1">
                Letters arrive directly from each reference. You can track who's
                replied below.
              </p>
            </div>
            <Icon icon="lucide:mail" width="24" class="text-brand-violet shrink-0" />
          </div>
          <ul class="flex flex-col gap-3 list-none p-0 m-0">
            <li
              v-for="(r, i) in referenceList"
              :key="i"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border hairline-ink rounded-xl bg-paper/50"
            >
              <div>
                <div class="text-sm font-semibold text-ink">{{ r.name || `Reference ${i + 1}` }}</div>
                <div class="text-xs text-ink/60">{{ r.email }}{{ r.institution ? ` · ${r.institution}` : '' }}</div>
              </div>
              <span
                class="self-start sm:self-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap"
                :class="refStatusClass(r.status)"
              >
                {{ refStatusLabel(r.status) }}
              </span>
            </li>
          </ul>
        </UiCard>

        <!-- Personal info recap -->
        <UiCard class="p-6 md:p-8 bg-white">
          <h2 class="font-display text-xl font-semibold mb-5 m-0 text-ink">Personal</h2>
          <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div class="flex flex-col">
              <dt class="text-xs uppercase tracking-wider text-ink/50 font-semibold">Email</dt>
              <dd class="text-ink m-0">{{ application.personalInfo?.email }}</dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-xs uppercase tracking-wider text-ink/50 font-semibold">Phone</dt>
              <dd class="text-ink m-0">{{ application.personalInfo?.phone }}</dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-xs uppercase tracking-wider text-ink/50 font-semibold">Date of birth</dt>
              <dd class="text-ink m-0">{{ formatDate(application.personalInfo?.dateOfBirth) }}</dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-xs uppercase tracking-wider text-ink/50 font-semibold">Nationality</dt>
              <dd class="text-ink m-0">{{ application.personalInfo?.nationality }}</dd>
            </div>
            <div class="flex flex-col sm:col-span-2">
              <dt class="text-xs uppercase tracking-wider text-ink/50 font-semibold">School</dt>
              <dd class="text-ink m-0">
                {{ application.personalInfo?.currentInstitution }}
                <span v-if="application.personalInfo?.currentLevel" class="text-ink/60">
                  · {{ application.personalInfo.currentLevel }}
                </span>
              </dd>
            </div>
          </dl>
        </UiCard>

        <!-- Motivation -->
        <UiCard v-if="application.motivation || application.experience" class="p-6 md:p-8 bg-white">
          <h2 class="font-display text-xl font-semibold mb-5 m-0 text-ink">In your words</h2>
          <div v-if="application.researchInterests?.length" class="mb-5 flex flex-wrap gap-2">
            <span
              v-for="r in application.researchInterests"
              :key="r"
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border bg-brand-violet/10 text-brand-violet border-brand-violet/20"
            >
              {{ r }}
            </span>
          </div>
          <div v-if="application.motivation" class="mb-4">
            <div class="text-xs uppercase tracking-wider text-ink/50 font-semibold mb-2">Why this program</div>
            <p class="text-sm text-ink/80 leading-relaxed whitespace-pre-line m-0">{{ application.motivation }}</p>
          </div>
          <div v-if="application.experience">
            <div class="text-xs uppercase tracking-wider text-ink/50 font-semibold mb-2">Relevant experience</div>
            <p class="text-sm text-ink/80 leading-relaxed whitespace-pre-line m-0">{{ application.experience }}</p>
          </div>
        </UiCard>

        <p class="text-xs text-ink/40 text-center">
          Need to update something? Email
          <a href="mailto:hello@staija.org" class="text-brand-violet hover:underline">hello@staija.org</a>
          and quote this reference: <span class="font-mono">{{ route.params.id }}</span>.
        </p>
      </Container>
    </Section>
    </template>
  </div>
</template>

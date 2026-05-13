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
  if (s === 'under_review') return { label: 'In active review', tone: 'sky', desc: "A reviewer is reading through it now. You'll hear from us soon." }
  if (s === 'accepted') return { label: 'Accepted', tone: 'emerald', desc: "You're in. Check your inbox for next steps." }
  // Mirror the dashboard chip's "Not selected" so an applicant who
  // scans the dashboard sees the SAME plain-English outcome when they
  // click through. The legacy "Decision made" / "A decision has been
  // made" copy stayed ambiguous between accepted and rejected, which
  // is exactly what we don't want at the moment we deliver bad news.
  if (s === 'rejected') return { label: 'Not selected', tone: 'rose', desc: "We couldn't move you forward this cycle. The full note from the team is below." }
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

/** Coerce Firestore Timestamp / ISO string / Date into a Date. The
 *  reviewedAt field comes back as a Timestamp object from getDoc(),
 *  and `new Date(timestampObject)` produces an Invalid Date — same
 *  shape as the admin-side display we already had to normalise. */
function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const fn = (value as { toDate: () => Date }).toDate
    if (typeof fn === 'function') return fn.call(value)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Whether the application has reached a terminal decision the
 *  applicant should be told about in-app. `accepted` and `rejected`
 *  are the canonical end states; `under_review` is still in-progress.
 *  Decision-card render is gated on this so applications mid-flight
 *  don't get a confusing empty card. */
const hasDecision = computed(() => {
  const s = application.value?.status
  return s === 'accepted' || s === 'rejected'
})

/** Visual treatment + headline copy for the decision card. The
 *  applicant-facing tone is softer than the admin-facing chip — they
 *  see the decision in plain English ("You got in.") not the audit
 *  label ("Accepted"). */
const decisionMeta = computed(() => {
  const s = application.value?.status
  if (s === 'accepted') {
    return {
      headline: 'You got in.',
      eyebrow: 'Acceptance',
      icon: 'lucide:party-popper',
      iconClass: 'text-emerald-700 bg-emerald-100',
      cardClass: '!border-emerald-200 bg-emerald-50/40',
    }
  }
  // rejected — say the outcome out loud. "A decision has been made"
  // could equally describe an acceptance; the applicant shouldn't
  // have to scan the chip colour to know which one they got.
  return {
    headline: 'Not selected this cycle.',
    eyebrow: 'Decision',
    icon: 'lucide:mail',
    iconClass: 'text-rose-700 bg-rose-100',
    cardClass: '!border-rose-200 bg-rose-50/40',
  }
})

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
        <!-- Decision card. Renders only for terminal statuses
             (accepted/rejected) and surfaces the reviewer's feedback
             text inline. Previously the status hero just told the
             applicant to "check your inbox" — but email is unreliable
             (spam filters, deliverability holds), so the canonical
             copy of the decision needs to live in-app where the
             applicant can always read it. -->
        <UiCard
          v-if="hasDecision"
          class="p-6 md:p-8 bg-surface border-2"
          :class="decisionMeta.cardClass"
        >
          <div class="flex items-start gap-4 mb-5">
            <div
              class="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              :class="decisionMeta.iconClass"
            >
              <Icon :icon="decisionMeta.icon" width="22" />
            </div>
            <div class="flex-1 min-w-0">
              <Eyebrow class="text-ink/55 mb-1 block">{{ decisionMeta.eyebrow }}</Eyebrow>
              <h2 class="font-display text-xl md:text-2xl font-semibold m-0 text-ink">
                {{ decisionMeta.headline }}
              </h2>
            </div>
          </div>

          <!-- Feedback body. Renders only when staff actually wrote
               one. If they didn't, the headline + reviewedAt footer
               below ARE the decision — no need to invent a phantom
               "detailed message" the applicant should go look for. -->
          <div v-if="application.feedback">
            <div class="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-2">
              Note from the team
            </div>
            <p class="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap m-0">
              {{ application.feedback }}
            </p>
          </div>

          <div
            v-if="application.reviewedAt"
            class="text-xs text-ink/50"
            :class="application.feedback ? 'mt-4 pt-4 border-t hairline-ink' : ''"
          >
            Decision sent {{ formatDate(toDate(application.reviewedAt) ?? undefined) }}
          </div>
        </UiCard>

        <!-- References -->
        <UiCard class="p-6 md:p-8 bg-surface">
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
        <UiCard class="p-6 md:p-8 bg-surface">
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
        <UiCard v-if="application.motivation || application.experience" class="p-6 md:p-8 bg-surface">
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

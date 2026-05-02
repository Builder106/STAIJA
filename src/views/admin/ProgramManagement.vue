<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiButton from '../../components/ui/UiButton.vue'
import { AuthService, DatabaseService, type Program } from '../../services/firebase'
import { ProgramService } from '../../services/programService'

const programs = ref<Program[]>([])
const drafts = reactive<Record<string, ProgramDraft>>({})
const loading = ref(true)
const error = ref('')
const seeding = ref(false)
const savingId = ref<string | null>(null)
const toast = ref<{ kind: 'success' | 'error'; text: string } | null>(null)

interface ProgramDraft {
  applicationStart: string
  applicationEnd: string
  programStart: string
  programEnd: string
  decisionsBy: string
  status: Program['status']
}

async function loadPrograms() {
  loading.value = true
  error.value = ''
  try {
    programs.value = await ProgramService.getAllPrograms()
    for (const p of programs.value) {
      if (!p.id) continue
      drafts[p.id] = snapshotDraft(p)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load programs.'
  } finally {
    loading.value = false
  }
}

function snapshotDraft(p: Program): ProgramDraft {
  return {
    applicationStart: p.dates.applicationStart || '',
    applicationEnd: p.dates.applicationEnd || '',
    programStart: p.dates.programStart || '',
    programEnd: p.dates.programEnd || '',
    decisionsBy: p.dates.decisionsBy || '',
    status: p.status,
  }
}

function isDirty(p: Program): boolean {
  if (!p.id) return false
  const d = drafts[p.id]
  if (!d) return false
  return (
    d.applicationStart !== (p.dates.applicationStart || '') ||
    d.applicationEnd !== (p.dates.applicationEnd || '') ||
    d.programStart !== (p.dates.programStart || '') ||
    d.programEnd !== (p.dates.programEnd || '') ||
    d.decisionsBy !== (p.dates.decisionsBy || '') ||
    d.status !== p.status
  )
}

function discardChanges(p: Program) {
  if (!p.id) return
  drafts[p.id] = snapshotDraft(p)
}

async function saveChanges(p: Program) {
  if (!p.id) return
  const d = drafts[p.id]
  if (!d) return
  savingId.value = p.id
  try {
    const currentUser = AuthService.getCurrentUser()
    await DatabaseService.updateProgram(p.id, {
      dates: {
        applicationStart: d.applicationStart,
        applicationEnd: d.applicationEnd,
        programStart: d.programStart,
        programEnd: d.programEnd,
        decisionsBy: d.decisionsBy,
      },
      status: d.status,
      updatedBy: currentUser?.uid ?? p.updatedBy ?? '',
    })
    // Reflect new state locally without re-fetching the whole list.
    p.dates = {
      applicationStart: d.applicationStart,
      applicationEnd: d.applicationEnd,
      programStart: d.programStart,
      programEnd: d.programEnd,
      decisionsBy: d.decisionsBy,
    }
    p.status = d.status
    p.updatedAt = new Date()
    showToast('success', `${p.name} saved.`)
  } catch (err) {
    showToast('error', err instanceof Error ? err.message : 'Save failed.')
  } finally {
    savingId.value = null
  }
}

async function seedDefaults() {
  seeding.value = true
  try {
    await Promise.all([createSeed(STEPUP_SEED), createSeed(DYNAMERGE_SEED)])
    await loadPrograms()
    showToast('success', 'Created StepUp and Dynamerge defaults. Set the dates, then flip status to active when applications open.')
  } catch (err) {
    showToast('error', err instanceof Error ? err.message : 'Seed failed.')
  } finally {
    seeding.value = false
  }
}

async function createSeed(seed: SeedTemplate) {
  const currentUser = AuthService.getCurrentUser()
  await DatabaseService.createProgram({
    ...seed,
    status: 'draft',
    updatedBy: currentUser?.uid ?? '',
  })
}

function showToast(kind: 'success' | 'error', text: string) {
  toast.value = { kind, text }
  window.setTimeout(() => {
    if (toast.value?.text === text) toast.value = null
  }, 3500)
}

function applicationStatus(p: Program): 'open' | 'closed' | 'upcoming' | 'unset' {
  if (!p.dates.applicationStart || !p.dates.applicationEnd) return 'unset'
  return ProgramService.getApplicationStatus(p)
}

function applicationStatusLabel(s: ReturnType<typeof applicationStatus>): string {
  switch (s) {
    case 'open': return 'Applications open'
    case 'closed': return 'Applications closed'
    case 'upcoming': return 'Applications upcoming'
    case 'unset': return 'Dates not set'
  }
}

function timeAgo(value: unknown): string {
  const ms = Date.now() - toMillis(value)
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`
  return new Date(toMillis(value)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function toMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime()
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).getTime()
  }
  return 0
}

const sortedPrograms = computed(() =>
  [...programs.value].sort((a, b) => a.name.localeCompare(b.name)),
)

onMounted(loadPrograms)

// Seed templates: only the operational shell. The static content fields
// (description, benefits, curriculum, etc.) on the Program type are unused
// by the public site — program pages hardcode their copy in StepUp.vue and
// Dynamerge.vue, and Contentful holds the editorial content. We populate
// them with empty defaults so the type-required fields aren't undefined.
type SeedTemplate = Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'updatedBy'>

const STEPUP_SEED: SeedTemplate = {
  name: 'StepUp Scholars',
  slug: 'stepup-scholars',
  description: 'In-person research incubator in Nigeria for high-school and gap-year students.',
  overview: '',
  benefits: [],
  requirements: [],
  applicationProcess: { steps: [], summary: { totalTime: '', successRate: '', responseTime: '' } },
  dates: { applicationStart: '', applicationEnd: '', programStart: '', programEnd: '', decisionsBy: '' },
  eligibility: { ageRange: '15–19', educationLevel: 'Secondary school / gap year', location: 'Nigeria', otherRequirements: [] },
  curriculum: { duration: '6 months', format: 'In-person', topics: [], activities: [] },
  contact: { email: 'hello@staija.org' },
}

const DYNAMERGE_SEED: SeedTemplate = {
  name: 'Dynamerge',
  slug: 'dynamerge',
  description: 'Pan-African virtual summer bootcamp for ambitious students.',
  overview: '',
  benefits: [],
  requirements: [],
  applicationProcess: { steps: [], summary: { totalTime: '', successRate: '', responseTime: '' } },
  dates: { applicationStart: '', applicationEnd: '', programStart: '', programEnd: '', decisionsBy: '' },
  eligibility: { ageRange: '15–20', educationLevel: 'Secondary school / undergrad', location: 'Pan-African', otherRequirements: [] },
  curriculum: { duration: '4 weeks', format: 'Virtual', topics: [], activities: [] },
  contact: { email: 'hello@staija.org' },
}
</script>

<template>
  <Section class="!pt-12 !pb-24">
    <Container>
      <!-- Greeting -->
      <div class="flex flex-col gap-3 mb-12">
        <Eyebrow class="text-brand-violet">Admin · Program settings</Eyebrow>
        <Heading :level="1">Cohort dates &amp; status</Heading>
        <Body class="text-ink/70 max-w-xl">
          Set the application window, program dates, and current status for
          each program. Public program pages always render — this controls
          when applications are accepted.
        </Body>
      </div>

      <div v-if="loading" class="flex items-center gap-3 text-ink/60">
        <Icon icon="lucide:loader-2" width="18" class="animate-spin" />
        Loading programs…
      </div>

      <div
        v-else-if="error"
        class="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-6 max-w-2xl"
      >
        <div class="flex items-center gap-3 text-red-700">
          <Icon icon="lucide:alert-circle" width="20" />
          <span class="font-semibold">Couldn't load programs.</span>
        </div>
        <p class="text-sm text-ink/70 m-0">{{ error }}</p>
        <UiButton variant="secondary" @click="loadPrograms" class="self-start">
          Try again
        </UiButton>
      </div>

      <!-- Empty state: no programs configured -->
      <div
        v-else-if="programs.length === 0"
        class="rounded-2xl border hairline-ink p-8 max-w-2xl flex flex-col gap-5"
      >
        <Heading :level="3">No programs configured.</Heading>
        <Body class="text-ink/70">
          Create the StepUp Scholars and Dynamerge defaults to start tracking
          cohort dates. Both will be created in <strong>draft</strong> status —
          flip them to active once applications open.
        </Body>
        <UiButton
          variant="primary"
          :disabled="seeding"
          class="self-start"
          @click="seedDefaults"
        >
          <Icon
            v-if="seeding"
            icon="lucide:loader-2"
            width="16"
            class="animate-spin mr-1.5"
          />
          {{ seeding ? 'Creating…' : 'Create StepUp & Dynamerge defaults' }}
        </UiButton>
      </div>

      <!-- Programs list -->
      <div v-else class="flex flex-col gap-6">
        <UiCard
          v-for="p in sortedPrograms"
          :key="p.id"
          class="p-6 md:p-8"
        >
          <div class="flex flex-col gap-6">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex flex-col gap-2">
                <Heading :level="3" class="m-0">{{ p.name }}</Heading>
                <a
                  :href="`/programs/${p.slug}`"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-ink/60 hover:text-brand-violet inline-flex items-center gap-1.5 w-fit"
                >
                  /programs/{{ p.slug }}
                  <Icon icon="lucide:external-link" width="14" />
                </a>
              </div>
              <div class="flex flex-col items-end gap-1.5">
                <span
                  :class="[
                    'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full',
                    p.status === 'active' && 'bg-emerald-500/10 text-emerald-700',
                    p.status === 'draft' && 'bg-ink/10 text-ink/70',
                    p.status === 'inactive' && 'bg-ink/15 text-ink/65',
                  ]"
                >
                  {{ p.status }}
                </span>
                <span class="text-xs text-ink/55">
                  {{ applicationStatusLabel(applicationStatus(p)) }}
                </span>
              </div>
            </div>

            <!-- Application window -->
            <div class="flex flex-col gap-3">
              <Eyebrow class="text-brand-violet">Application window</Eyebrow>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Opens</span>
                  <input
                    v-if="p.id"
                    v-model="drafts[p.id].applicationStart"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Closes</span>
                  <input
                    v-if="p.id"
                    v-model="drafts[p.id].applicationEnd"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Decisions by</span>
                  <input
                    v-if="p.id"
                    v-model="drafts[p.id].decisionsBy"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                  />
                </label>
              </div>
            </div>

            <!-- Program dates -->
            <div class="flex flex-col gap-3">
              <Eyebrow class="text-brand-violet">Program dates</Eyebrow>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Starts</span>
                  <input
                    v-if="p.id"
                    v-model="drafts[p.id].programStart"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Ends</span>
                  <input
                    v-if="p.id"
                    v-model="drafts[p.id].programEnd"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                  />
                </label>
              </div>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-3">
              <Eyebrow class="text-brand-violet">Status</Eyebrow>
              <label class="flex flex-col gap-1.5 max-w-xs">
                <select
                  v-if="p.id"
                  v-model="drafts[p.id].status"
                  class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                >
                  <option value="active">Active — accepting applications</option>
                  <option value="draft">Draft — staff only</option>
                  <option value="inactive">Inactive — applications hidden</option>
                </select>
              </label>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between gap-4 pt-4 border-t hairline-ink flex-wrap">
              <span class="text-xs text-ink/55">
                Last updated {{ timeAgo(p.updatedAt) }}
              </span>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="text-sm font-semibold text-ink/60 hover:text-ink"
                  :disabled="!isDirty(p) || savingId === p.id"
                  @click="discardChanges(p)"
                >
                  Discard
                </button>
                <UiButton
                  variant="primary"
                  :disabled="!isDirty(p) || savingId === p.id"
                  @click="saveChanges(p)"
                >
                  <Icon
                    v-if="savingId === p.id"
                    icon="lucide:loader-2"
                    width="16"
                    class="animate-spin mr-1.5"
                  />
                  {{ savingId === p.id ? 'Saving…' : 'Save changes' }}
                </UiButton>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Toast -->
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-150"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="toast"
          :class="[
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg max-w-md',
            toast.kind === 'success' && 'bg-emerald-700 text-white',
            toast.kind === 'error' && 'bg-red-700 text-white',
          ]"
          role="status"
        >
          {{ toast.text }}
        </div>
      </Transition>
    </Container>
  </Section>
</template>

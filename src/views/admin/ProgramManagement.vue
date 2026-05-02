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
import IconPicker from '../../components/admin/IconPicker.vue'
import {
  AuthService,
  DatabaseService,
  type Program,
  type ProgramStat,
  type ProgramFeature,
  type ProgramTimelineStep,
  type ProgramMentor,
} from '../../services/firebase'
import { ProgramService } from '../../services/programService'

interface ProgramDraft {
  pitch: string
  eligibility: string
  heroImg: string
  stats: ProgramStat[]
  features: ProgramFeature[]
  timeline: ProgramTimelineStep[]
  eligibilityList: string[]
  mentors: ProgramMentor[]
  applicationStart: string
  applicationEnd: string
  programStart: string
  programEnd: string
  decisionsBy: string
  status: Program['status']
}

const programs = ref<Program[]>([])
const drafts = reactive<Record<string, ProgramDraft>>({})
const loading = ref(true)
const error = ref('')
const seeding = ref(false)
const savingId = ref<string | null>(null)
const toast = ref<{ kind: 'success' | 'error'; text: string } | null>(null)

const sortedPrograms = computed(() =>
  [...programs.value].sort((a, b) => a.name.localeCompare(b.name)),
)

async function loadPrograms() {
  loading.value = true
  error.value = ''
  try {
    programs.value = await ProgramService.getAllPrograms()
    for (const p of programs.value) {
      if (p.id) drafts[p.id] = snapshotDraft(p)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load programs.'
  } finally {
    loading.value = false
  }
}

function snapshotDraft(p: Program): ProgramDraft {
  return {
    pitch: p.pitch ?? '',
    eligibility: p.eligibility ?? '',
    heroImg: p.heroImg ?? '',
    // Deep-clone the arrays so editing the draft doesn't mutate the
    // canonical Program object until the user clicks Save.
    stats: (p.stats ?? []).map((s) => ({ ...s })),
    features: (p.features ?? []).map((f) => ({ ...f })),
    timeline: (p.timeline ?? []).map((t) => ({ ...t })),
    eligibilityList: [...(p.eligibilityList ?? [])],
    mentors: (p.mentors ?? []).map((m) => ({ ...m })),
    applicationStart: p.dates?.applicationStart || '',
    applicationEnd: p.dates?.applicationEnd || '',
    programStart: p.dates?.programStart || '',
    programEnd: p.dates?.programEnd || '',
    decisionsBy: p.dates?.decisionsBy || '',
    status: p.status,
  }
}

function isDirty(p: Program): boolean {
  if (!p.id) return false
  const d = drafts[p.id]
  if (!d) return false
  // Cheap deep-equality via JSON.stringify — these payloads are tiny and
  // there are at most two programs on the page.
  return JSON.stringify(d) !== JSON.stringify(snapshotDraft(p))
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
    const updates: Partial<Program> = {
      pitch: d.pitch,
      eligibility: d.eligibility,
      heroImg: d.heroImg,
      stats: d.stats,
      features: d.features,
      timeline: d.timeline,
      eligibilityList: d.eligibilityList,
      mentors: d.mentors,
      dates: {
        applicationStart: d.applicationStart,
        applicationEnd: d.applicationEnd,
        programStart: d.programStart,
        programEnd: d.programEnd,
        decisionsBy: d.decisionsBy,
      },
      status: d.status,
      updatedBy: currentUser?.uid ?? p.updatedBy ?? '',
    }
    await DatabaseService.updateProgram(p.id, updates)
    Object.assign(p, updates, { updatedAt: new Date() })
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
  if (!p.dates?.applicationStart || !p.dates?.applicationEnd) return 'unset'
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

// Array-of-object editors — small helpers used by the template buttons.
function addStat(d: ProgramDraft) {
  d.stats.push({ icon: 'lucide:star', label: '', value: '' })
}
function addFeature(d: ProgramDraft) {
  d.features.push({ title: '', desc: '', img: '' })
}
function addTimelineStep(d: ProgramDraft) {
  d.timeline.push({ date: '', desc: '' })
}
function addEligibilityItem(d: ProgramDraft) {
  d.eligibilityList.push('')
}
function addMentor(d: ProgramDraft) {
  d.mentors.push({ name: '', title: '', institution: '', img: '' })
}

onMounted(loadPrograms)

// --- Seed data --------------------------------------------------------
//
// Mirrors the FALLBACKS dict in src/components/ProgramDetailView.vue so
// running this seed produces the same public pages users see today, just
// driven by Firestore instead of hardcoded constants. The fallback in
// ProgramDetailView stays as a safety net for unauthenticated transient
// errors and for the migration window before this seed runs.

type SeedTemplate = Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'updatedBy'>

const STEPUP_SEED: SeedTemplate = {
  name: 'StepUp Scholars',
  slug: 'stepup-scholars',
  pitch: 'A rigorous, Nigeria-based research incubator for high-school and gap-year students.',
  eligibility: 'Ages 15–19 · Nigeria',
  heroImg: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  stats: [
    { icon: 'lucide:users', label: 'Cohort size', value: '30 students' },
    { icon: 'lucide:clock', label: 'Duration', value: '6 months' },
    { icon: 'lucide:banknote', label: 'Stipend', value: '₦50,000 / mo' },
  ],
  features: [
    { title: 'Real Research', desc: 'Access world-class labs and equipment. Design experiments and gather original data.', img: 'https://images.unsplash.com/photo-1758573467240-f944226c2026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { title: 'Direct Mentorship', desc: 'Work 1:1 with postdoctoral researchers and industry scientists from top institutions.', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { title: 'Lasting Community', desc: 'Join a tight-knit cohort of peers who will become your future collaborators.', img: 'https://images.unsplash.com/photo-1737529807163-1d8a3fb6c403?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  ],
  timeline: [
    { date: 'Month 1', desc: 'Research methods boot camp and lab safety certification.' },
    { date: 'Month 2–4', desc: 'Active experimentation, data gathering, and weekly mentor check-ins.' },
    { date: 'Month 5', desc: 'Data analysis, scientific writing workshops, and abstract drafting.' },
    { date: 'Month 6', desc: 'Final symposium presentation and submission to youth science journals.' },
  ],
  eligibilityList: [
    'Must be between 15 and 19 years old',
    'Currently enrolled in secondary school or on a gap year in Nigeria',
    'Demonstrated interest in STEM subjects',
    'Able to commit 10 hours per week for 6 months',
  ],
  mentors: [
    { name: 'Dr. Amina Yusuf', title: 'Postdoctoral Researcher', institution: 'MIT', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { name: 'Prof. David Okafor', title: 'Principal Investigator', institution: 'University of Lagos', img: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { name: 'Sarah Nwachukwu', title: 'PhD Candidate', institution: 'Stanford', img: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  ],
  dates: { applicationStart: '', applicationEnd: '', programStart: '', programEnd: '', decisionsBy: '' },
}

const DYNAMERGE_SEED: SeedTemplate = {
  name: 'Dynamerge',
  slug: 'dynamerge',
  pitch: 'A pan-African virtual summer bootcamp connecting ambitious students with global mentors.',
  eligibility: 'Ages 15–20 · Pan-African',
  heroImg: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  stats: [
    { icon: 'lucide:users', label: 'Eligibility', value: 'Pan-African' },
    { icon: 'lucide:clock', label: 'Duration', value: '4 weeks' },
    { icon: 'lucide:banknote', label: 'Cost', value: 'Fully funded' },
  ],
  features: [
    { title: 'Intensive Curriculum', desc: 'Four weeks of daily virtual workshops covering coding, data science, and leadership.', img: 'https://images.unsplash.com/photo-1758573467240-f944226c2026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { title: 'Global Mentors', desc: 'Learn directly from industry experts at top tech companies and research institutes.', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { title: 'Pan-African Network', desc: 'Build lasting relationships with peers across the continent.', img: 'https://images.unsplash.com/photo-1737529807163-1d8a3fb6c403?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  ],
  timeline: [
    { date: 'Week 1', desc: 'Foundations: Introduction to programming and data analysis.' },
    { date: 'Week 2', desc: 'Deep Dive: specialized tracks in AI, biotech, or clean energy.' },
    { date: 'Week 3', desc: 'Project Phase: Collaborative problem solving in assigned teams.' },
    { date: 'Week 4', desc: 'Demo Day: Present solutions to a panel of expert judges.' },
  ],
  eligibilityList: [
    'Must be between 15 and 20 years old',
    'Resident of any African country',
    'Reliable internet access (data stipends available based on need)',
    'Passionate about leveraging technology for impact',
  ],
  mentors: [
    { name: 'Dr. Amina Yusuf', title: 'Postdoctoral Researcher', institution: 'MIT', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { name: 'Prof. David Okafor', title: 'Principal Investigator', institution: 'University of Lagos', img: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { name: 'Sarah Nwachukwu', title: 'PhD Candidate', institution: 'Stanford', img: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  ],
  dates: { applicationStart: '', applicationEnd: '', programStart: '', programEnd: '', decisionsBy: '' },
}
</script>

<template>
  <Section class="!pt-12 !pb-24">
    <Container>
      <!-- Greeting -->
      <div class="flex flex-col gap-3 mb-12">
        <Eyebrow class="text-brand-violet">Admin · Program settings</Eyebrow>
        <Heading :level="1">Programs</Heading>
        <Body class="text-ink/70 max-w-xl">
          Edit everything that shows on the public program page — pitch, hero
          image, stats, features, curriculum timeline, eligibility, and
          mentors — plus cohort dates and current status. Save changes at
          the bottom of each program card.
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
          cohort dates and editing public copy. The seed populates the same
          content the public site renders today, so nothing changes for
          visitors — but everything becomes editable from this page.
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
      <div v-else class="flex flex-col gap-8">
        <UiCard
          v-for="p in sortedPrograms"
          :key="p.id"
          class="p-6 md:p-8"
        >
          <div v-if="p.id && drafts[p.id]" class="flex flex-col gap-8">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex flex-col gap-2">
                <Heading :level="2" class="m-0">{{ p.name }}</Heading>
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

            <!-- Hero / pitch -->
            <details open class="group">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none py-2">
                <Eyebrow class="text-brand-violet">Hero</Eyebrow>
                <Icon
                  icon="lucide:chevron-down"
                  width="16"
                  class="text-ink/50 transition-transform group-open:rotate-180"
                />
              </summary>
              <div class="flex flex-col gap-4 pt-3">
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Pitch</span>
                  <textarea
                    v-model="drafts[p.id].pitch"
                    rows="3"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20 leading-relaxed"
                    placeholder="One-sentence summary that appears under the program name on the public page."
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Eligibility line</span>
                  <input
                    v-model="drafts[p.id].eligibility"
                    type="text"
                    placeholder="Ages 15–19 · Nigeria"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                  />
                </label>
                <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
                  <label class="flex flex-col gap-1.5">
                    <span class="text-sm font-semibold text-ink/80">Hero image URL</span>
                    <input
                      v-model="drafts[p.id].heroImg"
                      type="url"
                      placeholder="https://…"
                      class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-brand-violet/20"
                    />
                  </label>
                  <div
                    v-if="drafts[p.id].heroImg"
                    class="w-32 h-24 rounded-lg overflow-hidden border hairline-ink bg-ink/5 mt-7"
                  >
                    <img
                      :src="drafts[p.id].heroImg"
                      :alt="`${p.name} hero preview`"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </details>

            <!-- Stats -->
            <details class="group">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none py-2">
                <Eyebrow class="text-brand-violet">Stats (hero strip)</Eyebrow>
                <div class="flex items-center gap-3 text-ink/50 text-sm">
                  <span>{{ drafts[p.id].stats.length }} item{{ drafts[p.id].stats.length === 1 ? '' : 's' }}</span>
                  <Icon
                    icon="lucide:chevron-down"
                    width="16"
                    class="transition-transform group-open:rotate-180"
                  />
                </div>
              </summary>
              <div class="flex flex-col gap-3 pt-3">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="text-sm font-semibold text-brand-violet hover:underline flex items-center gap-1"
                    @click="addStat(drafts[p.id])"
                  >
                    <Icon icon="lucide:plus" width="14" /> Add stat
                  </button>
                </div>
                <div
                  v-if="drafts[p.id].stats.length === 0"
                  class="text-sm text-ink/50 italic"
                >
                  No stats yet.
                </div>
                <div
                  v-for="(stat, i) in drafts[p.id].stats"
                  :key="i"
                  class="grid grid-cols-1 md:grid-cols-[220px_1fr_1fr_auto] gap-3 items-end p-4 rounded-xl border hairline-ink"
                >
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-semibold text-ink/70">Icon</span>
                    <IconPicker v-model="stat.icon" :aria-label="`Stat ${i + 1} icon`" />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-semibold text-ink/70">Label</span>
                    <input
                      v-model="stat.label"
                      type="text"
                      class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                    />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-semibold text-ink/70">Value</span>
                    <input
                      v-model="stat.value"
                      type="text"
                      class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    class="text-ink/50 hover:text-red-700 self-end p-2"
                    :aria-label="`Remove stat ${stat.label}`"
                    @click="drafts[p.id].stats.splice(i, 1)"
                  >
                    <Icon icon="lucide:trash-2" width="16" />
                  </button>
                </div>
              </div>
            </details>

            <!-- Features -->
            <details class="group">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none py-2">
                <Eyebrow class="text-brand-violet">Features ("Why join us")</Eyebrow>
                <div class="flex items-center gap-3 text-ink/50 text-sm">
                  <span>{{ drafts[p.id].features.length }} item{{ drafts[p.id].features.length === 1 ? '' : 's' }}</span>
                  <Icon icon="lucide:chevron-down" width="16" class="transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div class="flex flex-col gap-3 pt-3">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="text-sm font-semibold text-brand-violet hover:underline flex items-center gap-1"
                    @click="addFeature(drafts[p.id])"
                  >
                    <Icon icon="lucide:plus" width="14" /> Add feature
                  </button>
                </div>
                <div
                  v-if="drafts[p.id].features.length === 0"
                  class="text-sm text-ink/50 italic"
                >
                  No features yet.
                </div>
                <div
                  v-for="(feature, i) in drafts[p.id].features"
                  :key="i"
                  class="flex flex-col gap-3 p-4 rounded-xl border hairline-ink"
                >
                  <div class="flex items-start justify-between gap-3">
                    <input
                      v-model="feature.title"
                      type="text"
                      placeholder="Feature title"
                      class="flex-1 rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      class="text-ink/50 hover:text-red-700 p-2 shrink-0"
                      :aria-label="`Remove feature ${feature.title}`"
                      @click="drafts[p.id].features.splice(i, 1)"
                    >
                      <Icon icon="lucide:trash-2" width="16" />
                    </button>
                  </div>
                  <textarea
                    v-model="feature.desc"
                    rows="2"
                    placeholder="One- or two-sentence description"
                    class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm leading-relaxed"
                  />
                  <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
                    <input
                      v-model="feature.img"
                      type="url"
                      placeholder="Image URL (https://…)"
                      class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                    />
                    <div
                      v-if="feature.img"
                      class="w-24 h-18 rounded-lg overflow-hidden border hairline-ink bg-ink/5"
                    >
                      <img
                        :src="feature.img"
                        :alt="feature.title || 'Feature preview'"
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </details>

            <!-- Timeline -->
            <details class="group">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none py-2">
                <Eyebrow class="text-brand-violet">Timeline ("What you'll do")</Eyebrow>
                <div class="flex items-center gap-3 text-ink/50 text-sm">
                  <span>{{ drafts[p.id].timeline.length }} step{{ drafts[p.id].timeline.length === 1 ? '' : 's' }}</span>
                  <Icon icon="lucide:chevron-down" width="16" class="transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div class="flex flex-col gap-3 pt-3">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="text-sm font-semibold text-brand-violet hover:underline flex items-center gap-1"
                    @click="addTimelineStep(drafts[p.id])"
                  >
                    <Icon icon="lucide:plus" width="14" /> Add step
                  </button>
                </div>
                <div
                  v-if="drafts[p.id].timeline.length === 0"
                  class="text-sm text-ink/50 italic"
                >
                  No timeline steps yet.
                </div>
                <div
                  v-for="(step, i) in drafts[p.id].timeline"
                  :key="i"
                  class="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-start p-4 rounded-xl border hairline-ink"
                >
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-semibold text-ink/70">When</span>
                    <input
                      v-model="step.date"
                      type="text"
                      placeholder="Month 1"
                      class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                    />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-semibold text-ink/70">What happens</span>
                    <textarea
                      v-model="step.desc"
                      rows="2"
                      class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm leading-relaxed"
                    />
                  </label>
                  <button
                    type="button"
                    class="text-ink/50 hover:text-red-700 self-start p-2 mt-5"
                    :aria-label="`Remove timeline step ${step.date}`"
                    @click="drafts[p.id].timeline.splice(i, 1)"
                  >
                    <Icon icon="lucide:trash-2" width="16" />
                  </button>
                </div>
              </div>
            </details>

            <!-- Eligibility list -->
            <details class="group">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none py-2">
                <Eyebrow class="text-brand-violet">Eligibility list ("Who it's for")</Eyebrow>
                <div class="flex items-center gap-3 text-ink/50 text-sm">
                  <span>{{ drafts[p.id].eligibilityList.length }} item{{ drafts[p.id].eligibilityList.length === 1 ? '' : 's' }}</span>
                  <Icon icon="lucide:chevron-down" width="16" class="transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div class="flex flex-col gap-3 pt-3">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="text-sm font-semibold text-brand-violet hover:underline flex items-center gap-1"
                    @click="addEligibilityItem(drafts[p.id])"
                  >
                    <Icon icon="lucide:plus" width="14" /> Add requirement
                  </button>
                </div>
                <div
                  v-if="drafts[p.id].eligibilityList.length === 0"
                  class="text-sm text-ink/50 italic"
                >
                  No requirements yet.
                </div>
                <div
                  v-for="(_, i) in drafts[p.id].eligibilityList"
                  :key="i"
                  class="flex items-center gap-3"
                >
                  <input
                    v-model="drafts[p.id].eligibilityList[i]"
                    type="text"
                    placeholder="One requirement per line"
                    class="flex-1 rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    class="text-ink/50 hover:text-red-700 p-2"
                    :aria-label="`Remove requirement ${i + 1}`"
                    @click="drafts[p.id].eligibilityList.splice(i, 1)"
                  >
                    <Icon icon="lucide:trash-2" width="16" />
                  </button>
                </div>
              </div>
            </details>

            <!-- Mentors -->
            <details class="group">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none py-2">
                <Eyebrow class="text-brand-violet">Mentors</Eyebrow>
                <div class="flex items-center gap-3 text-ink/50 text-sm">
                  <span>{{ drafts[p.id].mentors.length }} mentor{{ drafts[p.id].mentors.length === 1 ? '' : 's' }}</span>
                  <Icon icon="lucide:chevron-down" width="16" class="transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div class="flex flex-col gap-3 pt-3">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="text-sm font-semibold text-brand-violet hover:underline flex items-center gap-1"
                    @click="addMentor(drafts[p.id])"
                  >
                    <Icon icon="lucide:plus" width="14" /> Add mentor
                  </button>
                </div>
                <div
                  v-if="drafts[p.id].mentors.length === 0"
                  class="text-sm text-ink/50 italic"
                >
                  No mentors yet.
                </div>
                <div
                  v-for="(mentor, i) in drafts[p.id].mentors"
                  :key="i"
                  class="flex gap-4 p-4 rounded-xl border hairline-ink"
                >
                  <div
                    v-if="mentor.img"
                    class="w-16 h-16 rounded-full overflow-hidden border hairline-ink bg-ink/5 shrink-0"
                  >
                    <img
                      :src="mentor.img"
                      :alt="mentor.name || 'Mentor preview'"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div
                    v-else
                    class="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center shrink-0 text-ink/30"
                  >
                    <Icon icon="lucide:user" width="24" />
                  </div>
                  <div class="flex-1 flex flex-col gap-3 min-w-0">
                    <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                      <label class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-ink/70">Name</span>
                        <input
                          v-model="mentor.name"
                          type="text"
                          class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm font-semibold"
                        />
                      </label>
                      <label class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-ink/70">Title</span>
                        <input
                          v-model="mentor.title"
                          type="text"
                          placeholder="Postdoctoral Researcher"
                          class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        class="text-ink/50 hover:text-red-700 self-end p-2"
                        :aria-label="`Remove mentor ${mentor.name}`"
                        @click="drafts[p.id].mentors.splice(i, 1)"
                      >
                        <Icon icon="lucide:trash-2" width="16" />
                      </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-ink/70">Institution</span>
                        <input
                          v-model="mentor.institution"
                          type="text"
                          placeholder="MIT"
                          class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                        />
                      </label>
                      <label class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-ink/70">Photo URL</span>
                        <input
                          v-model="mentor.img"
                          type="url"
                          placeholder="https://…"
                          class="rounded-lg border hairline-ink bg-paper px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            <!-- Application window -->
            <div class="flex flex-col gap-3">
              <Eyebrow class="text-brand-violet">Application window</Eyebrow>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Opens</span>
                  <input
                    v-model="drafts[p.id].applicationStart"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans"
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Closes</span>
                  <input
                    v-model="drafts[p.id].applicationEnd"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans"
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Decisions by</span>
                  <input
                    v-model="drafts[p.id].decisionsBy"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans"
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
                    v-model="drafts[p.id].programStart"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans"
                  />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-semibold text-ink/80">Ends</span>
                  <input
                    v-model="drafts[p.id].programEnd"
                    type="date"
                    class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans"
                  />
                </label>
              </div>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-3">
              <Eyebrow class="text-brand-violet">Status</Eyebrow>
              <label class="flex flex-col gap-1.5 max-w-xs">
                <select
                  v-model="drafts[p.id].status"
                  class="rounded-xl border hairline-ink bg-paper px-3 py-2 text-sm font-sans"
                >
                  <option value="active">Active — accepting applications</option>
                  <option value="draft">Draft — staff only</option>
                  <option value="inactive">Inactive — applications hidden</option>
                </select>
              </label>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between gap-4 pt-6 border-t hairline-ink flex-wrap sticky bottom-0 bg-paper -mx-6 md:-mx-8 px-6 md:px-8 py-4">
              <span class="text-xs text-ink/55">
                Last updated {{ timeAgo(p.updatedAt) }}
              </span>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="text-sm font-semibold text-ink/60 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
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

<script setup lang="ts">
/**
 * Admin application triage surface — the queue staff scan before
 * drilling into individual reviews.
 *
 * The legacy version used the codebase's pre-design-system CSS
 * vocabulary (--color-primary, --color-secondary, --color-background)
 * which were never defined as actual tokens, so the Export Data
 * button rendered as white text on a transparent background, the
 * Program column's pill rendered as white text on white, and the
 * Submitted column showed "Invalid Date" because `new Date(timestamp)`
 * doesn't coerce a Firestore Timestamp object. This rewrite drops the
 * legacy CSS entirely and uses the same UiCard / UiButton / Section /
 * status-chip vocabulary the unified review page already uses, so the
 * two surfaces feel like one product instead of two.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import { DatabaseService, AuthService, type Application } from '../../services/firebase'

const router = useRouter()

const applications = ref<Application[]>([])
const loading = ref(true)
const error = ref('')
const selectedApplications = ref<string[]>([])

const searchQuery = ref('')
const statusFilter = ref('')
const programFilter = ref('')
const sortBy = ref('submittedAt')

/** Status presentation map. Single source of truth so the chip tones
 *  match the unified review page — staff scanning the list and
 *  staff inside an open application see the same colour for the same
 *  state, instead of two different visual languages. */
interface StatusMeta {
  label: string
  pill: string
}
const STATUS_META: Record<Application['status'], StatusMeta> = {
  draft:        { label: 'Draft',         pill: 'bg-ink/5 text-ink/60 border-ink/15' },
  submitted:    { label: 'Submitted',     pill: 'bg-brand-violet/10 text-brand-violet border-brand-violet/30' },
  under_review: { label: 'Under review',  pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted:     { label: 'Accepted',      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:     { label: 'Decision sent', pill: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const PROGRAM_LABEL: Record<Application['program'], string> = {
  stepup_scholars: 'StepUp Scholars',
  dynamerge:       'Dynamerge',
}

/** Coerce Firestore Timestamp / ISO string / Date into a real Date.
 *  Without this the bare `new Date(timestampObject)` call returned an
 *  Invalid Date and surfaced "Invalid Date" in the table cell — the
 *  ALL-CAPS clue you saw on the legacy surface. */
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

function formatDate(value: unknown): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const filteredApplications = computed(() => {
  let filtered = applications.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (app) =>
        app.personalInfo.firstName.toLowerCase().includes(q) ||
        app.personalInfo.lastName.toLowerCase().includes(q) ||
        app.personalInfo.email.toLowerCase().includes(q) ||
        app.researchInterests.some((i) => i.toLowerCase().includes(q)),
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter((app) => app.status === statusFilter.value)
  }
  if (programFilter.value) {
    filtered = filtered.filter((app) => app.program === programFilter.value)
  }

  // Sort. Out-of-the-list null timestamps go to the bottom so the
  // newest reviewable applications are always on top. localeCompare
  // covers the string columns.
  const sorted = [...filtered]
  sorted.sort((a, b) => {
    switch (sortBy.value) {
      case 'submittedAt': {
        const aT = toDate(a.submittedAt)?.getTime() ?? 0
        const bT = toDate(b.submittedAt)?.getTime() ?? 0
        return bT - aT
      }
      case 'createdAt': {
        const aT = toDate(a.createdAt)?.getTime() ?? 0
        const bT = toDate(b.createdAt)?.getTime() ?? 0
        return bT - aT
      }
      case 'program':
        return a.program.localeCompare(b.program)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'personalInfo.firstName':
        return a.personalInfo.firstName.localeCompare(b.personalInfo.firstName)
      default:
        return 0
    }
  })
  return sorted
})

const hasFilters = computed(
  () => !!(searchQuery.value || statusFilter.value || programFilter.value),
)

const allSelected = computed(
  () =>
    filteredApplications.value.length > 0 &&
    filteredApplications.value.every((app) => selectedApplications.value.includes(app.id!)),
)

const submittedCount   = computed(() => applications.value.filter((a) => a.status === 'submitted').length)
const underReviewCount = computed(() => applications.value.filter((a) => a.status === 'under_review').length)
const acceptedCount    = computed(() => applications.value.filter((a) => a.status === 'accepted').length)
const rejectedCount    = computed(() => applications.value.filter((a) => a.status === 'rejected').length)

/** Sorted snapshot of researchInterests for the cell. The legacy view
 *  used `.slice(0, 2).join(', ') + '...'` unconditionally — adds an
 *  ellipsis even when there are exactly 2 interests. Cheap to fix
 *  while we're rewriting the cell. */
function shortInterests(list: string[] | undefined | null): string {
  if (!list || list.length === 0) return '—'
  if (list.length <= 2) return list.join(', ')
  return `${list.slice(0, 2).join(', ')} +${list.length - 2}`
}

async function loadApplications() {
  loading.value = true
  error.value = ''
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    applications.value = await DatabaseService.getAllApplications()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load applications'
  } finally {
    loading.value = false
  }
}

function toggleSelection(applicationId: string) {
  const idx = selectedApplications.value.indexOf(applicationId)
  if (idx > -1) selectedApplications.value.splice(idx, 1)
  else selectedApplications.value.push(applicationId)
}

function toggleSelectAll() {
  if (allSelected.value) selectedApplications.value = []
  else selectedApplications.value = filteredApplications.value.map((a) => a.id!)
}

function clearSelection() {
  selectedApplications.value = []
}

/** Whether a bulk action is currently in flight — disables every
 *  bulk button so the staffer doesn't accidentally double-fire while
 *  the first batch is still hitting Firestore. */
const bulking = ref(false)

async function bulkUpdateStatus(status: Application['status']) {
  if (selectedApplications.value.length === 0 || bulking.value) return
  bulking.value = true
  try {
    const reviewer = AuthService.getCurrentUser()?.email || 'Unknown'
    await Promise.all(
      selectedApplications.value.map((id) =>
        DatabaseService.updateApplication(id, {
          status,
          reviewedAt: new Date(),
          reviewedBy: reviewer,
        }),
      ),
    )
    await loadApplications()
    selectedApplications.value = []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Bulk update failed'
  } finally {
    bulking.value = false
  }
}

function openApplication(applicationId: string) {
  router.push(`/admin/applications/${applicationId}`)
}

/** Route to the manual-enroll surface with the applicant's uid
 *  pre-filled. The EnrollStudent page reads `?applicant=<uid>` on
 *  mount and locks the student picker to that uid, so staff can pick
 *  a cohort + mentor without hunting through the full candidate list.
 *  Available on every accepted application — staff can still enroll
 *  before the applicant explicitly accepts, but the spot-confirmed
 *  indicator on the row is the visual cue for "this one's ready". */
function placeInCohort(userId: string) {
  router.push({ path: '/admin/enroll', query: { applicant: userId } })
}

/** CSV export of the currently-filtered list. Quotes every cell so
 *  commas inside research interests / names don't corrupt the
 *  column boundaries — the legacy export joined `researchInterests`
 *  with `; ` to dodge this, but a name with a comma still broke. */
function exportApplications() {
  const cell = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [
    ['Name', 'Email', 'Program', 'Status', 'Submitted', 'Research Interests'].map(cell).join(','),
    ...filteredApplications.value.map((app) =>
      [
        `${app.personalInfo.firstName} ${app.personalInfo.lastName}`,
        app.personalInfo.email,
        PROGRAM_LABEL[app.program] || app.program,
        STATUS_META[app.status]?.label || app.status,
        toDate(app.submittedAt)?.toISOString() ?? '',
        (app.researchInterests || []).join('; '),
      ].map(cell).join(','),
    ),
  ]
  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

onMounted(loadApplications)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <!-- Hero band. Mirrors the unified ReviewApplication.vue header
         so jumping between the queue and an open review stays
         visually coherent. -->
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container class="max-w-6xl">
        <Eyebrow class="text-brand-violet mb-3 block">Admin</Eyebrow>
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="flex flex-col gap-2">
            <Heading :level="1" class="!text-3xl md:!text-4xl !m-0">
              Applications
            </Heading>
            <Body class="text-ink/70 m-0">
              Review and triage every program application.
            </Body>
          </div>
          <UiButton
            variant="secondary"
            :disabled="filteredApplications.length === 0"
            @click="exportApplications"
          >
            <span class="flex items-center gap-2">
              <Icon icon="lucide:download" width="16" />
              Export CSV
            </span>
          </UiButton>
        </div>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="max-w-6xl flex flex-col gap-6">
        <!-- Stats strip. Five compact cards so staff see the queue
             shape at a glance before scanning the table. Numbers
             reflect the FULL set, not the filtered subset — filters
             change what's visible below, not what's true. -->
        <div v-if="!loading && applications.length > 0" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            v-for="stat in [
              { label: 'Total',        value: applications.length, tone: 'text-ink' },
              { label: 'Submitted',    value: submittedCount,   tone: 'text-brand-violet' },
              { label: 'Under review', value: underReviewCount, tone: 'text-amber-700' },
              { label: 'Accepted',     value: acceptedCount,    tone: 'text-emerald-700' },
              { label: 'Decision sent',value: rejectedCount,    tone: 'text-rose-700' },
            ]"
            :key="stat.label"
            class="bg-surface border hairline-ink rounded-2xl p-4 flex flex-col items-start gap-1"
          >
            <span class="text-xs uppercase tracking-wider text-ink/55 font-semibold">{{ stat.label }}</span>
            <span class="font-display text-2xl font-semibold tabular-nums" :class="stat.tone">{{ stat.value }}</span>
          </div>
        </div>

        <!-- Filters + search. Search left, filters right. On mobile
             they stack with a label-less search at the top — staff
             scrolling on mobile shouldn't have to scroll past every
             dropdown to reach the input. -->
        <UiCard class="p-4 md:p-5 bg-surface flex flex-col gap-3">
          <div class="relative">
            <Icon
              icon="lucide:search"
              width="16"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, email, or research interest…"
              class="w-full border hairline-ink rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-paper"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UiSelect
              v-model="statusFilter"
              placeholder="All statuses"
              :options="[
                { value: '',             label: 'All statuses' },
                { value: 'submitted',    label: 'Submitted' },
                { value: 'under_review', label: 'Under review' },
                { value: 'accepted',     label: 'Accepted' },
                { value: 'rejected',     label: 'Decision sent' },
              ]"
            />
            <UiSelect
              v-model="programFilter"
              placeholder="All programs"
              :options="[
                { value: '',                label: 'All programs' },
                { value: 'stepup_scholars', label: 'StepUp Scholars' },
                { value: 'dynamerge',       label: 'Dynamerge' },
              ]"
            />
            <UiSelect
              v-model="sortBy"
              :options="[
                { value: 'submittedAt',            label: 'Sort: Date submitted' },
                { value: 'createdAt',              label: 'Sort: Date created' },
                { value: 'program',                label: 'Sort: Program' },
                { value: 'status',                 label: 'Sort: Status' },
                { value: 'personalInfo.firstName', label: 'Sort: Name' },
              ]"
            />
          </div>
        </UiCard>

        <!-- Bulk-action bar. Renders only when one+ rows are
             selected, with the count surfaced for ambiguity-free
             affordance ("9 selected · Accept selected"). Disabled
             while a bulk op is in flight so the staffer can't
             double-fire. -->
        <div
          v-if="selectedApplications.length > 0"
          class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-brand-violet/30 bg-brand-violet/5"
        >
          <span class="text-sm font-semibold text-ink">
            {{ selectedApplications.length }} selected
          </span>
          <div class="flex flex-wrap gap-2 flex-1">
            <button
              type="button"
              :disabled="bulking"
              class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors focus-ring-brand"
              @click="bulkUpdateStatus('under_review')"
            >
              <Icon icon="lucide:eye" width="14" /> Mark under review
            </button>
            <button
              type="button"
              :disabled="bulking"
              class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors focus-ring-brand"
              @click="bulkUpdateStatus('accepted')"
            >
              <Icon icon="lucide:check" width="14" /> Accept selected
            </button>
            <button
              type="button"
              :disabled="bulking"
              class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors focus-ring-brand"
              @click="bulkUpdateStatus('rejected')"
            >
              <Icon icon="lucide:x" width="14" /> Decline selected
            </button>
          </div>
          <button
            type="button"
            :disabled="bulking"
            class="text-sm font-semibold text-ink/60 hover:text-ink focus-ring-brand rounded-sm disabled:opacity-50"
            @click="clearSelection"
          >
            Clear
          </button>
        </div>

        <!-- Inline error. Same rose pill the review surface uses for
             save errors so the visual vocabulary stays consistent. -->
        <div
          v-if="error"
          role="alert"
          class="flex items-center justify-between gap-3 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900"
        >
          <div class="flex items-center gap-3">
            <Icon icon="lucide:alert-circle" width="20" class="text-rose-700 shrink-0" />
            <span class="text-sm">{{ error }}</span>
          </div>
          <UiButton variant="secondary" @click="loadApplications">Retry</UiButton>
        </div>

        <!-- Loading skeleton. Holds the page shape so the first paint
             doesn't reflow when applications land. -->
        <div v-if="loading" class="flex flex-col gap-3">
          <div v-for="i in 4" :key="i" class="h-20 bg-ink/5 rounded-2xl animate-pulse" />
        </div>

        <!-- Empty state -->
        <UiCard
          v-else-if="filteredApplications.length === 0"
          class="p-10 md:p-16 bg-surface flex flex-col items-center gap-3 text-center"
        >
          <div class="w-14 h-14 rounded-full bg-brand-violet/10 flex items-center justify-center">
            <Icon icon="lucide:clipboard-list" width="28" class="text-brand-violet" />
          </div>
          <Heading :level="3" class="!text-xl !m-0">
            {{ hasFilters ? 'No applications match your filters.' : 'No applications yet.' }}
          </Heading>
          <Body class="text-ink/65 m-0 max-w-md">
            {{ hasFilters
              ? 'Adjust the status / program filters or clear the search to see more.'
              : 'Applications submitted through the wizard land here for review.' }}
          </Body>
        </UiCard>

        <!-- Applications list. Desktop renders a proper table for
             scan-ability across columns; mobile collapses each row
             into a stacked card with the same data, prioritising the
             applicant name + status chip + Open button. -->
        <template v-else>
          <!-- Desktop / tablet (md+) — table -->
          <UiCard class="hidden md:block bg-surface overflow-hidden p-0">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-ink/[0.025]">
                  <th class="text-left p-4 w-10">
                    <input
                      type="checkbox"
                      :checked="allSelected"
                      class="rounded border-ink/20 text-brand-violet focus:ring-brand-violet"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th class="text-left p-4 text-xs uppercase tracking-wider text-ink/55 font-semibold">Applicant</th>
                  <th class="text-left p-4 text-xs uppercase tracking-wider text-ink/55 font-semibold">Program</th>
                  <th class="text-left p-4 text-xs uppercase tracking-wider text-ink/55 font-semibold">Status</th>
                  <th class="text-left p-4 text-xs uppercase tracking-wider text-ink/55 font-semibold">Submitted</th>
                  <th class="text-left p-4 text-xs uppercase tracking-wider text-ink/55 font-semibold">Interests</th>
                  <th class="text-right p-4 text-xs uppercase tracking-wider text-ink/55 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="app in filteredApplications"
                  :key="app.id"
                  class="border-t hairline-ink hover:bg-ink/[0.025] transition-colors cursor-pointer"
                  :class="{ '!bg-brand-violet/5': selectedApplications.includes(app.id!) }"
                  @click="openApplication(app.id!)"
                >
                  <td class="p-4" @click.stop>
                    <input
                      type="checkbox"
                      :checked="selectedApplications.includes(app.id!)"
                      class="rounded border-ink/20 text-brand-violet focus:ring-brand-violet"
                      @change="toggleSelection(app.id!)"
                    />
                  </td>
                  <td class="p-4">
                    <div class="font-semibold text-ink text-sm">
                      {{ app.personalInfo.firstName }} {{ app.personalInfo.lastName }}
                    </div>
                    <div class="text-xs text-ink/55 truncate">{{ app.personalInfo.email }}</div>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-ink/5 text-ink/80">
                      {{ PROGRAM_LABEL[app.program] || app.program }}
                    </span>
                  </td>
                  <td class="p-4">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap"
                      :class="STATUS_META[app.status]?.pill"
                    >
                      {{ STATUS_META[app.status]?.label || app.status }}
                      <!-- Spot-response indicator. Only renders on
                           accepted rows where the applicant has
                           replied. Three states map to three icons so
                           staff can triage at a glance:
                             - ✓ emerald → ready to enroll
                             - ✗ rose    → applicant declined, do NOT
                                          enroll
                             - clock amber → applicant deferred,
                                          revisit next cycle -->
                      <Icon
                        v-if="app.status === 'accepted' && app.spotResponse === 'accepted'"
                        icon="lucide:check"
                        width="12"
                        class="text-emerald-700"
                        :aria-label="'Applicant accepted their spot'"
                      />
                      <Icon
                        v-else-if="app.status === 'accepted' && app.spotResponse === 'declined'"
                        icon="lucide:x"
                        width="12"
                        class="text-rose-700"
                        :aria-label="'Applicant declined the offer'"
                      />
                      <Icon
                        v-else-if="app.status === 'accepted' && app.spotResponse === 'deferred'"
                        icon="lucide:clock"
                        width="12"
                        class="text-amber-700"
                        :aria-label="'Applicant deferred to next cycle'"
                      />
                    </span>
                  </td>
                  <td class="p-4 text-sm text-ink/75 whitespace-nowrap">
                    {{ formatDate(app.submittedAt) }}
                  </td>
                  <td class="p-4 text-sm text-ink/65 max-w-[12rem] truncate">
                    {{ shortInterests(app.researchInterests) }}
                  </td>
                  <td class="p-4 text-right whitespace-nowrap" @click.stop>
                    <div class="inline-flex items-center gap-4">
                      <!-- Place-in-cohort gating:
                           - Hidden entirely for declined applicants —
                             enrolling someone who said "no thanks" is
                             a clear bug, so we remove the affordance.
                           - Shown for accepted + no-response + deferred,
                             but deferred renders muted so staff treats
                             it as an explicit override (the applicant
                             said "next cycle" — proceeding now is a
                             conscious choice). -->
                      <button
                        v-if="app.status === 'accepted' && app.spotResponse !== 'declined'"
                        type="button"
                        class="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline focus-ring-brand rounded-sm"
                        :class="app.spotResponse === 'deferred'
                          ? 'text-ink/45 hover:text-amber-700'
                          : 'text-emerald-700'"
                        :title="app.spotResponse === 'deferred'
                          ? 'Applicant deferred to next cycle. Override only if you have a reason.'
                          : undefined"
                        @click="placeInCohort(app.userId)"
                      >
                        <Icon icon="lucide:user-plus" width="14" />
                        Place in cohort
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-violet hover:underline focus-ring-brand rounded-sm"
                        @click="openApplication(app.id!)"
                      >
                        Open
                        <Icon icon="lucide:arrow-right" width="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </UiCard>

          <!-- Mobile — stacked cards. Checkbox + name + email +
               status chip + Open. Tap-area is the full card. -->
          <div class="md:hidden flex flex-col gap-3">
            <div
              v-for="app in filteredApplications"
              :key="app.id"
              class="bg-surface border hairline-ink rounded-2xl p-4 flex flex-col gap-3"
              :class="{ '!border-brand-violet/30 bg-brand-violet/5': selectedApplications.includes(app.id!) }"
              @click="openApplication(app.id!)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 flex-1 min-w-0" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedApplications.includes(app.id!)"
                    class="mt-1 rounded border-ink/20 text-brand-violet focus:ring-brand-violet shrink-0"
                    @change="toggleSelection(app.id!)"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-ink text-sm">
                      {{ app.personalInfo.firstName }} {{ app.personalInfo.lastName }}
                    </div>
                    <div class="text-xs text-ink/55 truncate">{{ app.personalInfo.email }}</div>
                  </div>
                </div>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border whitespace-nowrap shrink-0"
                  :class="STATUS_META[app.status]?.pill"
                >
                  {{ STATUS_META[app.status]?.label || app.status }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs text-ink/60">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-ink/5 text-ink/80 font-semibold">
                  {{ PROGRAM_LABEL[app.program] || app.program }}
                </span>
                <span>{{ formatDate(app.submittedAt) }}</span>
              </div>
              <div
                v-if="app.researchInterests && app.researchInterests.length > 0"
                class="text-xs text-ink/65 truncate"
              >
                {{ shortInterests(app.researchInterests) }}
              </div>
            </div>
          </div>
        </template>
      </Container>
    </Section>
  </div>
</template>

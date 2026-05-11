<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import { useAuth } from '../../composables/useAuth'
import { CohortService, toMillis } from '../../services/learn'
import { Timestamp } from 'firebase/firestore'
import type { Cohort } from '../../services/types'

const { user } = useAuth()

const cohorts = ref<Cohort[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const editingId = ref<string | null>(null)

const blank = () => ({
  program: 'stepup_scholars' as 'stepup_scholars' | 'dynamerge',
  courseSlug: '',
  courseVersion: '',
  name: '',
  startDate: '',
  endDate: '',
  mentorPool: '',
  status: 'planned' as 'planned' | 'active' | 'completed',
})
const form = ref(blank())
const saving = ref(false)

const canSave = computed(
  () =>
    form.value.courseSlug &&
    form.value.courseVersion &&
    form.value.startDate &&
    form.value.endDate,
)

async function load() {
  loading.value = true
  try {
    cohorts.value = await CohortService.listAllCohorts()
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Failed to load cohorts.'
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = blank()
  showForm.value = true
}

function openEdit(c: Cohort) {
  editingId.value = c.id ?? null
  form.value = {
    program: c.program,
    courseSlug: c.courseSlug,
    courseVersion: c.courseVersion,
    name: c.name ?? '',
    startDate: new Date(toMillis(c.startDate)).toISOString().slice(0, 10),
    endDate: new Date(toMillis(c.endDate)).toISOString().slice(0, 10),
    mentorPool: (c.mentorPool ?? []).join(', '),
    status: c.status,
  }
  showForm.value = true
}

async function save() {
  if (!canSave.value || !user.value) return
  saving.value = true
  error.value = null
  try {
    const payload = {
      program: form.value.program,
      courseSlug: form.value.courseSlug.trim(),
      courseVersion: form.value.courseVersion.trim(),
      name: form.value.name.trim() || undefined,
      startDate: Timestamp.fromDate(new Date(form.value.startDate)).toDate(),
      endDate: Timestamp.fromDate(new Date(form.value.endDate)).toDate(),
      mentorPool: form.value.mentorPool
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: form.value.status,
      createdBy: user.value.uid,
    }

    if (editingId.value) {
      await CohortService.updateCohort(editingId.value, payload)
    } else {
      await CohortService.createCohort(payload)
    }
    showForm.value = false
    await load()
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function remove(c: Cohort) {
  if (!c.id) return
  if (!confirm(`Delete cohort "${c.name || c.courseSlug}"? This can't be undone.`)) return
  try {
    await CohortService.deleteCohort(c.id)
    await load()
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Delete failed.'
  }
}

function fmtDate(value: unknown) {
  return new Date(toMillis(value)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const statusClass: Record<string, string> = {
  planned: 'bg-ink/5 text-ink/70 ring-1 ring-ink/10',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  completed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Admin</Eyebrow>
        <Heading :level="1" class="mb-3">Cohorts.</Heading>
        <Body class="text-ink/70 max-w-2xl">
          A cohort is one cycle of a course — set start/end dates, pin a course version, assign a
          mentor pool. Enrollment is done from <strong>/admin/enroll</strong>.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-6">
        <div class="flex justify-end">
          <UiButton variant="primary" @click="openNew">
            <Icon icon="lucide:plus" width="14" />
            New cohort
          </UiButton>
        </div>

        <UiCard v-if="loading" class="p-10 bg-surface text-center">
          <Icon icon="lucide:loader-2" width="24" class="animate-spin text-brand-violet mx-auto" />
        </UiCard>

        <UiCard v-else-if="error" class="p-6 bg-surface">
          <Body class="text-red-700 text-sm">{{ error }}</Body>
        </UiCard>

        <UiCard v-else-if="cohorts.length === 0" class="p-10 bg-surface text-center">
          <Body class="text-ink/60 text-sm">No cohorts yet.</Body>
        </UiCard>

        <UiCard v-else class="p-0 bg-surface overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-ink/[0.03] text-ink/60">
                <tr>
                  <th class="text-left font-semibold px-5 py-3">Cohort</th>
                  <th class="text-left font-semibold px-5 py-3">Program</th>
                  <th class="text-left font-semibold px-5 py-3">Dates</th>
                  <th class="text-left font-semibold px-5 py-3">Mentors</th>
                  <th class="text-left font-semibold px-5 py-3">Status</th>
                  <th class="text-right font-semibold px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in cohorts"
                  :key="c.id"
                  class="border-t hairline-ink hover:bg-ink/[0.015]"
                >
                  <td class="px-5 py-3">
                    <div class="text-ink font-medium">{{ c.name || c.courseSlug }}</div>
                    <div class="text-ink/60 text-xs">v{{ c.courseVersion }}</div>
                  </td>
                  <td class="px-5 py-3 text-ink/80 capitalize">
                    {{ c.program.replace('_', ' ') }}
                  </td>
                  <td class="px-5 py-3 text-ink/70 text-xs whitespace-nowrap">
                    {{ fmtDate(c.startDate) }} – {{ fmtDate(c.endDate) }}
                  </td>
                  <td class="px-5 py-3 text-ink/70 text-xs">{{ (c.mentorPool ?? []).length }}</td>
                  <td class="px-5 py-3">
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                      :class="statusClass[c.status]"
                    >
                      {{ c.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <button
                      type="button"
                      class="text-xs font-medium text-brand-violet hover:underline mr-3"
                      @click="openEdit(c)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-xs font-medium text-red-700 hover:underline"
                      @click="remove(c)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiCard>

        <!-- Form -->
        <UiCard v-if="showForm" class="p-6 md:p-8 bg-surface">
          <Heading :level="2" class="text-lg mb-4">
            {{ editingId ? 'Edit cohort' : 'New cohort' }}
          </Heading>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Program</label>
              <UiSelect
                v-model="form.program"
                :options="[
                  { value: 'stepup_scholars', label: 'StepUp Scholars' },
                  { value: 'dynamerge', label: 'Dynamerge' },
                ]"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Status</label>
              <UiSelect
                v-model="form.status"
                :options="[
                  { value: 'planned', label: 'Planned' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                ]"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Course slug</label>
              <input
                v-model="form.courseSlug"
                type="text"
                placeholder="e.g. stepup-foundations"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-surface text-sm font-mono"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Course version</label>
              <input
                v-model="form.courseVersion"
                type="text"
                placeholder="e.g. 2026-spring"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-surface text-sm font-mono"
              />
            </div>
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Display name <span class="text-ink/40 normal-case">(optional)</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. Spring 2026"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-surface text-sm"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Start date</label>
              <input
                v-model="form.startDate"
                type="date"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-surface text-sm"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">End date</label>
              <input
                v-model="form.endDate"
                type="date"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-surface text-sm"
              />
            </div>
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Mentor pool <span class="text-ink/40 normal-case">(comma-separated uids)</span>
              </label>
              <textarea
                v-model="form.mentorPool"
                rows="2"
                placeholder="abc123, def456, …"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-surface text-sm font-mono resize-none"
              />
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-700 mt-4">{{ error }}</p>

          <div class="flex gap-2 mt-6">
            <UiButton variant="primary" :disabled="!canSave || saving" @click="save">
              <Icon v-if="saving" icon="lucide:loader-2" width="14" class="animate-spin" />
              {{ saving ? 'Saving…' : editingId ? 'Update cohort' : 'Create cohort' }}
            </UiButton>
            <UiButton variant="secondary" :disabled="saving" @click="showForm = false">Cancel</UiButton>
          </div>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

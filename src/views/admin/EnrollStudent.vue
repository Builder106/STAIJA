<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import { CohortService, enrollStudent } from '../../services/learn'
import { DatabaseService } from '../../services/database'
import type { Cohort, UserProfile } from '../../services/types'

const route = useRoute()

const cohorts = ref<Cohort[]>([])
const candidates = ref<UserProfile[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const selectedStudentId = ref('')
const selectedCohortId = ref('')
const selectedMentorId = ref('')
const submitting = ref(false)

const selectedCohort = computed(() =>
  cohorts.value.find((c) => c.id === selectedCohortId.value),
)

const canSubmit = computed(
  () => selectedStudentId.value && selectedCohortId.value && !submitting.value,
)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [cs, allUsers] = await Promise.all([
      CohortService.listAllCohorts(),
      DatabaseService.getAllUsers(),
    ])
    cohorts.value = cs.filter((c) => c.status !== 'completed')
    // Phase 1: enroll any applicant or student. The applicant role is the
    // common case (just got accepted); already-students may need a second
    // course.
    candidates.value = allUsers.filter(
      (u) => u.role === 'applicant' || u.role === 'student',
    )
    // Pre-fill from ?applicant=<uid> on the URL. AdminApplications'
    // "Place in cohort" button hands the student off via this query
    // param so staff don't have to scroll through the whole candidate
    // list looking for the person they just accepted. Only honour
    // values that actually exist in the candidate set — a stale uid
    // from a copy-pasted URL silently no-ops instead of locking the
    // picker to nothing.
    const presetApplicant = route.query.applicant
    if (typeof presetApplicant === 'string' && candidates.value.some((u) => u.uid === presetApplicant)) {
      selectedStudentId.value = presetApplicant
    }
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Failed to load.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = null
  success.value = null
  try {
    const result = await enrollStudent({
      studentId: selectedStudentId.value,
      cohortId: selectedCohortId.value,
      mentorId: selectedMentorId.value || undefined,
    })
    success.value = `Enrolled — assigned to mentor ${result.mentorId.slice(0, 8)}…`
    selectedStudentId.value = ''
    selectedMentorId.value = ''
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Enroll failed.'
  } finally {
    submitting.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container class="max-w-2xl">
        <Eyebrow class="text-brand-violet mb-3 block">Admin</Eyebrow>
        <Heading :level="1" class="mb-3">Enroll a student.</Heading>
        <Body class="text-ink/70">
          Manually enroll a student into a cohort. In Phase 2 this becomes automatic when an
          application is accepted.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="max-w-2xl">
        <UiCard v-if="loading" class="p-10 bg-surface text-center">
          <Icon icon="lucide:loader-2" width="24" class="animate-spin text-brand-violet mx-auto" />
        </UiCard>

        <UiCard v-else class="p-6 md:p-10 bg-surface">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Cohort</label>
              <UiSelect
                v-model="selectedCohortId"
                placeholder="Select a cohort…"
                :options="cohorts.map((c) => ({
                  value: c.id ?? '',
                  label: `${c.name || c.courseSlug} (${c.program.replace('_', ' ')}, ${c.status})`,
                }))"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Student</label>
              <UiSelect
                v-model="selectedStudentId"
                placeholder="Select a student…"
                :options="candidates.map((u) => ({
                  value: u.uid,
                  label: `${u.displayName || u.email} — ${u.role}`,
                }))"
              />
              <p class="text-xs text-ink/50">
                Showing applicants and existing students.
              </p>
            </div>

            <div v-if="selectedCohort" class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Mentor <span class="text-ink/40 normal-case">(optional — auto-picks from pool if blank)</span>
              </label>
              <UiSelect
                v-model="selectedMentorId"
                placeholder="Auto (least-loaded)"
                :options="[
                  { value: '', label: 'Auto (least-loaded)' },
                  ...(selectedCohort.mentorPool ?? []).map((mid) => ({
                    value: mid,
                    label: mid,
                  })),
                ]"
              />
            </div>

            <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
            <p v-if="success" class="text-sm text-emerald-700">{{ success }}</p>

            <UiButton variant="primary" :disabled="!canSubmit" @click="submit">
              <Icon v-if="submitting" icon="lucide:loader-2" width="14" class="animate-spin" />
              <Icon v-else icon="lucide:user-plus" width="14" />
              {{ submitting ? 'Enrolling…' : 'Enroll' }}
            </UiButton>
          </div>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

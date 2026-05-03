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
import { CohortService, enrollStudent } from '../../services/learn'
import { DatabaseService } from '../../services/database'
import type { Cohort, UserProfile } from '../../services/types'

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
        <UiCard v-if="loading" class="p-10 bg-white text-center">
          <Icon icon="lucide:loader-2" width="24" class="animate-spin text-brand-violet mx-auto" />
        </UiCard>

        <UiCard v-else class="p-6 md:p-10 bg-white">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Cohort</label>
              <select
                v-model="selectedCohortId"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-white text-sm"
              >
                <option value="" disabled>Select a cohort…</option>
                <option v-for="c in cohorts" :key="c.id" :value="c.id">
                  {{ c.name || c.courseSlug }} ({{ c.program.replace('_', ' ') }}, {{ c.status }})
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Student</label>
              <select
                v-model="selectedStudentId"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-white text-sm"
              >
                <option value="" disabled>Select a student…</option>
                <option v-for="u in candidates" :key="u.uid" :value="u.uid">
                  {{ u.displayName || u.email }} — {{ u.role }}
                </option>
              </select>
              <p class="text-xs text-ink/50">
                Showing applicants and existing students.
              </p>
            </div>

            <div v-if="selectedCohort" class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Mentor <span class="text-ink/40 normal-case">(optional — auto-picks from pool if blank)</span>
              </label>
              <select
                v-model="selectedMentorId"
                class="w-full px-3 py-2 rounded-md border hairline-ink bg-white text-sm font-mono"
              >
                <option value="">Auto (least-loaded)</option>
                <option
                  v-for="mid in selectedCohort.mentorPool ?? []"
                  :key="mid"
                  :value="mid"
                >
                  {{ mid }}
                </option>
              </select>
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

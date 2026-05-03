<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../../components/ui/Container.vue'
import Section from '../../../components/ui/Section.vue'
import Heading from '../../../components/ui/Heading.vue'
import Body from '../../../components/ui/Body.vue'
import Eyebrow from '../../../components/ui/Eyebrow.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import { useAuth } from '../../../composables/useAuth'
import { DatabaseService } from '../../../services/database'
import { MentorService } from '../../../services/mentor'
import {
  EnrollmentService,
  ProgressService,
  SubmissionService,
  toMillis,
} from '../../../services/learn'
import type {
  UserProfile,
  Enrollment,
  LessonProgress,
  AssignmentSubmission,
  MentorFeedback,
} from '../../../services/types'

const route = useRoute()
const { user } = useAuth()

const loading = ref(true)
const error = ref<string | null>(null)
const student = ref<UserProfile | null>(null)
const enrollment = ref<Enrollment | null>(null)
const progress = ref<LessonProgress[]>([])
const submissions = ref<AssignmentSubmission[]>([])
const feedback = ref<MentorFeedback[]>([])

const completedCount = computed(
  () => progress.value.filter((p) => p.status === 'completed').length,
)

async function load() {
  if (!user.value) return
  loading.value = true
  error.value = null
  try {
    const studentId = route.params.studentId as string

    const [s, assignment] = await Promise.all([
      DatabaseService.getUserProfile(studentId),
      MentorService.getAssignment(user.value.uid, studentId),
    ])
    student.value = s
    if (!s) {
      error.value = 'Student profile not found.'
      return
    }
    if (!assignment) {
      error.value = 'You are not assigned to this student.'
      return
    }

    // Find the matching active enrollment.
    const studentEnrollments = await EnrollmentService.getActiveForStudent(studentId)
    const own = studentEnrollments.find((e) => e.mentorId === user.value!.uid)
    if (own) {
      enrollment.value = own
      const enrollmentId = own.id ?? `${own.studentId}_${own.cohortId}`
      const [p, subs, fb] = await Promise.all([
        ProgressService.getProgressForEnrollment(enrollmentId),
        SubmissionService.getSubmissionsForEnrollmentAndAssignmentAll(enrollmentId),
        MentorService.getFeedbackForStudent(user.value.uid, studentId),
      ])
      progress.value = p
      submissions.value = subs
      feedback.value = fb
    }
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Failed to load student.'
  } finally {
    loading.value = false
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
  submitted: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  returned: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  graded: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-10 !pb-6 border-b hairline-ink">
      <Container class="max-w-4xl">
        <RouterLink to="/mentor" class="text-xs text-ink/60 hover:text-ink mb-3 inline-flex items-center gap-1">
          <Icon icon="lucide:arrow-left" width="12" /> All students
        </RouterLink>
        <Eyebrow class="text-brand-violet mb-2 block">Student</Eyebrow>
        <Heading v-if="student" :level="1" class="mb-2">
          {{ student.displayName || 'No name' }}
        </Heading>
        <p v-if="student" class="text-sm text-ink/60">{{ student.email }}</p>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="max-w-4xl flex flex-col gap-6">
        <UiCard v-if="loading" class="p-10 bg-white text-center">
          <Icon icon="lucide:loader-2" width="24" class="animate-spin text-brand-violet mx-auto" />
        </UiCard>

        <UiCard v-else-if="error" class="p-6 bg-white">
          <Body class="text-red-700 text-sm">{{ error }}</Body>
        </UiCard>

        <template v-else-if="student && enrollment">
          <UiCard class="p-6 md:p-8 bg-white">
            <Eyebrow class="text-ink/50 mb-2 block">Progress</Eyebrow>
            <p class="text-ink text-sm">
              {{ completedCount }} lesson{{ completedCount === 1 ? '' : 's' }} completed
            </p>
          </UiCard>

          <div>
            <Eyebrow class="text-ink/50 mb-3 block">Submissions</Eyebrow>
            <UiCard v-if="submissions.length === 0" class="p-6 bg-white">
              <Body class="text-ink/60 text-sm">No submissions yet.</Body>
            </UiCard>
            <UiCard v-else class="p-0 bg-white overflow-hidden">
              <ul class="divide-y divide-ink/5">
                <li v-for="sub in submissions" :key="sub.id">
                  <RouterLink
                    :to="{ name: 'learn-mentor-submission', params: { id: sub.id } }"
                    class="flex items-center gap-3 px-5 py-4 hover:bg-ink/[0.02]"
                  >
                    <Icon icon="lucide:file-edit" width="18" class="text-ink/50" />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-ink truncate capitalize">
                        {{ sub.assignmentSlug.replace(/-/g, ' ') }}
                      </div>
                      <div class="text-xs text-ink/50">{{ fmtDate(sub.submittedAt) }}</div>
                    </div>
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      :class="statusClass[sub.status]"
                    >
                      {{ sub.status }}
                    </span>
                    <Icon icon="lucide:chevron-right" width="14" class="text-ink/30" />
                  </RouterLink>
                </li>
              </ul>
            </UiCard>
          </div>

          <div>
            <Eyebrow class="text-ink/50 mb-3 block">Feedback you've left</Eyebrow>
            <RouterLink
              :to="{ name: 'mentor-feedback', params: { studentId: student.uid } }"
              class="text-xs text-brand-violet hover:underline mb-3 inline-block"
            >
              + Leave new feedback
            </RouterLink>
            <UiCard v-if="feedback.length === 0" class="p-6 bg-white">
              <Body class="text-ink/60 text-sm">No feedback yet.</Body>
            </UiCard>
            <UiCard v-else class="p-0 bg-white overflow-hidden">
              <ul class="divide-y divide-ink/5">
                <li v-for="fb in feedback" :key="fb.id" class="px-5 py-4">
                  <p class="text-sm text-ink whitespace-pre-line">{{ fb.content }}</p>
                  <p class="text-xs text-ink/40 mt-2">{{ fmtDate(fb.submittedAt) }}</p>
                </li>
              </ul>
            </UiCard>
          </div>
        </template>
      </Container>
    </Section>
  </div>
</template>

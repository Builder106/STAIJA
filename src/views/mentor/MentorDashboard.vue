<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiChip from '../../components/ui/UiChip.vue'
import { AuthService, MentorService, type AssignedStudent } from '../../services/firebase'
import { useAuth } from '../../composables/useAuth'

const { displayName } = useAuth()

const assignments = ref<AssignedStudent[]>([])
const loading = ref(true)
const error = ref('')

const firstName = computed(() => {
  const name = displayName.value ?? ''
  return name.split(/[\s@]/)[0] || 'there'
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) return
    assignments.value = await MentorService.getAssignedStudents(currentUser.uid)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load your assigned students.'
  } finally {
    loading.value = false
  }
}

function programLabel(p: AssignedStudent['program']) {
  return p === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge'
}

function studentLabel(a: AssignedStudent): string {
  return a.student?.displayName || a.student?.email || 'Student'
}

onMounted(loadData)
</script>

<template>
  <Section class="!pt-12 !pb-24">
    <Container>
      <div class="flex flex-col gap-3 mb-12">
        <Eyebrow class="text-brand-violet">Mentor portal</Eyebrow>
        <Heading :level="1">Hi, {{ firstName }}.</Heading>
        <Body class="text-ink/70 max-w-xl">
          Your assigned students are listed below. Click into one to see your
          previous notes and leave new feedback.
        </Body>
      </div>

      <div v-if="loading" class="flex items-center gap-3 text-ink/60">
        <Icon icon="lucide:loader-2" width="18" class="animate-spin" />
        Loading your students…
      </div>

      <div
        v-else-if="error"
        class="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-6"
      >
        <div class="flex items-center gap-3 text-red-700">
          <Icon icon="lucide:alert-circle" width="20" />
          <span class="font-semibold">Couldn't load your students.</span>
        </div>
        <p class="text-sm text-ink/70 m-0">{{ error }}</p>
        <button
          type="button"
          class="self-start text-sm font-semibold text-brand-violet hover:underline"
          @click="loadData"
        >
          Try again
        </button>
      </div>

      <div
        v-else-if="assignments.length === 0"
        class="rounded-2xl border hairline-ink p-8 max-w-2xl"
      >
        <Heading :level="3" class="mb-3">No students yet.</Heading>
        <Body class="text-ink/70 mb-4">
          You don't have any active assignments. Mentor pairings are set up by
          STAIJA staff once a cohort is selected — you'll see your students
          here when that happens.
        </Body>
        <p class="text-sm text-ink/60 m-0">
          Think this is wrong? Email
          <a href="mailto:hello@staija.org" class="text-brand-violet hover:underline">
            hello@staija.org
          </a>
          and we'll sort it out.
        </p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <RouterLink
          v-for="a in assignments"
          :key="a.id ?? `${a.mentorId}-${a.studentId}`"
          :to="`/mentor/feedback/${a.studentId}`"
          class="block group focus-ring-brand rounded-2xl"
        >
          <UiCard hoverable class="p-6 flex items-center gap-6">
            <div class="flex-1 flex flex-col gap-1.5 min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <h3 class="font-display text-xl font-semibold m-0 truncate">
                  {{ studentLabel(a) }}
                </h3>
                <UiChip>{{ programLabel(a.program) }}</UiChip>
              </div>
              <p v-if="a.student?.email" class="text-sm text-ink/60 m-0">
                {{ a.student.email }}
              </p>
            </div>
            <div class="flex items-center gap-2 text-sm font-semibold text-brand-violet shrink-0">
              <span class="hidden sm:inline">Leave feedback</span>
              <Icon
                icon="lucide:arrow-right"
                width="18"
                class="transition-transform group-hover:translate-x-1"
              />
            </div>
          </UiCard>
        </RouterLink>
      </div>
    </Container>
  </Section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter, RouterLink } from 'vue-router'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiButton from '../../components/ui/UiButton.vue'
import { AuthService, DatabaseService, type UserProfile } from '../../services/firebase'

const router = useRouter()

const userProfile = ref<UserProfile | null>(null)

// Mock data — replaced by real LMS metrics in a future pass.
const userProgram = ref('StepUp Scholars')
const programStats = ref({ modules: 12, completed: 5 })
const pendingAssignments = ref(3)
const upcomingDeadlines = ref(2)
const progressPercentage = ref(42)
const progressStats = ref({ achievements: 8, hours: 67 })
const mentorName = ref('Dr. Sarah Johnson')
const mentorInitials = computed(() =>
  mentorName.value.split(' ').map((n) => n[0]).join(''),
)
const upcomingEvents = ref([
  { id: 1, title: 'Career Development Workshop', date: new Date('2024-12-15'), type: 'Workshop' },
  { id: 2, title: 'Peer Study Group',           date: new Date('2024-12-18'), type: 'Study Session' },
  { id: 3, title: 'Mentor Q&A Session',         date: new Date('2024-12-20'), type: 'Mentoring' },
])
const networkStats = ref({ connections: 15, discussions: 8 })

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

async function loadUserProfile() {
  const currentUser = AuthService.getCurrentUser()
  if (!currentUser) { router.push('/login'); return }
  const profile = await DatabaseService.getUserProfile(currentUser.uid)
  if (profile) userProfile.value = profile
}

const quickActions = [
  { icon: 'lucide:book-open',    to: '/student/program',     label: 'Study materials' },
  { icon: 'lucide:file-edit',    to: '/student/assignments', label: 'Submit assignment' },
  { icon: 'lucide:presentation', to: '/student/mentor',      label: 'Ask mentor' },
  { icon: 'lucide:bar-chart-2',  to: '/student/progress',    label: 'Check progress' },
]

onMounted(loadUserProfile)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow class="text-brand-violet mb-3 block">Student portal</Eyebrow>
            <Heading :level="1" class="mb-3">
              Welcome to your <span class="text-brand-violet">program</span>.
            </Heading>
            <Body class="text-ink/70 max-w-2xl">
              Access program materials, track your progress, and connect with your mentor.
            </Body>
          </div>
          <div class="inline-flex flex-col items-end gap-1 px-4 py-3 rounded-xl bg-surface border hairline-ink">
            <span class="text-xs text-ink/50 uppercase tracking-wide">Program</span>
            <span class="text-sm font-semibold text-ink">{{ userProgram }}</span>
            <span class="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
              Active student
            </span>
          </div>
        </div>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UiCard class="p-6 md:p-7 bg-surface flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Curriculum</Eyebrow>
              <Heading :level="3" class="text-lg mb-2">Program materials</Heading>
              <Body class="text-ink/70 text-sm">
                Access your program curriculum, resources, and learning materials.
              </Body>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="text-center bg-ink/[0.03] rounded-lg p-3">
                <div class="text-2xl font-semibold text-brand-violet">{{ programStats.modules }}</div>
                <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-0.5">Modules</div>
              </div>
              <div class="text-center bg-ink/[0.03] rounded-lg p-3">
                <div class="text-2xl font-semibold text-brand-violet">{{ programStats.completed }}</div>
                <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-0.5">Completed</div>
              </div>
            </div>
            <UiButton variant="primary" :to="{ path: '/learn' }">
              <Icon icon="lucide:book-open" width="14" />
              Open my course
            </UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-surface flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Assignments</Eyebrow>
              <Heading :level="3" class="text-lg mb-2">Assignments &amp; tasks</Heading>
              <Body class="text-ink/70 text-sm">
                Complete your assignments and track your progress.
              </Body>
            </div>
            <div class="flex flex-col gap-2">
              <div v-if="pendingAssignments > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 ring-1 ring-amber-200 text-amber-800 text-sm">
                <Icon icon="lucide:file-edit" width="14" />
                {{ pendingAssignments }} pending assignments
              </div>
              <div v-if="upcomingDeadlines > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-800 text-sm">
                <Icon icon="lucide:clock" width="14" />
                {{ upcomingDeadlines }} due soon
              </div>
            </div>
            <UiButton variant="primary" :to="{ path: '/learn' }">View assignments</UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-surface flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Progress</Eyebrow>
              <Heading :level="3" class="text-lg mb-2">My progress</Heading>
              <Body class="text-ink/70 text-sm">Track your learning journey and achievements.</Body>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex items-baseline justify-between">
                <span class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Overall</span>
                <span class="text-sm font-semibold text-ink">{{ progressPercentage }}%</span>
              </div>
              <div class="h-2 rounded-full bg-ink/[0.05] overflow-hidden">
                <div class="h-full bg-brand-violet rounded-full transition-all" :style="{ width: progressPercentage + '%' }" />
              </div>
              <div class="grid grid-cols-2 gap-3 mt-2">
                <div class="text-center bg-ink/[0.03] rounded-lg p-3">
                  <div class="text-2xl font-semibold text-brand-violet">{{ progressStats.achievements }}</div>
                  <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-0.5">Achievements</div>
                </div>
                <div class="text-center bg-ink/[0.03] rounded-lg p-3">
                  <div class="text-2xl font-semibold text-brand-violet">{{ progressStats.hours }}</div>
                  <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-0.5">Study hours</div>
                </div>
              </div>
            </div>
            <UiButton variant="secondary" :to="{ path: '/student/progress' }">View detailed progress</UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-surface flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Mentor</Eyebrow>
              <Heading :level="3" class="text-lg mb-2">Mentor support</Heading>
              <Body class="text-ink/70 text-sm">Get guidance from your assigned mentor.</Body>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.03] border hairline-ink">
              <div class="w-10 h-10 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center text-xs font-semibold">
                {{ mentorInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-ink truncate">{{ mentorName }}</div>
                <div class="text-xs text-ink/60">Program mentor</div>
              </div>
            </div>
            <UiButton variant="primary" :to="{ path: '/student/mentor' }">Contact mentor</UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-surface flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Calendar</Eyebrow>
              <Heading :level="3" class="text-lg mb-2">Upcoming events</Heading>
              <Body class="text-ink/70 text-sm">Join program events and workshops.</Body>
            </div>
            <ul class="flex flex-col divide-y divide-ink/5">
              <li v-for="event in upcomingEvents" :key="event.id" class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div class="text-[11px] font-semibold text-brand-violet uppercase tracking-wide whitespace-nowrap mt-0.5 w-12">
                  {{ formatDate(event.date) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-ink truncate">{{ event.title }}</div>
                  <div class="text-xs text-ink/60">{{ event.type }}</div>
                </div>
              </li>
            </ul>
            <UiButton variant="secondary" :to="{ path: '/learn/sessions' }">View live sessions</UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-surface flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Community</Eyebrow>
              <Heading :level="3" class="text-lg mb-2">Peer network</Heading>
              <Body class="text-ink/70 text-sm">Connect with fellow students in your program.</Body>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="text-center bg-ink/[0.03] rounded-lg p-3">
                <div class="text-2xl font-semibold text-brand-violet">{{ networkStats.connections }}</div>
                <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-0.5">Connections</div>
              </div>
              <div class="text-center bg-ink/[0.03] rounded-lg p-3">
                <div class="text-2xl font-semibold text-brand-violet">{{ networkStats.discussions }}</div>
                <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-0.5">Discussions</div>
              </div>
            </div>
            <UiButton variant="primary" :to="{ path: '/student/network' }">View network</UiButton>
          </UiCard>
        </div>

        <UiCard class="p-6 md:p-8 bg-surface">
          <Eyebrow class="text-ink/50 mb-2 block">Shortcuts</Eyebrow>
          <Heading :level="3" class="text-lg mb-4">Quick actions</Heading>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RouterLink
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border hairline-ink bg-paper hover:bg-ink/[0.02] hover:-translate-y-[1px] transition-all text-center no-underline"
            >
              <span class="text-ink/70"><Icon :icon="action.icon" width="20" /></span>
              <span class="text-xs font-medium text-ink">{{ action.label }}</span>
            </RouterLink>
          </div>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

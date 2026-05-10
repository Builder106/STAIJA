<script setup lang="ts">
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'

const overall = 67

const stats = [
  { value: '24',  label: 'Modules completed' },
  { value: '156', label: 'Study hours' },
  { value: '8',   label: 'Achievements' },
  { value: '92%', label: 'Assignment score' },
]

interface Phase {
  name: string
  description: string
  status: 'completed' | 'in_progress'
  date: string
}

const phases: Phase[] = [
  { name: 'Phase 1: Foundation',         description: 'Basic concepts and fundamental skills',           status: 'completed',  date: 'Oct 15, 2024' },
  { name: 'Phase 2: Advanced Learning',  description: 'Advanced concepts and practical applications',    status: 'completed',  date: 'Nov 20, 2024' },
  { name: 'Phase 3: Capstone Project',   description: 'Final project and portfolio development',          status: 'in_progress', date: 'Due: Dec 31, 2024' },
]

const phaseStatus: Record<Phase['status'], { label: string; chip: string }> = {
  completed:   { label: 'Completed',   chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  in_progress: { label: 'In progress', chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
}

const achievements = [
  { icon: 'lucide:trophy', title: 'Research Excellence', body: 'Awarded for outstanding research paper', date: 'Nov 25, 2024' },
  { icon: 'lucide:star',   title: 'Perfect Attendance',  body: '100% attendance in program sessions',    date: 'Nov 20, 2024' },
  { icon: 'lucide:rocket', title: 'Fast Learner',        body: 'Completed 10 modules ahead of schedule', date: 'Nov 15, 2024' },
]
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Student portal</Eyebrow>
        <Heading :level="1" class="mb-3">
          My <span class="text-brand-violet">progress</span>.
        </Heading>
        <Body class="text-ink/70 max-w-2xl">
          Track your learning journey and achievements.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-6">
        <div class="grid lg:grid-cols-3 gap-6">
          <UiCard class="p-6 md:p-8 bg-white text-center flex flex-col items-center justify-center gap-4">
            <Eyebrow class="text-ink/50 block">Overall progress</Eyebrow>
            <div
              class="w-32 h-32 rounded-full flex items-center justify-center relative"
              :style="`background: conic-gradient(var(--color-brand-violet, #A98AFF) ${overall}%, rgba(14,18,23,0.06) ${overall}%)`"
            >
              <div class="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                <span class="text-2xl font-semibold text-ink">{{ overall }}%</span>
              </div>
            </div>
            <Body class="text-ink/60 text-xs">2 of 3 program phases completed</Body>
          </UiCard>

          <UiCard class="p-6 md:p-8 bg-white lg:col-span-2">
            <Eyebrow class="text-ink/50 mb-3 block">By the numbers</Eyebrow>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                v-for="s in stats"
                :key="s.label"
                class="text-center bg-ink/[0.03] rounded-xl p-4"
              >
                <div class="text-2xl font-semibold text-brand-violet">{{ s.value }}</div>
                <div class="text-[11px] text-ink/60 uppercase tracking-wide mt-1">
                  {{ s.label }}
                </div>
              </div>
            </div>
          </UiCard>
        </div>

        <UiCard class="p-6 md:p-8 bg-white">
          <Eyebrow class="text-ink/50 mb-2 block">Roadmap</Eyebrow>
          <Heading :level="3" class="text-lg mb-4">Program phases</Heading>
          <ul class="flex flex-col gap-3">
            <li
              v-for="phase in phases"
              :key="phase.name"
              class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border hairline-ink bg-paper"
            >
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-ink">{{ phase.name }}</div>
                <div class="text-xs text-ink/60 mt-0.5">{{ phase.description }}</div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <span
                  class="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                  :class="phaseStatus[phase.status].chip"
                >
                  {{ phaseStatus[phase.status].label }}
                </span>
                <span class="text-[11px] text-ink/60">{{ phase.date }}</span>
              </div>
            </li>
          </ul>
        </UiCard>

        <UiCard class="p-6 md:p-8 bg-white">
          <Eyebrow class="text-ink/50 mb-2 block">Achievements</Eyebrow>
          <Heading :level="3" class="text-lg mb-4">Recent achievements</Heading>
          <div class="grid md:grid-cols-3 gap-3">
            <div
              v-for="a in achievements"
              :key="a.title"
              class="flex items-start gap-3 px-4 py-4 rounded-xl border hairline-ink bg-paper"
            >
              <span
                class="w-9 h-9 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center shrink-0"
              >
                <Icon :icon="a.icon" width="18" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-ink">{{ a.title }}</div>
                <div class="text-xs text-ink/60 mt-0.5">{{ a.body }}</div>
                <div class="text-[11px] text-ink/50 mt-1">{{ a.date }}</div>
              </div>
            </div>
          </div>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

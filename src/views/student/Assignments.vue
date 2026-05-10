<script setup lang="ts">
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'

interface DemoAssignment {
  title: string
  description: string
  due: string
  status: 'pending' | 'in_progress'
}

// Mock placeholder data — wire up to real submissions in a future pass.
const assignments: DemoAssignment[] = [
  {
    title: 'Research Paper Submission',
    description: 'Submit your research paper on sustainable development practices.',
    due: 'Dec 20, 2024',
    status: 'pending',
  },
  {
    title: 'Group Project Presentation',
    description: 'Prepare and submit your group project presentation.',
    due: 'Dec 25, 2024',
    status: 'in_progress',
  },
]

const statusClass: Record<DemoAssignment['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
}

const statusLabel: Record<DemoAssignment['status'], string> = {
  pending: 'Pending submission',
  in_progress: 'In progress',
}
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Student portal</Eyebrow>
        <Heading :level="1" class="mb-3">
          Your <span class="text-brand-violet">assignments</span>.
        </Heading>
        <Body class="text-ink/70 max-w-2xl">
          Complete your assignments and track your progress.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-4">
        <UiCard
          v-for="a in assignments"
          :key="a.title"
          class="p-6 md:p-7 bg-white"
        >
          <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
            <Heading :level="3" class="text-lg">{{ a.title }}</Heading>
            <span class="text-xs font-semibold text-rose-700">Due: {{ a.due }}</span>
          </div>
          <Body class="text-ink/70 text-sm mb-4">{{ a.description }}</Body>
          <span
            class="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
            :class="statusClass[a.status]"
          >
            {{ statusLabel[a.status] }}
          </span>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

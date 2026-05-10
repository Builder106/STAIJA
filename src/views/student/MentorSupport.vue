<script setup lang="ts">
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiButton from '../../components/ui/UiButton.vue'

const mentor = {
  name: 'Dr. Jane Doe',
  title: 'Senior Program Mentor',
  specialty: 'Specializes in Research & Career Development',
  initials: 'JD',
}

const activity = [
  {
    icon: 'lucide:message-circle',
    text: 'You scheduled a meeting for Dec 18, 2024',
    time: '2 days ago',
  },
  {
    icon: 'lucide:mail',
    text: 'Mentor sent feedback on your research paper',
    time: '1 week ago',
  },
]
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Student portal</Eyebrow>
        <Heading :level="1" class="mb-3">
          Mentor <span class="text-brand-violet">support</span>.
        </Heading>
        <Body class="text-ink/70 max-w-2xl">
          Get guidance from your assigned mentor.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-6">
        <UiCard class="p-6 md:p-8 bg-white flex flex-col gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center text-lg font-semibold">
              {{ mentor.initials }}
            </div>
            <div class="flex-1 min-w-0">
              <Heading :level="3" class="text-lg mb-0.5">{{ mentor.name }}</Heading>
              <div class="text-sm font-medium text-brand-violet">{{ mentor.title }}</div>
              <div class="text-xs text-ink/60 mt-0.5">{{ mentor.specialty }}</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton variant="primary">
              <Icon icon="lucide:message-circle" width="14" />
              Schedule meeting
            </UiButton>
            <UiButton variant="secondary">
              <Icon icon="lucide:mail" width="14" />
              Send message
            </UiButton>
            <UiButton variant="secondary">
              <Icon icon="lucide:calendar" width="14" />
              View availability
            </UiButton>
          </div>
        </UiCard>

        <UiCard class="p-6 md:p-8 bg-white">
          <Eyebrow class="text-ink/50 mb-2 block">Activity</Eyebrow>
          <Heading :level="3" class="text-lg mb-4">Recent activity</Heading>
          <ul class="flex flex-col divide-y divide-ink/5">
            <li
              v-for="item in activity"
              :key="item.text"
              class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                class="w-9 h-9 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center shrink-0"
              >
                <Icon :icon="item.icon" width="16" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-ink">{{ item.text }}</div>
                <div class="text-xs text-ink/60 mt-0.5">{{ item.time }}</div>
              </div>
            </li>
          </ul>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

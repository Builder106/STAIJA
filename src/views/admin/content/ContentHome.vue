<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../../components/ui/Container.vue'
import Section from '../../../components/ui/Section.vue'
import Heading from '../../../components/ui/Heading.vue'
import Body from '../../../components/ui/Body.vue'
import Eyebrow from '../../../components/ui/Eyebrow.vue'
import LmsOnboarding from '../../../components/admin/LmsOnboarding.vue'

const tiles = [
  { to: '/admin/content/courses', icon: 'lucide:book-open', title: 'Courses', desc: 'Top-level units. Pin a version, link to modules.' },
  { to: '/admin/content/modules', icon: 'lucide:layers', title: 'Modules', desc: 'Groups of lessons + assignments inside a course.' },
  { to: '/admin/content/lessons', icon: 'lucide:file-text', title: 'Lessons', desc: 'Bodies of rich text, video links, attachments.' },
  { to: '/admin/content/assignments', icon: 'lucide:clipboard-edit', title: 'Assignments', desc: 'Prompts students submit against. Defines submission type.' },
]
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Admin</Eyebrow>
        <Heading :level="1" class="mb-3">Course content.</Heading>
        <Body class="text-ink/70 max-w-2xl">
          Author and publish course material. All edits save through to Contentful — no separate
          tab. Bottom-up authoring works best: lessons + assignments first, then group them into
          modules, then bundle modules into a course.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-8 max-w-3xl">
        <LmsOnboarding />

        <RouterLink
          to="/admin/content/outline"
          class="flex items-start gap-4 p-5 rounded-2xl border hairline-ink hover:border-brand-violet/60 hover:bg-brand-violet/5 transition-colors focus-ring-brand bg-gradient-to-br from-brand-violet/5 to-brand-sky/5"
        >
          <div class="w-10 h-10 rounded-xl bg-brand-violet/15 flex items-center justify-center shrink-0">
            <Icon icon="lucide:wand-2" width="20" class="text-brand-violet" />
          </div>
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="font-semibold text-base text-ink">Outline a course with AI</span>
            <span class="text-sm text-ink/60">Sketch a topic; generate a full draft tree of modules, lessons, and assignments.</span>
          </div>
          <Icon icon="lucide:arrow-right" width="18" class="text-ink/40 mt-1.5 shrink-0" />
        </RouterLink>

        <div class="grid sm:grid-cols-2 gap-4">
          <RouterLink
            v-for="t in tiles"
            :key="t.to"
            :to="t.to"
            class="flex items-start gap-4 p-5 rounded-2xl border hairline-ink hover:border-brand-violet/40 hover:bg-brand-violet/5 transition-colors focus-ring-brand bg-white"
          >
            <div class="w-10 h-10 rounded-xl bg-brand-violet/10 flex items-center justify-center shrink-0">
              <Icon :icon="t.icon" width="20" class="text-brand-violet" />
            </div>
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="font-semibold text-base text-ink">{{ t.title }}</span>
              <span class="text-sm text-ink/60">{{ t.desc }}</span>
            </div>
          </RouterLink>
        </div>
      </Container>
    </Section>
  </div>
</template>

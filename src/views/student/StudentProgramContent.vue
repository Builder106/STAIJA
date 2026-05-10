<script setup lang="ts">
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiButton from '../../components/ui/UiButton.vue'
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Student portal</Eyebrow>
        <Heading :level="1" class="mb-3">
          Program <span class="text-brand-violet">content</span>.
        </Heading>
        <Body class="text-ink/70 max-w-2xl">
          Access your program materials and resources.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-6">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UiCard class="p-6 md:p-7 bg-white flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Curriculum</Eyebrow>
              <Heading :level="3" class="text-lg mb-2 inline-flex items-center gap-2">
                <Icon icon="lucide:book-open" width="18" class="text-brand-violet" />
                Curriculum materials
              </Heading>
              <Body class="text-ink/70 text-sm">
                Access course materials, lectures, and study guides.
              </Body>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex items-baseline justify-between">
                <span class="text-xs font-semibold text-ink/70 uppercase tracking-wide">Progress</span>
                <span class="text-sm font-semibold text-ink">65%</span>
              </div>
              <div class="h-2 rounded-full bg-ink/[0.05] overflow-hidden">
                <div class="h-full bg-brand-violet rounded-full" style="width: 65%" />
              </div>
            </div>
            <UiButton variant="primary" :to="{ path: '/learn' }">Continue learning</UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-white flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Resources</Eyebrow>
              <Heading :level="3" class="text-lg mb-2 inline-flex items-center gap-2">
                <Icon icon="lucide:target" width="18" class="text-brand-violet" />
                Program resources
              </Heading>
              <Body class="text-ink/70 text-sm">
                Download templates, tools, and additional resources.
              </Body>
            </div>
            <UiButton variant="primary">Browse resources</UiButton>
          </UiCard>

          <UiCard class="p-6 md:p-7 bg-white flex flex-col gap-5">
            <div>
              <Eyebrow class="text-ink/50 mb-2 block">Library</Eyebrow>
              <Heading :level="3" class="text-lg mb-2 inline-flex items-center gap-2">
                <Icon icon="lucide:book-marked" width="18" class="text-brand-violet" />
                Reading materials
              </Heading>
              <Body class="text-ink/70 text-sm">
                Access recommended readings and research papers.
              </Body>
            </div>
            <UiButton variant="secondary">View library</UiButton>
          </UiCard>
        </div>
      </Container>
    </Section>
  </div>
</template>

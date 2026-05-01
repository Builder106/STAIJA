<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../components/ui/Container.vue'
import Section from '../components/ui/Section.vue'
import Heading from '../components/ui/Heading.vue'
import Body from '../components/ui/Body.vue'
import Eyebrow from '../components/ui/Eyebrow.vue'
import UiButton from '../components/ui/UiButton.vue'

const route = useRoute()
// Slug is read but content is mocked for now — wire to CMS in a follow-up.
void route.params.slug

const post = {
  title: 'How to run a PCR test when the power goes out',
  dek: 'A brief look into the creative problem solving required to do rigorous science in resource-constrained environments. Sometimes the most important discoveries happen during a blackout.',
  eyebrow: 'StepUp · Research · Oct 12, 2024',
  author: 'Chinedu Okafor',
  role: "StepUp Scholar '24",
  readingTime: '6 min read',
  heroImg: 'https://images.unsplash.com/photo-1758573467240-f944226c2026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  authorImg: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
}
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-8 !pb-16 border-b hairline-ink">
      <Container class="max-w-3xl">
        <RouterLink to="/blog" class="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-brand-violet transition-colors mb-10 focus-ring-brand rounded-sm">
          <Icon icon="lucide:arrow-left" width="16" /> Back to stories
        </RouterLink>

        <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.4 }">
          <Eyebrow class="text-brand-violet mb-6 block">{{ post.eyebrow }}</Eyebrow>
          <Heading :level="1" class="mb-6 leading-tight">{{ post.title }}</Heading>
          <Body large class="text-ink/70 mb-10 leading-relaxed !text-xl">{{ post.dek }}</Body>

          <div class="flex items-center gap-4 pt-6 border-t hairline-ink">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-ink/10 shrink-0">
              <img :src="post.authorImg" :alt="post.author" class="w-full h-full object-cover" />
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-ink leading-tight">{{ post.author }}</span>
              <span class="text-sm text-ink/60">{{ post.role }}</span>
            </div>
            <div class="ml-auto flex items-center gap-1.5 text-sm font-medium text-ink/50 bg-ink/5 px-3 py-1.5 rounded-full">
              <Icon icon="lucide:clock" width="14" /> {{ post.readingTime }}
            </div>
          </div>
        </Motion>
      </Container>
    </Section>

    <Section class="!py-0 relative -mt-6 z-10">
      <Container class="max-w-4xl">
        <Motion
          class="aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-xl border hairline-ink relative"
          :initial="{ opacity: 0, scale: 0.98 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.5, delay: 0.2 }"
        >
          <div class="absolute inset-0 wash-violet-6 mix-blend-multiply z-10 pointer-events-none" />
          <img :src="post.heroImg" :alt="post.title" class="w-full h-full object-cover" />
        </Motion>
      </Container>
    </Section>

    <Section class="!pt-16 !pb-24 bg-white">
      <Container class="max-w-3xl">
        <div class="flex flex-col md:flex-row gap-12 relative">
          <!-- Social Share Sidebar -->
          <div class="md:w-16 shrink-0 md:sticky md:top-32 h-fit flex md:flex-col gap-4 items-center">
            <span class="text-xs uppercase tracking-wider font-semibold text-ink/40 md:-rotate-90 md:mb-6 md:whitespace-nowrap">Share</span>
            <button type="button" class="w-10 h-10 rounded-full border hairline-ink flex items-center justify-center text-ink/60 hover:text-brand-violet hover:border-brand-violet transition-colors">
              <Icon icon="lucide:twitter" width="18" />
            </button>
            <button type="button" class="w-10 h-10 rounded-full border hairline-ink flex items-center justify-center text-ink/60 hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors">
              <Icon icon="lucide:linkedin" width="18" />
            </button>
            <button type="button" class="w-10 h-10 rounded-full border hairline-ink flex items-center justify-center text-ink/60 hover:text-[#1877F2] hover:border-[#1877F2] transition-colors">
              <Icon icon="lucide:facebook" width="18" />
            </button>
          </div>

          <article class="flex flex-col gap-6 max-w-none w-full text-ink/80 leading-relaxed">
            <p class="text-base leading-relaxed m-0">
              It was 2:00 PM on a Tuesday when the hum of the air conditioning died. In a lab in
              Lagos, this is not an uncommon occurrence, but today it mattered. I was in the
              middle of running a Polymerase Chain Reaction (PCR) test for my final StepUp
              project on soil microbiomes.
            </p>
            <h2 class="font-display text-3xl font-semibold mt-4 m-0 text-ink">The clock is ticking</h2>
            <p class="m-0">
              A PCR machine relies on precise temperature cycling. If the machine loses power
              mid-cycle, your samples—hours of careful pipetting and precious reagents—can be
              compromised. My mentor, Dr. Amina, always told me, "Science isn't just about what
              happens when everything works perfectly. It's about how you respond when it
              doesn't."
            </p>
            <blockquote class="font-display text-2xl italic border-l-4 border-brand-violet pl-6 py-2 text-ink m-0">
              "Science isn't just about what happens when everything works perfectly. It's about
              how you respond when it doesn't."
            </blockquote>
            <p class="m-0">
              We had exactly a four-minute window before the internal temperature of the
              thermocycler would drift too far from the protocol. I didn't panic. Instead, I
              remembered our contingency plan.
            </p>
            <h2 class="font-display text-3xl font-semibold mt-4 m-0 text-ink">Resourcefulness as a skill</h2>
            <p class="m-0">
              While my peers in well-funded labs abroad might take stable electricity for
              granted, we have learned to engineer resilience into our protocols. We immediately
              moved the samples to a pre-prepared insulated cooler with temperature-calibrated
              gel packs, pausing the reaction physically until the backup generator kicked in.
            </p>
            <p class="m-0">Ten minutes later, the lights flickered back on. We resumed the cycle. The results? Flawless.</p>
            <p class="m-0">
              This experience taught me that true innovation isn't just about new discoveries;
              it's about making science happen against the odds. When I present this research
              next month, the data will speak for itself, but the story behind the data is what
              makes me a scientist.
            </p>
          </article>
        </div>

        <div class="mt-16 pt-12 border-t hairline-ink text-center">
          <Heading :level="3" class="mb-4">Inspired by this story?</Heading>
          <Body class="mb-8">Your support makes these experiences possible for more students across Africa.</Body>
          <UiButton variant="primary" :to="'/donate'">Donate to STAIJA</UiButton>
        </div>
      </Container>
    </Section>
  </div>
</template>

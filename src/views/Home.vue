<script setup lang="ts">
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../components/ui/Container.vue'
import Section from '../components/ui/Section.vue'
import Heading from '../components/ui/Heading.vue'
import Body from '../components/ui/Body.vue'
import Eyebrow from '../components/ui/Eyebrow.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiChip from '../components/ui/UiChip.vue'
import HeroLottie from '../components/HeroLottie.vue'

const stats = [
  { eyebrow: 'Scholars trained', number: '240', caption: 'Across 18 Nigerian states' },
  { eyebrow: 'Countries', number: '12', caption: 'Represented in Dynamerge' },
  { eyebrow: 'Research papers', number: '45', caption: 'Published or presented' },
  { eyebrow: 'Mentors', number: '120+', caption: 'From top global institutions' },
]

const events = [
  { date: 'Oct 12', title: 'Information Session: StepUp 2025', loc: 'Virtual', type: 'Webinar' },
  { date: 'Oct 24', title: 'Alumni Research Symposium', loc: 'Lagos, Nigeria', type: 'In-person' },
  { date: 'Nov 05', title: 'Mentor Matching Mixer', loc: 'Virtual', type: 'Networking' },
]

const FEATURED_IMG = 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero -->
    <Section class="!pt-8 !pb-16 md:!pt-16 md:!pb-24 wash-violet-6">
      <Container>
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <Motion
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.32, ease: 'easeOut' }"
            class="flex flex-col gap-8 max-w-xl"
          >
            <Heading :level="1">
              Africa's next <span class="text-brand-violet">scientist-leaders</span> start here.
            </Heading>
            <Body large>
              We nurture ambitious high-school and gap-year students through
              intensive research programs, mentorship, and a pan-African
              community of practice.
            </Body>
            <div class="flex flex-wrap gap-4">
              <UiButton variant="gradient" :to="'/programs/stepup-scholars'">
                Apply to StepUp
              </UiButton>
              <UiButton variant="secondary" href="#programs">
                Explore programs
              </UiButton>
            </div>
          </Motion>

          <Motion
            :initial="{ opacity: 0, scale: 0.95 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ duration: 0.5, delay: 0.2 }"
            class="relative w-full aspect-[4/3] lg:aspect-square flex items-center justify-center"
          >
            <HeroLottie class="w-full h-full max-w-[560px]" />
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Impact Strip -->
    <Section class="!py-12 border-y hairline-ink bg-paper/50">
      <Container>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          <Motion
            v-for="(stat, i) in stats"
            :key="stat.eyebrow"
            :initial="{ opacity: 0, y: 10 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, margin: '-50px' }"
            :transition="{ duration: 0.4, delay: i * 0.08 }"
            class="flex flex-col gap-2"
          >
            <Eyebrow class="text-brand-violet">{{ stat.eyebrow }}</Eyebrow>
            <div class="font-display text-4xl md:text-5xl font-semibold tracking-tight text-brand-violet">
              {{ stat.number }}
            </div>
            <p class="text-sm text-ink/70">{{ stat.caption }}</p>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Programs Split -->
    <Section id="programs" class="bg-white">
      <Container>
        <div class="flex flex-col gap-12">
          <div class="max-w-2xl">
            <Eyebrow class="text-brand-violet mb-4 block">Our Programs</Eyebrow>
            <Heading :level="2">Two paths to accelerated impact.</Heading>
          </div>

          <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Motion
              :initial="{ opacity: 0, y: 20 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :viewport="{ once: true }"
              :transition="{ duration: 0.5 }"
            >
              <UiCard hoverable class="h-full flex flex-col relative pt-[4px]">
                <div class="absolute top-0 left-0 right-0 h-[4px] bg-gradient-brand" />
                <div class="p-8 md:p-10 flex flex-col h-full gap-6">
                  <div class="flex justify-between items-start gap-4">
                    <Heading :level="3">StepUp Scholars</Heading>
                    <UiChip>In-person</UiChip>
                  </div>
                  <Body class="flex-1">
                    A rigorous, Nigeria-based research incubator for high-school
                    and gap-year students. Access world-class labs, receive a
                    stipend, and publish your first paper.
                  </Body>
                  <div class="pt-6 border-t hairline-ink flex items-center justify-between">
                    <span class="text-sm font-semibold text-ink/60">Ages 15–19 · Nigeria</span>
                    <UiButton variant="tertiary" :to="'/programs/stepup-scholars'" class="text-brand-violet">
                      <span class="flex items-center gap-1 group">
                        Learn more
                        <Icon icon="lucide:arrow-right" width="16" class="transition-transform group-hover:translate-x-1" />
                      </span>
                    </UiButton>
                  </div>
                </div>
              </UiCard>
            </Motion>

            <Motion
              :initial="{ opacity: 0, y: 20 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :viewport="{ once: true }"
              :transition="{ duration: 0.5, delay: 0.1 }"
            >
              <UiCard hoverable class="h-full flex flex-col relative pt-[4px]">
                <div class="absolute top-0 left-0 right-0 h-[4px] bg-gradient-brand" />
                <div class="p-8 md:p-10 flex flex-col h-full gap-6">
                  <div class="flex justify-between items-start gap-4">
                    <Heading :level="3">Dynamerge</Heading>
                    <UiChip>Virtual</UiChip>
                  </div>
                  <Body class="flex-1">
                    A pan-African virtual summer bootcamp connecting ambitious
                    students with global mentors. Four weeks of intense
                    learning, collaboration, and skill-building.
                  </Body>
                  <div class="pt-6 border-t hairline-ink flex items-center justify-between">
                    <span class="text-sm font-semibold text-ink/60">Ages 15–20 · Pan-African</span>
                    <UiButton variant="tertiary" :to="'/programs/dynamerge'" class="text-brand-violet">
                      <span class="flex items-center gap-1 group">
                        Learn more
                        <Icon icon="lucide:arrow-right" width="16" class="transition-transform group-hover:translate-x-1" />
                      </span>
                    </UiButton>
                  </div>
                </div>
              </UiCard>
            </Motion>
          </div>
        </div>
      </Container>
    </Section>

    <!-- Featured Story -->
    <Section class="bg-paper">
      <Container>
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <Motion
            class="lg:col-span-7 aspect-[4/3] rounded-2xl overflow-hidden relative"
            :initial="{ opacity: 0, scale: 0.98 }"
            :while-in-view="{ opacity: 1, scale: 1 }"
            :viewport="{ once: true }"
            :transition="{ duration: 0.6 }"
          >
            <div class="absolute inset-0 wash-violet-6 mix-blend-multiply z-10 pointer-events-none" />
            <img
              :src="FEATURED_IMG"
              alt="Student portrait"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </Motion>
          <Motion
            class="lg:col-span-5 flex flex-col gap-6"
            :initial="{ opacity: 0, x: 20 }"
            :while-in-view="{ opacity: 1, x: 0 }"
            :viewport="{ once: true }"
            :transition="{ duration: 0.6, delay: 0.2 }"
          >
            <Eyebrow class="text-brand-violet">Featured Scholar</Eyebrow>
            <blockquote class="font-display text-2xl md:text-3xl lg:text-4xl italic leading-tight text-ink m-0">
              "STAIJA didn't just teach me how to run a PCR test. They taught me
              how to ask questions that matter to my community."
            </blockquote>
            <div class="mt-4 flex flex-col gap-4">
              <div>
                <div class="font-semibold text-ink">Chinedu Okafor</div>
                <div class="text-sm text-ink/70">StepUp Scholar '24 · Lagos, Nigeria</div>
              </div>
              <UiButton variant="tertiary" :to="'/blog/chinedu-story'" class="self-start text-brand-violet mt-2">
                <span class="flex items-center gap-1 group">
                  Read Chinedu's story
                  <Icon icon="lucide:arrow-right" width="16" class="transition-transform group-hover:translate-x-1" />
                </span>
              </UiButton>
            </div>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Upcoming Events -->
    <Section class="bg-white border-y hairline-ink">
      <Container>
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div class="max-w-2xl">
            <Eyebrow class="text-brand-violet mb-4 block">Community</Eyebrow>
            <Heading :level="2">Upcoming events.</Heading>
          </div>
          <UiButton variant="tertiary" :to="'/events'">
            <span class="flex items-center gap-1 group pb-1">
              View all events
              <Icon icon="lucide:arrow-right" width="16" class="transition-transform group-hover:translate-x-1" />
            </span>
          </UiButton>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <Motion
            v-for="(event, i) in events"
            :key="event.title"
            :initial="{ opacity: 0, y: 15 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true }"
            :transition="{ duration: 0.4, delay: i * 0.1 }"
          >
            <UiCard hoverable class="p-6 flex flex-col gap-6 h-full">
              <div class="flex justify-between items-start">
                <div class="bg-ink/5 rounded-lg px-4 py-3 text-center min-w-[70px]">
                  <div class="text-sm font-semibold text-ink/60 uppercase">
                    {{ event.date.split(' ')[0] }}
                  </div>
                  <div class="font-display font-semibold text-2xl text-ink">
                    {{ event.date.split(' ')[1] }}
                  </div>
                </div>
                <UiChip>{{ event.type }}</UiChip>
              </div>
              <div class="flex-1">
                <h4 class="font-sans font-semibold text-lg leading-snug mb-3">
                  {{ event.title }}
                </h4>
                <div class="flex items-center gap-1.5 text-sm text-ink/60">
                  <Icon icon="lucide:map-pin" width="16" />
                  {{ event.loc }}
                </div>
              </div>
            </UiCard>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Partners -->
    <Section class="bg-paper">
      <Container>
        <Eyebrow class="text-center text-brand-violet mb-10 block">
          Supported by global partners
        </Eyebrow>
        <div class="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
          <span class="font-display text-2xl font-bold">Acme Corp</span>
          <span class="font-sans text-xl font-bold tracking-widest">GLOBEX</span>
          <span class="font-display text-2xl italic">Stark Labs</span>
          <span class="font-sans text-xl font-semibold">Massive Dynamic</span>
          <span class="font-display text-2xl">Soylent</span>
        </div>
      </Container>
    </Section>
  </div>
</template>

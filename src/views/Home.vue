<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
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
import { trackApplyClick } from '../services/analytics'
import { getBlogPosts, getEvents, type BlogPost, type EventItem } from '../services/content'

const stats = [
  { eyebrow: 'Students reached', number: '100', caption: 'Across StepUp + Dynamerge since 2023' },
  { eyebrow: 'Talk attendees', number: '200', caption: 'At STAIJA Talks and public events' },
  { eyebrow: 'Programs', number: '2', caption: 'StepUp Scholars · Dynamerge' },
]

// Featured story + upcoming events read from Contentful via the content
// service. Sections render only when real entries exist — no fallback to
// fabricated "Chinedu Okafor" / "StepUp 2025 info session" stubs that
// shipped fake credibility before the CMS was populated.
const featuredStory = ref<BlogPost | null>(null)
const upcomingEvents = ref<EventItem[]>([])

const featuredEyebrow = computed(() => {
  if (!featuredStory.value) return ''
  const d = new Date(featuredStory.value.publishedAt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})

function eventDateParts(iso: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  }
}

onMounted(async () => {
  try {
    const [blog, events] = await Promise.all([
      getBlogPosts({ limit: 1 }),
      getEvents({ upcoming: true, limit: 3 }),
    ])
    featuredStory.value = blog.items[0] ?? null
    upcomingEvents.value = events
  } catch {
    // Soft-fail: leave both null/empty so the sections stay hidden.
  }
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero — gradient-forward "brand-mark territory". The site is
         otherwise paper/ink/editorial; the hero is where the brand
         gradient gets to be loud, so the page feels like a cousin of
         the violet→cyan logo instead of a foil to it. -->
    <Section class="!pt-12 !pb-20 md:!pt-20 md:!pb-28 relative overflow-hidden bg-gradient-hero text-white">
      <!-- Soft accent glow behind the Lottie. Hidden on small screens
           where the artwork stacks below the copy and the glow would
           wash out the headline. -->
      <div
        class="hidden lg:block absolute -right-24 top-1/2 -translate-y-1/2 w-[640px] h-[640px] gradient-blob pointer-events-none"
        aria-hidden="true"
      />
      <Container>
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative">
          <Motion
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.32, ease: 'easeOut' }"
            class="flex flex-col gap-8 max-w-xl"
          >
            <Heading :level="1">
              Africa's next <span class="italic">scientist-leaders</span> start here.
            </Heading>
            <Body large class="!text-white/85">
              We nurture ambitious high-school and gap-year students through
              intensive research programs, mentorship, and a pan-African
              community of practice.
            </Body>
            <div class="flex flex-wrap gap-4">
              <UiButton
                variant="on-gradient"
                :to="'/apply/stepup-scholars'"
                @click="trackApplyClick({ program: 'stepup', source: 'home_hero' })"
              >
                Apply to StepUp
              </UiButton>
              <UiButton variant="on-gradient-ghost" href="#programs">
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
            <HeroLottie class="w-full h-full max-w-[560px] relative" />
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Impact Strip -->
    <Section class="!py-12 border-y hairline-ink bg-paper/50">
      <Container>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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

    <!-- Featured Story (renders only when CMS has at least one published post) -->
    <Section v-if="featuredStory" class="bg-paper">
      <Container>
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <Motion
            class="lg:col-span-7 aspect-[4/3] rounded-2xl overflow-hidden relative bg-ink/5"
            :initial="{ opacity: 0, scale: 0.98 }"
            :while-in-view="{ opacity: 1, scale: 1 }"
            :viewport="{ once: true }"
            :transition="{ duration: 0.6 }"
          >
            <div class="absolute inset-0 wash-violet-6 mix-blend-multiply z-10 pointer-events-none" />
            <img
              v-if="featuredStory.hero"
              :src="featuredStory.hero"
              :alt="featuredStory.title"
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
            <Eyebrow class="text-brand-violet">Featured Story · {{ featuredEyebrow }}</Eyebrow>
            <Heading :level="2">{{ featuredStory.title }}</Heading>
            <Body>{{ featuredStory.dek }}</Body>
            <div class="mt-2 flex flex-col gap-4">
              <div class="text-sm text-ink/70">By {{ featuredStory.author }}</div>
              <UiButton variant="tertiary" :to="`/blog/${featuredStory.slug}`" class="self-start text-brand-violet">
                <span class="flex items-center gap-1 group">
                  Read full story
                  <Icon icon="lucide:arrow-right" width="16" class="transition-transform group-hover:translate-x-1" />
                </span>
              </UiButton>
            </div>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Upcoming Events (renders only when CMS has at least one upcoming event) -->
    <Section v-if="upcomingEvents.length > 0" class="bg-white border-y hairline-ink">
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
            v-for="(event, i) in upcomingEvents"
            :key="event.slug"
            :initial="{ opacity: 0, y: 15 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true }"
            :transition="{ duration: 0.4, delay: i * 0.1 }"
          >
            <RouterLink :to="`/events/${event.slug}`" class="block h-full">
              <UiCard hoverable class="p-6 flex flex-col gap-6 h-full">
                <div class="flex justify-between items-start">
                  <div class="bg-ink/5 rounded-lg px-4 py-3 text-center min-w-[70px]">
                    <div class="text-sm font-semibold text-ink/60 uppercase">
                      {{ eventDateParts(event.datetime).month }}
                    </div>
                    <div class="font-display font-semibold text-2xl text-ink">
                      {{ eventDateParts(event.datetime).day }}
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
                    {{ event.location }}
                  </div>
                </div>
              </UiCard>
            </RouterLink>
          </Motion>
        </div>
      </Container>
    </Section>

  </div>
</template>

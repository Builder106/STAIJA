<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../components/ui/Container.vue'
import Section from '../components/ui/Section.vue'
import Heading from '../components/ui/Heading.vue'
import Body from '../components/ui/Body.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiChip from '../components/ui/UiChip.vue'

const route = useRoute()
void route.params.id

const event = {
  title: 'Information Session: StepUp 2025',
  date: 'October 12, 2024',
  time: '4:00 PM – 5:30 PM WAT',
  location: 'Virtual (Zoom link provided upon registration)',
  type: 'Webinar',
  isVirtual: true,
  heroImg: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  description: `Join us for an exclusive information session detailing the upcoming 2025 cohort of StepUp Scholars. This session is designed for prospective applicants, parents, and school counselors to learn about the rigorous 6-month research incubator program. We will cover the application process, timeline, stipend structure, and what we look for in successful candidates. There will be a live Q&A segment at the end.`,
  agenda: [
    { time: '4:00 PM', title: 'Welcome & Program Overview', speaker: 'Amina Yusuf' },
    { time: '4:20 PM', title: 'The Application Deep-Dive', speaker: 'Chinedu Okafor' },
    { time: '4:45 PM', title: 'Alumni Spotlight: My Research Journey', speaker: 'Sarah Nwachukwu' },
    { time: '5:00 PM', title: 'Live Q&A Session', speaker: 'Panel' },
  ],
  speakers: [
    { name: 'Dr. Amina Yusuf', title: 'Program Director', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    { name: 'Sarah Nwachukwu', title: "Alumni '23", img: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  ],
}

const rsvpState = ref<'idle' | 'loading' | 'success'>('idle')

function handleRSVP(e: Event) {
  e.preventDefault()
  rsvpState.value = 'loading'
  setTimeout(() => { rsvpState.value = 'success' }, 800)
}
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen pb-24">
    <Section class="!pt-8 !pb-0">
      <Container>
        <RouterLink to="/events" class="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-brand-violet transition-colors mb-6 focus-ring-brand rounded-sm">
          <Icon icon="lucide:arrow-left" width="16" /> Back to events
        </RouterLink>

        <Motion
          class="aspect-[21/9] md:aspect-[3/1] rounded-3xl overflow-hidden relative border hairline-ink"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <div class="absolute inset-0 wash-violet-6 mix-blend-multiply z-10 pointer-events-none" />
          <img :src="event.heroImg" :alt="event.title" class="w-full h-full object-cover" />
        </Motion>
      </Container>
    </Section>

    <Section class="!pt-12 !pb-16">
      <Container>
        <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
          <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
            <Motion :initial="{ opacity: 0, x: -10 }" :animate="{ opacity: 1, x: 0 }" :transition="{ delay: 0.2 }">
              <UiChip class="mb-4 bg-ink !text-white !border-transparent">{{ event.type }}</UiChip>
              <Heading :level="1" class="mb-6">{{ event.title }}</Heading>
              <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 py-4 border-y hairline-ink bg-white/50 px-2">
                <div class="flex items-center gap-3 text-ink font-semibold">
                  <Icon icon="lucide:calendar" width="20" class="text-brand-violet" /> {{ event.date }}
                </div>
                <div class="flex items-center gap-3 text-ink font-semibold">
                  <Icon icon="lucide:clock" width="20" class="text-brand-violet" /> {{ event.time }}
                </div>
              </div>
              <div class="flex items-center gap-3 py-4 border-b hairline-ink bg-white/50 px-2 text-ink font-semibold">
                <Icon :icon="event.isVirtual ? 'lucide:video' : 'lucide:map-pin'" width="20" class="text-brand-violet" />
                {{ event.location }}
              </div>
            </Motion>

            <div>
              <Heading :level="3" class="mb-4">About this event</Heading>
              <Body large class="text-ink/80 leading-relaxed">{{ event.description }}</Body>
            </div>

            <div>
              <Heading :level="3" class="mb-6">Agenda</Heading>
              <div class="flex flex-col">
                <div
                  v-for="(item, i) in event.agenda"
                  :key="i"
                  class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 py-4 border-t hairline-ink last:border-b"
                >
                  <div class="font-display font-semibold text-lg text-ink/60 sm:w-24 shrink-0">{{ item.time }}</div>
                  <div class="flex-1 font-semibold text-ink text-lg">{{ item.title }}</div>
                  <div class="text-sm font-medium text-ink/60 flex items-center gap-2 bg-ink/5 px-3 py-1.5 rounded-full w-fit">
                    <Icon icon="lucide:user" width="14" /> {{ item.speaker }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Heading :level="3" class="mb-6">Speakers</Heading>
              <div class="grid sm:grid-cols-2 gap-6">
                <div
                  v-for="(speaker, i) in event.speakers"
                  :key="i"
                  class="flex items-center gap-4 bg-white p-4 rounded-2xl border hairline-ink shadow-sm"
                >
                  <div class="w-16 h-16 rounded-full overflow-hidden shrink-0">
                    <img :src="speaker.img" :alt="speaker.name" class="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg m-0">{{ speaker.name }}</h4>
                    <p class="text-sm text-ink/60 m-0">{{ speaker.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32">
            <UiCard class="p-8 bg-white shadow-xl shadow-ink/5 !border-2 !border-brand-violet/10">
              <Motion
                v-if="rsvpState === 'success'"
                :initial="{ opacity: 0, scale: 0.95 }"
                :animate="{ opacity: 1, scale: 1 }"
                class="flex flex-col items-center text-center py-8 gap-4"
              >
                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <Icon icon="lucide:calendar" width="32" />
                </div>
                <Heading :level="3">You're all set!</Heading>
                <Body>We've sent a calendar invite and details to your email address.</Body>
                <UiButton variant="secondary" :to="'/events'" class="mt-4 w-full">
                  Browse more events
                </UiButton>
              </Motion>

              <Motion v-else :initial="{ opacity: 0 }" :animate="{ opacity: 1 }">
                <div class="mb-6 border-b hairline-ink pb-6">
                  <Heading :level="3" class="mb-2">Secure your spot</Heading>
                  <p class="text-sm text-ink/60 m-0">This event is free, but space is limited. Register to receive the streaming link.</p>
                </div>

                <form class="flex flex-col gap-5" @submit="handleRSVP">
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-semibold text-ink/80">Full Name</label>
                    <input type="text" required placeholder="Amina Yusuf" class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-white" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-semibold text-ink/80">Email Address</label>
                    <input type="email" required placeholder="amina@example.com" class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-white" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-semibold text-ink/80">Are you a prospective student?</label>
                    <select required class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-white">
                      <option value="">Select an option</option>
                      <option value="yes">Yes, I want to apply</option>
                      <option value="no">No, I'm a parent/educator/mentor</option>
                    </select>
                  </div>

                  <UiButton
                    variant="gradient"
                    type="submit"
                    :disabled="rsvpState === 'loading'"
                    class="w-full mt-4 !h-12 text-base font-bold group"
                  >
                    <span v-if="rsvpState === 'loading'">Processing…</span>
                    <span v-else class="flex items-center gap-2">
                      Complete RSVP
                      <Icon icon="lucide:arrow-right" width="18" class="transition-transform group-hover:translate-x-1" />
                    </span>
                  </UiButton>
                </form>
              </Motion>
            </UiCard>
          </div>
        </div>
      </Container>
    </Section>
  </div>
</template>

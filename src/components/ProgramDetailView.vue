<script setup lang="ts">
import { ref, computed } from 'vue'
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from './ui/Container.vue'
import Section from './ui/Section.vue'
import Heading from './ui/Heading.vue'
import Body from './ui/Body.vue'
import Eyebrow from './ui/Eyebrow.vue'
import UiButton from './ui/UiButton.vue'
import UiCard from './ui/UiCard.vue'
import UiChip from './ui/UiChip.vue'

type Stat = { icon: string; label: string; value: string }
type Feature = { title: string; desc: string; img: string }
type TimelineStep = { date: string; desc: string }
type Mentor = { name: string; title: string; institution: string; img: string }

type Program = {
  name: string
  pitch: string
  eligibility: string
  stats: Stat[]
  heroImg: string
  features: Feature[]
  timeline: TimelineStep[]
  eligibilityList: string[]
  mentors: Mentor[]
}

const props = defineProps<{ slug: 'stepup-scholars' | 'dynamerge' }>()

const programs: Record<string, Program> = {
  'stepup-scholars': {
    name: 'StepUp Scholars',
    pitch: 'A rigorous, Nigeria-based research incubator for high-school and gap-year students.',
    eligibility: 'Ages 15–19 · Nigeria',
    stats: [
      { icon: 'lucide:users', label: 'Cohort size', value: '30 students' },
      { icon: 'lucide:clock', label: 'Duration', value: '6 months' },
      { icon: 'lucide:banknote', label: 'Stipend', value: '₦50,000 / mo' },
    ],
    heroImg: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      { title: 'Real Research', desc: 'Access world-class labs and equipment. Design experiments and gather original data.', img: 'https://images.unsplash.com/photo-1758573467240-f944226c2026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { title: 'Direct Mentorship', desc: 'Work 1:1 with postdoctoral researchers and industry scientists from top institutions.', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { title: 'Lasting Community', desc: 'Join a tight-knit cohort of peers who will become your future collaborators.', img: 'https://images.unsplash.com/photo-1737529807163-1d8a3fb6c403?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    ],
    timeline: [
      { date: 'Month 1', desc: 'Research methods boot camp and lab safety certification.' },
      { date: 'Month 2–4', desc: 'Active experimentation, data gathering, and weekly mentor check-ins.' },
      { date: 'Month 5', desc: 'Data analysis, scientific writing workshops, and abstract drafting.' },
      { date: 'Month 6', desc: 'Final symposium presentation and submission to youth science journals.' },
    ],
    eligibilityList: [
      'Must be between 15 and 19 years old',
      'Currently enrolled in secondary school or on a gap year in Nigeria',
      'Demonstrated interest in STEM subjects',
      'Able to commit 10 hours per week for 6 months',
    ],
    mentors: [
      { name: 'Dr. Amina Yusuf', title: 'Postdoctoral Researcher', institution: 'MIT', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { name: 'Prof. David Okafor', title: 'Principal Investigator', institution: 'University of Lagos', img: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { name: 'Sarah Nwachukwu', title: 'PhD Candidate', institution: 'Stanford', img: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    ],
  },
  'dynamerge': {
    name: 'Dynamerge',
    pitch: 'A pan-African virtual summer bootcamp connecting ambitious students with global mentors.',
    eligibility: 'Ages 15–20 · Pan-African',
    stats: [
      { icon: 'lucide:users', label: 'Students', value: 'From 12 countries' },
      { icon: 'lucide:clock', label: 'Duration', value: '4 weeks' },
      { icon: 'lucide:banknote', label: 'Cost', value: 'Fully funded' },
    ],
    heroImg: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      { title: 'Intensive Curriculum', desc: 'Four weeks of daily virtual workshops covering coding, data science, and leadership.', img: 'https://images.unsplash.com/photo-1758573467240-f944226c2026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { title: 'Global Mentors', desc: 'Learn directly from industry experts at top tech companies and research institutes.', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { title: 'Pan-African Network', desc: 'Build lasting relationships with peers across the continent.', img: 'https://images.unsplash.com/photo-1737529807163-1d8a3fb6c403?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    ],
    timeline: [
      { date: 'Week 1', desc: 'Foundations: Introduction to programming and data analysis.' },
      { date: 'Week 2', desc: 'Deep Dive: specialized tracks in AI, biotech, or clean energy.' },
      { date: 'Week 3', desc: 'Project Phase: Collaborative problem solving in assigned teams.' },
      { date: 'Week 4', desc: 'Demo Day: Present solutions to a panel of expert judges.' },
    ],
    eligibilityList: [
      'Must be between 15 and 20 years old',
      'Resident of any African country',
      'Reliable internet access (data stipends available based on need)',
      'Passionate about leveraging technology for impact',
    ],
    mentors: [
      { name: 'Dr. Amina Yusuf', title: 'Postdoctoral Researcher', institution: 'MIT', img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { name: 'Prof. David Okafor', title: 'Principal Investigator', institution: 'University of Lagos', img: 'https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
      { name: 'Sarah Nwachukwu', title: 'PhD Candidate', institution: 'Stanford', img: 'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
    ],
  },
}

const program = computed(() => programs[props.slug])

const faqs = [
  { q: 'Is there an application fee?', a: 'No, applying to STAIJA programs is completely free.' },
  { q: 'Do I need prior research experience?', a: 'Not at all. We are looking for curiosity and a willingness to learn.' },
  { q: 'How does the stipend work?', a: 'Accepted students receive a monthly stipend to cover internet, transportation, and basic needs during the program.' },
  { q: 'Can I apply to both programs?', a: 'Yes, but you can only participate in one program per calendar year if accepted to both.' },
]

const openFaq = ref<number | null>(0)
function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i
}
</script>

<template>
  <div v-if="program" class="flex flex-col">
    <!-- Hero -->
    <div class="relative min-h-[70vh] flex items-center bg-ink overflow-hidden">
      <div class="absolute inset-0 z-0">
        <img :src="program.heroImg" :alt="program.name" class="w-full h-full object-cover opacity-40" />
        <div class="absolute inset-0 wash-violet-6 mix-blend-screen" />
        <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
      </div>

      <Container class="relative z-10 pt-24 pb-16">
        <div class="max-w-3xl flex flex-col gap-6 text-paper">
          <Motion :initial="{ opacity: 0, y: 12 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.3 }">
            <UiChip class="bg-paper/10 !text-paper border-paper/20">{{ program.eligibility }}</UiChip>
          </Motion>

          <Motion
            class="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white"
            as="h1"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.1 }"
          >
            {{ program.name }}
          </Motion>

          <Motion
            class="text-lg md:text-xl text-paper/80 leading-relaxed max-w-2xl"
            as="p"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.2 }"
          >
            {{ program.pitch }}
          </Motion>

          <Motion
            class="flex flex-wrap gap-6 mt-4 pt-8 border-t border-paper/20"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{ duration: 0.4, delay: 0.3 }"
          >
            <div v-for="stat in program.stats" :key="stat.label" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-paper/10 flex items-center justify-center">
                <Icon :icon="stat.icon" width="20" class="text-white" />
              </div>
              <div>
                <div class="text-xs text-paper/60 uppercase tracking-widest font-semibold">{{ stat.label }}</div>
                <div class="text-sm font-semibold text-white">{{ stat.value }}</div>
              </div>
            </div>
          </Motion>

          <Motion
            class="mt-8"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{ duration: 0.4, delay: 0.4 }"
          >
            <UiButton
              :to="'/signup'"
              class="!bg-white !text-ink hover:!bg-paper hover:shadow-lg"
            >
              Apply to {{ program.name }}
            </UiButton>
          </Motion>
        </div>
      </Container>
    </div>

    <!-- Why this program -->
    <Section class="bg-paper">
      <Container>
        <Eyebrow class="text-brand-violet mb-4 block text-center">Why join us</Eyebrow>
        <Heading :level="2" class="text-center mb-16">More than just a course.</Heading>

        <div class="grid md:grid-cols-3 gap-8">
          <Motion
            v-for="(feature, i) in program.features"
            :key="feature.title"
            class="flex flex-col gap-6"
            :initial="{ opacity: 0, y: 20 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true }"
            :transition="{ duration: 0.5, delay: i * 0.1 }"
          >
            <div class="aspect-[4/3] rounded-2xl overflow-hidden">
              <img :src="feature.img" :alt="feature.title" class="w-full h-full object-cover" loading="lazy" />
            </div>
            <div>
              <Heading :level="3" class="!text-xl mb-2">{{ feature.title }}</Heading>
              <Body>{{ feature.desc }}</Body>
            </div>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Timeline -->
    <Section class="bg-white">
      <Container>
        <div class="max-w-3xl mx-auto">
          <Eyebrow class="text-brand-violet mb-4 block">Curriculum</Eyebrow>
          <Heading :level="2" class="mb-12">What you'll do.</Heading>

          <div class="relative pl-8 md:pl-0">
            <div class="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-brand md:hidden" />
            <div class="flex flex-col gap-12">
              <Motion
                v-for="(step, i) in program.timeline"
                :key="step.date"
                class="relative flex flex-col md:flex-row md:items-start gap-4 md:gap-12"
                :initial="{ opacity: 0, x: -20 }"
                :while-in-view="{ opacity: 1, x: 0 }"
                :viewport="{ once: true }"
                :transition="{ duration: 0.4, delay: i * 0.1 }"
              >
                <div class="md:w-1/3 shrink-0 flex items-center gap-4 md:justify-end relative">
                  <div class="absolute -left-8 top-1.5 w-3 h-3 rounded-full bg-brand-violet md:hidden" />
                  <div class="font-display text-2xl text-ink md:text-right">{{ step.date }}</div>
                  <div class="hidden md:flex items-center absolute left-full -translate-x-1/2 top-3">
                    <div class="w-4 h-4 rounded-full bg-paper border-4 border-brand-violet z-10" />
                  </div>
                </div>
                <div class="md:w-2/3 md:pl-8">
                  <Body large>{{ step.desc }}</Body>
                </div>
              </Motion>
            </div>
          </div>
        </div>
      </Container>
    </Section>

    <!-- Who it's for -->
    <Section class="bg-paper border-y hairline-ink">
      <Container>
        <div class="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border hairline-ink flex flex-col md:flex-row gap-12">
          <div class="md:w-1/3">
            <Heading :level="2" class="mb-4">Who it's for</Heading>
            <p class="text-ink/60 text-sm">
              We evaluate applications based on curiosity, resilience, and potential for growth.
              We actively encourage students from underrepresented backgrounds to apply.
            </p>
          </div>
          <div class="md:w-2/3 flex flex-col gap-4">
            <div v-for="req in program.eligibilityList" :key="req" class="flex items-start gap-3">
              <Icon icon="lucide:check-circle-2" width="20" class="text-brand-violet shrink-0 mt-1" />
              <Body>{{ req }}</Body>
            </div>
          </div>
        </div>
      </Container>
    </Section>

    <!-- Mentors -->
    <Section class="bg-white">
      <Container>
        <div class="text-center mb-12">
          <Heading :level="2">Learn from the best.</Heading>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <UiCard v-for="mentor in program.mentors" :key="mentor.name" class="p-4 flex flex-col items-center text-center gap-4">
            <div class="w-24 h-24 rounded-full overflow-hidden mb-2">
              <img :src="mentor.img" :alt="mentor.name" class="w-full h-full object-cover" loading="lazy" />
            </div>
            <div>
              <h4 class="font-semibold text-ink text-lg m-0">{{ mentor.name }}</h4>
              <p class="text-sm text-ink/60 m-0">{{ mentor.title }}</p>
              <p class="text-xs font-medium text-brand-violet mt-1 m-0">{{ mentor.institution }}</p>
            </div>
          </UiCard>
        </div>
      </Container>
    </Section>

    <!-- FAQ -->
    <Section class="bg-paper border-t hairline-ink">
      <Container class="max-w-3xl">
        <Heading :level="2" class="text-center mb-12">Frequently Asked Questions</Heading>
        <div class="flex flex-col gap-4">
          <UiCard
            v-for="(faq, i) in faqs"
            :key="faq.q"
            class="overflow-hidden"
            @click="toggleFaq(i)"
          >
            <div class="p-6 flex items-center justify-between font-semibold text-lg cursor-pointer">
              <span>{{ faq.q }}</span>
              <Icon
                icon="lucide:chevron-down"
                width="20"
                class="transition-transform duration-300"
                :class="openFaq === i && 'rotate-180'"
              />
            </div>
            <div
              class="px-6 text-ink/70 transition-all duration-300 ease-in-out"
              :class="openFaq === i ? 'pb-6 max-h-[200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'"
            >
              {{ faq.a }}
            </div>
          </UiCard>
        </div>
      </Container>
    </Section>

    <!-- Apply CTA Banner -->
    <section class="bg-gradient-brand w-full py-24 px-6">
      <Container>
        <div class="text-center flex flex-col items-center">
          <Heading :level="2" class="!text-white mb-8 max-w-2xl">
            Ready to start your journey with STAIJA?
          </Heading>
          <UiButton
            :to="'/signup'"
            class="!bg-transparent !text-white !border-2 !border-white hover:!bg-white hover:!text-brand-violet text-lg !px-8 !h-auto !py-4"
          >
            Apply to {{ program.name }}
          </UiButton>
        </div>
      </Container>
    </section>
  </div>
  <div v-else class="p-24 text-center">Program not found.</div>
</template>

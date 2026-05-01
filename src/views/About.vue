<script setup lang="ts">
import { Motion } from 'motion-v'
import Container from '../components/ui/Container.vue'
import Section from '../components/ui/Section.vue'
import Heading from '../components/ui/Heading.vue'
import Eyebrow from '../components/ui/Eyebrow.vue'
import UiCard from '../components/ui/UiCard.vue'

const TEAM = [
  { name: 'Dr. Amina Yusuf', title: 'Executive Director' },
  { name: 'David Okafor', title: 'Director of Research' },
  { name: 'Sarah Nwachukwu', title: 'Head of Programs' },
  { name: 'Oluwaseun Adeyemi', title: 'Operations Lead' },
  { name: 'Chidi Nnamdi', title: 'Mentorship Coordinator' },
  { name: 'Amara Onwu', title: 'Community Manager' },
  { name: 'Ken Ikemefuna', title: 'Data Scientist' },
  { name: 'Nneka Eze', title: 'Communications Lead' },
].map((m) => ({
  ...m,
  img: 'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  bio: 'Former researcher at MIT. Passionate about democratizing access to lab spaces across West Africa.',
}))

const ADVISORS = [
  'Prof. Olabisi Ojo (Stanford)',
  'Dr. Kwame Ndlovu (Oxford)',
  'Funke Opeke (Tech Entrepreneur)',
  'Dr. Ndidi Nnoli-Edozien',
  'Tomiwa Alabi',
  'Niyi Yusuf',
]

const PRESS = [
  { source: 'Tech Review Africa', quote: 'Quietly building the most robust pipeline of scientific talent on the continent.' },
  { source: 'Daily Science', quote: "STAIJA's model proves that high schoolers can conduct rigorous, publishable research." },
  { source: 'The Lagos Times', quote: 'A masterclass in community-driven STEM education.' },
]
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <!-- Hero -->
    <Section class="!py-24 md:!py-32">
      <Container class="max-w-4xl text-center flex flex-col items-center">
        <Eyebrow class="text-brand-violet mb-8 block">Our Mission</Eyebrow>
        <blockquote class="font-display text-4xl md:text-5xl lg:text-6xl italic leading-tight text-ink m-0">
          "Talent is evenly distributed across the continent. Opportunity, equipment, and mentorship are not. We are here to balance the equation."
        </blockquote>
      </Container>
    </Section>

    <!-- Story -->
    <Section class="bg-white !py-24 border-y hairline-ink">
      <Container class="max-w-3xl">
        <div class="flex flex-col gap-8 text-lg md:text-xl text-ink/80 leading-relaxed font-sans">
          <p class="m-0">
            <span class="font-semibold text-brand-violet">STAIJA</span> began in 2018 in a borrowed classroom at the University of Lagos. Our founders—three Nigerian doctoral students who had struggled to find rigorous research opportunities during their own undergraduate years—wanted to build the bridge they never had.
          </p>
          <p class="m-0">
            What started as a weekend seminar for 15 ambitious high-schoolers has grown into a pan-African ecosystem. We realized early on that simply teaching students <em>about</em> science wasn't enough; they needed to <em>do</em> science. They needed pipettes, sequencers, clean data sets, and mentors who treated them as future peers, not just students.
          </p>
          <p class="m-0">
            Today, STAIJA runs two flagship programs that reach hundreds of scholars across 12 countries. We have built a network of over 120 mentors from top global institutions, and our alumni are already publishing papers, founding startups, and reshaping the narrative of African innovation.
          </p>
        </div>
      </Container>
    </Section>

    <!-- Leadership Grid -->
    <Section class="bg-paper !py-24">
      <Container>
        <div class="text-center mb-16">
          <Heading :level="2">Leadership Team</Heading>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Motion
            v-for="(member, i) in TEAM"
            :key="member.name"
            :initial="{ opacity: 0, y: 20 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true }"
            :transition="{ delay: (i % 4) * 0.1 }"
          >
            <UiCard class="overflow-hidden bg-white group">
              <div class="aspect-square relative overflow-hidden border-b hairline-ink">
                <div class="absolute inset-0 wash-violet-6 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img :src="member.img" :alt="member.name" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="p-6">
                <h4 class="font-display text-xl font-semibold mb-1 group-hover:text-brand-violet transition-colors m-0">{{ member.name }}</h4>
                <p class="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-3 m-0">{{ member.title }}</p>
                <p class="text-sm text-ink/80 leading-relaxed m-0">{{ member.bio }}</p>
              </div>
            </UiCard>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- Board + Advisors -->
    <Section class="bg-white !py-24 border-t hairline-ink">
      <Container class="max-w-4xl text-center">
        <Heading :level="3" class="mb-12">Board & Advisors</Heading>
        <div class="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <span
            v-for="advisor in ADVISORS"
            :key="advisor"
            class="text-lg font-medium text-ink/70 px-4 py-2 bg-ink/5 rounded-full"
          >{{ advisor }}</span>
        </div>
      </Container>
    </Section>

    <!-- Partners & Funders -->
    <Section class="bg-paper !py-24 border-t hairline-ink">
      <Container>
        <Eyebrow class="text-center text-ink/40 mb-12 block">Backed by</Eyebrow>
        <div class="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale">
          <span class="font-display text-3xl font-bold">Foundation X</span>
          <span class="font-sans text-2xl font-bold tracking-widest">TECHCORP</span>
          <span class="font-display text-3xl italic">Global Health Inst.</span>
          <span class="font-sans text-2xl font-semibold">Africa Innovates</span>
        </div>
      </Container>
    </Section>

    <!-- Press -->
    <Section class="bg-ink !py-24 text-white">
      <Container>
        <Eyebrow class="text-white/40 mb-16 block text-center">In the Press</Eyebrow>
        <div class="grid md:grid-cols-3 gap-12 text-center">
          <div v-for="press in PRESS" :key="press.source" class="flex flex-col items-center gap-6">
            <span class="font-display text-xl font-bold text-brand-sky">{{ press.source }}</span>
            <p class="text-lg text-white/80 italic leading-relaxed m-0">"{{ press.quote }}"</p>
          </div>
        </div>
      </Container>
    </Section>
  </div>
</template>

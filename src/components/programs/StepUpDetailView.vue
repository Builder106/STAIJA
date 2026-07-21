<script setup lang="ts">
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../ui/Container.vue'
import Section from '../ui/Section.vue'
import Heading from '../ui/Heading.vue'
import Body from '../ui/Body.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import UiButton from '../ui/UiButton.vue'
import UiCard from '../ui/UiCard.vue'
import Parallax from '../motion/Parallax.vue'
import ProgramFaq from './ProgramFaq.vue'
import ProgramCtaBanner from './ProgramCtaBanner.vue'
import { trackApplyClick } from '../../services/analytics'
import { useProgram } from '../../composables/useProgram'

// StepUp Scholars — the "research journal" register.
//
// StepUp and Dynamerge used to render through one shared layout with
// swapped text, which made two genuinely different programs read as the
// same product. This page leans into what StepUp actually is (a six-month
// Nigeria-based research incubator whose scholars end with a symposium
// talk and a journal submission): specimen-label ledger instead of icon
// stats, numbered editorial rows instead of a card grid, person-forward
// 1:1 mentor bench, and slower, quieter motion. The mono ledger styling
// deliberately echoes the transactional-email refBox (see
// functions/src/emailTemplates.ts) so the register carries across media.
const SLUG = 'stepup-scholars' as const

const { program, isApplyOpen, closedReason } = useProgram(SLUG)

// 2025 cohort project areas, as published on STAIJA's own LinkedIn page.
// Prototype seam: if this section survives review, these belong on the
// Firestore Program doc (admin-editable per cohort) rather than here.
const RESEARCH_AREAS = [
  { name: 'Cardiology', icon: 'lucide:heart-pulse' },
  { name: 'Robotics', icon: 'lucide:bot' },
  { name: 'Artificial Intelligence', icon: 'lucide:brain-circuit' },
]

const FAQS = [
  { q: 'Do I need prior research experience?', a: 'Not at all. We are looking for curiosity and a willingness to learn.' },
  { q: 'How does the stipend work?', a: 'Accepted students receive a monthly stipend to cover internet, transportation, and basic needs during the program.' },
  { q: 'Is there an application fee?', a: 'No, applying to STAIJA programs is completely free.' },
  { q: 'Can I apply to both programs?', a: 'Yes, but you can only participate in one program per calendar year if accepted to both.' },
]
</script>

<template>
  <div v-if="program" class="flex flex-col">
    <!-- Hero — intentionally always-dark regardless of theme (uses the
         `*-static` tokens so it doesn't invert in dark mode). One still
         photo, a specimen-label ledger for the program facts, and slow
         reveals: the page should open like a journal, not a poster. -->
    <div class="relative min-h-svh flex items-center bg-ink-static overflow-hidden">
      <div class="absolute inset-0 z-0">
        <Parallax :speed="-0.25" :distance="120" class="absolute inset-0">
          <img :src="program.heroImg" :alt="program.name" width="1280" height="720" class="w-full h-full object-cover opacity-40 scale-110" />
        </Parallax>
        <div class="absolute inset-0 wash-violet-6 mix-blend-screen" />
        <div class="absolute inset-0 bg-gradient-to-t from-ink-static via-ink-static/60 to-transparent" />
      </div>

      <Container class="relative z-10 py-24">
        <div class="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">
          <div class="max-w-2xl flex flex-col gap-6 text-paper-static">
            <Motion :initial="{ opacity: 0, y: 14 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.55 }">
              <Eyebrow accent class="text-brand-sky">Research incubator — {{ program.eligibility }}</Eyebrow>
            </Motion>

            <Motion
              class="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white"
              as="h1"
              :initial="{ opacity: 0, y: 14 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.55, delay: 0.12 }"
            >
              {{ program.name }}
            </Motion>

            <Motion
              class="text-lg md:text-xl text-paper-static/80 leading-relaxed"
              as="p"
              :initial="{ opacity: 0, y: 14 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.55, delay: 0.24 }"
            >
              {{ program.pitch }}
            </Motion>

            <Motion
              class="mt-6 flex flex-wrap items-center gap-4"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ duration: 0.6, delay: 0.4 }"
            >
              <UiButton
                v-if="isApplyOpen"
                variant="on-gradient"
                :to="`/apply/${SLUG}`"
                @click="trackApplyClick({ program: 'stepup', source: 'program_hero' })"
              >
                Apply now
              </UiButton>
              <template v-else>
                <UiButton
                  variant="on-gradient"
                  :to="`/stay-connected?from=${SLUG}&reason=${closedReason}`"
                >
                  {{ closedReason === 'upcoming' ? 'Get notified when applications open' : 'Stay connected for the next cycle' }}
                </UiButton>
                <span class="text-sm text-paper-static/70">
                  Applications {{ closedReason === 'upcoming' ? 'open soon' : 'are closed for this cycle' }}.
                </span>
              </template>
              <UiButton variant="on-gradient-ghost" href="#arc">Read the six-month arc</UiButton>
            </Motion>
          </div>

          <!-- Specimen ledger — same visual language as the email refBox
               (accent left border, dotted ledger rules, mono labels). -->
          <Motion
            :initial="{ opacity: 0, y: 14 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.35 }"
          >
            <div class="w-full lg:w-80 border-l-4 border-brand-violet bg-white/[0.06] backdrop-blur-sm rounded-r-2xl p-6 font-mono-african">
              <div class="text-[11px] uppercase tracking-[0.2em] text-paper-static/50">Program record</div>
              <dl class="m-0 mt-2">
                <div
                  v-for="stat in program.stats"
                  :key="stat.label"
                  class="flex items-baseline justify-between gap-6 py-3 border-b border-dotted border-paper-static/25 last:border-0"
                >
                  <dt class="text-[11px] uppercase tracking-[0.18em] text-paper-static/60">{{ stat.label }}</dt>
                  <dd class="m-0 text-sm text-white">{{ stat.value }}</dd>
                </div>
              </dl>
              <div class="mt-4 text-[10px] uppercase tracking-[0.2em] text-paper-static/40">Ref № stepup-scholars</div>
            </div>
          </Motion>
        </div>
      </Container>
    </div>

    <!-- The work — numbered editorial rows instead of a card grid. The
         index numerals do the "journal entry" work; alternating image
         sides keep the scroll from feeling like a template. -->
    <Section class="bg-paper">
      <Container>
        <div class="max-w-5xl mx-auto">
          <Eyebrow accent class="text-brand-violet mb-4 block">The work</Eyebrow>
          <Heading :level="2" class="mb-16 max-w-2xl">Six months of doing science, not hearing about it.</Heading>

          <div class="flex flex-col gap-16 md:gap-24">
            <Motion
              v-for="(feature, i) in program.features"
              :key="feature.title"
              class="grid md:grid-cols-2 gap-8 md:gap-14 items-center"
              :initial="{ opacity: 0, y: 24 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :viewport="{ once: true, margin: '-60px' }"
              :transition="{ duration: 0.6 }"
            >
              <div class="aspect-[4/3] rounded-2xl overflow-hidden" :class="i % 2 === 1 && 'md:order-2'">
                <img :src="feature.img" :alt="feature.title" width="600" height="400" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div>
                <div class="font-mono-african text-sm text-brand-violet mb-3">{{ String(i + 1).padStart(2, '0') }}</div>
                <Heading :level="3" class="mb-3">{{ feature.title }}</Heading>
                <Body large>{{ feature.desc }}</Body>
              </div>
            </Motion>
          </div>
        </div>
      </Container>
    </Section>

    <!-- The six-month arc — the vertical month spine stays: a long
         program earns a long, patient timeline. (Dynamerge deliberately
         does NOT use this shape.) -->
    <Section id="arc" class="bg-surface">
      <Container>
        <div class="max-w-4xl mx-auto">
          <Eyebrow accent class="text-brand-violet mb-4 block">The arc</Eyebrow>
          <Heading :level="2" class="mb-12">From first question to first paper.</Heading>

          <ol class="list-none p-0 m-0 grid grid-cols-[auto_28px_1fr] md:grid-cols-[180px_28px_1fr] gap-x-5 md:gap-x-8">
            <Motion
              v-for="(step, i) in program.timeline"
              :key="step.date"
              as="li"
              class="contents"
              :initial="{ opacity: 0, x: -12 }"
              :while-in-view="{ opacity: 1, x: 0 }"
              :viewport="{ once: true, margin: '-50px' }"
              :transition="{ duration: 0.5, delay: i * 0.08 }"
            >
              <!-- Date column. The Month label IS the sequence — the
                   spine dot deliberately doesn't repeat a step number. -->
              <div
                class="font-display text-lg md:text-2xl font-semibold text-ink md:text-right pt-2 self-start"
                :class="i === program.timeline.length - 1 ? 'pb-0' : 'pb-14'"
              >
                {{ step.date }}
              </div>

              <!-- Spine: gradient dot anchors the row; the connecting
                   line runs behind it and is hidden on the last row. -->
              <div class="relative flex flex-col items-center self-stretch">
                <span
                  v-if="i !== program.timeline.length - 1"
                  class="absolute top-7 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-brand-violet/20"
                  aria-hidden="true"
                />
                <span
                  class="relative z-10 mt-2 w-7 h-7 rounded-full bg-gradient-to-br from-brand-violet to-brand-sky shadow-lg shadow-brand-violet/25 ring-4 ring-surface"
                  aria-hidden="true"
                />
              </div>

              <div
                class="self-start pt-2"
                :class="i === program.timeline.length - 1 ? 'pb-0' : 'pb-14'"
              >
                <Body large class="text-ink/80 leading-relaxed">{{ step.desc }}</Body>
              </div>
            </Motion>
          </ol>
        </div>
      </Container>
    </Section>

    <!-- The record — what a finished cohort leaves behind. Content is
         limited to claims STAIJA has published itself; no invented
         numbers (see JOURNAL 2026-05-02 on fabricated stats). -->
    <Section class="bg-paper border-y hairline-ink">
      <Container>
        <div class="max-w-4xl mx-auto">
          <Eyebrow accent class="text-brand-violet mb-4 block">The record</Eyebrow>
          <Heading :level="2" class="mb-6">Work that leaves a paper trail.</Heading>
          <Body large class="max-w-2xl">
            Scholars close the program with a symposium presentation and a manuscript
            submitted to a youth science journal. The 2025 cohort's projects ran through
            cardiology, robotics, and artificial intelligence.
          </Body>

          <div class="grid sm:grid-cols-3 gap-4 mt-12">
            <Motion
              v-for="(area, i) in RESEARCH_AREAS"
              :key="area.name"
              :initial="{ opacity: 0, y: 16 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :viewport="{ once: true }"
              :transition="{ duration: 0.5, delay: i * 0.1 }"
            >
              <UiCard class="p-6 h-full !bg-surface">
                <Icon :icon="area.icon" width="24" class="text-brand-violet mb-4" />
                <div class="font-mono-african text-[11px] uppercase tracking-[0.18em] text-ink/60">2025 cohort</div>
                <div class="font-semibold text-ink mt-1">{{ area.name }}</div>
              </UiCard>
            </Motion>
          </div>
        </div>
      </Container>
    </Section>

    <!-- Mentor bench — person-forward, because for StepUp the mentor IS
         the product: one scholar, one working researcher, weekly
         check-ins. Dynamerge treats mentors as a network; this page
         treats them as a roster. -->
    <Section class="bg-surface">
      <Container>
        <div class="max-w-4xl mx-auto">
          <Eyebrow accent class="text-brand-violet mb-4 block">Mentorship</Eyebrow>
          <Heading :level="2" class="mb-6">One scholar, one researcher.</Heading>
          <Body large class="max-w-2xl mb-12">
            Every scholar works 1:1 with a postdoctoral researcher or industry scientist,
            with weekly check-ins on the calendar from week one.
          </Body>

          <div class="grid md:grid-cols-3 gap-6">
            <UiCard v-for="mentor in program.mentors" :key="mentor.name" class="p-5 flex items-center gap-4 !bg-paper">
              <img :src="mentor.img" :alt="mentor.name" width="300" height="300" class="w-16 h-16 rounded-full object-cover shrink-0" loading="lazy" />
              <div class="min-w-0">
                <h4 class="font-semibold text-ink m-0 truncate">{{ mentor.name }}</h4>
                <p class="text-sm text-ink/60 m-0">{{ mentor.title }}</p>
                <p class="font-mono-african text-[11px] uppercase tracking-[0.14em] text-brand-violet mt-1 m-0">{{ mentor.institution }}</p>
              </div>
            </UiCard>
          </div>
        </div>
      </Container>
    </Section>

    <!-- Who it's for -->
    <Section class="bg-paper border-t hairline-ink">
      <Container>
        <div class="max-w-4xl mx-auto bg-surface rounded-3xl p-8 md:p-12 shadow-sm border hairline-ink flex flex-col md:flex-row gap-12">
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

    <ProgramFaq :faqs="FAQS" />

    <ProgramCtaBanner
      :slug="SLUG"
      :is-apply-open="isApplyOpen"
      :closed-reason="closedReason"
    />
  </div>
  <div v-else class="p-24 text-center">Program not found.</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../ui/Container.vue'
import Section from '../ui/Section.vue'
import Heading from '../ui/Heading.vue'
import Body from '../ui/Body.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import UiButton from '../ui/UiButton.vue'
import UiCard from '../ui/UiCard.vue'
import ProgramFaq from './ProgramFaq.vue'
import ProgramCtaBanner from './ProgramCtaBanner.vue'
import { trackApplyClick } from '../../services/analytics'
import { ProgramService } from '../../services/programService'
import { useProgram } from '../../composables/useProgram'

// Dynamerge — the "sprint" register.
//
// Counterpart to StepUpDetailView.vue (see the note there on why the two
// program pages stopped sharing a layout). Dynamerge is a four-week
// pan-African virtual bootcamp, and its own recruitment voice — the
// "application is LIVE!" Instagram posts — is urgency and momentum, not
// journal gravitas. So: brand-gradient hero instead of the dark photo,
// a status-aware LIVE chip, a horizontal week-by-week sprint board
// instead of the vertical month spine, interactive track tabs, and
// faster, snappier motion timing throughout.
const SLUG = 'dynamerge' as const

const { program, programDoc, applicationStatus, isApplyOpen, closedReason } = useProgram(SLUG)

// Real deadline, only when a Firestore doc provides one — never invented.
const applyDeadline = computed<string | null>(() => {
  if (applicationStatus.value !== 'open') return null
  const end = programDoc.value?.dates?.applicationEnd
  return end ? ProgramService.formatDate(end) : null
})

// Timeline entries arrive as "Kicker: rest of sentence." — split for the
// sprint cards. Guarded so a colon deep inside a sentence doesn't split.
function splitStep(desc: string): { kicker: string | null; body: string } {
  const idx = desc.indexOf(':')
  if (idx === -1 || idx > 24) return { kicker: null, body: desc }
  return { kicker: desc.slice(0, idx), body: desc.slice(idx + 1).trim() }
}

// Week-2 track choices, expanded into pickable tabs. Copy is prototype
// content — editable claims only, no numbers; belongs on the Program doc
// if the section survives review.
type TrackId = 'ai' | 'biotech' | 'energy'
const TRACKS: { id: TrackId; name: string; icon: string; copy: string }[] = [
  { id: 'ai', name: 'Artificial Intelligence', icon: 'lucide:brain-circuit', copy: 'Go from first principles to working models, and look hard at where AI is already changing industries across the continent.' },
  { id: 'biotech', name: 'Biotech', icon: 'lucide:dna', copy: 'Explore how modern biology gets engineered — and how the same tools apply to health challenges African communities actually face.' },
  { id: 'energy', name: 'Clean Energy', icon: 'lucide:zap', copy: 'Dig into the technologies racing to power the continent, from solar economics to storage, and prototype around a real constraint.' },
]
const activeTrackId = ref<TrackId>('ai')
const activeTrack = computed(() => TRACKS.find((t) => t.id === activeTrackId.value) ?? TRACKS[0])

// Marquee sample — decorative reinforcement of the real eligibility rule
// ("resident of any African country"), not a claim about where students
// have come from.
// c1/c2: two representative colors pulled from each country's own flag —
// used for the hover gradient on its name in the marquee below, so the
// accent is that country's identity rather than the fixed brand gradient.
const MARQUEE_COUNTRIES = [
  { name: 'Nigeria', flag: '🇳🇬', c1: '#008751', c2: '#FFFFFF' },
  { name: 'Ghana', flag: '🇬🇭', c1: '#CE1126', c2: '#FCD116' },
  { name: 'Kenya', flag: '🇰🇪', c1: '#BB0000', c2: '#006600' },
  { name: 'Egypt', flag: '🇪🇬', c1: '#CE1126', c2: '#000000' },
  { name: 'South Africa', flag: '🇿🇦', c1: '#007A4D', c2: '#FFB612' },
  { name: 'Senegal', flag: '🇸🇳', c1: '#00853F', c2: '#FDEF42' },
  { name: 'Rwanda', flag: '🇷🇼', c1: '#00A1DE', c2: '#FAD201' },
  { name: 'Ethiopia', flag: '🇪🇹', c1: '#078930', c2: '#FCDD09' },
  { name: 'Morocco', flag: '🇲🇦', c1: '#C1272D', c2: '#006233' },
  { name: 'Uganda', flag: '🇺🇬', c1: '#FCDC04', c2: '#D90000' },
  { name: 'Tanzania', flag: '🇹🇿', c1: '#1EB53A', c2: '#00A3DD' },
  { name: 'Cameroon', flag: '🇨🇲', c1: '#007A5E', c2: '#FCD116' },
  { name: 'Botswana', flag: '🇧🇼', c1: '#75AADB', c2: '#FFFFFF' },
  { name: 'Algeria', flag: '🇩🇿', c1: '#006233', c2: '#D21034' },
]

const FAQS = [
  { q: 'How much does Dynamerge cost?', a: 'Nothing. The bootcamp is fully funded, and applying is completely free.' },
  { q: 'What if my internet connection is unreliable?', a: 'Data stipends are available based on need, so connectivity should never be the reason you don\'t apply.' },
  { q: 'Do I have to know how to code already?', a: 'No. Week one starts at foundations — an introduction to programming and data analysis.' },
  { q: 'Can I apply to both programs?', a: 'Yes, but you can only participate in one program per calendar year if accepted to both.' },
]

// Flag lift-on-proximity: each flag in the country marquee scales/lifts as
// it crosses the strip's horizontal center, like a coverflow. Driven by a
// rAF loop reading live getBoundingClientRect() positions rather than
// tying into the CSS scroll animation directly, since the marquee's
// translateX keyframe has no JS-observable "position" to hook into.
// Mutates style directly instead of going through Vue reactivity —
// this runs every frame, and reactive refs per-flag would be needless
// overhead for a purely visual, non-stateful effect.
const marqueeStageRef = ref<HTMLElement | null>(null)
let flagLiftFrame: number | null = null

function tickFlagLift() {
  const stage = marqueeStageRef.value
  if (!stage) return
  const stageRect = stage.getBoundingClientRect()
  const centerX = stageRect.left + stageRect.width / 2
  stage.querySelectorAll<HTMLElement>('.marquee-flag').forEach((flag) => {
    const flagRect = flag.getBoundingClientRect()
    const flagCenter = flagRect.left + flagRect.width / 2
    const distance = Math.abs(flagCenter - centerX)
    const proximity = Math.max(0, 1 - distance / 220)
    const scale = 1 + proximity * 0.6
    const lift = proximity * 16
    flag.style.transform = `translateY(${-lift}px) scale(${scale})`
    flag.style.filter = proximity > 0.05 ? `drop-shadow(0 ${2 + proximity * 4}px ${4 + proximity * 8}px rgba(0,0,0,${proximity * 0.45}))` : 'none'
  })
  flagLiftFrame = requestAnimationFrame(tickFlagLift)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  flagLiftFrame = requestAnimationFrame(tickFlagLift)
})

onUnmounted(() => {
  if (flagLiftFrame !== null) cancelAnimationFrame(flagLiftFrame)
})
</script>

<template>
  <div v-if="program" class="flex flex-col">
    <!-- Hero — cover photo at real colour, no gradient tint over it. A
         dark bottom-up scrim (same ink-static token StepUp's hero uses)
         carries text legibility instead. Still no parallax: Dynamerge's
         motion stays flatter than StepUp's by design. -->
    <!-- min-height is 100svh minus the sticky header's own height (5rem:
         py-5 + 40px logo), so header + hero together land exactly on one
         screen and the marquee at the hero's bottom edge is visible
         without scrolling on load. -->
    <div class="relative flex flex-col justify-center overflow-hidden min-h-[calc(100svh-5rem)] bg-ink-static">
      <img
        :src="program.heroImg"
        :alt="program.name"
        width="1080" height="720"
        class="absolute inset-0 z-0 w-full h-full object-cover"
        loading="eager"
        fetchpriority="high"
      />
      <div class="absolute inset-0 z-0 bg-gradient-to-t from-ink-static via-ink-static/55 to-ink-static/15" />
      <Container class="relative z-10 py-24 grow flex flex-col justify-center">
        <div class="max-w-3xl flex flex-col gap-6">
          <!-- Ojuju (secondary African accent, wght=500) on this short
               eyebrow label only — a non-header spot to test it now
               that Madimi One (below) has the wordmark role. See
               docs/TYPOGRAPHY-SYSTEM.md. -->
          <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.3 }">
            <div class="inline-flex items-center gap-2.5 rounded-full bg-ink-static/25 border border-white/25 px-4 py-1.5 font-accent-african-secondary text-xs uppercase tracking-[0.18em] text-white">
              <template v-if="isApplyOpen">Applications open now</template>
              <template v-else-if="closedReason === 'upcoming'">Applications open soon</template>
              <template v-else>Applications closed for this cycle</template>
            </div>
          </Motion>

          <!-- Program wordmark uses Madimi One (African-designed, OFL —
               see docs/TYPOGRAPHY-SYSTEM.md), the primary accent face.
               Scoped to program.name only; body copy, stats, and the
               marquee below stay on the existing Plex/mono system.
               font-normal because Madimi One ships one weight (400). -->
          <Motion
            class="font-accent-african text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white"
            as="h1"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.05 }"
          >
            {{ program.name }}
          </Motion>

          <Motion
            class="text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl"
            as="p"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.1 }"
          >
            {{ program.pitch }}
          </Motion>

          <!-- Fast facts as a plain mono strip, matching the "Daily |
               Virtual | Team-based" line further down this same page —
               no boxes, just typography carrying the rhythm. A thin
               vertical rule divides items instead of a middle-dot
               character — see CLAUDE.md "no dot-separator" rule.
               font-mono-african (STAIJA Tac Mono) instead of Plex Mono
               here only — see docs/TYPOGRAPHY-SYSTEM.md. -->
          <Motion
            class="flex flex-wrap items-center gap-x-1 gap-y-2 font-mono-african text-base md:text-lg uppercase tracking-[0.14em] text-white/80 cursor-pennant"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.15 }"
          >
            <template v-for="(stat, i) in program.stats" :key="stat.label">
              <span class="inline-flex items-center gap-2">
                <Icon :icon="stat.icon" width="20" aria-hidden="true" class="text-white/60" />
                {{ stat.value }}
              </span>
              <span v-if="i < program.stats.length - 1" class="inline-block w-px h-4 bg-white/25 mx-3" aria-hidden="true" />
            </template>
          </Motion>

          <Motion
            class="mt-4 flex flex-wrap items-center gap-4"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.2 }"
          >
            <UiButton
              v-if="isApplyOpen"
              variant="on-gradient"
              :to="`/apply/${SLUG}`"
              @click="trackApplyClick({ program: 'dynamerge', source: 'program_hero' })"
            >
              Apply now
            </UiButton>
            <UiButton
              v-else
              variant="on-gradient"
              :to="`/stay-connected?from=${SLUG}&reason=${closedReason}`"
            >
              {{ closedReason === 'upcoming' ? 'Get notified when applications open' : 'Stay connected for the next cycle' }}
            </UiButton>
            <UiButton variant="on-gradient-ghost" href="#sprint">See the four weeks</UiButton>
            <span v-if="applyDeadline" class="font-mono-african text-xs uppercase tracking-[0.14em] text-white/80">
              Apply by {{ applyDeadline }}
            </span>
          </Motion>
        </div>
      </Container>

      <!-- Country marquee — pinned to the hero's bottom edge. Decorative
           (the real rule is "any African country"); duplicated track for
           a seamless loop, clone hidden from AT. Reduced-motion users
           get a static strip via the global animation kill-switch (which
           also short-circuits the flag-lift rAF loop below — see
           startFlagLift). Flags scale/lift as they cross the strip's
           center, a coverflow-style cue that something is passing
           "through" rather than just sliding past. -->
      <div
        ref="marqueeStageRef"
        class="relative z-10 border-t border-white/15 bg-ink-static/25 py-4 marquee focus-ring-inverse cursor-dot"
        role="group"
        tabindex="0"
        aria-label="Open to students across Africa, scrolling. Focus to pause."
      >
        <div class="marquee-track">
          <div v-for="clone in 2" :key="clone" class="flex shrink-0" :aria-hidden="clone === 2">
            <span
              v-for="country in MARQUEE_COUNTRIES"
              :key="country.name"
              class="marquee-country pl-10 font-mono-african text-base md:text-lg uppercase tracking-[0.2em] whitespace-nowrap"
            >
              <span class="marquee-flag inline-block" aria-hidden="true">{{ country.flag }}</span>
              <span
                class="marquee-name inline-block ml-2"
                :style="{ '--c1': country.c1, '--c2': country.c2 }"
              >{{ country.name }}</span>
              <span class="inline-block w-px h-4 bg-white/25 ml-10" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- The sprint — four weeks as a horizontal board under a gradient
         rail. Deliberately NOT StepUp's vertical month spine: a four-week
         bootcamp reads left-to-right, like a schedule you can hold.

         Note on `features[i]`: unlike StepUp (which loops the full
         features array generically), this page spends each of the 3
         seeded features by fixed index — [0] here, [1] in the mentor
         strip, [2] in "One continent, one cohort" below — so every
         admin-editable feature has a home instead of a generic 3-card
         grid repeating StepUp's layout. Trade-off: it assumes exactly 3
         features. If that stops being true, this is the place to widen
         it back into a loop. -->
    <Section id="sprint" class="bg-paper">
      <Container>
        <Eyebrow accent class="text-brand-violet mb-4 block">The sprint</Eyebrow>
        <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
          <Heading :level="2" class="max-w-xl">Four weeks. Zero filler.</Heading>
          <div class="flex items-center font-mono-african text-xs uppercase tracking-[0.18em] text-ink/50">
            <span>Daily</span>
            <span class="inline-block w-px h-3 bg-ink/20 mx-3" aria-hidden="true" />
            <span>Virtual</span>
            <span class="inline-block w-px h-3 bg-ink/20 mx-3" aria-hidden="true" />
            <span>Team-based</span>
          </div>
        </div>
        <Body large class="max-w-2xl mb-12">{{ program.features[0]?.desc }}</Body>

        <div class="hairline-gradient h-[2px] rounded-full mb-6" aria-hidden="true" />
        <ol class="list-none p-0 m-0 grid md:grid-cols-4 gap-4">
          <Motion
            v-for="(step, i) in program.timeline"
            :key="step.date"
            as="li"
            :initial="{ opacity: 0, y: 12 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, margin: '-40px' }"
            :transition="{ duration: 0.3, delay: i * 0.06 }"
            class="h-full"
          >
            <!-- Final card gets the gradient: Demo Day is the payoff. -->
            <div
              class="h-full rounded-2xl p-6 flex flex-col gap-3"
              :class="i === program.timeline.length - 1
                ? 'bg-gradient-brand text-white'
                : 'bg-surface border hairline-ink'"
            >
              <div
                class="font-mono-african text-lg uppercase tracking-[0.2em]"
                :class="i === program.timeline.length - 1 ? 'text-white/80' : 'text-brand-violet'"
              >
                {{ step.date }}
              </div>
              <div v-if="splitStep(step.desc).kicker" class="font-display text-xl font-semibold">
                {{ splitStep(step.desc).kicker }}
              </div>
              <p class="m-0 text-sm leading-relaxed" :class="i === program.timeline.length - 1 ? 'text-white/90' : 'text-ink/70'">
                {{ splitStep(step.desc).body }}
              </p>
            </div>
          </Motion>
        </ol>
      </Container>
    </Section>

    <!-- Pick a track — interactive where StepUp is contemplative. -->
    <Section class="bg-surface">
      <Container>
        <div class="max-w-4xl mx-auto">
          <Eyebrow accent class="text-brand-violet mb-4 block">Week 2 onward</Eyebrow>
          <Heading :level="2" class="mb-6">Pick your track.</Heading>
          <Body large class="max-w-2xl mb-10">
            After a shared foundations week, the cohort splits into specialized tracks.
          </Body>

          <div class="flex flex-wrap gap-3 mb-8" role="group" aria-label="Choose a track to preview">
            <button
              v-for="track in TRACKS"
              :key="track.id"
              type="button"
              class="focus-ring-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-colors cursor-ring"
              :class="activeTrackId === track.id
                ? 'bg-gradient-brand text-white border-transparent'
                : 'bg-transparent text-ink border-ink/10 hover:border-ink/25'"
              :aria-pressed="activeTrackId === track.id"
              @click="activeTrackId = track.id"
            >
              <Icon :icon="track.icon" width="16" aria-hidden="true" />
              {{ track.name }}
            </button>
          </div>

          <Motion
            :key="activeTrack.id"
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.25 }"
          >
            <UiCard class="p-8 md:p-10 !bg-paper">
              <div class="flex items-start gap-5">
                <div class="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
                  <Icon :icon="activeTrack.icon" width="24" class="text-white" />
                </div>
                <div>
                  <Heading :level="3" class="mb-2">{{ activeTrack.name }}</Heading>
                  <Body large>{{ activeTrack.copy }}</Body>
                </div>
              </div>
            </UiCard>
          </Motion>
        </div>
      </Container>
    </Section>

    <!-- One continent, one cohort — the network is Dynamerge's product
         the way the mentor is StepUp's. Uses features[2]; see the note
         on the sprint section above for why this reads by index. -->
    <Section class="bg-paper border-y hairline-ink">
      <Container>
        <div class="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto">
          <div>
            <Eyebrow accent class="text-brand-violet mb-4 block">The network</Eyebrow>
            <Heading :level="2" class="mb-6">One continent. One cohort.</Heading>
            <Body large class="mb-6">{{ program.features[2]?.desc }}</Body>
            <div class="inline-flex items-center gap-2 rounded-full bg-brand-violet/10 px-4 py-2 font-mono-african text-xs uppercase tracking-[0.14em] text-brand-violet cursor-pin">
              <Icon icon="lucide:globe-2" width="14" aria-hidden="true" />
              Open to every African country
            </div>
          </div>
          <div class="aspect-[4/3] rounded-2xl overflow-hidden">
            <img
              :src="program.features[2]?.img"
              :alt="program.features[2]?.title"
              width="600" height="400"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </Container>
    </Section>

    <!-- Mentor strip — network-forward and lightweight: mentors dial in
         from everywhere, so they present as a scrolling lineup, not
         StepUp's 1:1 roster. -->
    <Section class="bg-surface">
      <Container>
        <Eyebrow accent class="text-brand-violet mb-4 block">Mentors</Eyebrow>
        <div class="flex flex-wrap items-end justify-between gap-4 mb-10">
          <Heading :level="2" class="max-w-xl">Mentors dial in from everywhere.</Heading>
          <Body class="max-w-sm">{{ program.features[1]?.desc }}</Body>
        </div>

        <!-- cursor-comet on the scroll track itself (hints "drag/scroll to
             explore"); cursor-pin on the institution line specifically,
             since that's the one piece of literal location data per
             card — the more specific descendant rule wins on hover. -->
        <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory cursor-comet">
          <UiCard
            v-for="mentor in program.mentors"
            :key="mentor.name"
            class="p-5 min-w-[260px] snap-start shrink-0 flex items-center gap-4 !bg-paper"
          >
            <img :src="mentor.img" :alt="mentor.name" width="300" height="300" class="w-14 h-14 rounded-full object-cover shrink-0" loading="lazy" />
            <div class="min-w-0">
              <h4 class="font-semibold text-ink m-0 truncate">{{ mentor.name }}</h4>
              <p class="text-sm text-ink/60 m-0 truncate">{{ mentor.title }}</p>
              <p class="font-mono-african text-[11px] uppercase tracking-[0.14em] text-brand-violet mt-1 m-0 truncate cursor-pin">{{ mentor.institution }}</p>
            </div>
          </UiCard>
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

<style scoped>
/* Seamless loop: the track holds two identical copies of the country
   list, so translating exactly -50% lands back on frame one. The global
   prefers-reduced-motion rule in style.css freezes this to a static
   strip. */
.marquee {
  overflow: hidden;
  /* Edge fade instead of a hard clip -- flags/names dissolve in and out
     rather than cutting off mid-glyph at the container edge. */
  -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
  mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
  /* Purely decorative, scrolling text — selecting it as prose makes no
     sense, and without this the browser's default text-select cursor
     (I-beam) shows instead of the custom one (.cursor-dot, applied via
     class in the template — see src/style.css for the shared brand
     cursor system). */
  user-select: none;
}

.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee-scroll 36s linear infinite;
}

.marquee-flag {
  will-change: transform;
  transform-origin: center;
}

/* Hover gradient — each country's name tints toward its own flag colors
   (--c1/--c2, set inline per span) instead of the fixed brand gradient,
   so hovering reads as that country's identity, not a generic accent. */
.marquee-name {
  color: rgba(255, 255, 255, 0.8);
  background-image: linear-gradient(90deg, var(--c1), var(--c2));
  background-size: 100% 100%;
  background-position: center;
  -webkit-background-clip: text;
  background-clip: text;
  transition: color 200ms ease, -webkit-text-fill-color 200ms ease;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.8);
}

.marquee-country:hover .marquee-name,
.marquee-country:focus-within .marquee-name {
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* WCAG 2.2.2 — focus pauses the scroll so a keyboard/AT user can stop it
   and take their time, without requiring OS-level reduced-motion.
   Deliberately keyboard-only, not :hover — a mouse just passing over the
   strip on its way elsewhere shouldn't freeze it. */
.marquee:focus-within .marquee-track {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MoleculeField from './MoleculeField.vue'

const props = defineProps<{ 
  title: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  backgroundImageUrl?: string
}>()

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const heroRef = ref<HTMLElement | null>(null)
const parallaxY = ref(0)
const pointerX = ref(0)
const pointerY = ref(0)

onMounted(() => {
  if (prefersReducedMotion) return
  const onScroll = () => {
    if (!heroRef.value) return
    const rect = heroRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const visible = Math.max(0, Math.min(rect.height, viewportHeight - rect.top))

    // Background parallax
    parallaxY.value = -(rect.top * 0.2)
    heroRef.value.style.setProperty('--parallax-y', `${parallaxY.value}px`)

    // Molecule parallax (lighter movement)
    const moleculeParallax = -(rect.top * 0.08)
    heroRef.value.style.setProperty('--molecule-parallax', `${moleculeParallax}px`)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  const onPointerMove = (e: PointerEvent) => {
    if (!heroRef.value) return
    const rect = heroRef.value.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * 6 // -3..3deg
    const py = ((e.clientY - rect.top) / rect.height - 0.5) * 6
    heroRef.value.style.setProperty('--parallax-rot-x', `${-py}deg`)
    heroRef.value.style.setProperty('--parallax-rot-y', `${px}deg`)
  }
  heroRef.value?.addEventListener('pointermove', onPointerMove, { passive: true })
})
</script>

<template>
  <section class="hero" ref="heroRef">
    <div class="hero-background">
      <!-- background layer only; molecule moved into grid for layout control -->
    </div>
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-text">🧬 Science • Technology • Innovation</span>
        </div>

        <!-- 3-column grid for headline and molecule -->
        <div class="hero-grid">
          <div class="headline-left">
            <span class="headline-text">Nurturing Africa's next</span>
          </div>
          <div class="molecule-container">
            <MoleculeField />
          </div>
          <div class="headline-right">
            <span class="headline-text">generation of scientist‑leaders</span>
          </div>
          <div class="subheading-container">
        <p v-if="subtitle" class="hero-subtitle">{{ subtitle }}</p>
          </div>
        </div>

        <!-- CTAs temporarily removed to spotlight molecule field -->
      </div>
    </div>
  </section>
</template>

<style scoped>
  
.hero {
  position: relative;
  padding: var(--space-24) 0 var(--space-20);
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
  min-height: 80vh;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  will-change: transform;
  transform: translateY(var(--parallax-y, 0px)) rotateX(var(--parallax-rot-x, 0deg)) rotateY(var(--parallax-rot-y, 0deg));
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: left;
  max-width: 1400px;
  margin: 0;
  animation: fadeInUp 1s ease-out;
}

/* soft vignette around content for readability */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(1100px 420px at 50% 30%, rgba(255,255,255,0.28), rgba(255,255,255,0) 70%);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: rgba(255,255,255,0.9);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-glow);
  margin-bottom: var(--space-8);
  backdrop-filter: blur(10px);
}

.badge-text {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-700);
}

/* 3-column grid layout */
.hero-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: auto auto;
  grid-template-areas:
    "headline-left molecule headline-right"
    ". subheading .";
  gap: calc(var(--space-16) / 2);
  align-items: center;
  justify-items: center;
  position: relative;
  min-height: 200px;
}

.headline-left {
  grid-area: headline-left;
  text-align: right;
  justify-self: end;
}

.headline-right {
  grid-area: headline-right;
  text-align: left;
  justify-self: start;
}

.molecule-container {
  grid-area: molecule;
  position: relative;
  width: 420px;
  height: 315px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subheading-container {
  grid-area: subheading;
  text-align: center;
  margin-top: var(--space-4);
}

/* Headline text styling */
.headline-text {
  font-size: var(--text-4xl);
  font-weight: 800;
  line-height: var(--leading-tight);
  background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  display: inline-block;
  position: relative;
}

/* remove extra blur layer behind headline to avoid hazy look */

.hero-subtitle {
  font-size: var(--text-xl);
  color: rgba(255,255,255,0.9);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 500px;
  text-shadow: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */

/* Large desktop: ≥1024px */
@media (min-width: 1024px) {
  .hero {
    min-height: 90vh;
    padding: var(--space-28) 0 var(--space-24);
  }

  .hero-grid {
    gap: var(--space-16);
  }

  .molecule-container {
    width: 520px;
    height: 390px;
  }

  .headline-text {
    font-size: var(--text-5xl);
  }

  .hero-subtitle {
    font-size: var(--text-2xl);
    margin-top: var(--space-6);
  }
}

/* Medium screens: 640px - 1024px */
@media (min-width: 640px) and (max-width: 1023px) {
  .hero {
    min-height: 80vh;
    padding: var(--space-20) 0 var(--space-16);
  }

  .hero-grid {
    gap: var(--space-8);
  }

  .molecule-container {
    width: 380px;
    height: 285px;
  }

  .headline-text {
    font-size: var(--text-4xl);
  }
}

/* Small screens: <640px */
@media (max-width: 639px) {
  .hero {
    padding: var(--space-16) 0 var(--space-12);
    min-height: 70vh;
  }

  .hero-badge {
    margin-bottom: var(--space-6);
  }

  /* Stack layout for mobile */
  .hero-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    text-align: center;
  }

  .headline-left,
  .headline-right {
    text-align: center;
    justify-self: center;
  }

  .molecule-container {
    width: 280px;
    height: 210px;
    order: 2;
  }

  .subheading-container {
    order: 3;
    margin-top: var(--space-2);
  }

  .headline-text {
    font-size: var(--text-3xl);
    display: block;
  }
}

/* Micro-motion: Light parallax scroll for molecule */
@media (min-width: 640px) {
  .molecule-container {
    transform: translateY(var(--molecule-parallax, 0px));
    transition: transform var(--transition-slow);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hero-content {
    animation: none;
  }

  .hero-background {
    transform: none;
  }

  .molecule-container {
    transform: none;
    transition: none;
  }
}
</style>
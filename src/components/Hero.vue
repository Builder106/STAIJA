<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Motion } from 'https://esm.sh/motion-v@1.7.0'
// Use ESM import for lottie-web to keep compatibility across bundlers
// If local dependency exists, this can be changed to: import lottie from 'lottie-web'
import lottie from 'https://esm.sh/lottie-web@5.12.2'
// Import the hero Lottie animation JSON
// Vite supports JSON imports; TS will infer type as any
import heroAnimation from '../assets/hero.json'

const props = defineProps<{ 
  title: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  backgroundImageUrl?: string
}>()

const lottieContainer = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (lottieContainer.value) {
    lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: heroAnimation as unknown as Record<string, unknown>
    })
  }
})
</script>

<template>
  <section class="hero" :style="props.backgroundImageUrl ? { backgroundImage: `linear-gradient(rgba(10,14,23,0.55), rgba(10,14,23,0.55)), url(${props.backgroundImageUrl})` } : {}">
    <div class="container">
      <div class="hero-inner" aria-labelledby="hero-heading">
        <Motion
          :initial="{ opacity: 0, scale: 0.8 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.8, ease: 'easeOut' }"
          class="hero-animation"
          aria-hidden="true"
        >
          <div ref="lottieContainer" class="hero-animation__canvas"></div>
        </Motion>

        <Motion
          :initial="{ opacity: 0, y: 30 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.8, delay: 0.3, ease: 'easeOut' }"
        >
          <h1 id="hero-heading" class="hero-title">{{ props.title || "Nurturing Africa's next generation of scientist‑leaders" }}</h1>
        </Motion>

        <Motion
          v-if="subtitle"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6, delay: 0.5, ease: 'easeOut' }"
        >
          <p class="hero-subtitle">{{ subtitle }}</p>
        </Motion>

        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6, delay: 0.7, ease: 'easeOut' }"
          class="hero-actions"
        >
          <Motion
            :initial="{ opacity: 0, x: -20 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.5, delay: 0.8, ease: 'easeOut' }"
            :whileHover="{ scale: 1.05 }"
            :whileTap="{ scale: 0.95 }"
          >
            <RouterLink class="btn btn-primary" :to="ctaHref || '/apply'">{{ ctaText || 'Apply' }}</RouterLink>
          </Motion>

          <Motion
            :initial="{ opacity: 0, x: 20 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.5, delay: 0.9, ease: 'easeOut' }"
            :whileHover="{ scale: 1.05 }"
            :whileTap="{ scale: 0.95 }"
          >
            <RouterLink class="btn btn-secondary" :to="secondaryCtaHref || '/donate'">{{ secondaryCtaText || 'Donate' }}</RouterLink>
          </Motion>
        </Motion>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  min-height: 92vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--primary-50), var(--secondary-50));
  background-size: cover;
  background-position: center;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-inner {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  text-align: center;
}

.hero-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto var(--space-8);
  max-width: 520px;
}

.hero-animation__canvas {
  width: 100%;
  height: 260px;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--neutral-900);
  margin: 0 0 var(--space-4) 0;
}

.hero-subtitle {
  font-size: clamp(1.0625rem, 2.2vw, 1.375rem);
  color: var(--neutral-700);
  line-height: 1.7;
  margin: 0 auto;
  max-width: 900px;
}

.hero-actions {
  margin-top: var(--space-8);
  display: inline-flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-full);
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--primary-700);
  color: white;
  border-color: var(--primary-800);
}

.btn-primary:hover { background: var(--primary-800); }

.btn-secondary {
  background: white;
  color: var(--primary-800);
  border-color: var(--primary-200);
}

.btn-secondary:hover { background: var(--primary-50); }

.btn:focus-visible {
  outline: 3px solid var(--secondary-400);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .hero { min-height: 95vh; }
  .hero-title { font-size: clamp(3rem, 5.5vw, 4.25rem); }
  .hero-subtitle { font-size: clamp(1.125rem, 1.8vw, 1.5rem); }
}

@media (max-width: 639px) {
  .hero { min-height: 80vh; }
}
</style>
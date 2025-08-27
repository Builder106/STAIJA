<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

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

const defaultBackgroundImage = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'

const backgroundImageStyle = computed(() => {
  const imageUrl = props.backgroundImageUrl || defaultBackgroundImage
  return { backgroundImage: `url(${imageUrl})` }
})

onMounted(() => {
  if (prefersReducedMotion) return
  const onScroll = () => {
    if (!heroRef.value) return
    const rect = heroRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const visible = Math.max(0, Math.min(rect.height, viewportHeight - rect.top))
    parallaxY.value = -(rect.top * 0.2)
    heroRef.value.style.setProperty('--parallax-y', `${parallaxY.value}px`)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
</script>

<template>
  <section class="hero" ref="heroRef">
    <div class="hero-background" :style="backgroundImageStyle">
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
    </div>
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-text">🧬 Science • Technology • Innovation</span>
        </div>
        <h1 class="hero-title">{{ title }}</h1>
        <p v-if="subtitle" class="hero-subtitle">{{ subtitle }}</p>
        <div v-if="ctaText && ctaHref" class="hero-actions">
          <a :href="ctaHref" class="btn btn-primary btn-lg">
            {{ ctaText }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a v-if="secondaryCtaText && secondaryCtaHref" :href="secondaryCtaHref" class="btn btn-outline btn-lg">
            {{ secondaryCtaText }}
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat" v-for="(s, i) in [
            { n: 500, suffix: '+', label: 'Students Mentored' },
            { n: 50, suffix: '+', label: 'Research Projects' },
            { n: 25, suffix: '+', label: 'Partner Organizations' }
          ]" :key="i">
            <div class="stat-number" :data-target="s.n">0</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  
.hero {
  position: relative;
  padding: var(--space-20) 0 var(--space-16);
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  will-change: transform;
  transform: translateY(var(--parallax-y, 0px));
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(234, 88, 12, 0.6));
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  opacity: 0.8;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: left;
  max-width: 900px;
  margin: 0;
  animation: fadeInUp 1s ease-out;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: rgba(255,255,255,0.9);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-glow);
  margin-bottom: var(--space-6);
  backdrop-filter: blur(10px);
}

.badge-text {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-700);
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  line-height: var(--leading-tight);
  color: white;
  margin-bottom: var(--space-6);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: rgba(255,255,255,0.9);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
  max-width: 600px;
  margin-left: 0;
  margin-right: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
  margin-bottom: var(--space-12);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-8);
  max-width: 600px;
  margin: 0;
}

.stat {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-number {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: var(--space-1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.stat-label {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

/* Responsive Design */
@media (min-width: 640px) {
  .hero {
    padding: var(--space-24) 0 var(--space-20);
  }

  .hero-title {
    font-size: var(--text-5xl);
  }

  .hero-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--text-6xl);
  }

  .hero-subtitle {
    font-size: var(--text-2xl);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-content {
    animation: none;
  }

  .hero-background {
    background-attachment: scroll;
  }
}
</style>
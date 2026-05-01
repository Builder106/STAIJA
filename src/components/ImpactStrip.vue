<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'

type Stat = { label: string; value: number; suffix?: string }

const stats: Stat[] = [
  { label: 'Alumni', value: 500, suffix: '+' },
  { label: 'Projects', value: 50, suffix: '+' },
  { label: 'Workshops', value: 120, suffix: '+' },
  { label: 'Partners', value: 25, suffix: '+' }
]

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const rootRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!rootRef.value) return
  const numbers = Array.from(rootRef.value.querySelectorAll<HTMLElement>('[data-target]'))
  const animate = (el: HTMLElement) => {
    const target = Number(el.dataset.target || '0')
    if (prefersReducedMotion || target <= 0) {
      el.textContent = `${target}${el.dataset.suffix || ''}`
      return
    }
    const duration = 1200
    const start = performance.now()
    const step = (t: number) => {
      const progress = Math.min(1, (t - start) / duration)
      const steps = 15;
      const steppedProgress = Math.floor(progress * steps) / steps;
      const eased = 1 - Math.pow(1 - steppedProgress, 3)
      const current = Math.floor(eased * target)
      
      if (el.dataset.current !== String(current)) {
        el.dataset.current = String(current);
        el.style.transform = 'scale(1.1)';
        setTimeout(() => { if (el) el.style.transform = 'scale(1)'; }, 80);
      }

      el.textContent = `${current}${el.dataset.suffix || ''}`
      if (progress < 1) requestAnimationFrame(step)
    }
    el.style.transition = 'transform 80ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    requestAnimationFrame(step)
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        numbers.forEach(animate)
        io.disconnect()
      }
    })
  }, { threshold: 0.3 })
  io.observe(rootRef.value)
})
</script>

<template>
  <section ref="rootRef" class="impact-strip" aria-label="Impact statistics and partners">
    <div class="container">
      <div class="strip">
        <div class="stats">
          <div class="stat" v-for="(s, i) in stats" :key="i">
            <div class="number" :data-target="s.value" :data-suffix="s.suffix">0</div>
            <div class="label">{{ s.label }}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="partners" aria-label="Partner logos">
          <div class="track">
            <div class="partner-logo"><Icon icon="lucide:graduation-cap" class="inline-icon" /> Universities</div>
            <div class="partner-logo"><Icon icon="lucide:microscope" class="inline-icon" /> Research Labs</div>
            <div class="partner-logo"><Icon icon="lucide:building-2" class="inline-icon" /> Tech Companies</div>
            <div class="partner-logo"><Icon icon="lucide:globe" class="inline-icon" /> NGOs</div>
            <div class="partner-logo"><Icon icon="lucide:briefcase" class="inline-icon" /> Foundations</div>
            <div class="partner-logo"><Icon icon="lucide:landmark" class="inline-icon" /> Government</div>
            <div class="partner-logo"><Icon icon="lucide:graduation-cap" class="inline-icon" /> Universities</div>
            <div class="partner-logo"><Icon icon="lucide:microscope" class="inline-icon" /> Research Labs</div>
            <div class="partner-logo"><Icon icon="lucide:building-2" class="inline-icon" /> Tech Companies</div>
            <div class="partner-logo"><Icon icon="lucide:globe" class="inline-icon" /> NGOs</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.impact-strip {
  background: var(--primary-600);
  border-top: 1px solid var(--primary-700);
  border-bottom: 1px solid var(--primary-700);
  position: relative;
  overflow: hidden;
  padding: 0;
}

.impact-strip::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 16px);
  pointer-events: none;
}

.strip {
  display: flex;
  flex-direction: column;
  width: 100%;
}

@media (min-width: 1024px) {
  .strip {
    flex-direction: row;
  }
}

.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-6);
  background: transparent;
  border-right: 1px solid var(--primary-700);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.stat {
  text-align: center;
  min-width: 100px;
}

.number {
  font-size: var(--text-4xl);
  font-weight: 800;
  color: white;
  line-height: 1;
  font-family: monospace;
  margin-bottom: var(--space-1);
}

.label {
  font-size: var(--text-sm);
  color: var(--primary-100);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.partners {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  background: transparent;
  padding: var(--space-4) 0;
}

.track {
  display: flex;
  gap: var(--space-12);
  align-items: center;
  animation: marquee 25s linear infinite;
  white-space: nowrap;
  padding-left: var(--space-8);
}

.partner-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  color: white;
  opacity: 0.9;
  font-size: var(--text-xl);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.inline-icon {
  font-size: var(--text-3xl);
  color: var(--primary-300);
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}


@media (prefers-reduced-motion: reduce) {
  .track { animation: none; }
}
</style>

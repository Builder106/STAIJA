<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(eased * target)
      el.textContent = `${current}${el.dataset.suffix || ''}`
      if (progress < 1) requestAnimationFrame(step)
    }
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
            <div class="partner-logo">🎓 Universities</div>
            <div class="partner-logo">🔬 Research Labs</div>
            <div class="partner-logo">🏢 Tech Companies</div>
            <div class="partner-logo">🌍 NGOs</div>
            <div class="partner-logo">💼 Foundations</div>
            <div class="partner-logo">🏛️ Government</div>
            <div class="partner-logo">🎓 Universities</div>
            <div class="partner-logo">🔬 Research Labs</div>
            <div class="partner-logo">🏢 Tech Companies</div>
            <div class="partner-logo">🌍 NGOs</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.impact-strip {
  background: white;
  border-top: 1px solid var(--neutral-200);
  border-bottom: 1px solid var(--neutral-200);
}

.strip {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6) 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6);
}

.stat {
  text-align: left;
}

.number {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--primary-600);
  letter-spacing: -0.02em;
}

.label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.divider {
  display: none;
}

.partners {
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
}

.track {
  display: flex;
  gap: var(--space-8);
  align-items: center;
  will-change: transform;
  animation: scroll 24s linear infinite;
}

.partner-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--neutral-100);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--neutral-600);
  white-space: nowrap;
  border: 1px solid var(--neutral-200);
  transition: all var(--transition-normal);
}

.partner-logo:hover {
  background: var(--primary-50);
  color: var(--primary-700);
  border-color: var(--primary-200);
  transform: translateY(-2px);
}

@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (min-width: 768px) {
  .strip {
    grid-template-columns: auto 1px 1fr;
    gap: var(--space-8);
    padding: var(--space-8) 0;
  }
  .stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .divider {
    display: block;
    width: 1px;
    height: 56px;
    background: var(--neutral-200);
    justify-self: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .track { animation: none; }
  .partner-logo:hover { transform: none; }
}
</style>



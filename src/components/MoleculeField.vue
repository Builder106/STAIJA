<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

type Props = {
  /** width/height will stretch to parent via CSS; viewBox keeps vector crisp */
  electronColor?: string
  nucleusColor?: string
  connectionColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  electronColor: '#93c5fd',
  nucleusColor: '#ffffff',
  connectionColor: 'rgba(15,21,48,0.28)'
})

const root = ref<SVGSVGElement | null>(null)
let raf = 0
let start = 0
let reduce = false

onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  start = performance.now()
  const step = (t: number) => {
    const elapsed = (t - start) / 1000
    const svg = root.value
    if (svg) {
      const r1 = 42, r2 = 64, r3 = 84
      const a1 = (elapsed * 0.6) % (Math.PI * 2)
      const a2 = (elapsed * 0.45) % (Math.PI * 2)
      const a3 = (elapsed * 0.32) % (Math.PI * 2)
      const cx = 400, cy = 300
      ;(svg.querySelector('#e1') as SVGCircleElement).setAttribute('cx', String(cx + Math.cos(a1) * r1))
      ;(svg.querySelector('#e1') as SVGCircleElement).setAttribute('cy', String(cy + Math.sin(a1) * r1))
      ;(svg.querySelector('#e2') as SVGCircleElement).setAttribute('cx', String(cx + Math.cos(a2) * r2))
      ;(svg.querySelector('#e2') as SVGCircleElement).setAttribute('cy', String(cy + Math.sin(a2) * r2))
      ;(svg.querySelector('#e3') as SVGCircleElement).setAttribute('cx', String(cx + Math.cos(a3) * r3))
      ;(svg.querySelector('#e3') as SVGCircleElement).setAttribute('cy', String(cy + Math.sin(a3) * r3))
    }
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
})

onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf) })
</script>

<template>
  <svg ref="root" class="mol" viewBox="0 0 800 600" aria-hidden="true" focusable="false">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" :stop-color="nucleusColor" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2" />
      </radialGradient>
      <radialGradient id="nucleusHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#93c5fd" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#93c5fd" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Soft nucleus glow to anchor the molecule visually -->
    <circle cx="400" cy="300" r="120" fill="url(#nucleusHalo)" />

    <!-- Background constellation removed for prominence -->

    <!-- Orbits -->
    <g stroke="rgba(59,130,246,0.5)" stroke-width="1.25" fill="none" filter="url(#glow)">
      <ellipse cx="400" cy="300" rx="50" ry="28" />
      <ellipse cx="400" cy="300" rx="72" ry="38" transform="rotate(35 400 300)" />
      <ellipse cx="400" cy="300" rx="96" ry="52" transform="rotate(-28 400 300)" />
    </g>

    <!-- Nucleus -->
    <circle cx="400" cy="300" r="12" fill="url(#nucleusGrad)" filter="url(#glow)" />

    <!-- Electrons (animated via rAF) -->
    <circle id="e1" r="3.6" :fill="electronColor" />
    <circle id="e2" r="3.6" :fill="electronColor" />
    <circle id="e3" r="3.6" :fill="electronColor" />
  </svg>
  
</template>

<style scoped>
.mol {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 1;
  mix-blend-mode: normal;
  pointer-events: none;
  /* No blur/halo */
  filter: none;
}
</style>



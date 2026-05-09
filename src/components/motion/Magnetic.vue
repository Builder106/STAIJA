<script setup lang="ts">
/**
 * Magnetic — wraps a slot in a Motion element that translates toward the
 * cursor while it's within the wrapper's bounds. Spring-smoothed, returns
 * to origin on mouse leave.
 *
 * Reserve for hero / primary CTAs — applying it to every button reads as
 * marketing-site flex.
 *
 * Reduced motion: pass-through (no listeners attached).
 */

import { Motion, useMotionValue, useSpring } from 'motion-v'
import { useReducedMotion } from '../../composables/useReducedMotion'

interface Props {
  /**
   * Pull factor. The translation applied to the inner element is
   * `(cursorOffset * strength)`, so 0.3 means the wrapper drifts 30% of
   * the way toward the cursor.
   */
  strength?: number
}

const { strength = 0.3 } = defineProps<Props>()
const reduce = useReducedMotion()

const x = useMotionValue(0)
const y = useMotionValue(0)
// Spring keeps the chase smooth and gives the gentle settle on mouse-leave.
const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  x.set((e.clientX - cx) * strength)
  y.set((e.clientY - cy) * strength)
}

function onLeave() {
  x.set(0)
  y.set(0)
}
</script>

<template>
  <span v-if="reduce" class="magnetic-host">
    <slot />
  </span>
  <Motion
    v-else
    class="magnetic-host"
    :style="{ x: sx, y: sy }"
    @mousemove="onMove"
    @mouseleave="onLeave"
  >
    <slot />
  </Motion>
</template>

<style scoped>
.magnetic-host {
  display: inline-block;
}
</style>

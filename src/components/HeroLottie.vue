<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import type { AnimationItem } from 'lottie-web'

const props = withDefaults(
  defineProps<{
    loop?: boolean
    autoplay?: boolean
  }>(),
  { loop: true, autoplay: true },
)

const container = ref<HTMLDivElement | null>(null)
let instance: AnimationItem | null = null
// Tracks whether the component unmounted while the dynamic imports were
// still in flight. Without this, we could call loadAnimation on a stale
// DOM node, or worse, attach a player to a detached element that will
// silently leak.
let disposed = false

onMounted(async () => {
  if (!container.value) return
  // Code-split lottie-web (~50 KB gz) and hero.json (~120 KB gz) out of
  // the home-route bundle. Without this, the LCP element (hero <h1>)
  // had to wait for the home chunk to parse before it could paint —
  // and that chunk included both the lottie runtime and a ~384 KB
  // animation JSON, neither of which is needed for the headline.
  // Parallel-import both so the network round-trips overlap.
  const [{ default: lottie }, animationModule] = await Promise.all([
    import('lottie-web'),
    import('../assets/hero.json'),
  ])
  if (disposed || !container.value) return
  instance = lottie.loadAnimation({
    container: container.value,
    renderer: 'svg',
    loop: props.loop,
    autoplay: props.autoplay,
    animationData: animationModule.default as unknown as Record<string, unknown>,
  })
})

onBeforeUnmount(() => {
  disposed = true
  instance?.destroy()
  instance = null
})
</script>

<template>
  <div ref="container" class="w-full h-full" aria-hidden="true" />
</template>

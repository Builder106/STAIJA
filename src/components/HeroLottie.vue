<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import lottie, { type AnimationItem } from 'lottie-web'
import heroAnimation from '../assets/hero.json'

withDefaults(
  defineProps<{
    loop?: boolean
    autoplay?: boolean
  }>(),
  { loop: false, autoplay: true },
)

const container = ref<HTMLDivElement | null>(null)
let instance: AnimationItem | null = null

onMounted(() => {
  if (!container.value) return
  instance = lottie.loadAnimation({
    container: container.value,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    animationData: heroAnimation as unknown as Record<string, unknown>,
  })
})

onBeforeUnmount(() => {
  instance?.destroy()
  instance = null
})
</script>

<template>
  <div ref="container" class="w-full h-full" aria-hidden="true" />
</template>

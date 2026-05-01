<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'gradient'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button' }
)

defineEmits<{ (e: 'click', payload: MouseEvent): void }>()

const base =
  'inline-flex items-center justify-center font-sans text-sm font-semibold transition-all focus-ring-brand disabled:opacity-50 disabled:pointer-events-none'

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand-violet text-white h-11 px-6 rounded-xl hover:-translate-y-[1px] hover:bg-[#9768FF]'
    case 'secondary':
      return 'bg-transparent text-ink border border-ink/10 h-11 px-6 rounded-xl hover:bg-ink/5'
    case 'tertiary':
      return 'bg-transparent text-ink h-auto p-0 underline-offset-2 hover:underline'
    case 'gradient':
      return 'bg-gradient-brand text-white h-11 px-6 rounded-xl hover:-translate-y-[1px] hover:shadow-lg hover:shadow-brand-violet/20'
  }
})

const tag = computed(() => {
  if (props.to !== undefined) return RouterLink
  if (props.href !== undefined) return 'a'
  return 'button'
})
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
    :class="[base, variantClass]"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>

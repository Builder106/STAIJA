<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { SUPPORTED_LOCALES, setLocale, type LocaleCode } from '../i18n'

const { locale } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const current = computed(() =>
  SUPPORTED_LOCALES.find((l) => l.code === locale.value) ?? SUPPORTED_LOCALES[0],
)

function pick(code: LocaleCode) {
  setLocale(code)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!root.value) return
  if (e.target instanceof Node && !root.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', onClickOutside)
  }
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', onClickOutside)
  }
})
</script>

<template>
  <div ref="root" class="relative inline-block">
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-paper/10 text-sm font-semibold text-paper/80 hover:text-paper hover:border-paper/20 transition-colors focus-ring-brand"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <Icon icon="lucide:globe" width="16" />
      {{ current.nativeLabel }}
      <Icon
        icon="lucide:chevron-down"
        width="14"
        class="transition-transform"
        :class="open && 'rotate-180'"
      />
    </button>
    <ul
      v-if="open"
      role="listbox"
      class="absolute right-0 bottom-full mb-2 min-w-[160px] bg-ink border border-paper/10 rounded-xl shadow-xl py-1 z-50"
    >
      <li v-for="loc in SUPPORTED_LOCALES" :key="loc.code">
        <button
          type="button"
          role="option"
          :aria-selected="loc.code === current.code"
          class="w-full text-left px-4 py-2 text-sm font-medium text-paper/80 hover:bg-paper/5 hover:text-paper transition-colors flex items-center justify-between"
          @click="pick(loc.code)"
        >
          <span>{{ loc.nativeLabel }}</span>
          <Icon
            v-if="loc.code === current.code"
            icon="lucide:check"
            width="14"
            class="text-brand-violet"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

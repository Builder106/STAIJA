<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { compressFile, formatBytes } from '../../services/fileCompression'

const props = withDefaults(
  defineProps<{
    label?: string
    accept?: string
    maxSizeBytes?: number
    /** Disable client-side image compression — useful for non-image documents that should pass through unchanged. */
    skipCompress?: boolean
  }>(),
  {
    label: 'Upload file',
    accept: 'image/*,application/pdf',
    maxSizeBytes: 2_000_000,
    skipCompress: false,
  },
)

const emit = defineEmits<{
  (e: 'update:file', file: File | null): void
  (e: 'error', message: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selected = ref<File | null>(null)
const compressing = ref(false)
const compressionInfo = ref<{ original: number; output: number; compressed: boolean } | null>(null)

const isImage = computed(() => selected.value?.type.startsWith('image/') ?? false)

async function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.files?.[0]
  if (!raw) return

  if (props.skipCompress || !raw.type.startsWith('image/')) {
    if (raw.size > props.maxSizeBytes) {
      emit(
        'error',
        `${raw.name} is ${formatBytes(raw.size)} — bigger than the ${formatBytes(props.maxSizeBytes)} limit. Compress it externally and try again.`,
      )
      input.value = ''
      return
    }
    selected.value = raw
    compressionInfo.value = null
    emit('update:file', raw)
    return
  }

  compressing.value = true
  try {
    const result = await compressFile(raw, { maxSizeBytes: props.maxSizeBytes })
    if (result.outputBytes > props.maxSizeBytes) {
      emit(
        'error',
        `Couldn't shrink ${raw.name} below ${formatBytes(props.maxSizeBytes)} — current ${formatBytes(result.outputBytes)}. Try a smaller / lower-resolution photo.`,
      )
      input.value = ''
      return
    }
    selected.value = result.file
    compressionInfo.value = {
      original: result.originalBytes,
      output: result.outputBytes,
      compressed: result.compressed,
    }
    emit('update:file', result.file)
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'File processing failed')
    input.value = ''
  } finally {
    compressing.value = false
  }
}

function clear() {
  selected.value = null
  compressionInfo.value = null
  if (fileInput.value) fileInput.value.value = ''
  emit('update:file', null)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-semibold text-ink/80">{{ label }}</label>

    <div
      v-if="!selected"
      class="flex items-center justify-center gap-3 border-2 border-dashed hairline-ink rounded-xl px-6 py-8 cursor-pointer hover:border-brand-violet/40 hover:bg-brand-violet/5 transition-colors"
      @click="fileInput?.click()"
    >
      <Icon icon="lucide:upload-cloud" width="24" class="text-ink/40" />
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-ink">{{ compressing ? 'Compressing…' : 'Choose a file' }}</span>
        <span class="text-xs text-ink/50">Up to {{ formatBytes(maxSizeBytes) }} · {{ accept }}</span>
      </div>
    </div>

    <div
      v-else
      class="flex items-center gap-3 border hairline-ink rounded-xl px-4 py-3 bg-white"
    >
      <Icon
        :icon="isImage ? 'lucide:image' : 'lucide:file-text'"
        width="20"
        class="text-brand-violet shrink-0"
      />
      <div class="flex flex-col flex-1 min-w-0">
        <span class="text-sm font-semibold text-ink truncate">{{ selected.name }}</span>
        <span v-if="compressionInfo?.compressed" class="text-xs text-ink/50">
          Compressed from {{ formatBytes(compressionInfo.original) }} →
          {{ formatBytes(compressionInfo.output) }}
        </span>
        <span v-else class="text-xs text-ink/50">
          {{ formatBytes(selected.size) }}
        </span>
      </div>
      <button
        type="button"
        class="text-sm font-semibold text-ink/60 hover:text-brand-violet focus-ring-brand rounded-sm"
        @click="clear"
      >
        Remove
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="sr-only"
      :accept="accept"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import UiButton from './UiButton.vue'

// In-browser audio recorder. Caps recording length, exposes a Blob via
// `update:blob` and the achieved duration via `update:durationSec`.
// Always optional from the consumer's perspective — null Blob means the
// applicant chose not to record.

interface Props {
  maxSeconds?: number
  /** One-line prompt rendered above the controls (e.g. "Prefer to talk it out?"). */
  prompt?: string
}
const props = withDefaults(defineProps<Props>(), { maxSeconds: 90 })

export interface RecordedAudio { blob: Blob; durationSec: number }
const emit = defineEmits<{
  (e: 'update:audio', value: RecordedAudio | null): void
}>()

type State = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'
const state = ref<State>('idle')
const error = ref<string | null>(null)
const elapsed = ref(0)
const audioUrl = ref<string | null>(null)

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: Blob[] = []
let timer: ReturnType<typeof setInterval> | null = null

function format(sec: number) {
  const m = Math.floor(sec / 60).toString()
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function teardownStream() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function start() {
  error.value = null
  // If we're re-recording, clear the previous capture first.
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
  }
  emit('update:audio', null)
  elapsed.value = 0
  state.value = 'requesting'
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      const mime = recorder?.mimeType || 'audio/webm'
      const blob = new Blob(chunks, { type: mime })
      audioUrl.value = URL.createObjectURL(blob)
      state.value = 'recorded'
      emit('update:audio', { blob, durationSec: elapsed.value })
      teardownStream()
    }
    recorder.start()
    state.value = 'recording'
    timer = setInterval(() => {
      elapsed.value += 1
      if (elapsed.value >= props.maxSeconds) stop()
    }, 1000)
  } catch (err) {
    teardownStream()
    state.value = 'error'
    const msg = err instanceof Error ? err.message : ''
    error.value = msg.includes('Permission')
      ? 'Microphone access was blocked. You can keep going with just the written answer.'
      : "Couldn't start the recording. You can keep going with just the written answer."
  }
}

function stop() {
  clearTimer()
  if (recorder && recorder.state !== 'inactive') recorder.stop()
}

function clear() {
  clearTimer()
  if (recorder && recorder.state !== 'inactive') recorder.stop()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = null
  elapsed.value = 0
  chunks = []
  state.value = 'idle'
  teardownStream()
  emit('update:audio', null)
}

onBeforeUnmount(() => {
  clearTimer()
  if (recorder && recorder.state !== 'inactive') recorder.stop()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  teardownStream()
})
</script>

<template>
  <div class="rounded-lg border hairline-ink bg-paper/50 px-3 py-3 flex flex-col gap-3">
    <div class="flex items-center gap-2 text-xs font-semibold text-ink/70">
      <Icon icon="lucide:mic" width="14" class="text-brand-violet" />
      <span class="uppercase tracking-wide">Audio response</span>
      <span class="font-normal text-ink/50 normal-case">· optional · up to {{ maxSeconds }}s</span>
    </div>
    <p v-if="prompt" class="text-xs text-ink/65 m-0 leading-relaxed">{{ prompt }}</p>

    <div v-if="state === 'idle' || state === 'requesting'" class="flex items-center gap-2">
      <UiButton variant="secondary" :disabled="state === 'requesting'" @click="start">
        <span class="flex items-center gap-2">
          <Icon icon="lucide:mic" width="14" />
          {{ state === 'requesting' ? 'Allow microphone…' : 'Start recording' }}
        </span>
      </UiButton>
    </div>

    <div v-else-if="state === 'recording'" class="flex items-center gap-3">
      <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
      <span class="font-mono text-xs tabular-nums text-ink shrink-0">
        {{ format(elapsed) }} / {{ format(maxSeconds) }}
      </span>
      <div class="flex-1 h-1.5 bg-ink/[0.06] rounded-full overflow-hidden">
        <div
          class="h-full bg-rose-500 transition-all"
          :style="{ width: (elapsed / maxSeconds * 100) + '%' }"
        />
      </div>
      <UiButton variant="primary" @click="stop">
        <span class="flex items-center gap-2">
          <Icon icon="lucide:square" width="14" />
          Stop
        </span>
      </UiButton>
    </div>

    <div v-else-if="state === 'recorded'" class="flex flex-col gap-2">
      <audio v-if="audioUrl" :src="audioUrl" controls class="w-full" />
      <div class="flex items-center gap-3 text-xs">
        <button
          type="button"
          class="text-ink/60 hover:text-brand-violet underline-offset-2 hover:underline"
          @click="start"
        >
          <span class="inline-flex items-center gap-1">
            <Icon icon="lucide:rotate-ccw" width="12" />
            Re-record
          </span>
        </button>
        <button
          type="button"
          class="text-ink/60 hover:text-rose-700 underline-offset-2 hover:underline"
          @click="clear"
        >
          <span class="inline-flex items-center gap-1">
            <Icon icon="lucide:trash-2" width="12" />
            Remove
          </span>
        </button>
        <span class="ml-auto text-ink/50">Recorded {{ format(elapsed) }}</span>
      </div>
    </div>

    <p v-if="error" role="alert" class="text-xs text-rose-700 m-0">{{ error }}</p>
  </div>
</template>

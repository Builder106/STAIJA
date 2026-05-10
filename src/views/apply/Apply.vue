<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import FileUpload from '../../components/ui/FileUpload.vue'
import AudioRecorder from '../../components/ui/AudioRecorder.vue'
import { useAuth } from '../../composables/useAuth'
import { useAutoSave } from '../../composables/useAutoSave'
import { DatabaseService } from '../../services/database'
import { StorageService } from '../../services/storageService'
import { trackApplyClick } from '../../services/analytics'
import { getProgram, type FieldDef, type ProgramSchema } from './programs'

const route = useRoute()
const router = useRouter()
const { user, displayName } = useAuth()

// --- Resolve program from route ----------------------------------------

const program = computed<ProgramSchema | null>(() => {
  const slug = route.params.program as string
  return getProgram(slug)
})

// --- Form state -------------------------------------------------------

interface ReferenceEntry {
  name: string
  email: string
  institution: string
  relationship: string
}

const eligibility = ref<Record<string, boolean>>({})
const fields = ref<Record<string, unknown>>({})
const references = ref<ReferenceEntry[]>([
  { name: '', email: '', institution: '', relationship: '' },
  { name: '', email: '', institution: '', relationship: '' },
])
const transcriptFile = ref<File | null>(null)
const idFile = ref<File | null>(null)
const fileUploadError = ref<string | null>(null)

// Optional audio answers, keyed by field name. The recorder is fully
// off-by-default — empty here means the applicant didn't record one,
// which is fine: the written field stays canonical and required.
const audioByField = ref<Record<string, { blob: Blob; durationSec: number }>>({})
function setAudio(name: string, value: { blob: Blob; durationSec: number } | null) {
  if (value) audioByField.value[name] = value
  else delete audioByField.value[name]
}

const stepIndex = ref(0)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submittedId = ref<string | null>(null)

// --- Auto-save: keyed per-program ------------------------------------

const formStateForSave = computed(() => ({
  eligibility: eligibility.value,
  fields: fields.value,
  references: references.value,
  // Files are NOT persisted — File objects don't serialize and
  // re-uploads would be cheap to redo.
}))
// We need a Ref for useAutoSave. Wrap the computed in a ref proxy.
const persistedRef = ref(formStateForSave.value) as Ref<typeof formStateForSave.value>
watch(formStateForSave, (v) => { persistedRef.value = v }, { deep: true })

const autoSave = ref<ReturnType<typeof useAutoSave> | null>(null)
function initAutoSave() {
  if (!program.value || autoSave.value) return
  autoSave.value = useAutoSave(`apply.${program.value.slug}`, persistedRef)
  // After restore, hydrate the form state from the ref.
  watch(persistedRef, (v) => {
    if (autoSave.value?.restored) {
      eligibility.value = v.eligibility ?? {}
      fields.value = v.fields ?? {}
      references.value = v.references ?? references.value
    }
  }, { immediate: true })
}

// --- Steps -----------------------------------------------------------

interface StepMeta {
  id: string
  label: string
}
const stepsMeta = computed<StepMeta[]>(() => {
  if (!program.value) return []
  return [
    { id: 'eligibility', label: 'Eligibility' },
    ...program.value.steps.map((s) => ({ id: s.id, label: s.label })),
    { id: 'references', label: 'References' },
    { id: 'files', label: 'Files' },
    { id: 'review', label: 'Review' },
  ]
})

const currentStep = computed(() => stepsMeta.value[stepIndex.value])

// --- Validation per step --------------------------------------------

function validateField(field: FieldDef): string | null {
  const v = fields.value[field.name]
  if (field.required) {
    if (v === undefined || v === null) return `${field.label} is required.`
    if (typeof v === 'string' && v.trim() === '') return `${field.label} is required.`
    if (Array.isArray(v) && v.length === 0) return `${field.label} is required.`
  }
  if (field.type === 'tags' && Array.isArray(v)) {
    if (field.minTags && v.length < field.minTags) return `Add at least ${field.minTags} ${field.label.toLowerCase()}.`
    if (field.maxTags && v.length > field.maxTags) return `${field.label} is capped at ${field.maxTags}.`
  }
  return null
}

function validateCurrentStep(): string | null {
  if (!program.value) return 'Program not found.'
  const step = currentStep.value
  if (!step) return null

  if (step.id === 'eligibility') {
    for (const e of program.value.eligibility) {
      if (e.required && !eligibility.value[e.id]) {
        return 'Confirm each eligibility item — these are hard requirements for the program.'
      }
    }
    return null
  }

  if (step.id === 'references') {
    const required = program.value.referenceCount.min
    for (let i = 0; i < required; i++) {
      const r = references.value[i]
      if (!r) return `Reference ${i + 1} is required.`
      if (!r.name || !r.email || !r.institution || !r.relationship) {
        return `Reference ${i + 1}: fill all fields (name, email, institution, relationship).`
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
        return `Reference ${i + 1}: please use a valid email so we can reach them.`
      }
    }
    return null
  }

  if (step.id === 'files' || step.id === 'review') {
    return null // optional files; review step has its own checks
  }

  // Schema-driven step
  const schemaStep = program.value.steps.find((s) => s.id === step.id)
  if (!schemaStep) return null
  for (const f of schemaStep.fields) {
    const err = validateField(f)
    if (err) return err
  }
  return null
}

const stepError = ref<string | null>(null)

// Transient flash shown briefly after a successful "Continue" — the one
// celebratory beat per save we allow ourselves. Cleared by a timeout so
// it never lingers across step changes.
const justCompletedLabel = ref<string | null>(null)
let justCompletedTimer: ReturnType<typeof setTimeout> | null = null

function next() {
  stepError.value = validateCurrentStep()
  if (stepError.value) return
  const completed = currentStep.value?.label ?? null
  stepIndex.value = Math.min(stepIndex.value + 1, stepsMeta.value.length - 1)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (completed) {
    justCompletedLabel.value = completed
    if (justCompletedTimer) clearTimeout(justCompletedTimer)
    justCompletedTimer = setTimeout(() => { justCompletedLabel.value = null }, 2400)
  }
}

function back() {
  stepError.value = null
  stepIndex.value = Math.max(stepIndex.value - 1, 0)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// --- Reference list manipulation ------------------------------------

function addReference() {
  if (!program.value) return
  if (references.value.length >= program.value.referenceCount.max) return
  references.value.push({ name: '', email: '', institution: '', relationship: '' })
}
function removeReference(i: number) {
  if (!program.value) return
  if (references.value.length <= program.value.referenceCount.min) return
  references.value.splice(i, 1)
}

// --- Submit ----------------------------------------------------------

async function handleSubmit() {
  if (!program.value || !user.value) return
  // Final validation across all schema steps
  for (let i = 0; i < stepsMeta.value.length; i++) {
    stepIndex.value = i
    const err = validateCurrentStep()
    if (err) {
      stepError.value = err
      return
    }
  }
  stepError.value = null

  submitting.value = true
  submitError.value = null
  try {
    const f = fields.value as Record<string, unknown>
    const personalInfo = {
      firstName: (f.firstName as string) ?? '',
      lastName: (f.lastName as string) ?? '',
      email: (f.email as string) ?? user.value.email ?? '',
      phone: (f.phone as string) ?? '',
      dateOfBirth: (f.dateOfBirth as string) ?? '',
      nationality: (f.nationality as string) ?? '',
      currentInstitution: (f.currentInstitution as string) ?? '',
      currentLevel: (f.currentLevel as string) ?? '',
      // program-specific personal extras
      state: f.state,
      country: f.country,
      timezone: f.timezone,
      internetSelfReport: f.internetSelfReport,
    }
    const academicInfo = {
      gpa: (f.gpa as string) ?? '',
      major: (f.major as string) ?? '',
      graduationYear: f.graduationYear ? String(f.graduationYear) : '',
      relevantCourses: (f.relevantCourses as string[]) ?? [],
    }

    const applicationId = await DatabaseService.createApplication({
      userId: user.value.uid,
      program: program.value.programKey,
      status: 'submitted',
      personalInfo,
      academicInfo,
      researchInterests: (f.researchInterests as string[]) ?? [],
      motivation: (f.motivation as string) ?? '',
      experience: (f.experience as string) ?? '',
      references: references.value,
      submittedAt: new Date(),
    } as Parameters<typeof DatabaseService.createApplication>[0])

    // Upload files (post-create so we have the application id)
    const uploads: Promise<unknown>[] = []
    if (transcriptFile.value) {
      uploads.push(
        StorageService.uploadFile(
          transcriptFile.value,
          `applications/${user.value.uid}/${applicationId}/transcript-${transcriptFile.value.name}`,
        ),
      )
    }
    if (idFile.value) {
      uploads.push(
        StorageService.uploadFile(
          idFile.value,
          `applications/${user.value.uid}/${applicationId}/id-${idFile.value.name}`,
        ),
      )
    }
    // Optional audio answers — one file per field that has audioOptional set.
    // Convention-based naming so admin review can find them by prefix, same
    // as transcript/ID. We pick a small filename ext from the recorded MIME.
    for (const [fieldName, audio] of Object.entries(audioByField.value)) {
      const mime = audio.blob.type || 'audio/webm'
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      const filename = `audio-${fieldName}-${audio.durationSec}s.${ext}`
      const file = new File([audio.blob], filename, { type: mime })
      uploads.push(
        StorageService.uploadFile(
          file,
          `applications/${user.value.uid}/${applicationId}/${filename}`,
        ),
      )
    }
    if (uploads.length > 0) {
      await Promise.all(uploads)
    }

    autoSave.value?.clear()
    submittedId.value = applicationId
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Submission failed. Try again.'
  } finally {
    submitting.value = false
  }
}

// --- Auth gate -------------------------------------------------------

onMounted(() => {
  if (!program.value) return
  if (!user.value) {
    router.replace({ path: '/signup', query: { redirect: route.fullPath } })
    return
  }
  initAutoSave()
  trackApplyClick({
    program: program.value.programKey === 'stepup_scholars' ? 'stepup' : 'dynamerge',
    source: 'apply_route',
  })
  // Pre-fill email from auth profile
  if (user.value.email && !fields.value.email) {
    fields.value.email = user.value.email
  }
  if (displayName.value && !fields.value.firstName) {
    const parts = displayName.value.split(' ')
    fields.value.firstName = parts[0] ?? ''
    fields.value.lastName = parts.slice(1).join(' ') ?? ''
  }
})

watch(user, (u) => {
  if (!u && program.value) {
    router.replace({ path: '/signup', query: { redirect: route.fullPath } })
  }
})

// --- Field helpers for tags input -----------------------------------

function tagsValue(name: string): string {
  const v = fields.value[name]
  return Array.isArray(v) ? v.join(', ') : ''
}
function setTagsValue(name: string, value: string) {
  fields.value[name] = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section v-if="!program" class="!py-24 text-center">
      <Container class="max-w-xl flex flex-col items-center gap-6">
        <Heading :level="2">Program not found.</Heading>
        <Body>The link you followed doesn't match a program we run right now.</Body>
        <UiButton variant="primary" :to="'/'">Back to home</UiButton>
      </Container>
    </Section>

    <Section v-else-if="submittedId" class="!py-24 text-center">
      <Container class="max-w-xl flex flex-col items-center gap-6">
        <div class="w-20 h-20 bg-brand-violet/10 text-brand-violet rounded-full flex items-center justify-center">
          <Icon icon="lucide:check-circle-2" width="40" />
        </div>
        <Heading :level="1">Application submitted.</Heading>
        <Body large class="text-ink/70">
          Thanks for applying to <strong>{{ program.name }}</strong>. We've sent a
          confirmation to your email and a separate invite to each of your
          references. Application reference:
          <span class="font-mono text-sm bg-ink/5 px-2 py-1 rounded">{{ submittedId }}</span>
        </Body>
        <div class="flex flex-wrap gap-3 mt-2">
          <UiButton variant="primary" :to="`/applicant/applications/${submittedId}`">
            View application status
          </UiButton>
          <UiButton variant="secondary" :to="'/'">Back to home</UiButton>
        </div>
      </Container>
    </Section>

    <template v-else>
    <!-- Header band -->
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container class="max-w-3xl">
        <Eyebrow class="text-brand-violet mb-3 block">Apply · {{ program.scope }}</Eyebrow>
        <Heading :level="1" class="mb-3">
          {{ program.name }}
        </Heading>
        <Body class="text-ink/70 mb-8">
          {{ program.ageRange }}. Plan to spend ~15 minutes. Your progress
          auto-saves on this device — you can pick up where you left off.
        </Body>

        <!-- Step progress -->
        <ol class="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          <li
            v-for="(step, i) in stepsMeta"
            :key="step.id"
            class="flex items-center gap-2 shrink-0"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors"
              :class="i < stepIndex
                ? 'bg-brand-violet text-white border-brand-violet'
                : i === stepIndex
                ? 'bg-surface text-brand-violet border-brand-violet'
                : 'bg-surface text-ink/40 border-ink/15'"
            >
              <Icon v-if="i < stepIndex" icon="lucide:check" width="14" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-xs font-semibold whitespace-nowrap"
              :class="i === stepIndex ? 'text-brand-violet' : 'text-ink/50'"
            >
              {{ step.label }}
            </span>
            <Icon v-if="i < stepsMeta.length - 1" icon="lucide:chevron-right" width="14" class="text-ink/30 mx-1" />
          </li>
        </ol>
      </Container>
    </Section>

    <Section class="!py-12">
      <Container class="max-w-3xl">
        <UiCard class="p-6 md:p-10 bg-surface">
          <Motion
            :key="currentStep.id"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.2 }"
          >
            <!-- Eligibility -->
            <div v-if="currentStep.id === 'eligibility'" class="flex flex-col gap-6">
              <div>
                <Heading :level="2" class="!text-2xl mb-2">Quick eligibility check</Heading>
                <Body class="text-ink/70">Confirm each item to continue. We don't disqualify silently.</Body>
              </div>
              <div class="flex flex-col gap-3">
                <label
                  v-for="e in program.eligibility"
                  :key="e.id"
                  class="flex items-start gap-3 p-4 border hairline-ink rounded-xl bg-paper/50 hover:bg-paper transition-colors cursor-pointer"
                >
                  <input
                    v-model="eligibility[e.id]"
                    type="checkbox"
                    class="mt-1 h-4 w-4 accent-brand-violet"
                  />
                  <span class="text-sm text-ink/80 leading-relaxed">{{ e.label }}</span>
                </label>
              </div>
            </div>

            <!-- Schema-driven steps -->
            <div v-else-if="currentStep.id !== 'references' && currentStep.id !== 'files' && currentStep.id !== 'review'">
              <template v-for="schemaStep in [program.steps.find((s) => s.id === currentStep.id)]" :key="schemaStep?.id">
                <div v-if="schemaStep" class="flex flex-col gap-6">
                  <div>
                    <Heading :level="2" class="!text-2xl mb-2">
                      {{ schemaStep.headline ?? schemaStep.label }}
                    </Heading>
                    <Body v-if="schemaStep.description" class="text-ink/70">{{ schemaStep.description }}</Body>
                  </div>
                  <div class="grid sm:grid-cols-2 gap-5">
                    <div
                      v-for="field in schemaStep.fields"
                      :key="field.name"
                      class="flex flex-col gap-2"
                      :class="field.type === 'textarea' || field.type === 'tags' ? 'sm:col-span-2' : ''"
                    >
                      <label class="text-sm font-semibold text-ink/80">
                        {{ field.label }}
                        <span v-if="field.required" class="text-brand-violet">*</span>
                      </label>
                      <textarea
                        v-if="field.type === 'textarea'"
                        v-model="(fields[field.name] as string)"
                        :rows="field.rows ?? 4"
                        :placeholder="field.placeholder"
                        :required="field.required"
                        class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface resize-y"
                      />
                      <input
                        v-else-if="field.type === 'tags'"
                        :value="tagsValue(field.name)"
                        :placeholder="field.placeholder ?? 'Comma-separated'"
                        class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface"
                        @input="(e) => setTagsValue(field.name, (e.target as HTMLInputElement).value)"
                      />
                      <select
                        v-else-if="field.type === 'select'"
                        v-model="fields[field.name]"
                        :required="field.required"
                        class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface"
                      >
                        <option value="">Choose…</option>
                        <option v-for="o in field.options" :key="o" :value="o">{{ o }}</option>
                      </select>
                      <input
                        v-else
                        v-model="fields[field.name]"
                        :type="field.type === 'number' ? 'number' : field.type"
                        :placeholder="field.placeholder"
                        :required="field.required"
                        class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface"
                      />
                      <p v-if="field.helpText" class="text-xs text-ink/50 m-0">{{ field.helpText }}</p>
                      <details v-if="field.helpExample" class="group rounded-lg border hairline-ink bg-paper/50 px-3 py-2">
                        <summary class="cursor-pointer text-xs font-semibold text-brand-violet inline-flex items-center gap-1.5 select-none">
                          <Icon icon="lucide:sparkles" width="12" />
                          See an example response
                          <Icon icon="lucide:chevron-down" width="12" class="ml-auto transition-transform group-open:rotate-180" />
                        </summary>
                        <blockquote class="mt-2 text-xs text-ink/75 leading-relaxed border-l-2 border-brand-violet/40 pl-3 italic">
                          {{ field.helpExample.body }}
                        </blockquote>
                        <p class="mt-1.5 text-[11px] text-ink/50 not-italic">{{ field.helpExample.author }}</p>
                      </details>
                      <AudioRecorder
                        v-if="field.audioOptional"
                        :max-seconds="field.audioOptional.maxSeconds"
                        :prompt="field.audioOptional.prompt"
                        @update:audio="(v) => setAudio(field.name, v)"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- References -->
            <div v-else-if="currentStep.id === 'references'" class="flex flex-col gap-6">
              <div>
                <Heading :level="2" class="!text-2xl mb-2">References</Heading>
                <Body class="text-ink/70">
                  We'll email each reference a private link to upload their letter directly —
                  you don't have to chase them. Provide
                  {{ program.referenceCount.min }} required
                  <template v-if="program.referenceCount.max > program.referenceCount.min">
                    (up to {{ program.referenceCount.max }})
                  </template>.
                </Body>
              </div>
              <div class="flex flex-col gap-6">
                <div
                  v-for="(ref_, i) in references"
                  :key="i"
                  class="border hairline-ink rounded-xl p-5 bg-paper/50 flex flex-col gap-4"
                >
                  <div class="flex justify-between items-center">
                    <h3 class="font-display text-lg font-semibold m-0">Reference {{ i + 1 }}</h3>
                    <button
                      v-if="i >= program.referenceCount.min"
                      type="button"
                      class="text-sm font-semibold text-ink/60 hover:text-brand-violet transition-colors"
                      @click="removeReference(i)"
                    >
                      Remove
                    </button>
                  </div>
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-ink/70">Name <span class="text-brand-violet">*</span></label>
                      <input
                        v-model="ref_.name"
                        type="text"
                        required
                        class="border hairline-ink rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet"
                      />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-ink/70">Email <span class="text-brand-violet">*</span></label>
                      <input
                        v-model="ref_.email"
                        type="email"
                        required
                        class="border hairline-ink rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet"
                      />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-ink/70">Institution <span class="text-brand-violet">*</span></label>
                      <input
                        v-model="ref_.institution"
                        type="text"
                        required
                        class="border hairline-ink rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet"
                      />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-ink/70">Relationship <span class="text-brand-violet">*</span></label>
                      <input
                        v-model="ref_.relationship"
                        type="text"
                        placeholder="e.g. Physics teacher"
                        required
                        class="border hairline-ink rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet"
                      />
                    </div>
                  </div>
                </div>
                <button
                  v-if="references.length < program.referenceCount.max"
                  type="button"
                  class="self-start text-sm font-semibold text-brand-violet hover:underline underline-offset-2"
                  @click="addReference"
                >
                  + Add another reference
                </button>
              </div>
            </div>

            <!-- Files -->
            <div v-else-if="currentStep.id === 'files'" class="flex flex-col gap-6">
              <div>
                <Heading :level="2" class="!text-2xl mb-2">Documents</Heading>
                <Body class="text-ink/70">
                  Optional but strongly encouraged. Photos of physical
                  documents are fine — we'll compress them client-side
                  before upload.
                </Body>
              </div>
              <FileUpload
                label="Transcript or grade report"
                accept="image/*,application/pdf"
                @update:file="(f) => transcriptFile = f"
                @error="(m) => fileUploadError = m"
              />
              <FileUpload
                label="Government or school ID"
                accept="image/*,application/pdf"
                @update:file="(f) => idFile = f"
                @error="(m) => fileUploadError = m"
              />
              <p v-if="fileUploadError" role="alert" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 m-0">
                {{ fileUploadError }}
              </p>
            </div>

            <!-- Review -->
            <div v-else-if="currentStep.id === 'review'" class="flex flex-col gap-6">
              <div>
                <Heading :level="2" class="!text-2xl mb-2">Review and submit</Heading>
                <Body class="text-ink/70">
                  One last look. After submit, you'll get an email
                  confirmation and your references will be invited
                  separately.
                </Body>
              </div>

              <div class="border hairline-ink rounded-xl p-5 bg-paper/50 text-sm flex flex-col gap-3">
                <div class="font-semibold text-ink">Program</div>
                <div class="text-ink/70">{{ program.name }} · {{ program.scope }}</div>
              </div>

              <div class="border hairline-ink rounded-xl p-5 bg-paper/50 text-sm flex flex-col gap-1">
                <div class="font-semibold text-ink mb-2">Personal</div>
                <div class="text-ink/70">{{ fields.firstName }} {{ fields.lastName }}</div>
                <div class="text-ink/70">{{ fields.email }}</div>
                <div class="text-ink/70">{{ fields.phone }}</div>
              </div>

              <div class="border hairline-ink rounded-xl p-5 bg-paper/50 text-sm flex flex-col gap-1">
                <div class="font-semibold text-ink mb-2">References</div>
                <div v-for="(r, i) in references" :key="i" class="text-ink/70">
                  {{ i + 1 }}. {{ r.name || '(missing)' }} — {{ r.email || '(missing)' }}
                </div>
              </div>

              <div class="border hairline-ink rounded-xl p-5 bg-paper/50 text-sm flex flex-col gap-1">
                <div class="font-semibold text-ink mb-2">Files</div>
                <div class="text-ink/70">Transcript: {{ transcriptFile?.name ?? 'not attached' }}</div>
                <div class="text-ink/70">ID: {{ idFile?.name ?? 'not attached' }}</div>
              </div>

              <p v-if="submitError" role="alert" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 m-0">
                {{ submitError }}
              </p>
            </div>
          </Motion>

          <p v-if="stepError" role="alert" class="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 m-0">
            {{ stepError }}
          </p>

          <!-- Step nav -->
          <div class="mt-8 pt-6 border-t hairline-ink flex items-center justify-between gap-3">
            <UiButton variant="secondary" :disabled="stepIndex === 0" @click="back">
              <span class="flex items-center gap-2">
                <Icon icon="lucide:arrow-left" width="16" />
                Back
              </span>
            </UiButton>
            <Motion
              v-if="justCompletedLabel"
              :initial="{ opacity: 0, y: 4 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0 }"
              :transition="{ duration: 0.25 }"
              class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2.5 py-1"
            >
              <Icon icon="lucide:check" width="12" />
              {{ justCompletedLabel }} saved
            </Motion>
            <span
              v-else-if="autoSave?.lastSavedAt"
              class="text-xs text-ink/50 hidden sm:inline"
            >
              Draft saved · {{ autoSave.lastSavedAt.toLocaleTimeString() }}
            </span>
            <UiButton
              v-if="currentStep?.id !== 'review'"
              variant="gradient"
              @click="next"
            >
              <span class="flex items-center gap-2">
                Continue
                <Icon icon="lucide:arrow-right" width="16" />
              </span>
            </UiButton>
            <UiButton
              v-else
              variant="gradient"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <span v-if="submitting">Submitting…</span>
              <span v-else class="flex items-center gap-2">
                Submit application
                <Icon icon="lucide:check" width="16" />
              </span>
            </UiButton>
          </div>
        </UiCard>
      </Container>
    </Section>
    </template>
  </div>
</template>

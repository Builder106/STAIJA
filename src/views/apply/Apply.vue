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
import {
  getDraft as getCloudDraft,
  saveDraft as saveCloudDraft,
  deleteDraft as deleteCloudDraft,
  type DraftProgramSlug,
} from '../../services/applicationDrafts'
import { getProgram, type FieldDef, type ProgramSchema } from './programs'
import UiSelect from '../../components/ui/UiSelect.vue'

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

// Optional "show your work" slot — URL is the preferred path (zero
// upload, accessible to reviewers anywhere), file is the fallback for
// applicants without somewhere to host work. Either, both, or neither
// is fine; reviewers see whatever's there.
const showcaseUrl = ref('')
const showcaseNote = ref('')
const showcaseFile = ref<File | null>(null)

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

// Track the last step the applicant was on so resume lands them
// where they actually were, not back at eligibility. Updated by the
// URL → stepIndex watcher below whenever the wizard's position
// changes, so it stays in sync with stepIndex through every form of
// navigation (Continue, Back, direct URL paste, browser back-button).
const lastStep = ref<string>('')

const formStateForSave = computed(() => ({
  eligibility: eligibility.value,
  fields: fields.value,
  references: references.value,
  showcaseUrl: showcaseUrl.value,
  showcaseNote: showcaseNote.value,
  lastStep: lastStep.value,
  // Files are NOT persisted — File objects don't serialize and
  // re-uploads would be cheap to redo.
}))
// We need a Ref for useAutoSave. Wrap the computed in a ref proxy.
const persistedRef = ref(formStateForSave.value) as Ref<typeof formStateForSave.value>
watch(formStateForSave, (v) => { persistedRef.value = v }, { deep: true })

const autoSave = ref<ReturnType<typeof useAutoSave> | null>(null)
// Whether the form was restored from the cloud draft (vs localStorage).
// Drives the wording on the "Draft restored" banner so a returning
// applicant on a fresh device sees "synced from your account" instead
// of the device-scoped copy.
const restoredFromCloud = ref(false)

async function initAutoSave() {
  if (!program.value || autoSave.value || !user.value) return
  const slug = program.value.slug
  const uid = user.value.uid
  // Scope the localStorage key by uid so signing out / signing in as a
  // different user (shared device, school lab) doesn't expose the prior
  // applicant's in-progress draft to the new viewer.
  const scopedKey = `apply.${slug}.${uid}`
  // One-time migration: lift any pre-scoping legacy draft into the new
  // uid-scoped slot for the current user before useAutoSave reads.
  try {
    const legacy = window.localStorage.getItem(`staija.draft.apply.${slug}`)
    const scoped = window.localStorage.getItem(`staija.draft.${scopedKey}`)
    if (legacy && !scoped) {
      window.localStorage.setItem(`staija.draft.${scopedKey}`, legacy)
    }
    window.localStorage.removeItem(`staija.draft.apply.${slug}`)
  } catch { /* private mode / quota — fine */ }

  // Read both the localStorage draft (savedAt timestamp) and the cloud
  // draft (savedAt on the doc) before useAutoSave's restore() runs, so
  // we can pick the newer of the two. If cloud is newer, we overwrite
  // the localStorage entry first; useAutoSave then restores it as usual.
  let localSavedAt = 0
  try {
    const raw = window.localStorage.getItem(`staija.draft.${scopedKey}`)
    if (raw) {
      const parsed = JSON.parse(raw) as { savedAt?: number }
      if (typeof parsed.savedAt === 'number') localSavedAt = parsed.savedAt
    }
  } catch { /* malformed local; treat as absent */ }

  const cloud = await getCloudDraft(uid, slug as DraftProgramSlug)
  if (cloud && cloud.savedAt > localSavedAt) {
    // Cloud wins — write its payload into the localStorage slot in the
    // exact envelope useAutoSave expects, so the existing restore path
    // runs unchanged. Marker flips the banner copy.
    try {
      window.localStorage.setItem(
        `staija.draft.${scopedKey}`,
        JSON.stringify({ v: 1, savedAt: cloud.savedAt, data: cloud.payload }),
      )
      restoredFromCloud.value = true
    } catch { /* if local write fails, fall through to direct hydration */ }
  }

  // skipRestore: true because we drive restore() ourselves below.
  // useAutoSave's built-in restore runs inside an onMounted, which fires
  // *only if registered during component setup*. We're inside an async
  // path called from the parent's onMounted, so by the time useAutoSave
  // would register its hook, the parent has already mounted — Vue
  // silently drops the late registration. Calling restore() explicitly
  // sidesteps that timing trap entirely.
  //
  // Hold the handle in a local const so TS narrows past the
  // `Ref<... | null>` declared type — `autoSave.value` reads as
  // possibly-null even one line after the assignment in vue-tsc's
  // strict build mode.
  const handle = useAutoSave(scopedKey, persistedRef, { skipRestore: true })
  autoSave.value = handle

  // Pull the localStorage payload (which is now the cloud payload, if
  // the cloud branch above ran) into persistedRef.value, then copy each
  // slice into its matching form ref. We don't go through a watcher
  // because restore() uses Object.assign — a deep mutation — and the
  // watch on persistedRef (no `deep: true`) wouldn't fire for that.
  if (handle.restore()) {
    const v = persistedRef.value
    if (v.eligibility) eligibility.value = v.eligibility
    if (v.fields) fields.value = v.fields
    if (v.references) references.value = v.references
    if (typeof v.showcaseUrl === 'string') showcaseUrl.value = v.showcaseUrl
    if (typeof v.showcaseNote === 'string') showcaseNote.value = v.showcaseNote
    // Cross-device resume: the same-device case is handled
    // synchronously by readLastStepFromLocal() in the URL watcher,
    // before this async path runs. But on a fresh device the local
    // storage is empty at watcher time, so the URL canonicalized to
    // eligibility. Now that we've read the cloud draft into local
    // storage, jump to wherever the applicant was — favoring an
    // explicit lastStep on the draft, then falling back to the
    // deepest step that has any data. The fallback handles drafts
    // saved by older bundles that didn't track lastStep, drafts
    // affected by partial-save races, etc.
    const restoredLast = resolveResumeStep(v as Record<string, unknown>) ?? ''
    if (
      restoredLast &&
      restoredLast !== 'eligibility' &&
      currentStep.value?.id === 'eligibility' &&
      stepsMeta.value.some((m) => m.id === restoredLast)
    ) {
      const idx = stepsMeta.value.findIndex((m) => m.id === restoredLast)
      if (idx > 0) goToStep(idx)
    }
  }

  // Bootstrap-push the local draft to the cloud at mount time when
  // the cloud copy is missing or older. Without this, a draft that
  // predates the cloud-sync code (or one written while the Firestore
  // rule was undeployed) would stay "this browser only" until the
  // applicant actively edited inside the wizard — the 30s mirror
  // watcher below only fires on form *changes*. Fire-and-forget;
  // saveCloudDraft swallows its own errors so a Firestore hiccup
  // here can't break the form.
  if (localSavedAt > 0 && (!cloud || cloud.savedAt < localSavedAt)) {
    void saveCloudDraft(uid, slug as DraftProgramSlug, persistedRef.value)
  }

  // Cloud mirror. Same debounce as the localStorage write — but we hang
  // off a separate watcher so a Firestore hiccup never blocks the local
  // path. Fire-and-forget; saveCloudDraft swallows its own errors.
  let cloudTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    formStateForSave,
    (v) => {
      if (cloudTimer) clearTimeout(cloudTimer)
      cloudTimer = setTimeout(() => {
        if (!user.value) return
        void saveCloudDraft(uid, slug as DraftProgramSlug, v)
      }, 30_000)
    },
    { deep: true },
  )

  // Step navigation is a separate, immediate cloud write — not
  // debounced. A user who navigates from one step to the next and
  // immediately quits the browser would lose their position
  // otherwise: the 30s debounce above doesn't fire, the localStorage
  // save captures lastStep locally, but the cloud doesn't get it
  // and a fresh-device resume drops them back at eligibility.
  // Position changes are infrequent (one per Continue/Back click) so
  // the extra Firestore writes are cheap; cross-device resume
  // accuracy is worth them.
  watch(lastStep, () => {
    if (cloudTimer) {
      clearTimeout(cloudTimer)
      cloudTimer = null
    }
    if (!user.value) return
    void saveCloudDraft(uid, slug as DraftProgramSlug, formStateForSave.value)
  })
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

// Has any user-supplied data been entered for a given step? Used to
// infer where the applicant was when an explicit lastStep marker is
// absent (drafts saved before the lastStep tracking shipped, or drafts
// that hit some race condition during save). `data` is the persisted
// form state from a draft payload, with the same shape as
// `formStateForSave.value`.
function stepHasDataInPayload(
  stepId: string,
  data: Record<string, unknown>,
): boolean {
  if (!program.value) return false
  if (stepId === 'eligibility') {
    const e = data.eligibility as Record<string, unknown> | undefined
    return e ? Object.values(e).some((v) => !!v) : false
  }
  if (stepId === 'references') {
    const refs = (data.references as Array<Record<string, unknown>> | undefined) ?? []
    return refs.some((r) => !!(r.name || r.email || r.institution || r.relationship))
  }
  // Files step isn't persisted; review step is a summary only.
  if (stepId === 'files' || stepId === 'review') return false
  // Schema-driven step (personal, academic, motivation, ...).
  const schemaStep = program.value.steps.find((s) => s.id === stepId)
  if (!schemaStep) return false
  const fields = (data.fields as Record<string, unknown> | undefined) ?? {}
  for (const f of schemaStep.fields) {
    const v = fields[f.name]
    if (typeof v === 'string' && v.trim()) return true
    if (Array.isArray(v) && v.length > 0) return true
    if (typeof v === 'number' && Number.isFinite(v)) return true
  }
  return false
}

// Resolve the step to resume at from a draft payload.
//
// Decision tree:
//   - Explicit `lastStep` that's NOT 'eligibility' wins. Respects an
//     applicant who deliberately backed up to revise an earlier
//     step.
//   - Explicit `lastStep === 'eligibility'` is treated as "no
//     opinion", same as missing. Reason: pre-40d69eb bundles wrote
//     'eligibility' during the initial URL canonicalization without
//     consulting the saved data, so countless drafts have a corrupt
//     marker pinned to the default even though the applicant had
//     real progress past it. Falling back to data-based inference in
//     that case heals the corruption.
//   - Inference walks stepsMeta and returns the deepest step that
//     has any user-supplied content (eligibility checkboxes, schema
//     fields, references with values). Returns null if nothing.
function resolveResumeStep(data: Record<string, unknown>): string | null {
  const explicit = typeof data.lastStep === 'string' ? data.lastStep : ''
  if (explicit && explicit !== 'eligibility') return explicit
  if (!program.value) return null
  let deepest = ''
  for (const meta of stepsMeta.value) {
    if (stepHasDataInPayload(meta.id, data)) deepest = meta.id
  }
  return deepest || null
}

// Synchronously read the resume step from this user's localStorage
// draft, if any. Used by the canonicalization watcher so Resume lands
// the applicant on the exact step they left off at — not back at
// eligibility. Runs before any await so the redirect happens without
// a visible flash through the eligibility step.
function readLastStepFromLocal(): string | null {
  if (!user.value || !program.value || typeof window === 'undefined') return null
  try {
    const key = `staija.draft.apply.${program.value.slug}.${user.value.uid}`
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data?: Record<string, unknown> }
    if (!parsed?.data || typeof parsed.data !== 'object') return null
    return resolveResumeStep(parsed.data)
  } catch {
    return null
  }
}

// URL → stepIndex sync. Runs immediately so a deep-linked URL like
// /apply/dynamerge/motivation parks the wizard on the right step on
// initial mount, and re-runs on browser back/forward so history nav
// stays coherent. Unknown / missing step param falls back to the
// applicant's last step (from their draft) or eligibility if no draft.
// Guarded against stepsMeta being empty before the program resolves —
// the watcher fires again once it's populated.
watch(
  [() => route.params.step, stepsMeta],
  ([stepSlug, meta]) => {
    if (!meta || meta.length === 0) return
    let slug = typeof stepSlug === 'string' ? stepSlug : ''
    // Bare /apply/<program> (no step) — resume at last visited step
    // from the draft. Falls through to step 0 if no draft / no
    // lastStep recorded yet.
    if (!slug) {
      const last = readLastStepFromLocal()
      if (last && meta.some((m) => m.id === last)) {
        slug = last
      }
    }
    const idx = slug ? meta.findIndex((m) => m.id === slug) : 0
    stepIndex.value = idx >= 0 ? idx : 0
    // Persist the new position so a future visit resumes here.
    if (meta[stepIndex.value]) {
      lastStep.value = meta[stepIndex.value].id
    }
    // Canonicalize: a bare /apply/<program> hit (or an unknown step
    // slug like /apply/dynamerge/typo) gets rewritten to the resolved
    // step's URL, so the address bar always reflects the wizard's
    // actual position. Uses replace, not push — we don't want a back-
    // button trip through a stale URL.
    if (program.value && meta[stepIndex.value]) {
      const target = `/apply/${program.value.slug}/${meta[stepIndex.value].id}`
      if (route.fullPath !== target) router.replace(target)
    }
  },
  { immediate: true },
)

// --- Validation per step --------------------------------------------

function validateField(field: FieldDef): string | null {
  const v = fields.value[field.name]
  // Use the dynamic label so "State is required" reads correctly for a
  // Nigerian and "Department is required" for a Beninese applicant.
  const label = field.optionsBy?.labelByDependent
    ? (field.optionsBy.labelByDependent[fields.value[field.optionsBy.dependsOn] as string] ?? field.label)
    : field.label
  if (field.required) {
    if (v === undefined || v === null) return `${label} is required.`
    if (typeof v === 'string' && v.trim() === '') return `${label} is required.`
    if (Array.isArray(v) && v.length === 0) return `${label} is required.`
  }
  if (field.type === 'tags' && Array.isArray(v)) {
    if (field.minTags && v.length < field.minTags) return `Add at least ${field.minTags} ${label.toLowerCase()}.`
    if (field.maxTags && v.length > field.maxTags) return `${label} is capped at ${field.maxTags}.`
  }
  if (field.type === 'textarea' && field.minWords) {
    const wc = wordCount(v)
    if (wc < field.minWords) {
      return `${label}: write at least ${field.minWords} words. You're at ${wc}.`
    }
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
  goToStep(Math.min(stepIndex.value + 1, stepsMeta.value.length - 1))
  if (completed) {
    justCompletedLabel.value = completed
    if (justCompletedTimer) clearTimeout(justCompletedTimer)
    justCompletedTimer = setTimeout(() => { justCompletedLabel.value = null }, 2400)
  }
}

function back() {
  stepError.value = null
  goToStep(Math.max(stepIndex.value - 1, 0))
}

// Single chokepoint for changing the wizard's position. Updates the
// route (replace, not push — back-button shouldn't cycle through every
// step within a single application session, it should leave the
// wizard) and scrolls to the top. The route watcher below picks up the
// param change and syncs stepIndex, which keeps URL ↔ state coherent
// regardless of how the navigation was triggered (button, refresh,
// pasted URL).
function goToStep(i: number) {
  const meta = stepsMeta.value[i]
  if (!meta || !program.value) return
  const target = `/apply/${program.value.slug}/${meta.id}`
  if (route.fullPath !== target) {
    router.replace(target)
  }
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
  // Final validation across all schema steps. Bounces stepIndex through
  // each step so validateCurrentStep (which reads currentStep) can see
  // the relevant slice — when something fails we leave the user parked
  // on the offending step *and* sync that to the URL, so the address
  // bar matches the wizard's visible position.
  for (let i = 0; i < stepsMeta.value.length; i++) {
    stepIndex.value = i
    const err = validateCurrentStep()
    if (err) {
      stepError.value = err
      goToStep(i)
      return
    }
  }
  stepError.value = null

  submitting.value = true
  submitError.value = null
  try {
    const f = fields.value as Record<string, unknown>
    // Firestore rejects `undefined` field values on createApplication,
    // and program-specific extras (state / country / timezone /
    // internetSelfReport) only exist in one program's schema each — so
    // we build the object conditionally and never write a key whose
    // value would be `undefined`.
    const personalInfo: Record<string, unknown> = {
      firstName: (f.firstName as string) ?? '',
      lastName: (f.lastName as string) ?? '',
      email: (f.email as string) ?? user.value.email ?? '',
      phone: (f.phone as string) ?? '',
      dateOfBirth: (f.dateOfBirth as string) ?? '',
      nationality: (f.nationality as string) ?? '',
      currentInstitution: (f.currentInstitution as string) ?? '',
      currentLevel: (f.currentLevel as string) ?? '',
    }
    for (const key of ['region', 'state', 'country', 'timezone', 'internetSelfReport'] as const) {
      const v = f[key]
      if (v !== undefined && v !== null && v !== '') personalInfo[key] = v
    }
    const academicInfo = {
      gpa: (f.gpa as string) ?? '',
      major: (f.major as string) ?? '',
      graduationYear: f.graduationYear ? String(f.graduationYear) : '',
      relevantCourses: (f.relevantCourses as string[]) ?? [],
    }

    // Optional showcase — only attach if the applicant filled any of
    // the slots. Skip the property entirely otherwise so we don't write
    // an empty `{}` to Firestore.
    const showcase: Record<string, string> = {}
    if (showcaseUrl.value.trim()) showcase.url = showcaseUrl.value.trim()
    if (showcaseNote.value.trim()) showcase.note = showcaseNote.value.trim()
    if (showcaseFile.value) showcase.fileName = showcaseFile.value.name

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
      ...(Object.keys(showcase).length > 0 ? { showcase } : {}),
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
    if (showcaseFile.value) {
      uploads.push(
        StorageService.uploadFile(
          showcaseFile.value,
          `applications/${user.value.uid}/${applicationId}/showcase-${showcaseFile.value.name}`,
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
    // Best-effort: wipe the cloud mirror too so a fresh device doesn't
    // pull a stale draft after submission. Failure here doesn't matter
    // — the real applications/{id} doc is what staff review.
    if (program.value && user.value) {
      void deleteCloudDraft(user.value.uid, program.value.slug as DraftProgramSlug)
    }
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
  // Fire-and-forget; the async work is the cloud-vs-local merge, but
  // useAutoSave's localStorage restore still runs synchronously inside
  // it, so the form rehydrates on the same paint either way.
  void initAutoSave()
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

// --- Restored-draft banner -------------------------------------------
//
// useAutoSave shallow-merges any in-TTL draft into form state on
// mount, and surfaces `restored`/`lastSavedAt` for UI hints. We show a
// dismissible notice so a returning applicant immediately understands
// "this isn't a fresh form, your earlier answers came back".

const restoredBannerDismissed = ref(false)
const showRestoredBanner = computed(
  () => !!autoSave.value?.restored && !!autoSave.value?.lastSavedAt && !restoredBannerDismissed.value,
)

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.round(diffMs / 60_000)
  if (mins < 1) return 'less than a minute ago'
  if (mins === 1) return '1 minute ago'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.round(mins / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

// --- Field helpers for tags input -----------------------------------

// Raw text per tags field, kept separately from `fields[name]` (which
// stays a clean string[]). Without this, typing a comma rebuilds the
// array, joins it back with ", ", and instantly erases whatever the
// user just typed after the comma — including the comma itself.
const tagsRaw = ref<Record<string, string>>({})

function tagsValue(name: string): string {
  if (tagsRaw.value[name] !== undefined) return tagsRaw.value[name]
  const v = fields.value[name]
  return Array.isArray(v) ? v.join(', ') : ''
}
function setTagsValue(name: string, value: string) {
  tagsRaw.value[name] = value
  fields.value[name] = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function wordCount(s: unknown): number {
  if (typeof s !== 'string') return 0
  const trimmed = s.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

// --- Dependent-select helpers ---------------------------------------
//
// Fields with `optionsBy` resolve their options + label dynamically
// from another field's current value. Used today by the region
// selector: a Nigerian sees "State" with 37 options, a Ghanaian sees
// "Region" with 16, and so on. Clearing the parent (or switching to a
// country with no fixture data) leaves the child empty.

function dynamicOptions(field: FieldDef): string[] {
  if (!field.optionsBy) return field.options ?? []
  const parentValue = fields.value[field.optionsBy.dependsOn] as string | undefined
  if (!parentValue) return []
  return field.optionsBy.map[parentValue] ?? []
}

// Shape options into the { value, label } objects UiSelect expects.
// Schema gives us a flat string[]; the value and the display label are
// the same string for every applicant-facing select today.
function uiSelectOptions(field: FieldDef): { value: string; label: string }[] {
  return dynamicOptions(field).map((o) => ({ value: o, label: o }))
}

function uiSelectPlaceholder(field: FieldDef): string {
  if (field.optionsBy && dynamicOptions(field).length === 0) {
    return `Pick a ${field.optionsBy.dependsOn} first`
  }
  return 'Choose…'
}

function dynamicLabel(field: FieldDef): string {
  if (!field.optionsBy?.labelByDependent) return field.label
  const parentValue = fields.value[field.optionsBy.dependsOn] as string | undefined
  if (!parentValue) return field.label
  return field.optionsBy.labelByDependent[parentValue] ?? field.label
}

// Reset any dependent field whose parent changes — so picking
// "Nigeria" then switching to "Ghana" doesn't leave "Lagos" stranded
// as a meaningless region value.
watch(
  fields,
  (next, prev) => {
    if (!program.value) return
    for (const step of program.value.steps) {
      for (const f of step.fields) {
        if (!f.optionsBy) continue
        const parent = f.optionsBy.dependsOn
        const before = (prev as Record<string, unknown> | undefined)?.[parent]
        const after = (next as Record<string, unknown>)[parent]
        if (before !== undefined && before !== after) {
          fields.value[f.name] = ''
        }
      }
    }
  },
  { deep: true },
)
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
      <Container class="max-w-3xl flex flex-col gap-4">
        <Motion
          v-if="showRestoredBanner && autoSave?.lastSavedAt"
          :initial="{ opacity: 0, y: -4 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.25 }"
          class="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-900 text-sm"
        >
          <Icon :icon="restoredFromCloud ? 'lucide:cloud-download' : 'lucide:rotate-ccw'" width="16" class="mt-0.5 text-emerald-700 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold">
              {{ restoredFromCloud ? 'Draft synced from your account.' : 'Draft restored.' }}
            </div>
            <div class="text-emerald-800/80 text-xs mt-0.5">
              <template v-if="restoredFromCloud">
                Picked up where you left off — last edited
                {{ relativeTime(autoSave.lastSavedAt) }} on another device.
                Uploaded files need to be reattached.
              </template>
              <template v-else>
                Picked up where you left off — last edited
                {{ relativeTime(autoSave.lastSavedAt) }}. Uploaded files
                need to be reattached.
              </template>
            </div>
          </div>
          <button
            type="button"
            class="text-emerald-700/70 hover:text-emerald-900 p-1 -m-1 shrink-0"
            aria-label="Dismiss"
            @click="restoredBannerDismissed = true"
          >
            <Icon icon="lucide:x" width="14" />
          </button>
        </Motion>
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
                        {{ dynamicLabel(field) }}
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
                      <UiSelect
                        v-else-if="field.type === 'select'"
                        v-model="(fields[field.name] as string)"
                        :options="uiSelectOptions(field)"
                        :placeholder="uiSelectPlaceholder(field)"
                        :disabled="field.optionsBy && dynamicOptions(field).length === 0"
                      />
                      <input
                        v-else
                        v-model="fields[field.name]"
                        :type="field.type === 'number' ? 'number' : field.type"
                        :placeholder="field.placeholder"
                        :required="field.required"
                        class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface"
                      />
                      <div v-if="field.helpText || field.minWords" class="flex items-center justify-between gap-3">
                        <p v-if="field.helpText" class="text-xs text-ink/50 m-0">{{ field.helpText }}</p>
                        <p
                          v-if="field.type === 'textarea' && field.minWords"
                          class="text-xs font-semibold m-0 shrink-0 tabular-nums"
                          :class="wordCount(fields[field.name]) >= field.minWords ? 'text-emerald-600' : 'text-ink/50'"
                        >
                          {{ wordCount(fields[field.name]) }} / {{ field.minWords }} words
                        </p>
                      </div>
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

              <!-- Optional "show your work" — separated from the gated
                   documents block above by a hairline. URL is the
                   preferred path (no upload, no bandwidth tax on either
                   end). File is the fallback. Reviewers see whatever
                   the applicant attaches; nothing here is required. -->
              <div class="border-t hairline-ink pt-6 mt-2 flex flex-col gap-4">
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-brand-violet/10 text-brand-violet flex items-center justify-center shrink-0">
                    <Icon icon="lucide:sparkles" width="18" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <Heading :level="3" class="!text-lg mb-1">Show us something you've made <span class="text-ink/50 font-normal">· optional</span></Heading>
                    <Body class="text-ink/70 text-sm m-0">
                      A repo, a sketch, a track, a 60-second video of a
                      thing you built — anything that lets us see your
                      work the way essays can't. Skip this freely; it
                      won't hurt your application.
                    </Body>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold text-ink/80">Link to your work</label>
                  <input
                    v-model="showcaseUrl"
                    type="url"
                    placeholder="https://github.com/…  ·  https://youtu.be/…  ·  https://behance.net/…"
                    class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface"
                  />
                  <p class="text-xs text-ink/50 m-0">GitHub, YouTube (unlisted is fine), Behance, a blog post, an Instagram reel — whatever's easiest.</p>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold text-ink/80">Or upload a file <span class="text-ink/50 font-normal">· up to 25 MB</span></label>
                  <FileUpload
                    label="Image, short video, audio, or PDF"
                    accept="image/*,video/*,audio/*,application/pdf"
                    :max-size-bytes="25_000_000"
                    skip-compress
                    @update:file="(f) => showcaseFile = f"
                    @error="(m) => fileUploadError = m"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold text-ink/80">One-line context <span class="text-ink/50 font-normal">· optional</span></label>
                  <input
                    v-model="showcaseNote"
                    type="text"
                    placeholder="What is this and why are you showing it to us?"
                    class="border hairline-ink rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all text-sm bg-surface"
                  />
                </div>
              </div>

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

              <div
                v-if="showcaseUrl || showcaseFile || showcaseNote"
                class="border hairline-ink rounded-xl p-5 bg-paper/50 text-sm flex flex-col gap-1"
              >
                <div class="font-semibold text-ink mb-2">Showcase</div>
                <div v-if="showcaseUrl" class="text-ink/70 break-all">Link: {{ showcaseUrl }}</div>
                <div v-if="showcaseFile" class="text-ink/70">File: {{ showcaseFile.name }}</div>
                <div v-if="showcaseNote" class="text-ink/70">Note: {{ showcaseNote }}</div>
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

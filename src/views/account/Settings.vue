<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { httpsCallable } from 'firebase/functions'
import { Icon } from '@iconify/vue'
import Container from '../../components/ui/Container.vue'
import Section from '../../components/ui/Section.vue'
import Heading from '../../components/ui/Heading.vue'
import Body from '../../components/ui/Body.vue'
import Eyebrow from '../../components/ui/Eyebrow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import { useAuth } from '../../composables/useAuth'
import { functions } from '../../config/firebase'
import { AuthService } from '../../services/auth'
import { DatabaseService } from '../../services/database'
import { StorageService } from '../../services/storageService'

const router = useRouter()
const { user, userProfile, displayName, signOut, refreshProfile } = useAuth()

// --- Profile editor ---------------------------------------------------

const BIO_MAX = 280

const form = ref({
  displayName: '',
  bio: '',
  photoURL: '',
})
const original = ref({ displayName: '', bio: '', photoURL: '' })

watch(
  userProfile,
  (p) => {
    form.value.displayName = p?.displayName ?? ''
    form.value.bio = p?.bio ?? ''
    form.value.photoURL = p?.photoURL ?? ''
    original.value = { ...form.value }
  },
  { immediate: true },
)

const dirty = computed(
  () =>
    form.value.displayName !== original.value.displayName ||
    form.value.bio !== original.value.bio ||
    form.value.photoURL !== original.value.photoURL,
)
const bioOver = computed(() => form.value.bio.length > BIO_MAX)
const canSave = computed(() => dirty.value && !bioOver.value && !saving.value && !uploading.value)

const saving = ref(false)
const uploading = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

async function handleAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !user.value) return
  if (!file.type.startsWith('image/')) {
    saveError.value = 'Avatar must be an image.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    saveError.value = 'Avatar must be under 2 MB.'
    return
  }
  uploading.value = true
  saveError.value = null
  try {
    const path = `avatars/${user.value.uid}/${Date.now()}_${file.name}`
    const url = await StorageService.uploadFile(file, path)
    form.value.photoURL = url
    // Mirror the URL onto the Firebase Auth user immediately so it shows
    // up wherever the SDK reads displayName/photoURL directly.
    await AuthService.updateProfile({ photoURL: url })
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Upload failed.'
    saveError.value = msg
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handleSave() {
  if (!canSave.value || !user.value) return
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  try {
    const updates: Record<string, string> = {}
    if (form.value.displayName !== original.value.displayName)
      updates.displayName = form.value.displayName.trim()
    if (form.value.bio !== original.value.bio) updates.bio = form.value.bio.trim()
    if (form.value.photoURL !== original.value.photoURL) updates.photoURL = form.value.photoURL

    await DatabaseService.updateUserProfile(user.value.uid, updates)

    if ('displayName' in updates || 'photoURL' in updates) {
      await AuthService.updateProfile({
        displayName: updates.displayName ?? form.value.displayName,
        photoURL: updates.photoURL ?? form.value.photoURL,
      })
    }

    await refreshProfile()
    original.value = { ...form.value }
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Could not save changes.'
    saveError.value = msg
  } finally {
    saving.value = false
  }
}

function handleReset() {
  form.value = { ...original.value }
  saveError.value = null
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(date: unknown): string {
  if (!date) return '—'
  // Firestore Timestamp has a toDate() method; ISO string and Date both
  // pass through new Date() fine.
  const candidate =
    typeof (date as { toDate?: () => Date })?.toDate === 'function'
      ? (date as { toDate: () => Date }).toDate()
      : (date as Date | string)
  const d = new Date(candidate as Date | string)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// --- Account deletion -------------------------------------------------

const SELF_DELETABLE = new Set(['applicant', 'student', 'alumni', 'mentor'])
const canSelfDelete = computed(() =>
  userProfile.value?.role ? SELF_DELETABLE.has(userProfile.value.role) : true,
)

const showConfirm = ref(false)
const confirmText = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const confirmReady = computed(() => confirmText.value.trim() === 'DELETE')

async function handleDelete() {
  if (!confirmReady.value || deleting.value) return
  deleting.value = true
  deleteError.value = null
  try {
    const callable = httpsCallable<Record<string, never>, { ok: boolean; partialFailures?: string[] }>(
      functions,
      'deleteAccount',
    )
    await callable({})
    await signOut()
    router.replace({ path: '/', query: { deleted: '1' } })
  } catch (err) {
    const message = (err as { message?: string }).message ?? 'Could not delete your account. Try again.'
    deleteError.value = message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container class="max-w-3xl">
        <Eyebrow class="text-brand-violet mb-3 block">Account settings</Eyebrow>
        <Heading :level="1" class="mb-3">
          Your <span class="text-brand-violet">account</span>.
        </Heading>
        <Body class="text-ink/70">Manage your STAIJA profile, account info, and personal data.</Body>
      </Container>
    </Section>

    <Section class="!py-12">
      <Container class="max-w-3xl flex flex-col gap-8">
        <!-- Profile editor -->
        <UiCard class="p-6 md:p-10 bg-white">
          <Eyebrow class="text-brand-violet mb-3 block">Profile</Eyebrow>
          <Heading :level="2" class="mb-2 text-xl">Public profile</Heading>
          <Body class="text-ink/60 text-sm mb-8">
            How you appear to mentors, peers, and the rest of the STAIJA community.
          </Body>

          <div class="flex flex-col gap-6">
            <!-- Avatar -->
            <div class="flex items-center gap-5">
              <div
                class="w-20 h-20 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center text-xl font-semibold flex-shrink-0 overflow-hidden"
              >
                <img
                  v-if="form.photoURL"
                  :src="form.photoURL"
                  alt=""
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ getInitials(displayName) }}</span>
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border hairline-ink text-xs font-medium cursor-pointer hover:bg-ink/5 transition-colors w-fit"
                  :class="uploading ? 'opacity-50 pointer-events-none' : ''"
                >
                  <Icon
                    :icon="uploading ? 'lucide:loader-2' : 'lucide:upload'"
                    width="14"
                    :class="uploading ? 'animate-spin' : ''"
                  />
                  {{ uploading ? 'Uploading…' : 'Upload photo' }}
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="uploading"
                    @change="handleAvatar"
                  />
                </label>
                <p class="text-xs text-ink/50">PNG or JPG, max 2 MB.</p>
              </div>
            </div>

            <!-- Display name -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Display name
              </label>
              <input
                v-model="form.displayName"
                type="text"
                placeholder="Your name"
                maxlength="80"
                class="w-full px-4 py-2.5 rounded-md border hairline-ink bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet"
              />
            </div>

            <!-- Bio -->
            <div class="flex flex-col gap-2">
              <div class="flex items-end justify-between">
                <label class="text-xs font-semibold text-ink/70 uppercase tracking-wide">
                  Bio
                </label>
                <span
                  class="text-xs"
                  :class="bioOver ? 'text-red-600 font-semibold' : 'text-ink/40'"
                >
                  {{ form.bio.length }} / {{ BIO_MAX }}
                </span>
              </div>
              <textarea
                v-model="form.bio"
                rows="4"
                placeholder="A short intro — what you're studying, what you're curious about."
                class="w-full px-4 py-3 rounded-md border hairline-ink bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet resize-none"
              ></textarea>
            </div>

            <p v-if="saveError" class="text-sm text-red-700">{{ saveError }}</p>
            <p v-else-if="saveSuccess" class="text-sm text-emerald-700">
              <Icon icon="lucide:check" width="14" class="inline -mt-0.5" />
              Saved.
            </p>

            <div class="flex flex-wrap gap-3 pt-2">
              <UiButton variant="primary" :disabled="!canSave" @click="handleSave">
                <Icon v-if="saving" icon="lucide:loader-2" width="14" class="animate-spin" />
                {{ saving ? 'Saving…' : 'Save changes' }}
              </UiButton>
              <UiButton variant="secondary" :disabled="!dirty || saving" @click="handleReset">
                Reset
              </UiButton>
            </div>
          </div>
        </UiCard>

        <!-- Account info (read-only) -->
        <UiCard class="p-6 md:p-10 bg-white">
          <Eyebrow class="text-ink/60 mb-3 block">Account</Eyebrow>
          <Heading :level="2" class="mb-2 text-xl">Account info</Heading>
          <Body class="text-ink/60 text-sm mb-6">
            Read-only. Email and role are managed by an admin.
          </Body>
          <dl class="flex flex-col gap-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-ink/60">Email</dt>
              <dd class="text-ink flex items-center gap-1.5">
                {{ user?.email || '—' }}
                <Icon
                  v-if="user?.emailVerified"
                  icon="lucide:badge-check"
                  width="14"
                  class="text-emerald-600"
                />
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink/60">Role</dt>
              <dd class="text-ink capitalize">{{ userProfile?.role || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink/60">Joined</dt>
              <dd class="text-ink">{{ formatDate(userProfile?.createdAt) }}</dd>
            </div>
          </dl>
        </UiCard>

        <!-- Danger zone -->
        <UiCard class="p-6 md:p-10 bg-white border border-red-200">
          <Eyebrow class="text-red-700 mb-3 block">Danger zone</Eyebrow>
          <Heading :level="2" class="mb-3 text-xl">Delete your account</Heading>
          <Body class="text-ink/70 mb-2">
            Permanently removes your profile, applications, uploaded files (transcripts, IDs),
            and any connections you've made.
          </Body>
          <Body class="text-ink/60 text-sm mb-6">
            We retain donation receipts (with your name removed) for tax and accounting,
            audit logs for compliance, and any mentor feedback you wrote about students
            as program records.
          </Body>

          <template v-if="!canSelfDelete">
            <Body class="text-ink/70 text-sm">
              Staff and admin accounts must be deleted by another admin. Email
              <a href="mailto:hello@staija.org" class="text-brand-violet underline">hello@staija.org</a>
              and we'll handle it.
            </Body>
          </template>
          <template v-else-if="!showConfirm">
            <UiButton
              variant="secondary"
              class="!border-red-300 !text-red-700 hover:!bg-red-50"
              @click="showConfirm = true"
            >
              <Icon icon="lucide:trash-2" width="16" />
              Delete account
            </UiButton>
          </template>
          <template v-else>
            <div class="flex flex-col gap-4">
              <Body class="text-ink text-sm">
                This is permanent. Type <strong class="font-mono">DELETE</strong> below to confirm.
              </Body>
              <input
                v-model="confirmText"
                type="text"
                placeholder="DELETE"
                autocomplete="off"
                spellcheck="false"
                class="w-full px-4 py-3 rounded-md border hairline-ink bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet"
                :disabled="deleting"
              />
              <p v-if="deleteError" class="text-sm text-red-700">{{ deleteError }}</p>
              <div class="flex flex-wrap gap-3">
                <UiButton
                  variant="secondary"
                  class="!border-red-300 !text-red-700 hover:!bg-red-50"
                  :disabled="!confirmReady || deleting"
                  @click="handleDelete"
                >
                  <Icon v-if="deleting" icon="lucide:loader-2" width="16" class="animate-spin" />
                  <Icon v-else icon="lucide:trash-2" width="16" />
                  {{ deleting ? 'Deleting…' : 'Permanently delete my account' }}
                </UiButton>
                <UiButton
                  variant="secondary"
                  :disabled="deleting"
                  @click="showConfirm = false; confirmText = ''; deleteError = null"
                >
                  Cancel
                </UiButton>
              </div>
            </div>
          </template>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>

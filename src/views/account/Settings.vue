<script setup lang="ts">
import { ref, computed } from 'vue'
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

const router = useRouter()
const { user, userProfile, displayName, signOut } = useAuth()

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
      <Container class="max-w-2xl">
        <Eyebrow class="text-brand-violet mb-3 block">Account settings</Eyebrow>
        <Heading :level="1" class="mb-3">
          Your <span class="text-brand-violet">account</span>.
        </Heading>
        <Body class="text-ink/70">Manage your STAIJA account and personal data.</Body>
      </Container>
    </Section>

    <Section class="!py-12">
      <Container class="max-w-2xl flex flex-col gap-8">
        <UiCard class="p-6 md:p-10 bg-white">
          <Heading :level="2" class="mb-4 text-xl">Profile</Heading>
          <dl class="flex flex-col gap-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-ink/60">Name</dt>
              <dd class="text-ink">{{ displayName || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink/60">Email</dt>
              <dd class="text-ink">{{ user?.email || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink/60">Role</dt>
              <dd class="text-ink capitalize">{{ userProfile?.role || '—' }}</dd>
            </div>
          </dl>
        </UiCard>

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

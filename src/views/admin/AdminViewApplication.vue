<template>
  <div class="admin-view-application">
    <header class="page-header">
      <h1>View Application</h1>
      <button @click="goBack">← Back</button>
    </header>

    <div v-if="loading" class="loading">
      <p>Loading application...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadApplication">Retry</button>
    </div>

    <div v-else-if="application" class="application-content">
      <!-- Failed-email banner — only renders when Mailgun rejected the
           last applicant-facing send. Retry re-derives the email from
           the current status so a typo'd address fixed since the
           failure picks up automatically. -->
      <div v-if="application.lastEmailFailure" class="email-failure-banner" role="status">
        <div class="email-failure-text">
          <strong>Couldn't email the applicant.</strong>
          <span>
            {{ failureKindLabel(application.lastEmailFailure.kind) }} email to
            <code>{{ application.lastEmailFailure.to }}</code>
            failed{{ failureWhen ? ` ${failureWhen}` : '' }}.
          </span>
          <span class="email-failure-detail">{{ application.lastEmailFailure.error }}</span>
        </div>
        <div class="email-failure-actions">
          <button
            type="button"
            class="email-failure-retry"
            :disabled="retrying"
            @click="retryEmail"
          >
            {{ retrying ? 'Retrying…' : 'Retry email' }}
          </button>
        </div>
      </div>
      <div v-if="retryMessage" class="email-retry-result" :data-tone="retryTone">
        {{ retryMessage }}
      </div>

      <!-- Application Info -->
      <div class="app-info">
        <h2>{{ application.personalInfo.firstName }} {{ application.personalInfo.lastName }}</h2>
        <p>{{ application.personalInfo.email }}</p>
        <p>{{ application.program === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge' }}</p>
        <p>Status: {{ application.status }}</p>
        <p>Submitted: {{ formatDate(application.submittedAt) }}</p>
      </div>

      <!-- Application Details -->
      <div class="app-details">
        <h3>Application Details</h3>
        
        <div class="detail-section">
          <h4>Personal Information</h4>
          <p><strong>Name:</strong> {{ application.personalInfo.firstName }} {{ application.personalInfo.lastName }}</p>
          <p><strong>Email:</strong> {{ application.personalInfo.email }}</p>
          <p><strong>Phone:</strong> {{ application.personalInfo.phone || 'Not provided' }}</p>
          <p><strong>Nationality:</strong> {{ application.personalInfo.nationality }}</p>
          <p><strong>Institution:</strong> {{ application.personalInfo.currentInstitution || 'Not provided' }}</p>
        </div>

        <div class="detail-section">
          <h4>Motivation</h4>
          <p>{{ application.motivation }}</p>
        </div>

        <div class="detail-section">
          <h4>Experience</h4>
          <p>{{ application.experience }}</p>
        </div>

        <div class="detail-section">
          <h4>Research Interests</h4>
          <div class="tags">
            <span v-for="interest in application.researchInterests" :key="interest" class="tag">
              {{ interest }}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h4>References</h4>
          <div v-for="(ref, index) in application.references" :key="index" class="reference">
            <p><strong>{{ ref.name }}</strong> - {{ ref.institution }}</p>
            <p>{{ ref.email }} | {{ ref.relationship }}</p>
          </div>
        </div>

        <div v-if="application.feedback" class="detail-section">
          <h4>Review Feedback</h4>
          <p>{{ application.feedback }}</p>
          <p><small>Reviewed by: {{ application.reviewedBy }} on {{ formatDate(application.reviewedAt) }}</small></p>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button @click="reviewApplication" class="btn-primary">Review Application</button>
        <button @click="goToApplications" class="btn-secondary">Back to Applications</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { httpsCallable } from 'firebase/functions'
import { DatabaseService, type Application } from '../../services/firebase'
import { functions } from '../../config/firebase'

const router = useRouter()
const route = useRoute()

const application = ref<Application | null>(null)
const loading = ref(true)
const error = ref('')

const retrying = ref(false)
const retryMessage = ref('')
const retryTone = ref<'success' | 'error'>('success')

const loadApplication = async () => {
  try {
    const app = await DatabaseService.getApplication(route.params.id as string)
    if (app) {
      application.value = app
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function failureKindLabel(kind: 'submitted' | 'accepted' | 'rejected'): string {
  if (kind === 'submitted') return 'Submission-confirmation'
  if (kind === 'accepted') return 'Acceptance'
  return 'Status-update'
}

// Coerce the assorted shapes Firestore returns for timestamps into a
// readable relative phrase. Firestore Web SDK returns Timestamp; if the
// doc was just written by a server function we may still see a raw
// Date. Anything else falls through to "" (the banner just omits the time).
const failureWhen = computed(() => {
  const ts = application.value?.lastEmailFailure?.attemptedAt
  if (!ts) return ''
  const d =
    ts instanceof Date
      ? ts
      : typeof (ts as { toDate?: () => Date }).toDate === 'function'
        ? (ts as { toDate: () => Date }).toDate()
        : null
  if (!d) return ''
  return d.toLocaleString()
})

async function retryEmail() {
  if (!application.value?.id || retrying.value) return
  retrying.value = true
  retryMessage.value = ''
  try {
    const fn = httpsCallable<
      { applicationId: string },
      { ok: boolean; kind: string; to: string }
    >(functions, 'retryApplicationEmail')
    const res = await fn({ applicationId: application.value.id })
    retryMessage.value = `Email re-sent to ${res.data.to}.`
    retryTone.value = 'success'
    // Reload so the banner clears (lastEmailFailure was deleted on
    // success by the function).
    await loadApplication()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Retry failed.'
    retryMessage.value = msg
    retryTone.value = 'error'
  } finally {
    retrying.value = false
  }
}

const reviewApplication = () => {
  router.push(`/admin/applications/${route.params.id}/review`)
}

const goToApplications = () => {
  router.push('/admin/applications')
}

const goBack = () => {
  router.back()
}

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Not submitted'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadApplication()
})
</script>

<style scoped>
.admin-view-application {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.email-failure-banner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #b91c1c;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  color: #7f1d1d;
}

.email-failure-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.email-failure-text strong {
  font-weight: 600;
}

.email-failure-text code {
  background: rgba(127, 29, 29, 0.08);
  padding: 0 0.3rem;
  border-radius: 3px;
  font-size: 0.85em;
}

.email-failure-detail {
  font-size: 0.8rem;
  color: rgba(127, 29, 29, 0.75);
  font-family: ui-monospace, 'Courier New', monospace;
  word-break: break-word;
}

.email-failure-actions {
  flex-shrink: 0;
}

.email-failure-retry {
  background: #b91c1c;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.email-failure-retry:hover:not(:disabled) {
  background: #991b1b;
}

.email-failure-retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.email-retry-result {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.email-retry-result[data-tone='success'] {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.email-retry-result[data-tone='error'] {
  background: #fef2f2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
}

.app-info {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-details {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.detail-section:last-child {
  border-bottom: none;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.reference {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}
</style>

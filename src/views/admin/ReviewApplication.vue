<template>
  <div class="review-application">
    <header class="page-header">
      <h1>Review Application</h1>
      <button @click="goBack">← Back</button>
    </header>

    <div v-if="loading" class="loading">
      <p>Loading application...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadApplication">Retry</button>
    </div>

    <div v-else-if="application" class="review-content">
      <!-- Application Info -->
      <div class="app-info">
        <h2>{{ application.personalInfo.firstName }} {{ application.personalInfo.lastName }}</h2>
        <p>{{ application.personalInfo.email }}</p>
        <p>{{ application.program === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge' }}</p>
        <p>Status: {{ application.status }}</p>
      </div>

      <!-- Review Form -->
      <div class="review-form">
        <h3>Review Decision</h3>
        <div class="form-group">
          <label>Status</label>
          <select v-model="reviewForm.status">
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div class="form-group">
          <label>Feedback</label>
          <textarea v-model="reviewForm.feedback" rows="4" placeholder="Provide feedback..."></textarea>
        </div>

        <div class="form-actions">
          <button @click="saveReview" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Review' }}
          </button>
          <button @click="goBack">Cancel</button>
        </div>
      </div>

      <!-- Application Details -->
      <div class="app-details">
        <h3>Application Details</h3>
        
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DatabaseService, AuthService, type Application } from '../../services/firebase'

const router = useRouter()
const route = useRoute()

const application = ref<Application | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const reviewForm = ref({
  status: 'submitted',
  feedback: ''
})

const loadApplication = async () => {
  try {
    const app = await DatabaseService.getApplication(route.params.id as string)
    if (app) {
      application.value = app
      reviewForm.value.status = app.status
      reviewForm.value.feedback = app.feedback || ''
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const saveReview = async () => {
  if (!application.value?.id) return

  saving.value = true
  try {
    const currentUser = AuthService.getCurrentUser()
    await DatabaseService.updateApplication(application.value.id, {
      status: reviewForm.value.status,
      feedback: reviewForm.value.feedback,
      reviewedAt: new Date(),
      reviewedBy: currentUser?.email || 'Unknown'
    })
    router.push('/admin/applications')
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadApplication()
})
</script>

<style scoped>
.review-application {
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

.app-info {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.review-form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button:first-child {
  background: var(--color-primary);
  color: white;
}

.form-actions button:last-child {
  background: #6b7280;
  color: white;
}

.app-details {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
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

.loading, .error {
  text-align: center;
  padding: 2rem;
}
</style>

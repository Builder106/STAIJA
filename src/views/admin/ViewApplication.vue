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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DatabaseService, type Application } from '../../services/firebase'

const router = useRouter()
const route = useRoute()

const application = ref<Application | null>(null)
const loading = ref(true)
const error = ref('')

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

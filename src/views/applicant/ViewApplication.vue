<template>
  <div class="view-application">
    <header class="page-header">
      <div class="header-content">
        <button @click="goBack" class="btn-back">← Back</button>
        <h1>Application Details</h1>
        <p class="subtitle">{{ application?.program === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge' }} Program</p>
      </div>
      <div class="header-actions">
        <button
          v-if="application?.status === 'draft'"
          @click="editApplication"
          class="btn-primary"
        >
          Continue Editing
        </button>
        <button @click="navigateTo('/applicant/applications')" class="btn-secondary">
          Back to Applications
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading application details...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadApplication" class="btn-primary">Retry</button>
    </div>

    <div v-else-if="application" class="application-details">
      <!-- Status Banner -->
      <div class="status-banner" :class="`status-${application.status}`">
        <div class="status-content">
          <span class="status-icon">
            {{ getStatusIcon(application.status) }}
          </span>
          <div class="status-info">
            <h3>{{ formatStatus(application.status) }}</h3>
            <p>{{ getStatusDescription(application.status) }}</p>
          </div>
        </div>
        <div class="status-dates">
          <div class="date-item">
            <span class="date-label">Created:</span>
            <span class="date-value">{{ formatDate(application.createdAt) }}</span>
          </div>
          <div v-if="application.submittedAt" class="date-item">
            <span class="date-label">Submitted:</span>
            <span class="date-value">{{ formatDate(application.submittedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Application Content -->
      <div class="application-content">
        <!-- Personal Information -->
        <div class="content-section">
          <h2>Personal Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Full Name</label>
              <span>{{ application.personalInfo.firstName }} {{ application.personalInfo.lastName }}</span>
            </div>
            <div class="info-item">
              <label>Email Address</label>
              <span>{{ application.personalInfo.email }}</span>
            </div>
            <div class="info-item">
              <label>Phone Number</label>
              <span>{{ application.personalInfo.phone || 'Not provided' }}</span>
            </div>
            <div class="info-item">
              <label>Date of Birth</label>
              <span>{{ formatDate(application.personalInfo.dateOfBirth) }}</span>
            </div>
            <div class="info-item">
              <label>Nationality</label>
              <span>{{ application.personalInfo.nationality }}</span>
            </div>
            <div class="info-item">
              <label>Current Institution</label>
              <span>{{ application.personalInfo.currentInstitution || 'Not provided' }}</span>
            </div>
            <div class="info-item">
              <label>Current Level</label>
              <span>{{ formatLevel(application.personalInfo.currentLevel) }}</span>
            </div>
          </div>
        </div>

        <!-- Academic Information -->
        <div class="content-section">
          <h2>Academic Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>GPA</label>
              <span>{{ application.academicInfo.gpa || 'Not provided' }}</span>
            </div>
            <div class="info-item">
              <label>Major/Field of Study</label>
              <span>{{ application.academicInfo.major || 'Not provided' }}</span>
            </div>
            <div class="info-item">
              <label>Graduation Year</label>
              <span>{{ application.academicInfo.graduationYear || 'Not provided' }}</span>
            </div>
          </div>
          
          <div v-if="application.academicInfo.relevantCourses.length > 0" class="info-section">
            <label>Relevant Courses</label>
            <div class="tags-list">
              <span
                v-for="course in application.academicInfo.relevantCourses"
                :key="course"
                class="tag"
              >
                {{ course }}
              </span>
            </div>
          </div>
        </div>

        <!-- Research Interests -->
        <div class="content-section">
          <h2>Research Interests</h2>
          <div class="tags-list">
            <span
              v-for="interest in application.researchInterests"
              :key="interest"
              class="tag"
            >
              {{ interest }}
            </span>
          </div>
        </div>

        <!-- Motivation Statement -->
        <div class="content-section">
          <h2>Motivation Statement</h2>
          <div class="text-content">
            {{ application.motivation }}
          </div>
        </div>

        <!-- Experience -->
        <div class="content-section">
          <h2>Relevant Experience</h2>
          <div class="text-content">
            {{ application.experience }}
          </div>
        </div>

        <!-- References -->
        <div class="content-section">
          <h2>References</h2>
          <div class="references-list">
            <div
              v-for="(reference, index) in application.references"
              :key="index"
              class="reference-card"
            >
              <h4>Reference {{ index + 1 }}</h4>
              <div class="reference-info">
                <div class="reference-item">
                  <label>Name</label>
                  <span>{{ reference.name }}</span>
                </div>
                <div class="reference-item">
                  <label>Email</label>
                  <span>{{ reference.email }}</span>
                </div>
                <div class="reference-item">
                  <label>Institution</label>
                  <span>{{ reference.institution }}</span>
                </div>
                <div class="reference-item">
                  <label>Relationship</label>
                  <span>{{ reference.relationship }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Staff Feedback (if available) -->
        <div v-if="application.feedback" class="content-section">
          <h2>Review Feedback</h2>
          <div class="feedback-content">
            <div class="feedback-header">
              <span class="feedback-date">Reviewed on {{ formatDate(application.reviewedAt) }}</span>
              <span v-if="application.reviewedBy" class="feedback-reviewer">by {{ application.reviewedBy }}</span>
            </div>
            <div class="text-content">
              {{ application.feedback }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="not-found-state">
      <div class="not-found-icon">📄</div>
      <h3>Application Not Found</h3>
      <p>The application you're looking for doesn't exist or you don't have permission to view it.</p>
      <button @click="navigateTo('/applicant/applications')" class="btn-primary">
        Back to Applications
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DatabaseService, AuthService, type Application } from '../../services/firebase'

const router = useRouter()
const route = useRoute()

// Reactive data
const application = ref<Application | null>(null)
const loading = ref(true)
const error = ref('')

// Methods
const loadApplication = async () => {
  loading.value = true
  error.value = ''

  try {
    const applicationId = route.params.id as string
    if (!applicationId) {
      error.value = 'Application ID is required'
      return
    }

    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const app = await DatabaseService.getApplication(applicationId)
    
    if (!app) {
      error.value = 'Application not found'
      return
    }

    // Verify the application belongs to the current user
    if (app.userId !== currentUser.uid) {
      error.value = 'You do not have permission to view this application'
      return
    }

    application.value = app
  } catch (err: any) {
    error.value = err.message || 'Failed to load application'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const editApplication = () => {
  if (application.value?.id) {
    router.push(`/applicant/applications/${application.value.id}/edit`)
  }
}

const navigateTo = (path: string) => {
  router.push(path)
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Not provided'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Rejected'
  }
  return statusMap[status] || status
}

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    draft: '📝',
    submitted: '📤',
    under_review: '🔍',
    accepted: '✅',
    rejected: '❌'
  }
  return iconMap[status] || '📄'
}

const getStatusDescription = (status: string) => {
  const descriptionMap: Record<string, string> = {
    draft: 'Your application is saved as a draft. You can continue editing and submit when ready.',
    submitted: 'Your application has been submitted and is awaiting review.',
    under_review: 'Your application is currently being reviewed by our team.',
    accepted: 'Congratulations! Your application has been accepted.',
    rejected: 'Your application was not accepted. Please review the feedback below.'
  }
  return descriptionMap[status] || 'Application status unknown.'
}

const formatLevel = (level: string | undefined) => {
  if (!level) return 'Not specified'
  const levelMap: Record<string, string> = {
    undergraduate: 'Undergraduate',
    masters: "Master's",
    phd: 'PhD',
    postdoc: 'Postdoctoral',
    professional: 'Professional'
  }
  return levelMap[level] || level
}

// Lifecycle
onMounted(() => {
  loadApplication()
})
</script>

<style scoped>
.view-application {
  min-height: 100vh;
  background: var(--color-background);
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-back {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
}

.header-content h1 {
  color: var(--color-primary);
  margin: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.loading-state, .error-state, .not-found-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.not-found-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.not-found-state h3 {
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.application-details {
  max-width: 1000px;
  margin: 0 auto;
}

.status-banner {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.status-banner.status-draft {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.status-banner.status-submitted {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.status-banner.status-under_review {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.status-banner.status-accepted {
  border-left-color: #10b981;
  background: #ecfdf5;
}

.status-banner.status-rejected {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 2rem;
}

.status-info h3 {
  margin: 0 0 0.25rem;
  color: var(--color-text);
}

.status-info p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.status-dates {
  display: flex;
  gap: 2rem;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.date-value {
  font-size: 0.9rem;
  color: var(--color-text);
}

.application-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.content-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.content-section h2 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.info-item span {
  color: var(--color-text);
  font-size: 1rem;
}

.info-section {
  margin-top: 1rem;
}

.info-section label {
  display: block;
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--color-background-secondary);
  color: var(--color-text);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid var(--color-border);
}

.text-content {
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 8px;
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre-wrap;
}

.references-list {
  display: grid;
  gap: 1rem;
}

.reference-card {
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.reference-card h4 {
  color: var(--color-primary);
  margin: 0 0 1rem;
}

.reference-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.reference-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reference-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.reference-item span {
  color: var(--color-text);
  font-size: 0.9rem;
}

.feedback-content {
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.feedback-date, .feedback-reviewer {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-secondary-dark);
}

@media (max-width: 768px) {
  .view-application {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .status-content {
    flex-direction: column;
    text-align: center;
  }
  
  .status-dates {
    flex-direction: column;
    gap: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .reference-info {
    grid-template-columns: 1fr;
  }
  
  .feedback-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>

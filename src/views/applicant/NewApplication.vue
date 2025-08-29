<template>
  <div class="new-application">
    <header class="page-header">
      <div class="header-content">
        <h1>New Application</h1>
        <p class="subtitle">Complete your application for STAIJA programs</p>
      </div>
      <div class="header-actions">
        <button @click="goBack" class="btn-secondary">Cancel</button>
      </div>
    </header>

    <div class="application-form-container">
      <form @submit.prevent="handleSubmit" class="application-form">
        <!-- Program Selection -->
        <div class="form-section">
          <h3>Program Selection</h3>
          <div class="form-group">
            <label for="program">Select Program *</label>
            <select
              id="program"
              v-model="form.program"
              required
              :disabled="loading"
              class="form-control"
            >
              <option value="">Choose a program</option>
              <option value="stepup_scholars">StepUp Scholars Program</option>
              <option value="dynamerge">Dynamerge Research Program</option>
            </select>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="form-section">
          <h3>Personal Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input
                id="firstName"
                v-model="form.personalInfo.firstName"
                type="text"
                required
                :disabled="loading"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input
                id="lastName"
                v-model="form.personalInfo.lastName"
                type="text"
                required
                :disabled="loading"
                class="form-control"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="email">Email Address *</label>
              <input
                id="email"
                v-model="form.personalInfo.email"
                type="email"
                required
                :disabled="loading"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input
                id="phone"
                v-model="form.personalInfo.phone"
                type="tel"
                :disabled="loading"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                v-model="form.personalInfo.dateOfBirth"
                type="date"
                required
                :disabled="loading"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="nationality">Nationality *</label>
              <input
                id="nationality"
                v-model="form.personalInfo.nationality"
                type="text"
                required
                :disabled="loading"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="currentInstitution">Current Institution</label>
              <input
                id="currentInstitution"
                v-model="form.personalInfo.currentInstitution"
                type="text"
                :disabled="loading"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="currentLevel">Current Level</label>
              <select
                id="currentLevel"
                v-model="form.personalInfo.currentLevel"
                :disabled="loading"
                class="form-control"
              >
                <option value="">Select level</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="masters">Master's</option>
                <option value="phd">PhD</option>
                <option value="postdoc">Postdoctoral</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Academic Information -->
        <div class="form-section">
          <h3>Academic Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="gpa">GPA (if applicable)</label>
              <input
                id="gpa"
                v-model="form.academicInfo.gpa"
                type="text"
                placeholder="e.g., 3.8/4.0"
                :disabled="loading"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="major">Major/Field of Study</label>
              <input
                id="major"
                v-model="form.academicInfo.major"
                type="text"
                :disabled="loading"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="graduationYear">Expected/Actual Graduation Year</label>
              <input
                id="graduationYear"
                v-model="form.academicInfo.graduationYear"
                type="number"
                min="2020"
                max="2030"
                :disabled="loading"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="relevantCourses">Relevant Courses (comma-separated)</label>
            <textarea
              id="relevantCourses"
              v-model="relevantCoursesText"
              placeholder="e.g., Advanced Mathematics, Computer Science, Research Methods"
              :disabled="loading"
              class="form-control"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Research Interests -->
        <div class="form-section">
          <h3>Research Interests</h3>
          <div class="form-group">
            <label for="researchInterests">Research Interests (comma-separated) *</label>
            <textarea
              id="researchInterests"
              v-model="researchInterestsText"
              placeholder="e.g., Artificial Intelligence, Climate Change, Renewable Energy"
              required
              :disabled="loading"
              class="form-control"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Motivation -->
        <div class="form-section">
          <h3>Motivation Statement</h3>
          <div class="form-group">
            <label for="motivation">Why do you want to join this program? *</label>
            <textarea
              id="motivation"
              v-model="form.motivation"
              placeholder="Describe your motivation, goals, and how this program aligns with your career aspirations..."
              required
              :disabled="loading"
              class="form-control"
              rows="6"
            ></textarea>
          </div>
        </div>

        <!-- Experience -->
        <div class="form-section">
          <h3>Relevant Experience</h3>
          <div class="form-group">
            <label for="experience">Describe your relevant experience *</label>
            <textarea
              id="experience"
              v-model="form.experience"
              placeholder="Describe your research experience, projects, internships, or any relevant work..."
              required
              :disabled="loading"
              class="form-control"
              rows="6"
            ></textarea>
          </div>
        </div>

        <!-- References -->
        <div class="form-section">
          <h3>References</h3>
          <p class="section-description">Please provide at least two academic or professional references.</p>
          
          <div v-for="(reference, index) in form.references" :key="index" class="reference-item">
            <h4>Reference {{ index + 1 }}</h4>
            <div class="form-row">
              <div class="form-group">
                <label :for="`refName${index}`">Full Name *</label>
                <input
                  :id="`refName${index}`"
                  v-model="reference.name"
                  type="text"
                  required
                  :disabled="loading"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label :for="`refEmail${index}`">Email Address *</label>
                <input
                  :id="`refEmail${index}`"
                  v-model="reference.email"
                  type="email"
                  required
                  :disabled="loading"
                  class="form-control"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label :for="`refInstitution${index}`">Institution/Organization *</label>
                <input
                  :id="`refInstitution${index}`"
                  v-model="reference.institution"
                  type="text"
                  required
                  :disabled="loading"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label :for="`refRelationship${index}`">Relationship *</label>
                <input
                  :id="`refRelationship${index}`"
                  v-model="reference.relationship"
                  type="text"
                  placeholder="e.g., Professor, Supervisor, Mentor"
                  required
                  :disabled="loading"
                  class="form-control"
                />
              </div>
            </div>
            <button
              v-if="form.references.length > 2"
              @click="removeReference(index)"
              type="button"
              class="btn-remove"
              :disabled="loading"
            >
              Remove Reference
            </button>
          </div>
          
          <button
            @click="addReference"
            type="button"
            class="btn-add"
            :disabled="loading || form.references.length >= 4"
          >
            Add Another Reference
          </button>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            @click="saveDraft"
            :disabled="loading || !isFormValid"
            class="btn-secondary"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn-primary"
          >
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content" @click.stop>
        <div class="success-icon">✅</div>
        <h3>Application Submitted Successfully!</h3>
        <p>Your application has been submitted and is now under review. You will receive updates via email.</p>
        <div class="modal-actions">
          <button @click="goToDashboard" class="btn-primary">Go to Dashboard</button>
          <button @click="closeSuccessModal" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="error = ''" class="btn-close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DatabaseService, AuthService, type Application } from '../../services/firebase'

const router = useRouter()

// Form data
const form = ref({
  program: '',
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    currentInstitution: '',
    currentLevel: ''
  },
  academicInfo: {
    gpa: '',
    major: '',
    graduationYear: '',
    relevantCourses: [] as string[]
  },
  researchInterests: [] as string[],
  motivation: '',
  experience: '',
  references: [
    {
      name: '',
      email: '',
      institution: '',
      relationship: ''
    },
    {
      name: '',
      email: '',
      institution: '',
      relationship: ''
    }
  ]
})

// UI state
const loading = ref(false)
const error = ref('')
const showSuccessModal = ref(false)

// Computed properties for text inputs
const relevantCoursesText = computed({
  get: () => form.value.academicInfo.relevantCourses.join(', '),
  set: (value: string) => {
    form.value.academicInfo.relevantCourses = value
      .split(',')
      .map(course => course.trim())
      .filter(course => course.length > 0)
  }
})

const researchInterestsText = computed({
  get: () => form.value.researchInterests.join(', '),
  set: (value: string) => {
    form.value.researchInterests = value
      .split(',')
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0)
  }
})

// Form validation
const isFormValid = computed(() => {
  return (
    form.value.program &&
    form.value.personalInfo.firstName &&
    form.value.personalInfo.lastName &&
    form.value.personalInfo.email &&
    form.value.personalInfo.dateOfBirth &&
    form.value.personalInfo.nationality &&
    form.value.researchInterests.length > 0 &&
    form.value.motivation &&
    form.value.experience &&
    form.value.references.length >= 2 &&
    form.value.references.every(ref => 
      ref.name && ref.email && ref.institution && ref.relationship
    )
  )
})

// Methods
const addReference = () => {
  if (form.value.references.length < 4) {
    form.value.references.push({
      name: '',
      email: '',
      institution: '',
      relationship: ''
    })
  }
}

const removeReference = (index: number) => {
  if (form.value.references.length > 2) {
    form.value.references.splice(index, 1)
  }
}

const saveDraft = async () => {
  await submitApplication('draft')
}

const handleSubmit = async () => {
  await submitApplication('submitted')
}

const submitApplication = async (status: 'draft' | 'submitted') => {
  loading.value = true
  error.value = ''

  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const applicationData = {
      userId: currentUser.uid,
      program: form.value.program as 'stepup_scholars' | 'dynamerge',
      status,
      personalInfo: form.value.personalInfo,
      academicInfo: form.value.academicInfo,
      researchInterests: form.value.researchInterests,
      motivation: form.value.motivation,
      experience: form.value.experience,
      references: form.value.references,
      submittedAt: status === 'submitted' ? new Date() : undefined
    }

    await DatabaseService.createApplication(applicationData)

    if (status === 'submitted') {
      showSuccessModal.value = true
    } else {
      router.push('/applicant/applications')
    }

  } catch (err: any) {
    error.value = err.message || 'Failed to save application. Please try again.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToDashboard = () => {
  router.push('/applicant')
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
}

// Lifecycle
onMounted(() => {
  // Pre-fill email if available
  const currentUser = AuthService.getCurrentUser()
  if (currentUser?.email) {
    form.value.personalInfo.email = currentUser.email
  }
})
</script>

<style scoped>
.new-application {
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

.header-content h1 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.application-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.application-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.section-description {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--color-text);
}

.form-control {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-control:disabled {
  background: var(--color-background-secondary);
  cursor: not-allowed;
}

.reference-item {
  background: var(--color-background-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.reference-item h4 {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.btn-add, .btn-remove {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-add:hover {
  border-color: var(--color-primary);
  background: var(--color-background-secondary);
}

.btn-remove {
  color: #dc2626;
  border-color: #fecaca;
}

.btn-remove:hover {
  background: #fef2f2;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-secondary-dark);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-content h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.error-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1001;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #dc2626;
}

@media (max-width: 768px) {
  .new-application {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 1rem;
  }
}
</style>

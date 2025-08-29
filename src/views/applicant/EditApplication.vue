<template>
  <div class="edit-application">
    <header class="page-header">
      <h1>Edit Application</h1>
      <p>Update your STAIJA program application</p>
    </header>

    <div v-if="loading" class="loading">
      <p>Loading application...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadApplication">Retry</button>
    </div>

    <div v-else-if="application && application.status === 'draft'" class="form-container">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Program</label>
          <select v-model="form.program" required>
            <option value="stepup_scholars">StepUp Scholars</option>
            <option value="dynamerge">Dynamerge</option>
          </select>
        </div>

        <div class="form-group">
          <label>First Name</label>
          <input v-model="form.personalInfo.firstName" required />
        </div>

        <div class="form-group">
          <label>Last Name</label>
          <input v-model="form.personalInfo.lastName" required />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="form.personalInfo.email" type="email" required />
        </div>

        <div class="form-group">
          <label>Motivation</label>
          <textarea v-model="form.motivation" required rows="4"></textarea>
        </div>

        <div class="form-group">
          <label>Experience</label>
          <textarea v-model="form.experience" required rows="4"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="saveDraft">Save Draft</button>
          <button type="submit">Submit Application</button>
        </div>
      </form>
    </div>

    <div v-else class="error">
      <p>This application cannot be edited.</p>
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

const form = ref({
  program: '',
  personalInfo: {
    firstName: '',
    lastName: '',
    email: ''
  },
  motivation: '',
  experience: ''
})

const loadApplication = async () => {
  try {
    const app = await DatabaseService.getApplication(route.params.id as string)
    if (app) {
      application.value = app
      form.value = {
        program: app.program,
        personalInfo: app.personalInfo,
        motivation: app.motivation,
        experience: app.experience
      }
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const saveDraft = async () => {
  if (application.value?.id) {
    await DatabaseService.updateApplication(application.value.id, form.value)
    router.push('/applicant/applications')
  }
}

const handleSubmit = async () => {
  if (application.value?.id) {
    await DatabaseService.updateApplication(application.value.id, {
      ...form.value,
      status: 'submitted',
      submittedAt: new Date()
    })
    router.push('/applicant/applications')
  }
}

onMounted(() => {
  loadApplication()
})
</script>

<style scoped>
.edit-application {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
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

.form-group input,
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
  margin-top: 2rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button:first-child {
  background: #6b7280;
  color: white;
}

.form-actions button:last-child {
  background: var(--color-primary);
  color: white;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}
</style>

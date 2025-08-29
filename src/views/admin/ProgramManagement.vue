<template>
  <div class="program-management">
    <header class="page-header">
      <h1>Program Management</h1>
      <p class="subtitle">Update program dates and information</p>
    </header>

    <div v-if="loading" class="loading">
      Loading programs...
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="loadPrograms" class="btn btn-primary">Retry</button>
    </div>

    <div v-else class="programs-container">
      <div v-for="program in programs" :key="program.id" class="program-card">
        <div class="program-header">
          <h3>{{ program.name }}</h3>
          <span :class="['status-badge', program.status]">{{ program.status }}</span>
        </div>

        <div class="program-dates">
          <h4>Program Dates</h4>
          <div class="dates-grid">
            <div class="date-field">
              <label>Application Start</label>
              <input 
                v-model="program.dates.applicationStart" 
                type="date" 
                class="date-input"
                @change="updateProgramDates(program.id!, program.dates)"
              />
            </div>
            <div class="date-field">
              <label>Application End</label>
              <input 
                v-model="program.dates.applicationEnd" 
                type="date" 
                class="date-input"
                @change="updateProgramDates(program.id!, program.dates)"
              />
            </div>
            <div class="date-field">
              <label>Program Start</label>
              <input 
                v-model="program.dates.programStart" 
                type="date" 
                class="date-input"
                @change="updateProgramDates(program.id!, program.dates)"
              />
            </div>
            <div class="date-field">
              <label>Program End</label>
              <input 
                v-model="program.dates.programEnd" 
                type="date" 
                class="date-input"
                @change="updateProgramDates(program.id!, program.dates)"
              />
            </div>
            <div class="date-field">
              <label>Decisions By</label>
              <input 
                v-model="program.dates.decisionsBy" 
                type="date" 
                class="date-input"
                @change="updateProgramDates(program.id!, program.dates)"
              />
            </div>
          </div>
        </div>

        <div class="program-status">
          <h4>Program Status</h4>
          <select 
            v-model="program.status" 
            class="status-select"
            @change="updateProgramStatus(program.id!, program.status)"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div class="program-info">
          <div class="info-item">
            <strong>Application Status:</strong> 
            <span :class="['status-indicator', getApplicationStatus(program)]">
              {{ getApplicationStatus(program) }}
            </span>
          </div>
          <div class="info-item">
            <strong>Last Updated:</strong> 
            {{ formatDate(program.updatedAt) }}
          </div>
        </div>

        <div class="program-actions">
          <button @click="viewProgram(program.slug)" class="btn btn-outline">View Program</button>
          <button @click="editProgram(program.id!)" class="btn btn-primary">Edit Details</button>
        </div>
      </div>
    </div>

    <div v-if="updateMessage" :class="['update-message', updateMessageType]">
      {{ updateMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProgramService, { type Program } from '../../services/programService'

const router = useRouter()

const programs = ref<Program[]>([])
const loading = ref(true)
const error = ref('')
const updateMessage = ref('')
const updateMessageType = ref<'success' | 'error'>('success')

const loadPrograms = async () => {
  loading.value = true
  error.value = ''
  
  try {
    programs.value = await ProgramService.getAllPrograms()
  } catch (err: any) {
    error.value = err.message || 'Failed to load programs'
  } finally {
    loading.value = false
  }
}

const updateProgramDates = async (programId: string, dates: any) => {
  try {
    await ProgramService.updateProgramDates(programId, dates)
    showUpdateMessage('Program dates updated successfully!', 'success')
  } catch (err: any) {
    showUpdateMessage('Failed to update dates: ' + err.message, 'error')
  }
}

const updateProgramStatus = async (programId: string, status: string) => {
  try {
    await ProgramService.updateProgram(programId, { status })
    showUpdateMessage('Program status updated successfully!', 'success')
  } catch (err: any) {
    showUpdateMessage('Failed to update status: ' + err.message, 'error')
  }
}

const showUpdateMessage = (message: string, type: 'success' | 'error') => {
  updateMessage.value = message
  updateMessageType.value = type
  setTimeout(() => {
    updateMessage.value = ''
  }, 3000)
}

const getApplicationStatus = (program: Program) => {
  return ProgramService.getApplicationStatus(program)
}

const formatDate = (date: Date) => {
  return ProgramService.formatDate(date.toISOString())
}

const viewProgram = (slug: string) => {
  window.open(`/programs/${slug}`, '_blank')
}

const editProgram = (programId: string) => {
  router.push(`/admin/programs/${programId}/edit`)
}

onMounted(() => {
  loadPrograms()
})
</script>

<style scoped>
.program-management {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--neutral-900);
}

.subtitle {
  color: var(--neutral-600);
  margin: 0;
}

.programs-container {
  display: grid;
  gap: 2rem;
}

.program-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.program-header h3 {
  margin: 0;
  color: var(--neutral-900);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: var(--success-100);
  color: var(--success-700);
}

.status-badge.inactive {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.status-badge.draft {
  background: var(--warning-100);
  color: var(--warning-700);
}

.program-dates h4,
.program-status h4 {
  margin: 0 0 1rem 0;
  color: var(--neutral-800);
  font-size: 1rem;
}

.dates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.date-field {
  display: flex;
  flex-direction: column;
}

.date-field label {
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.date-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.program-status {
  margin-bottom: 1.5rem;
}

.status-select {
  padding: 0.5rem;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: white;
}

.program-info {
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--neutral-100);
}

.info-item:last-child {
  border-bottom: none;
}

.status-indicator {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-indicator.open {
  background: var(--success-100);
  color: var(--success-700);
}

.status-indicator.closed {
  background: var(--danger-100);
  color: var(--danger-700);
}

.status-indicator.upcoming {
  background: var(--warning-100);
  color: var(--warning-700);
}

.program-actions {
  display: flex;
  gap: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--neutral-600);
}

.error-message {
  background: var(--danger-50);
  color: var(--danger-700);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--danger-200);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.update-message.success {
  background: var(--success-50);
  color: var(--success-700);
  border: 1px solid var(--success-200);
}

.update-message.error {
  background: var(--danger-50);
  color: var(--danger-700);
  border: 1px solid var(--danger-200);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .program-management {
    padding: 1rem;
  }
  
  .dates-grid {
    grid-template-columns: 1fr;
  }
  
  .program-actions {
    flex-direction: column;
  }
  
  .update-message {
    right: 1rem;
    left: 1rem;
  }
}
</style>

<template>
  <div class="program-list">
    <div class="list-header">
      <h3>Programs</h3>
      <button @click="createNew" class="btn btn-primary">Create New Program</button>
    </div>

    <div v-if="loading" class="loading">
      Loading programs...
    </div>

    <div v-else-if="programs.length === 0" class="empty-state">
      <p>No programs found. Create your first program!</p>
    </div>

    <div v-else class="programs-grid">
      <div v-for="program in programs" :key="program.id" class="program-card">
        <div class="program-header">
          <h4>{{ program.name }}</h4>
          <span :class="['status-badge', program.status]">{{ program.status }}</span>
        </div>
        
        <p class="program-description">{{ program.description }}</p>
        
        <div class="program-dates">
          <div class="date-item">
            <strong>Applications:</strong> 
            {{ formatDate(program.dates.applicationStart) }} - {{ formatDate(program.dates.applicationEnd) }}
          </div>
          <div class="date-item">
            <strong>Program:</strong> 
            {{ formatDate(program.dates.programStart) }} - {{ formatDate(program.dates.programEnd) }}
          </div>
        </div>
        
        <div class="program-actions">
          <button @click="editProgram(program.id!)" class="btn btn-outline btn-sm">Edit</button>
          <button @click="viewProgram(program.slug)" class="btn btn-outline btn-sm">View</button>
          <button @click="deleteProgram(program.id!)" class="btn btn-danger btn-sm">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DatabaseService, type Program } from '../../services/firebase'

const emit = defineEmits<{
  create: []
  edit: [programId: string]
}>()

const programs = ref<Program[]>([])
const loading = ref(true)
const error = ref('')

const loadPrograms = async () => {
  loading.value = true
  error.value = ''
  
  try {
    programs.value = await DatabaseService.getAllPrograms()
  } catch (err: any) {
    error.value = err.message || 'Failed to load programs'
  } finally {
    loading.value = false
  }
}

const createNew = () => {
  emit('create')
}

const editProgram = (programId: string) => {
  emit('edit', programId)
}

const viewProgram = (slug: string) => {
  window.open(`/programs/${slug}`, '_blank')
}

const deleteProgram = async (programId: string) => {
  if (!confirm('Are you sure you want to delete this program?')) return
  
  try {
    await DatabaseService.deleteProgram(programId)
    await loadPrograms()
  } catch (err: any) {
    error.value = err.message || 'Failed to delete program'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadPrograms()
})
</script>

<style scoped>
.program-list {
  padding: 1rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-header h3 {
  margin: 0;
  color: var(--neutral-900);
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.program-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.program-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-200);
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.program-header h4 {
  margin: 0;
  color: var(--neutral-900);
  font-size: 1.125rem;
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

.program-description {
  color: var(--neutral-600);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.program-dates {
  margin-bottom: 1.5rem;
}

.date-item {
  font-size: 0.875rem;
  color: var(--neutral-700);
  margin-bottom: 0.5rem;
}

.program-actions {
  display: flex;
  gap: 0.5rem;
}

.loading,
.empty-state {
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
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .programs-grid {
    grid-template-columns: 1fr;
  }
  
  .list-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>

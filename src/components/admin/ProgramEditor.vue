<template>
  <div class="program-editor">
    <div class="editor-header">
      <h2>{{ isEditing ? 'Edit Program' : 'Create New Program' }}</h2>
      <div class="header-actions">
        <button @click="saveProgram" :disabled="saving" class="btn btn-primary">
          {{ saving ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
        </button>
        <button @click="cancelEdit" class="btn btn-outline">Cancel</button>
      </div>
    </div>

    <form @submit.prevent="saveProgram" class="program-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h3>Basic Information</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Program Name *</label>
            <input v-model="program.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label>URL Slug *</label>
            <input v-model="program.slug" type="text" class="form-input" required />
          </div>
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea v-model="program.description" class="form-textarea" rows="3" required></textarea>
        </div>
      </div>

      <!-- Program Dates -->
      <div class="form-section">
        <h3>Program Dates</h3>
        <div class="dates-grid">
          <div class="form-group">
            <label>Application Start *</label>
            <input v-model="program.dates.applicationStart" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>Application End *</label>
            <input v-model="program.dates.applicationEnd" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>Program Start *</label>
            <input v-model="program.dates.programStart" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>Program End *</label>
            <input v-model="program.dates.programEnd" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>Decisions By *</label>
            <input v-model="program.dates.decisionsBy" type="date" class="form-input" required />
          </div>
        </div>
      </div>

      <!-- Contact Info -->
      <div class="form-section">
        <h3>Contact Information</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Contact Email *</label>
            <input v-model="program.contact.email" type="email" class="form-input" required />
          </div>
          <div class="form-group">
            <label>Contact Phone</label>
            <input v-model="program.contact.phone" type="tel" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="form-section">
        <h3>Program Status</h3>
        <div class="form-group">
          <label>Status</label>
          <select v-model="program.status" class="form-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
    </form>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { DatabaseService, AuthService, type Program } from '../../services/firebase'

const props = defineProps<{
  programId?: string
}>()

const emit = defineEmits<{
  saved: [programId: string]
  cancelled: []
}>()

const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const isEditing = computed(() => !!props.programId)

const program = reactive({
  name: '',
  slug: '',
  description: '',
  dates: {
    applicationStart: '',
    applicationEnd: '',
    programStart: '',
    programEnd: '',
    decisionsBy: ''
  },
  contact: {
    email: '',
    phone: ''
  },
  status: 'draft' as 'active' | 'inactive' | 'draft'
})

const saveProgram = async () => {
  saving.value = true
  message.value = ''
  
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')

    const programData = {
      ...program,
      updatedBy: currentUser.uid
    }

    if (isEditing.value && props.programId) {
      await DatabaseService.updateProgram(props.programId, programData)
      showMessage('Program updated successfully!', 'success')
    } else {
      const programId = await DatabaseService.createProgram(programData)
      showMessage('Program created successfully!', 'success')
      emit('saved', programId)
    }
  } catch (error: any) {
    showMessage(error.message || 'Failed to save program', 'error')
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  emit('cancelled')
}

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => message.value = '', 5000)
}

onMounted(() => {
  if (props.programId) {
    loadProgram()
  }
})

const loadProgram = async () => {
  try {
    const programs = await DatabaseService.getAllPrograms()
    const programData = programs.find(p => p.id === props.programId)
    if (programData) {
      Object.assign(program, {
        name: programData.name,
        slug: programData.slug,
        description: programData.description,
        dates: programData.dates,
        contact: programData.contact,
        status: programData.status
      })
    }
  } catch (error) {
    showMessage('Failed to load program', 'error')
  }
}
</script>

<style scoped>
.program-editor {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--neutral-200);
}

.form-section {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  margin-bottom: 2rem;
}

.form-section h3 {
  margin: 0 0 1.5rem 0;
  color: var(--neutral-900);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.message {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  font-weight: 500;
}

.message.success {
  background: var(--success-50);
  color: var(--success-700);
  border: 1px solid var(--success-200);
}

.message.error {
  background: var(--danger-50);
  color: var(--danger-700);
  border: 1px solid var(--danger-200);
}

@media (max-width: 768px) {
  .form-row,
  .dates-grid {
    grid-template-columns: 1fr;
  }
}
</style>

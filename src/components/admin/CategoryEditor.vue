<template>
  <div class="category-editor">
    <div class="editor-header">
      <h2>{{ isEditing ? 'Edit Category' : 'Create New Category' }}</h2>
      <div class="header-actions">
        <button @click="saveCategory" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Category' }}
        </button>
        <button @click="cancel" class="btn btn-outline" :disabled="saving">
          Cancel
        </button>
      </div>
    </div>

    <form @submit.prevent="saveCategory" class="editor-form">
      <div class="form-group">
        <label for="name" class="form-label">Name *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Enter category name"
          required
          :disabled="saving"
        />
      </div>

      <div class="form-group">
        <label for="slug" class="form-label">Slug *</label>
        <input
          id="slug"
          v-model="form.slug"
          type="text"
          class="form-input"
          placeholder="category-slug"
          required
          :disabled="saving"
        />
        <small class="form-hint">URL-friendly version of the name</small>
      </div>

      <div class="form-group">
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          class="form-textarea"
          rows="3"
          placeholder="Brief description of the category"
          :disabled="saving"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
          {{ saving ? 'Saving...' : 'Save Category' }}
        </button>
        <button type="button" @click="cancel" class="btn btn-outline" :disabled="saving">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { contentfulManagement } from '../../services/contentful-management'

// Props
interface Props {
  category?: {
    id?: string
    name: string
    slug: string
    description?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  category: undefined
})

// Emits
const emit = defineEmits<{
  saved: [category: any]
  cancelled: []
}>()

// State
const saving = ref(false)
const form = ref({
  name: props.category?.name || '',
  slug: props.category?.slug || '',
  description: props.category?.description || ''
})

// Computed
const isEditing = computed(() => !!props.category?.id)
const canSave = computed(() => form.value.name.trim() && form.value.slug.trim())

// Methods
const saveCategory = async () => {
  if (!canSave.value) return

  saving.value = true
  try {
    const result = await contentfulManagement.createCategory({
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description
    })
    
    if (result.success) {
      emit('saved', { id: result.entryId, ...form.value })
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    console.error('Error saving category:', error)
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  emit('cancelled')
}
</script>

<style scoped>
.category-editor {
  max-width: 800px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.editor-header h2 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.editor-form {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6c757d;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1565c0;
}

.btn-primary:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f8f9fa;
  color: #495057;
}

.btn-outline:disabled {
  color: #bdbdbd;
  border-color: #e9ecef;
  cursor: not-allowed;
}
</style>

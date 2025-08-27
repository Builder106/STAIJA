<template>
  <div class="alumni-story-editor">
    <div class="editor-header">
      <h2>{{ isEditing ? 'Edit Alumni Story' : 'Create New Alumni Story' }}</h2>
      <div class="header-actions">
        <button @click="saveStory" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Story' }}
        </button>
        <button @click="cancel" class="btn btn-outline" :disabled="saving">
          Cancel
        </button>
      </div>
    </div>

    <form @submit.prevent="saveStory" class="editor-form">
      <div class="form-group">
        <label for="title" class="form-label">Title *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          class="form-input"
          placeholder="Enter story title"
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
          placeholder="alumni-story-slug"
          required
          :disabled="saving"
        />
      </div>

      <div class="form-group">
        <label for="excerpt" class="form-label">Excerpt</label>
        <textarea
          id="excerpt"
          v-model="form.excerpt"
          class="form-textarea"
          rows="3"
          placeholder="Brief excerpt of the story"
          :disabled="saving"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="content" class="form-label">Content</label>
        <textarea
          id="content"
          v-model="form.content"
          class="form-textarea"
          rows="12"
          placeholder="Full story content"
          :disabled="saving"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="alumnusName" class="form-label">Alumnus Name</label>
          <input
            id="alumnusName"
            v-model="form.alumnusName"
            type="text"
            class="form-input"
            placeholder="Alumnus name"
            :disabled="saving"
          />
        </div>

        <div class="form-group">
          <label for="cohort" class="form-label">Cohort</label>
          <input
            id="cohort"
            v-model="form.cohort"
            type="text"
            class="form-input"
            placeholder="e.g., 2023, Spring 2022"
            :disabled="saving"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="profileImage" class="form-label">Profile Image URL</label>
        <input
          id="profileImage"
          v-model="form.profileImage"
          type="url"
          class="form-input"
          placeholder="https://example.com/profile.jpg"
          :disabled="saving"
        />
      </div>

      <div class="form-group">
        <label for="status" class="form-label">Status *</label>
        <select
          id="status"
          v-model="form.status"
          class="form-input"
          required
          :disabled="saving"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div class="form-group">
        <label for="publishDate" class="form-label">Publish Date</label>
        <input
          id="publishDate"
          v-model="form.publishDate"
          type="date"
          class="form-input"
          :disabled="saving"
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
          {{ saving ? 'Saving...' : 'Save Story' }}
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
  story?: {
    id?: string
    title: string
    slug: string
    excerpt?: string
    content?: string
    alumnusName?: string
    cohort?: string
    profileImage?: string
    status: 'draft' | 'published'
    publishDate?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  story: undefined
})

// Emits
const emit = defineEmits<{
  saved: [story: any]
  cancelled: []
}>()

// State
const saving = ref(false)
const form = ref({
  title: props.story?.title || '',
  slug: props.story?.slug || '',
  excerpt: props.story?.excerpt || '',
  content: props.story?.content || '',
  alumnusName: props.story?.alumnusName || '',
  cohort: props.story?.cohort || '',
  profileImage: props.story?.profileImage || '',
  status: props.story?.status || 'draft',
  publishDate: props.story?.publishDate || ''
})

// Computed
const isEditing = computed(() => !!props.story?.id)
const canSave = computed(() => form.value.title.trim() && form.value.slug.trim())

// Methods
const saveStory = async () => {
  if (!canSave.value) return

  saving.value = true
  try {
    const result = await contentfulManagement.createAlumniStory({
      title: form.value.title,
      slug: form.value.slug,
      excerpt: form.value.excerpt,
      content: form.value.content,
      alumnusName: form.value.alumnusName,
      cohort: form.value.cohort,
      profileImage: form.value.profileImage,
      status: form.value.status,
      publishDate: form.value.publishDate
    })
    
    if (result.success) {
      emit('saved', { id: result.entryId, ...form.value })
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    console.error('Error saving story:', error)
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  emit('cancelled')
}
</script>

<style scoped>
.alumni-story-editor {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

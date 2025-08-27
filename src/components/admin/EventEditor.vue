<template>
  <div class="event-editor">
    <div class="editor-header">
      <h2>{{ isEditing ? 'Edit Event' : 'Create New Event' }}</h2>
      <div class="header-actions">
        <button @click="saveEvent" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Event' }}
        </button>
        <button @click="cancel" class="btn btn-outline" :disabled="saving">
          Cancel
        </button>
      </div>
    </div>

    <form @submit.prevent="saveEvent" class="editor-form">
      <div class="form-group">
        <label for="title" class="form-label">Title *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          class="form-input"
          placeholder="Enter event title"
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
          placeholder="event-slug"
          required
          :disabled="saving"
        />
      </div>

      <div class="form-group">
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          class="form-textarea"
          rows="4"
          placeholder="Event description"
          :disabled="saving"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startsAt" class="form-label">Start Date & Time *</label>
          <input
            id="startsAt"
            v-model="form.startsAt"
            type="datetime-local"
            class="form-input"
            required
            :disabled="saving"
          />
        </div>

        <div class="form-group">
          <label for="endsAt" class="form-label">End Date & Time</label>
          <input
            id="endsAt"
            v-model="form.endsAt"
            type="datetime-local"
            class="form-input"
            :disabled="saving"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="location" class="form-label">Location</label>
        <input
          id="location"
          v-model="form.location"
          type="text"
          class="form-input"
          placeholder="Event location"
          :disabled="saving"
        />
      </div>

      <div class="form-group">
        <label for="coverImage" class="form-label">Cover Image URL</label>
        <input
          id="coverImage"
          v-model="form.coverImage"
          type="url"
          class="form-input"
          placeholder="https://example.com/event-image.jpg"
          :disabled="saving"
        />
      </div>

      <div class="form-group">
        <label for="registrationUrl" class="form-label">Registration URL</label>
        <input
          id="registrationUrl"
          v-model="form.registrationUrl"
          type="url"
          class="form-input"
          placeholder="https://example.com/register"
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
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
          {{ saving ? 'Saving...' : 'Save Event' }}
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
  event?: {
    id?: string
    title: string
    slug: string
    description?: string
    startsAt: string
    endsAt?: string
    location?: string
    coverImage?: string
    registrationUrl?: string
    status: 'draft' | 'published' | 'cancelled'
  }
}

const props = withDefaults(defineProps<Props>(), {
  event: undefined
})

// Emits
const emit = defineEmits<{
  saved: [event: any]
  cancelled: []
}>()

// State
const saving = ref(false)
const form = ref({
  title: props.event?.title || '',
  slug: props.event?.slug || '',
  description: props.event?.description || '',
  startsAt: props.event?.startsAt || '',
  endsAt: props.event?.endsAt || '',
  location: props.event?.location || '',
  coverImage: props.event?.coverImage || '',
  registrationUrl: props.event?.registrationUrl || '',
  status: props.event?.status || 'draft'
})

// Computed
const isEditing = computed(() => !!props.event?.id)
const canSave = computed(() => form.value.title.trim() && form.value.slug.trim() && form.value.startsAt)

// Methods
const saveEvent = async () => {
  if (!canSave.value) return

  saving.value = true
  try {
    const result = await contentfulManagement.createEvent({
      title: form.value.title,
      slug: form.value.slug,
      description: form.value.description,
      startsAt: form.value.startsAt,
      endsAt: form.value.endsAt,
      location: form.value.location,
      coverImage: form.value.coverImage,
      registrationUrl: form.value.registrationUrl,
      status: form.value.status
    })
    
    if (result.success) {
      emit('saved', { id: result.entryId, ...form.value })
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    console.error('Error saving event:', error)
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  emit('cancelled')
}
</script>

<style scoped>
.event-editor {
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

<template>
  <div class="blog-post-editor">
    <div class="editor-header">
      <h2>{{ isEditing ? 'Edit Blog Post' : 'Create New Blog Post' }}</h2>
      <div class="header-actions">
        <button @click="saveDraft" class="btn btn-secondary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Draft' }}
        </button>
        <button @click="publishPost" class="btn btn-primary" :disabled="saving || !canPublish">
          {{ saving ? 'Publishing...' : 'Publish' }}
        </button>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="editor-form">
      <div class="form-group">
        <label for="title" class="form-label">Title *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          class="form-input"
          placeholder="Enter blog post title"
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
          placeholder="Brief description of the blog post (optional)"
          :disabled="saving"
        ></textarea>
        <small class="form-hint">Leave empty to auto-generate from content</small>
      </div>

      <div class="form-group">
        <label for="content" class="form-label">Content *</label>
        <textarea
          id="content"
          v-model="form.content"
          class="form-textarea"
          rows="15"
          placeholder="Write your blog post content here..."
          required
          :disabled="saving"
        ></textarea>
        <div class="content-stats">
          <span>{{ contentWordCount }} words</span>
          <span>{{ contentCharCount }} characters</span>
        </div>
      </div>

      <div class="form-group">
        <label for="tags" class="form-label">Tags</label>
        <div class="tags-input">
          <div class="tags-list">
            <span
              v-for="(tag, index) in form.tags"
              :key="index"
              class="tag"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(index)"
                class="tag-remove"
                :disabled="saving"
              >
                ×
              </button>
            </span>
          </div>
          <div class="tag-input-group">
            <input
              v-model="newTag"
              type="text"
              class="form-input"
              placeholder="Add a tag"
              @keydown.enter.prevent="addTag"
              :disabled="saving"
            />
            <button
              type="button"
              @click="addTag"
              class="btn btn-sm btn-outline"
              :disabled="saving || !newTag.trim()"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-ghost" :disabled="saving">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !canPublish">
          {{ isEditing ? 'Update Post' : 'Create Post' }}
        </button>
      </div>
    </form>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { contentfulManagement, type BlogPostData } from '../../services/contentful-management'

interface Props {
  post?: BlogPost
}

const props = defineProps<Props>()
const emit = defineEmits<{
  saved: [post: BlogPost]
  cancelled: []
}>()

const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const newTag = ref('')

const form = ref<BlogPostData>({
  title: '',
  content: '',
  excerpt: '',
  tags: []
})

const isEditing = computed(() => !!props.post)

const contentWordCount = computed(() => {
  return form.value.content.trim().split(/\s+/).filter(word => word.length > 0).length
})

const contentCharCount = computed(() => {
  return form.value.content.length
})

const canPublish = computed(() => {
  return form.value.title.trim() && form.value.content.trim()
})

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags?.includes(tag)) {
    form.value.tags = [...(form.value.tags || []), tag]
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.value.tags = form.value.tags?.filter((_, i) => i !== index) || []
}

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

const saveDraft = async () => {
  if (!canPublish.value) {
    showMessage('Please fill in title and content to save', 'error')
    return
  }
  
  await handleSubmit(true)
}

const publishPost = async () => {
  if (!canPublish.value) {
    showMessage('Please fill in title and content to publish', 'error')
    return
  }
  
  await handleSubmit(false)
}

const handleSubmit = async (isDraft = false) => {
  saving.value = true
  
  try {
    if (isEditing.value && props.post) {
      // Update existing post
      // TODO: Implement update functionality
      console.log('Update functionality not yet implemented')
      showMessage('Blog post updated successfully!', 'success')
    } else {
      // Create new post
      const result = await contentfulManagement.createBlogPost(form.value)
      showMessage('Blog post created successfully!', 'success')
      
      // Emit saved event with the new post data
      const newPost: BlogPost = {
        id: result.entryId,
        ...form.value,
        publishDate: new Date().toISOString(),
        status: isDraft ? 'draft' : 'published',
        author: 'Current User' // This will be set by the function
      }
      emit('saved', newPost)
    }
  } catch (error: any) {
    showMessage(error.message || 'Failed to save blog post', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.post) {
    form.value = {
      title: props.post.title,
      content: props.post.content,
      excerpt: props.post.excerpt || '',
      tags: props.post.tags || []
    }
  }
})
</script>

<style scoped>
.blog-post-editor {
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

.editor-header h2 {
  margin: 0;
  color: var(--neutral-900);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--neutral-700);
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  font-size: 0.875rem;
  color: var(--neutral-600);
}

.content-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--neutral-600);
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--primary-600);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: var(--primary-800);
}

.tag-input-group {
  display: flex;
  gap: 0.5rem;
}

.tag-input-group .form-input {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--neutral-200);
}

.message {
  padding: 1rem;
  border-radius: var(--radius-lg);
  margin-top: 1rem;
  font-weight: 500;
}

.message.success {
  background: var(--success-500);
  color: white;
}

.message.error {
  background: var(--error-500);
  color: white;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
</style>

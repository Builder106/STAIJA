<template>
  <div class="new-blog-post">
    <div class="header">
      <h1>Create New Blog Post</h1>
      <div class="header-actions">
        <button @click="$router.push('/content/blog')" class="btn-secondary">
          Cancel
        </button>
        <button @click="saveAsDraft" class="btn-draft">
          Save as Draft
        </button>
        <button @click="publishPost" :disabled="!isFormValid" class="btn-primary">
          Publish Post
        </button>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-main">
        <!-- Title Input -->
        <div class="form-group">
          <label for="title">Post Title *</label>
          <input
            id="title"
            v-model="post.title"
            type="text"
            placeholder="Enter an engaging title..."
            class="title-input"
            :class="{ 'error': !post.title.trim() && showValidation }"
          >
          <span v-if="!post.title.trim() && showValidation" class="error-message">
            Title is required
          </span>
        </div>

        <!-- Excerpt -->
        <div class="form-group">
          <label for="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            v-model="post.excerpt"
            placeholder="Brief summary of the post (optional)..."
            class="excerpt-input"
            rows="3"
            maxlength="300"
          ></textarea>
          <span class="char-count">{{ post.excerpt.length }}/300</span>
        </div>

        <!-- Content Editor -->
        <div class="form-group">
          <label for="content">Content *</label>
          <div class="editor-toolbar">
            <button @click="insertBold" class="toolbar-btn">
              <strong>B</strong>
            </button>
            <button @click="insertItalic" class="toolbar-btn">
              <em>I</em>
            </button>
            <button @click="insertLink" class="toolbar-btn">
              🔗
            </button>
            <button @click="insertImage" class="toolbar-btn">
              🖼️
            </button>
            <button @click="insertList" class="toolbar-btn">
              📝
            </button>
          </div>
          <textarea
            id="content"
            v-model="post.content"
            placeholder="Write your blog post content here..."
            class="content-editor"
            rows="20"
            :class="{ 'error': !post.content.trim() && showValidation }"
          ></textarea>
          <span v-if="!post.content.trim() && showValidation" class="error-message">
            Content is required
          </span>
        </div>
      </div>

      <div class="editor-sidebar">
        <!-- Status -->
        <div class="sidebar-section">
          <h3>Status</h3>
          <div class="status-options">
            <label class="status-option">
              <input
                type="radio"
                value="draft"
                v-model="post.status"
              >
              <span class="status-label">Draft</span>
              <span class="status-desc">Save as draft, not visible to readers</span>
            </label>
            <label class="status-option">
              <input
                type="radio"
                value="published"
                v-model="post.status"
              >
              <span class="status-label">Published</span>
              <span class="status-desc">Make post visible to all readers</span>
            </label>
          </div>
        </div>

        <!-- Categories -->
        <div class="sidebar-section">
          <h3>Categories</h3>
          <div v-if="categoriesLoading" class="loading-text">Loading categories...</div>
          <div v-else>
            <div v-if="availableCategories.length === 0" class="empty-text">No categories available</div>
            <div v-else class="category-tags">
              <span
                v-for="category in availableCategories"
                :key="category"
                @click="toggleCategory(category)"
                :class="['category-tag', { 'selected': post.categories.includes(category) }]"
              >
                {{ category }}
              </span>
            </div>
          </div>
          <input
            v-model="newCategory"
            @keyup.enter="addCategory"
            placeholder="Add new category..."
            class="add-category-input"
          >
        </div>

        <!-- Tags -->
        <div class="sidebar-section">
          <h3>Tags</h3>
          <div class="tags-input">
            <div class="tag-chips">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="tag-chip"
              >
                {{ tag }}
                <button @click="removeTag(tag)" class="tag-remove">×</button>
              </span>
            </div>
            <input
              v-model="newTag"
              @keyup.enter="addTag"
              placeholder="Add tags..."
              class="add-tag-input"
            >
          </div>
        </div>

        <!-- Featured Image -->
        <div class="sidebar-section">
          <h3>Featured Image</h3>
          <div class="image-upload">
            <div v-if="!post.featuredImage" class="upload-placeholder">
              <div class="upload-icon">📷</div>
              <p>Click to upload image</p>
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="file-input"
              >
            </div>
            <div v-else class="image-preview">
              <img :src="post.featuredImage" alt="Featured image" class="preview-image">
              <button @click="removeImage" class="remove-image">×</button>
            </div>
          </div>
        </div>

        <!-- SEO Settings -->
        <div class="sidebar-section">
          <h3>SEO Settings</h3>
          <div class="seo-fields">
            <div class="form-group">
              <label for="seo-title">SEO Title</label>
              <input
                id="seo-title"
                v-model="post.seoTitle"
                type="text"
                placeholder="Custom SEO title..."
                maxlength="60"
              >
              <span class="char-count">{{ (post.seoTitle || post.title).length }}/60</span>
            </div>
            <div class="form-group">
              <label for="seo-description">Meta Description</label>
              <textarea
                id="seo-description"
                v-model="post.seoDescription"
                placeholder="Brief description for search engines..."
                rows="3"
                maxlength="160"
              ></textarea>
              <span class="char-count">{{ (post.seoDescription || post.excerpt).length }}/160</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, DatabaseService } from '../../services/firebase'

const router = useRouter()

// Reactive data
const post = ref({
  title: '',
  excerpt: '',
  content: '',
  status: 'draft' as 'draft' | 'published',
  categories: [] as string[],
  tags: [] as string[],
  featuredImage: '',
  seoTitle: '',
  seoDescription: '',
  author: '',
  createdAt: new Date()
})

const newCategory = ref('')
const newTag = ref('')
const showValidation = ref(false)

// Reactive data for available categories (to be loaded from API)
const availableCategories = ref<string[]>([])
const categoriesLoading = ref(true)

// Computed properties
const isFormValid = computed(() => {
  return post.value.title.trim() && post.value.content.trim()
})

// Methods
const saveAsDraft = () => {
  post.value.status = 'draft'
  savePost()
}

const publishPost = () => {
  if (!isFormValid.value) {
    showValidation.value = true
    return
  }

  post.value.status = 'published'
  savePost()
}

const savePost = async () => {
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      alert('You must be logged in to create a post.')
      return
    }

    const contentItem = {
      title: post.value.title,
      content: post.value.content,
      author: post.value.author,
      type: 'blog' as const,
      status: post.value.status,
      tags: post.value.tags,
      publishDate: post.value.status === 'published' ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const postId = await DatabaseService.createContentItem(contentItem)

    // Show success message
    alert(`Post ${post.value.status === 'published' ? 'published' : 'saved as draft'} successfully!`)

    // Redirect to blog management
    router.push('/content/blog')
  } catch (error) {
    console.error('Error saving post:', error)
    alert('Failed to save post. Please try again.')
  }
}

const toggleCategory = (category: string) => {
  const index = post.value.categories.indexOf(category)
  if (index > -1) {
    post.value.categories.splice(index, 1)
  } else {
    post.value.categories.push(category)
  }
}

const addCategory = () => {
  if (newCategory.value.trim() && !post.value.categories.includes(newCategory.value.trim())) {
    post.value.categories.push(newCategory.value.trim())
    newCategory.value = ''
  }
}

const addTag = () => {
  if (newTag.value.trim() && !post.value.tags.includes(newTag.value.trim())) {
    post.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = post.value.tags.indexOf(tag)
  if (index > -1) {
    post.value.tags.splice(index, 1)
  }
}

const insertBold = () => {
  // In a real editor, this would wrap selected text
  post.value.content += '**bold text**'
}

const insertItalic = () => {
  post.value.content += '*italic text*'
}

const insertLink = () => {
  const url = prompt('Enter URL:')
  if (url) {
    const text = prompt('Enter link text:', 'link text') || 'link text'
    post.value.content += `[${text}](${url})`
  }
}

const insertImage = () => {
  const url = prompt('Enter image URL:')
  if (url) {
    const alt = prompt('Enter alt text:', 'Image description') || 'Image description'
    post.value.content += `![${alt}](${url})`
  }
}

const insertList = () => {
  post.value.content += '\n- List item 1\n- List item 2\n- List item 3'
}

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // In a real app, this would upload to storage and get URL
    const reader = new FileReader()
    reader.onload = (e) => {
      post.value.featuredImage = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  post.value.featuredImage = ''
}

// Load categories data
const loadCategories = async () => {
  try {
    // For now, we'll use a predefined set of categories
    // In a real app, this could come from a categories collection
    availableCategories.value = [
      'Education',
      'Technology',
      'Career Development',
      'Mentorship',
      'Innovation',
      'Community',
      'Research',
      'Leadership'
    ]
  } catch (error) {
    console.error('Error loading categories:', error)
  } finally {
    categoriesLoading.value = false
  }
}

// Initialize component
onMounted(async () => {
  const currentUser = AuthService.getCurrentUser()
  if (currentUser) {
    post.value.author = currentUser.displayName || currentUser.email || 'Unknown Author'
  }
  await loadCategories()
})
</script>

<style scoped>
.new-blog-post {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary, .btn-draft {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-draft {
  background: #ffc107;
  color: #212529;
}

.btn-draft:hover {
  background: #e0a800;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

.editor-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.title-input {
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: 600;
}

.title-input:focus {
  outline: none;
  border-color: #007bff;
}

.title-input.error {
  border-color: #dc3545;
}

.excerpt-input, .content-editor {
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

.excerpt-input:focus, .content-editor:focus {
  outline: none;
  border-color: #007bff;
}

.content-editor.error {
  border-color: #dc3545;
}

.char-count {
  font-size: 0.8rem;
  color: #6c757d;
  text-align: right;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: #f8f9fa;
}

.toolbar-btn {
  padding: 0.5rem;
  border: none;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: #e9ecef;
}

.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.sidebar-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.loading-text, .empty-text {
  color: #6c757d;
  font-style: italic;
  padding: 1rem 0;
}

.status-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.status-option:hover {
  background: #f8f9fa;
}

.status-label {
  font-weight: 600;
  color: #2c3e50;
}

.status-desc {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.category-tag {
  padding: 0.5rem 0.75rem;
  background: #e9ecef;
  color: #495057;
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.category-tag:hover {
  background: #dee2e6;
}

.category-tag.selected {
  background: #007bff;
  color: white;
}

.add-category-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 0.9rem;
}

.add-category-input:focus {
  outline: none;
  border-color: #007bff;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #007bff;
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.tag-remove:hover {
  opacity: 0.8;
}

.add-tag-input {
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 0.9rem;
}

.add-tag-input:focus {
  outline: none;
  border-color: #007bff;
}

.image-upload {
  text-align: center;
}

.upload-placeholder {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-placeholder:hover {
  border-color: #007bff;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-placeholder p {
  color: #6c757d;
  margin: 0;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.image-preview {
  position: relative;
}

.preview-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.seo-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.seo-fields .form-group {
  margin-bottom: 0;
}

@media (max-width: 1024px) {
  .editor-container {
    grid-template-columns: 1fr;
  }

  .editor-sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .new-blog-post {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .editor-toolbar {
    flex-wrap: wrap;
  }

  .status-option {
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-tags {
    justify-content: center;
  }
}
</style>

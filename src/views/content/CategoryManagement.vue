<template>
  <div class="category-management">
    <div class="header">
      <div class="header-content">
        <h1>Category Management</h1>
        <p class="subtitle">Organize content with categories and tags</p>
      </div>
      <div class="header-actions">
        <button @click="showAddCategoryModal = true" class="btn-primary">
          <Icon icon="lucide:plus" />
          New Category
        </button>
      </div>
    </div>

    <!-- Categories Overview -->
    <div class="categories-overview">
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-number">{{ categories.length }}</div>
          <div class="stat-label">Total Categories</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalPosts }}</div>
          <div class="stat-label">Total Posts</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ unusedCategories }}</div>
          <div class="stat-label">Unused Categories</div>
        </div>
      </div>
    </div>

    <!-- Categories List -->
    <div class="categories-section">
      <h2>Categories</h2>
      <div class="categories-grid" v-if="!categoriesLoading">
        <div
          v-if="categories.length === 0"
          class="empty-state"
        >
          <div class="empty-icon"><Icon icon="lucide:folder" /></div>
          <h3>No categories found</h3>
          <p>Create your first category to organize content.</p>
          <button @click="showAddCategoryModal = true" class="btn-primary">
            Create First Category
          </button>
        </div>
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
        >
          <div class="category-header">
            <div class="category-info">
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
            </div>
            <div class="category-actions">
              <button @click="editCategory(category)" class="btn-edit">
                Edit
              </button>
              <button @click="deleteCategory(category)" class="btn-delete">
                Delete
              </button>
            </div>
          </div>

          <div class="category-stats">
            <div class="stat-item">
              <span class="stat-value">{{ category.postCount }}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ category.viewCount }}</span>
              <span class="stat-label">Views</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ category.lastUpdated }}</span>
              <span class="stat-label">Last Updated</span>
            </div>
          </div>

          <div class="category-color">
            <span class="color-preview" :style="{ backgroundColor: category.color }"></span>
            <span class="color-code">{{ category.color }}</span>
          </div>
        </div>
      </div>

      <div class="categories-grid" v-else>
        <div class="loading-state">
          <div class="loading-icon"><Icon icon="lucide:hourglass" /></div>
          <h3>Loading categories...</h3>
        </div>
      </div>
    </div>

    <!-- Tags Section -->
    <div class="tags-section">
      <div class="tags-header">
        <h2>Popular Tags</h2>
        <button @click="showTagManagement = !showTagManagement" class="btn-secondary">
          {{ showTagManagement ? 'Hide' : 'Manage' }} Tags
        </button>
      </div>

      <div v-if="showTagManagement" class="tag-management">
        <div class="tag-input-section">
          <input
            v-model="newTag"
            @keyup.enter="addTag"
            placeholder="Add new tag..."
            class="tag-input"
          >
          <button @click="addTag" class="btn-add-tag">Add Tag</button>
        </div>

        <div class="existing-tags">
          <h3>Existing Tags</h3>
          <div class="tags-list">
            <div
              v-for="tag in tags"
              :key="tag.id"
              class="tag-item"
            >
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-usage">{{ tag.usageCount }} posts</span>
              <button @click="deleteTag(tag)" class="btn-remove-tag">×</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!tagsLoading" class="popular-tags">
        <div
          v-if="popularTags.length === 0"
          class="empty-tags"
        >
          <div class="empty-icon"><Icon icon="lucide:tag" /></div>
          <h3>No tags found</h3>
          <p>Add tags to organize and find content easily.</p>
        </div>
        <div
          v-for="tag in popularTags"
          :key="tag.id"
          class="popular-tag"
          :style="{ fontSize: tag.size + 'px' }"
        >
          {{ tag.name }}
        </div>
      </div>

      <div v-else class="loading-tags">
        <div class="loading-icon"><Icon icon="lucide:hourglass" /></div>
        <h3>Loading tags...</h3>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showAddCategoryModal || editingCategory" class="modal-overlay" @click="closeCategoryModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
          <button @click="closeCategoryModal" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="categoryName">Category Name *</label>
            <input
              id="categoryName"
              v-model="categoryForm.name"
              type="text"
              placeholder="Enter category name..."
              class="form-input"
              :class="{ 'error': !categoryForm.name.trim() && showValidation }"
            >
            <span v-if="!categoryForm.name.trim() && showValidation" class="error-message">
              Category name is required
            </span>
          </div>

          <div class="form-group">
            <label for="categoryDescription">Description</label>
            <textarea
              id="categoryDescription"
              v-model="categoryForm.description"
              placeholder="Describe this category..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="categoryColor">Color</label>
            <div class="color-picker">
              <input
                id="categoryColor"
                v-model="categoryForm.color"
                type="color"
                class="color-input"
              >
              <span class="color-preview" :style="{ backgroundColor: categoryForm.color }"></span>
              <span class="color-code">{{ categoryForm.color }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="categorySlug">URL Slug</label>
            <input
              id="categorySlug"
              v-model="categoryForm.slug"
              type="text"
              placeholder="url-friendly-slug"
              class="form-input"
            >
            <small class="form-hint">This will be used in URLs. Auto-generated if left empty.</small>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCategoryModal" class="btn-cancel">Cancel</button>
          <button
            @click="saveCategory"
            :disabled="!categoryForm.name.trim() || saving"
            class="btn-save"
          >
            <span v-if="saving" class="spinner"></span>
            {{ saving ? 'Saving...' : 'Save Category' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { DatabaseService } from '../../services/firebase'

interface Category {
  id: string
  name: string
  description: string
  slug: string
  color: string
  postCount: number
  viewCount: number
  lastUpdated: string
}

interface Tag {
  id: string
  name: string
  usageCount: number
}

// Reactive data
const showAddCategoryModal = ref(false)
const showTagManagement = ref(false)
const editingCategory = ref<Category | null>(null)
const newTag = ref('')
const showValidation = ref(false)
const saving = ref(false)

const categoryForm = ref({
  name: '',
  description: '',
  slug: '',
  color: '#007bff'
})

// Reactive data for categories and tags (to be loaded from API)
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

// Loading states
const categoriesLoading = ref(true)
const tagsLoading = ref(true)

// Computed properties
const totalPosts = computed(() => {
  return categories.value.reduce((sum, category) => sum + category.postCount, 0)
})

const unusedCategories = computed(() => {
  return categories.value.filter(category => category.postCount === 0).length
})

const popularTags = computed(() => {
  const maxUsage = Math.max(...tags.value.map(tag => tag.usageCount))
  return tags.value.slice(0, 20).map(tag => ({
    ...tag,
    size: 14 + (tag.usageCount / maxUsage) * 16 // Font size between 14-30px
  }))
})

// Methods
const editCategory = (category: Category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description,
    slug: category.slug,
    color: category.color
  }
  showValidation.value = false
}

const deleteCategory = (category: Category) => {
  if (confirm(`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`)) {
    const index = categories.value.findIndex(c => c.id === category.id)
    if (index > -1) {
      categories.value.splice(index, 1)
    }
  }
}

const closeCategoryModal = () => {
  showAddCategoryModal.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: '',
    slug: '',
    color: '#007bff'
  }
  showValidation.value = false
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    showValidation.value = true
    return
  }

  saving.value = true

  try {
    // Generate slug if empty
    if (!categoryForm.value.slug.trim()) {
      categoryForm.value.slug = categoryForm.value.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    if (editingCategory.value) {
      // Update existing category
      const index = categories.value.findIndex(c => c.id === editingCategory.value?.id)
      if (index > -1) {
        categories.value[index] = {
          ...categories.value[index],
          ...categoryForm.value,
          lastUpdated: 'Just now'
        }
      }
    } else {
      // Add new category
      const newCategory: Category = {
        id: Date.now().toString(),
        ...categoryForm.value,
        postCount: 0,
        viewCount: 0,
        lastUpdated: 'Just now'
      }
      categories.value.push(newCategory)
    }

    closeCategoryModal()

    // Show success message
    alert(`Category ${editingCategory.value ? 'updated' : 'created'} successfully!`)

  } catch (error) {
    console.error('Error saving category:', error)
    alert('Failed to save category. Please try again.')
  } finally {
    saving.value = false
  }
}

const addTag = () => {
  if (newTag.value.trim()) {
    const existingTag = tags.value.find(tag =>
      tag.name.toLowerCase() === newTag.value.trim().toLowerCase()
    )

    if (existingTag) {
      existingTag.usageCount += 1
    } else {
      const newTagObj: Tag = {
        id: Date.now().toString(),
        name: newTag.value.trim(),
        usageCount: 1
      }
      tags.value.push(newTagObj)
    }

    newTag.value = ''
  }
}

const deleteTag = (tag: Tag) => {
  if (confirm(`Are you sure you want to delete the "${tag.name}" tag?`)) {
    const index = tags.value.findIndex(t => t.id === tag.id)
    if (index > -1) {
      tags.value.splice(index, 1)
    }
  }
}

// Load categories data
const loadCategories = async () => {
  try {
    // For now, we'll use a predefined set of categories
    // In a real app, this could come from a categories collection
    const predefinedCategories = [
      { name: 'Education', slug: 'education', color: '#007bff', postCount: 0, viewCount: 0 },
      { name: 'Technology', slug: 'technology', color: '#28a745', postCount: 0, viewCount: 0 },
      { name: 'Career Development', slug: 'career-development', color: '#ffc107', postCount: 0, viewCount: 0 },
      { name: 'Mentorship', slug: 'mentorship', color: '#dc3545', postCount: 0, viewCount: 0 },
      { name: 'Innovation', slug: 'innovation', color: '#6f42c1', postCount: 0, viewCount: 0 },
      { name: 'Community', slug: 'community', color: '#20c997', postCount: 0, viewCount: 0 },
      { name: 'Research', slug: 'research', color: '#fd7e14', postCount: 0, viewCount: 0 },
      { name: 'Leadership', slug: 'leadership', color: '#e83e8c', postCount: 0, viewCount: 0 }
    ]

    // Get actual post counts from content
    const allContent = await DatabaseService.getContentItems(undefined, undefined)

    predefinedCategories.forEach(category => {
      const categoryPosts = allContent.filter(content =>
        content.tags.some(tag => tag.toLowerCase().includes(category.slug))
      )
      category.postCount = categoryPosts.length
      category.viewCount = categoryPosts.length * 100 // Mock view count
    })

    categories.value = predefinedCategories.map((cat, index) => ({
      id: `cat_${index + 1}`,
      ...cat,
      description: `Content related to ${cat.name.toLowerCase()}`,
      lastUpdated: new Date().toLocaleDateString()
    }))
  } catch (error) {
    console.error('Error loading categories:', error)
  } finally {
    categoriesLoading.value = false
  }
}

// Load tags data
const loadTags = async () => {
  try {
    const allContent = await DatabaseService.getContentItems(undefined, undefined)

    // Extract all unique tags and count their usage
    const tagCounts: { [key: string]: number } = {}

    allContent.forEach(content => {
      content.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // Convert to array format
    tags.value = Object.entries(tagCounts).map(([name, usageCount], index) => ({
      id: `tag_${index + 1}`,
      name,
      usageCount
    })).sort((a, b) => b.usageCount - a.usageCount) // Sort by usage
  } catch (error) {
    console.error('Error loading tags:', error)
  } finally {
    tagsLoading.value = false
  }
}

// Watch for name changes to auto-generate slug
watch(() => categoryForm.value.name, (newName) => {
  if (newName && !categoryForm.value.slug) {
    categoryForm.value.slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
})

// Initialize
onMounted(async () => {
  await loadCategories()
  await loadTags()
})
</script>

<style scoped>
.category-management {
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

.header-content h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #0056b3;
}

.icon {
  font-size: 1.2rem;
}

.categories-overview {
  margin-bottom: 3rem;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.stat-number {
  font-size: 3rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-size: 1rem;
  font-weight: 500;
}

.categories-section, .tags-section {
  margin-bottom: 3rem;
}

.categories-section h2, .tags-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #545b62;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.empty-state, .loading-state {
  grid-column: 1 / -1;
  padding: 4rem 2rem;
  text-align: center;
  color: #6c757d;
}

.empty-state .empty-icon, .loading-state .loading-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3, .loading-state h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 2rem;
}

.empty-state .btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
}

.empty-state .btn-primary:hover {
  background: #0056b3;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.category-info h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.category-info p {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-edit {
  background: #007bff;
  color: white;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

.category-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 600;
}

.category-color {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e9ecef;
}

.color-code {
  font-family: monospace;
  font-size: 0.9rem;
  color: #6c757d;
}

.tag-management {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.tag-input-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tag-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.tag-input:focus {
  outline: none;
  border-color: #007bff;
}

.btn-add-tag {
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-add-tag:hover {
  background: #1e7e34;
}

.existing-tags h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 20px;
  border: 1px solid #e9ecef;
}

.tag-name {
  color: #2c3e50;
  font-weight: 500;
}

.tag-usage {
  color: #6c757d;
  font-size: 0.8rem;
}

.btn-remove-tag {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.btn-remove-tag:hover {
  color: #c82333;
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.empty-tags, .loading-tags {
  text-align: center;
  color: #6c757d;
  padding: 3rem 2rem;
}

.empty-tags .empty-icon, .loading-tags .loading-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-tags h3, .loading-tags h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-tags p {
  margin-bottom: 2rem;
}

.popular-tag {
  color: #007bff;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.popular-tag:hover {
  color: #0056b3;
}

/* Modal Styles */
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

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-input.error {
  border-color: #dc3545;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-input {
  width: 60px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e9ecef;
}

.form-hint {
  display: block;
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.error-message {
  display: block;
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #545b62;
}

.btn-save {
  background: #007bff;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #0056b3;
}

.btn-save:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .category-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .category-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .category-actions {
    justify-content: center;
  }

  .category-stats {
    grid-template-columns: 1fr;
  }

  .tag-input-section {
    flex-direction: column;
  }

  .tags-list {
    justify-content: center;
  }

  .popular-tags {
    justify-content: center;
  }

  .modal {
    margin: 1rem;
    width: calc(100% - 2rem);
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>

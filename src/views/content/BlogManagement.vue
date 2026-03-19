<template>
  <div class="blog-management">
    <div class="header">
      <div class="header-content">
        <h1>Blog Management</h1>
        <p class="subtitle">Create, edit, and manage blog posts</p>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/content/blog/new')" class="btn-primary">
          <Icon icon="lucide:plus" />
          New Post
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="filters">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search posts..."
          class="search-input"
        >
        <select v-model="statusFilter" class="status-filter">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select v-model="authorFilter" class="author-filter">
          <option value="">All Authors</option>
          <option value="current">My Posts</option>
        </select>
      </div>
    </div>

    <div class="posts-table">
      <div class="table-header">
        <div class="col-title">Title</div>
        <div class="col-author">Author</div>
        <div class="col-status">Status</div>
        <div class="col-date">Published</div>
        <div class="col-views">Views</div>
        <div class="col-actions">Actions</div>
      </div>

      <div class="table-body" v-if="!isLoading">
        <div
          v-if="filteredPosts.length === 0"
          class="empty-state"
        >
          <div class="empty-icon"><Icon icon="lucide:file-edit" /></div>
          <h3>No posts found</h3>
          <p>Create your first blog post to get started.</p>
          <button @click="$router.push('/content/blog/new')" class="btn-primary">
            Create First Post
          </button>
        </div>
        <div
          v-for="post in filteredPosts"
          :key="post.id"
          class="post-row"
        >
          <div class="col-title">
            <div class="post-info">
              <h4>{{ post.title }}</h4>
              <p class="excerpt">{{ post.excerpt }}</p>
              <div class="tags">
                <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
                <span v-if="post.tags.length > 3" class="tag more">+{{ post.tags.length - 3 }}</span>
              </div>
            </div>
          </div>

          <div class="col-author">
            <div class="author-info">
              <div class="avatar">{{ getInitials(post.author) }}</div>
              <span class="author-name">{{ post.author }}</span>
            </div>
          </div>

          <div class="col-status">
            <span :class="['status-badge', post.status]">
              {{ post.status }}
            </span>
          </div>

          <div class="col-date">
            {{ formatDate(post.publishDate || post.createdAt) }}
          </div>

          <div class="col-views">
            <span class="views-count">{{ post.views }}</span>
          </div>

          <div class="col-actions">
            <button @click="$router.push(`/content/blog/${post.id}/edit`)" class="btn-edit">
              Edit
            </button>
            <button @click="duplicatePost(post)" class="btn-duplicate">
              Duplicate
            </button>
            <button @click="togglePublish(post)" :class="['btn-publish', post.status]">
              {{ post.status === 'published' ? 'Unpublish' : 'Publish' }}
            </button>
          </div>
        </div>
      </div>

      <div class="table-body" v-else>
        <div class="loading-state">
          <div class="loading-icon"><Icon icon="lucide:hourglass" /></div>
          <h3>Loading posts...</h3>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedPosts.length > 0" class="bulk-actions">
      <span class="selection-count">{{ selectedPosts.length }} posts selected</span>
      <div class="bulk-buttons">
        <button @click="bulkPublish" class="btn-bulk-publish">Publish Selected</button>
        <button @click="bulkArchive" class="btn-bulk-archive">Archive Selected</button>
        <button @click="bulkDelete" class="btn-bulk-delete">Delete Selected</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { DatabaseService } from '../../services/firebase'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  author: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  publishDate?: Date
  createdAt: Date
  views: number
}

// Reactive data
const searchQuery = ref('')
const statusFilter = ref('')
const authorFilter = ref('')
const selectedPosts = ref<string[]>([])

// Reactive data for posts (to be loaded from API)
const posts = ref<BlogPost[]>([])

// Loading state
const isLoading = ref(true)

// Computed properties
const filteredPosts = computed(() => {
  let filtered = posts.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(post => post.status === statusFilter.value)
  }

  // Filter by author
  if (authorFilter.value === 'current') {
    // In a real app, this would check the current user
    filtered = filtered.filter(post => post.author === 'Dr. Sarah Johnson')
  }

  return filtered
})

// Methods
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const duplicatePost = (post: BlogPost) => {
  const newPost: BlogPost = {
    ...post,
    id: Date.now().toString(),
    title: `${post.title} (Copy)`,
    status: 'draft',
    createdAt: new Date(),
    publishDate: undefined,
    views: 0
  }
  posts.value.unshift(newPost)
}

const togglePublish = async (post: BlogPost) => {
  try {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const updates: any = {
      status: newStatus,
      updatedAt: new Date()
    }

    if (newStatus === 'published' && !post.publishDate) {
      updates.publishDate = new Date()
    }

    await DatabaseService.updateContentItem(post.id, updates)
    post.status = newStatus
    if (updates.publishDate) {
      post.publishDate = updates.publishDate
    }
  } catch (error) {
    console.error('Error updating post status:', error)
    alert('Failed to update post status. Please try again.')
  }
}

// Bulk actions
const bulkPublish = async () => {
  try {
    const updatePromises = selectedPosts.value.map(async postId => {
      const post = posts.value.find(p => p.id === postId)
      if (post && post.status !== 'published') {
        const updates: any = {
          status: 'published',
          updatedAt: new Date()
        }
        if (!post.publishDate) {
          updates.publishDate = new Date()
          post.publishDate = updates.publishDate
        }
        await DatabaseService.updateContentItem(postId, updates)
        post.status = 'published'
      }
    })

    await Promise.all(updatePromises)
    selectedPosts.value = []
    alert('Selected posts published successfully!')
  } catch (error) {
    console.error('Error bulk publishing posts:', error)
    alert('Failed to publish some posts. Please try again.')
  }
}

const bulkArchive = async () => {
  try {
    const updatePromises = selectedPosts.value.map(async postId => {
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        const updates = {
          status: 'archived' as const,
          updatedAt: new Date()
        }
        await DatabaseService.updateContentItem(postId, updates)
        post.status = 'archived'
      }
    })

    await Promise.all(updatePromises)
    selectedPosts.value = []
    alert('Selected posts archived successfully!')
  } catch (error) {
    console.error('Error bulk archiving posts:', error)
    alert('Failed to archive some posts. Please try again.')
  }
}

const bulkDelete = async () => {
  if (confirm('Are you sure you want to delete the selected posts? This action cannot be undone.')) {
    try {
      const deletePromises = selectedPosts.value.map(async postId => {
        await DatabaseService.deleteContentItem(postId)
      })

      await Promise.all(deletePromises)
      posts.value = posts.value.filter(post => !selectedPosts.value.includes(post.id))
      selectedPosts.value = []
      alert('Selected posts deleted successfully!')
    } catch (error) {
      console.error('Error bulk deleting posts:', error)
      alert('Failed to delete some posts. Please try again.')
    }
  }
}

// Load posts data
const loadPosts = async () => {
  try {
    const postsData = await DatabaseService.getContentItems('blog', undefined)
    posts.value = postsData.map(post => ({
      id: post.id || '',
      title: post.title,
      excerpt: post.content.substring(0, 150) + '...',
      author: post.author,
      status: post.status,
      tags: post.tags,
      publishDate: post.publishDate ? new Date(post.publishDate) : undefined,
      createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
      views: 0
    }))
  } catch (error) {
    console.error('Error loading posts:', error)
  } finally {
    isLoading.value = false
  }
}

// Initialize component
onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.blog-management {
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

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.status-filter, .author-filter {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 150px;
}

.posts-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.table-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.8fr 2fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.post-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.8fr 2fr;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.post-row:last-child {
  border-bottom: none;
}

.empty-state, .loading-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #6c757d;
}

.empty-icon, .loading-icon {
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

.post-info h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.excerpt {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.tag.more {
  background: #6c757d;
  color: white;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.author-name {
  color: #495057;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.published {
  background: #d4edda;
  color: #155724;
}

.status-badge.draft {
  background: #fff3cd;
  color: #856404;
}

.status-badge.archived {
  background: #e2e3e5;
  color: #383d41;
}

.views-count {
  color: #6c757d;
  font-weight: 500;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-edit, .btn-duplicate, .btn-publish {
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

.btn-duplicate {
  background: #6c757d;
  color: white;
}

.btn-duplicate:hover {
  background: #545b62;
}

.btn-publish.published {
  background: #dc3545;
  color: white;
}

.btn-publish.published:hover {
  background: #c82333;
}

.btn-publish.draft {
  background: #28a745;
  color: white;
}

.btn-publish.draft:hover {
  background: #1e7e34;
}

.bulk-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-count {
  font-weight: 600;
  color: #2c3e50;
}

.bulk-buttons {
  display: flex;
  gap: 1rem;
}

.btn-bulk-publish {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-bulk-publish:hover {
  background: #1e7e34;
}

.btn-bulk-archive {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-bulk-archive:hover {
  background: #e0a800;
}

.btn-bulk-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-bulk-delete:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .blog-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .filters {
    flex-direction: column;
  }

  .search-input {
    min-width: auto;
  }

  .status-filter, .author-filter {
    min-width: auto;
  }

  .table-header, .post-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .post-row {
    padding: 1rem;
  }

  .col-actions {
    justify-content: center;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>

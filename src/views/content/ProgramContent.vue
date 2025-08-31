<template>
  <div class="program-content">
    <div class="header">
      <div class="header-content">
        <h1>Program Content Management</h1>
        <p class="subtitle">Manage content for different programs and initiatives</p>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/content/programs/new')" class="btn-primary">
          <span class="icon">➕</span>
          New Program Content
        </button>
      </div>
    </div>

    <div class="program-overview">
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-number">{{ programs.length }}</div>
          <div class="stat-label">Total Programs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalContent }}</div>
          <div class="stat-label">Content Items</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ activePrograms }}</div>
          <div class="stat-label">Active Programs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalStudents }}</div>
          <div class="stat-label">Enrolled Students</div>
        </div>
      </div>
    </div>

    <!-- Program Filter -->
    <div class="program-filter">
      <div class="filter-section">
        <label for="program-select">Filter by Program:</label>
        <select id="program-select" v-model="selectedProgram" class="program-select">
          <option value="">All Programs</option>
          <option value="stepup_scholars">StepUp Scholars</option>
          <option value="dynamerge">Dynamerge</option>
        </select>
      </div>
    </div>

    <div class="content-grid" v-if="!isLoading">
      <div
        v-if="filteredContent.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">📚</div>
        <h3>No program content found</h3>
        <p>Create content for programs to help students learn and grow.</p>
        <button @click="$router.push('/content/programs/new')" class="btn-primary">
          Create First Content
        </button>
      </div>
      <div
        v-for="content in filteredContent"
        :key="content.id"
        class="content-card"
      >
        <div class="content-header">
          <div class="content-info">
            <h3>{{ content.title }}</h3>
            <p class="content-description">{{ content.description }}</p>
            <div class="content-meta">
              <span class="program-badge" :class="content.program">{{ content.program }}</span>
              <span class="content-type" :class="content.type">{{ content.type }}</span>
            </div>
          </div>
          <div class="content-actions">
            <button @click="editContent(content)" class="btn-edit">
              Edit
            </button>
            <button @click="duplicateContent(content)" class="btn-duplicate">
              Duplicate
            </button>
          </div>
        </div>

        <div class="content-details">
          <div class="detail-item">
            <span class="detail-icon">👤</span>
            <span>{{ content.author }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">📅</span>
            <span>{{ formatDate(content.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">👁️</span>
            <span>{{ content.views }} views</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">📊</span>
            <span>{{ content.completionRate }}% completion</span>
          </div>
        </div>

        <div class="content-tags">
          <div class="tag-list">
            <span
              v-for="tag in content.tags.slice(0, 5)"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
            <span v-if="content.tags.length > 5" class="tag more">
              +{{ content.tags.length - 5 }}
            </span>
          </div>
        </div>

        <div class="content-footer">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: content.completionRate + '%' }"></div>
          </div>
          <div class="content-status">
            <span :class="['status-indicator', content.status]">{{ content.status }}</span>
            <button @click="togglePublish(content)" :class="['btn-publish', content.status]">
              {{ content.status === 'published' ? 'Unpublish' : 'Publish' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid" v-else>
      <div class="loading-state">
        <div class="loading-icon">⏳</div>
        <h3>Loading program content...</h3>
      </div>
    </div>

    <!-- Program Summary -->
    <div class="program-summary">
      <h2>Program Overview</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>StepUp Scholars</h3>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-value">{{ stepupContentCount }}</span>
              <span class="stat-label">Content Items</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{{ stepupStudents }}</span>
              <span class="stat-label">Students</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{{ stepupAvgCompletion }}%</span>
              <span class="stat-label">Avg Completion</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <h3>Dynamerge</h3>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-value">{{ dynamergeContentCount }}</span>
              <span class="stat-label">Content Items</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{{ dynamergeStudents }}</span>
              <span class="stat-label">Students</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{{ dynamergeAvgCompletion }}%</span>
              <span class="stat-label">Avg Completion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DatabaseService } from '../../services/firebase'

const router = useRouter()

interface ProgramContent {
  id: string
  title: string
  description: string
  program: 'stepup_scholars' | 'dynamerge'
  type: 'lesson' | 'assignment' | 'resource' | 'video'
  author: string
  status: 'draft' | 'published'
  tags: string[]
  createdAt: Date
  views: number
  completionRate: number
}

interface Program {
  id: string
  name: string
  students: number
  contentCount: number
  avgCompletion: number
}

// Reactive data
const selectedProgram = ref('')
const isLoading = ref(true)

// Reactive data for content and programs (to be loaded from API)
const content = ref<ProgramContent[]>([])
const programs = ref<Program[]>([])

// Computed properties
const filteredContent = computed(() => {
  let filtered = content.value

  if (selectedProgram.value) {
    filtered = filtered.filter(item => item.program === selectedProgram.value)
  }

  return filtered
})

const totalContent = computed(() => content.value.length)

const activePrograms = computed(() => programs.value.length)

const totalStudents = computed(() => {
  return programs.value.reduce((sum, program) => sum + program.students, 0)
})

const stepupContentCount = computed(() => {
  return content.value.filter(item => item.program === 'stepup_scholars').length
})

const dynamergeContentCount = computed(() => {
  return content.value.filter(item => item.program === 'dynamerge').length
})

const stepupStudents = computed(() => {
  const program = programs.value.find(p => p.name === 'StepUp Scholars')
  return program?.students || 0
})

const dynamergeStudents = computed(() => {
  const program = programs.value.find(p => p.name === 'Dynamerge')
  return program?.students || 0
})

const stepupAvgCompletion = computed(() => {
  const stepupContent = content.value.filter(item => item.program === 'stepup_scholars')
  if (stepupContent.length === 0) return 0
  const total = stepupContent.reduce((sum, item) => sum + item.completionRate, 0)
  return Math.round(total / stepupContent.length)
})

const dynamergeAvgCompletion = computed(() => {
  const dynamergeContent = content.value.filter(item => item.program === 'dynamerge')
  if (dynamergeContent.length === 0) return 0
  const total = dynamergeContent.reduce((sum, item) => sum + item.completionRate, 0)
  return Math.round(total / dynamergeContent.length)
})

// Methods
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const editContent = (content: ProgramContent) => {
  router.push(`/content/programs/${content.id}/edit`)
}

const duplicateContent = (content: ProgramContent) => {
  const newContent: ProgramContent = {
    ...content,
    id: Date.now().toString(),
    title: `${content.title} (Copy)`,
    status: 'draft',
    views: 0,
    completionRate: 0
  }
  content.value.unshift(newContent)
}

const togglePublish = (content: ProgramContent) => {
  content.status = content.status === 'published' ? 'draft' : 'published'
}

// Load content and programs data
const loadContent = async () => {
  try {
    const contentData = await DatabaseService.getContentItems('program', undefined)
    content.value = contentData.map(item => ({
      id: item.id,
      title: item.title,
      description: item.content.substring(0, 100) + '...',
      program: 'stepup_scholars' as const, // This would need to be stored separately
      type: 'lesson' as const, // This would need to be stored separately
      author: item.author,
      status: item.status,
      tags: item.tags,
      createdAt: item.createdAt?.toDate() || new Date(),
      views: 0,
      completionRate: Math.floor(Math.random() * 100) // Mock completion rate
    }))

    // Mock program data - in a real app this would come from a programs collection
    programs.value = [
      {
        id: '1',
        name: 'StepUp Scholars',
        students: 45,
        contentCount: content.value.filter(c => c.program === 'stepup_scholars').length,
        avgCompletion: 78
      },
      {
        id: '2',
        name: 'Dynamerge',
        students: 32,
        contentCount: content.value.filter(c => c.program === 'dynamerge').length,
        avgCompletion: 65
      }
    ]
  } catch (error) {
    console.error('Error loading content:', error)
  } finally {
    isLoading.value = false
  }
}

// Initialize component
loadContent()
</script>

<style scoped>
.program-content {
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

.program-overview {
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

.program-filter {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-section label {
  font-weight: 600;
  color: #2c3e50;
}

.program-select {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
}

.program-select:focus {
  outline: none;
  border-color: #007bff;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.empty-state, .loading-state {
  grid-column: 1 / -1;
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

.content-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1rem;
}

.content-info h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.content-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.content-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.program-badge, .content-type {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.program-badge.stepup_scholars {
  background: #cce5ff;
  color: #0066cc;
}

.program-badge.dynamerge {
  background: #d1ecf1;
  color: #0c5460;
}

.content-type.lesson {
  background: #d4edda;
  color: #155724;
}

.content-type.assignment {
  background: #fff3cd;
  color: #856404;
}

.content-type.resource {
  background: #e2e3e5;
  color: #383d41;
}

.content-type.video {
  background: #f8d7da;
  color: #721c24;
}

.content-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-edit, .btn-duplicate {
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

.content-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.detail-icon {
  font-size: 1rem;
}

.content-tags {
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.tag-list {
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

.content-footer {
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.content-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-indicator.published {
  background: #d4edda;
  color: #155724;
}

.status-indicator.draft {
  background: #fff3cd;
  color: #856404;
}

.btn-publish {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
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

.program-summary {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.program-summary h2 {
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.summary-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.summary-card h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-stat {
  text-align: center;
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

@media (max-width: 768px) {
  .program-content {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
  }

  .content-actions {
    justify-content: center;
  }

  .content-details {
    grid-template-columns: 1fr;
  }

  .content-status {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>

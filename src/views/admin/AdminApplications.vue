<template>
  <div class="admin-applications">
    <header class="page-header">
      <div class="header-content">
        <h1>Application Management</h1>
        <p class="subtitle">Review and manage all program applications</p>
      </div>
      <div class="header-actions">
        <button @click="exportApplications" class="btn-secondary">Export Data</button>
      </div>
    </header>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or research interests..."
            class="search-input"
          />
        </div>
        <div class="filter-controls">
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <select v-model="programFilter" class="filter-select">
            <option value="">All Programs</option>
            <option value="stepup_scholars">StepUp Scholars</option>
            <option value="dynamerge">Dynamerge</option>
          </select>
          <select v-model="sortBy" class="filter-select">
            <option value="submittedAt">Date Submitted</option>
            <option value="createdAt">Date Created</option>
            <option value="program">Program</option>
            <option value="status">Status</option>
            <option value="personalInfo.firstName">Name</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedApplications.length > 0" class="bulk-actions">
      <span>{{ selectedApplications.length }} applications selected</span>
      <div class="bulk-buttons">
        <button @click="bulkUpdateStatus('under_review')" class="btn-secondary">Mark Under Review</button>
        <button @click="bulkUpdateStatus('accepted')" class="btn-success">Accept Selected</button>
        <button @click="bulkUpdateStatus('rejected')" class="btn-danger">Reject Selected</button>
        <button @click="clearSelection" class="btn-clear">Clear Selection</button>
      </div>
    </div>

    <!-- Applications Table -->
    <div class="applications-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading applications...</p>
      </div>

      <div v-else-if="filteredApplications.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No applications found</h3>
        <p v-if="hasFilters">
          No applications match your current filters. Try adjusting your search criteria.
        </p>
        <p v-else>
          No applications have been submitted yet.
        </p>
      </div>

      <div v-else class="applications-table">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th>Applicant</th>
              <th>Program</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Research Interests</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="application in filteredApplications"
              :key="application.id"
              :class="{ selected: selectedApplications.includes(application.id!) }"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="selectedApplications.includes(application.id!)"
                  @change="toggleSelection(application.id!)"
                />
              </td>
              <td class="applicant-info">
                <div class="applicant-name">
                  {{ application.personalInfo.firstName }} {{ application.personalInfo.lastName }}
                </div>
                <div class="applicant-email">{{ application.personalInfo.email }}</div>
              </td>
              <td>
                <span class="program-badge">
                  {{ application.program === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge' }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="`status-${application.status}`">
                  {{ formatStatus(application.status) }}
                </span>
              </td>
              <td>{{ formatDate(application.submittedAt) }}</td>
              <td>
                <div class="interests-list">
                  {{ application.researchInterests.slice(0, 2).join(', ') }}{{ application.researchInterests.length > 2 ? '...' : '' }}
                </div>
              </td>
              <td class="actions">
                <button @click="viewApplication(application.id!)" class="btn-view">View</button>
                <button @click="reviewApplication(application.id!)" class="btn-review">Review</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="!loading && applications.length > 0" class="statistics-section">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-number">{{ applications.length }}</span>
          <span class="stat-label">Total Applications</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ submittedCount }}</span>
          <span class="stat-label">Submitted</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ underReviewCount }}</span>
          <span class="stat-label">Under Review</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ acceptedCount }}</span>
          <span class="stat-label">Accepted</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ rejectedCount }}</span>
          <span class="stat-label">Rejected</span>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadApplications" class="btn-primary">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DatabaseService, AuthService, type Application } from '../../services/firebase'

const router = useRouter()

// Reactive data
const applications = ref<Application[]>([])
const loading = ref(true)
const error = ref('')
const selectedApplications = ref<string[]>([])

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const programFilter = ref('')
const sortBy = ref('submittedAt')

// Computed properties
const filteredApplications = computed(() => {
  let filtered = applications.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(app => 
      app.personalInfo.firstName.toLowerCase().includes(query) ||
      app.personalInfo.lastName.toLowerCase().includes(query) ||
      app.personalInfo.email.toLowerCase().includes(query) ||
      app.researchInterests.some(interest => 
        interest.toLowerCase().includes(query)
      )
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(app => app.status === statusFilter.value)
  }

  // Apply program filter
  if (programFilter.value) {
    filtered = filtered.filter(app => app.program === programFilter.value)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'submittedAt':
        if (!a.submittedAt && !b.submittedAt) return 0
        if (!a.submittedAt) return 1
        if (!b.submittedAt) return -1
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'program':
        return a.program.localeCompare(b.program)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'personalInfo.firstName':
        return a.personalInfo.firstName.localeCompare(b.personalInfo.firstName)
      default:
        return 0
    }
  })

  return filtered
})

const hasFilters = computed(() => {
  return searchQuery.value || statusFilter.value || programFilter.value
})

const allSelected = computed(() => {
  return filteredApplications.value.length > 0 && 
         filteredApplications.value.every(app => selectedApplications.value.includes(app.id!))
})

// Statistics
const submittedCount = computed(() => 
  applications.value.filter(app => app.status === 'submitted').length
)

const underReviewCount = computed(() => 
  applications.value.filter(app => app.status === 'under_review').length
)

const acceptedCount = computed(() => 
  applications.value.filter(app => app.status === 'accepted').length
)

const rejectedCount = computed(() => 
  applications.value.filter(app => app.status === 'rejected').length
)

// Methods
const loadApplications = async () => {
  loading.value = true
  error.value = ''

  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const allApps = await DatabaseService.getAllApplications()
    applications.value = allApps
  } catch (err: any) {
    error.value = err.message || 'Failed to load applications'
  } finally {
    loading.value = false
  }
}

const toggleSelection = (applicationId: string) => {
  const index = selectedApplications.value.indexOf(applicationId)
  if (index > -1) {
    selectedApplications.value.splice(index, 1)
  } else {
    selectedApplications.value.push(applicationId)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedApplications.value = []
  } else {
    selectedApplications.value = filteredApplications.value.map(app => app.id!)
  }
}

const clearSelection = () => {
  selectedApplications.value = []
}

const bulkUpdateStatus = async (status: string) => {
  if (selectedApplications.value.length === 0) return

  try {
    for (const applicationId of selectedApplications.value) {
      await DatabaseService.updateApplication(applicationId, {
        status,
        reviewedAt: new Date(),
        reviewedBy: AuthService.getCurrentUser()?.email || 'Unknown'
      })
    }
    
    // Reload applications and clear selection
    await loadApplications()
    selectedApplications.value = []
  } catch (err: any) {
    error.value = err.message || 'Failed to update applications'
  }
}

const viewApplication = (applicationId: string) => {
  router.push(`/admin/applications/${applicationId}`)
}

const reviewApplication = (applicationId: string) => {
  router.push(`/admin/applications/${applicationId}/review`)
}

const exportApplications = () => {
  // Simple CSV export
  const csvContent = [
    ['Name', 'Email', 'Program', 'Status', 'Submitted', 'Research Interests'].join(','),
    ...filteredApplications.value.map(app => [
      `${app.personalInfo.firstName} ${app.personalInfo.lastName}`,
      app.personalInfo.email,
      app.program,
      app.status,
      app.submittedAt ? new Date(app.submittedAt).toISOString() : '',
      app.researchInterests.join('; ')
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Not submitted'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Rejected'
  }
  return statusMap[status] || status
}

// Lifecycle
onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.admin-applications {
  min-height: 100vh;
  background: var(--color-background);
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.header-content h1 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.bulk-actions {
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-buttons {
  display: flex;
  gap: 0.5rem;
}

.applications-container {
  margin-bottom: 2rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.applications-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  background: var(--color-background-secondary);
  font-weight: 600;
  color: var(--color-text);
}

tr:hover {
  background: var(--color-background-secondary);
}

tr.selected {
  background: #eff6ff;
}

.applicant-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.applicant-name {
  font-weight: 500;
  color: var(--color-text);
}

.applicant-email {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.program-badge {
  background: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-submitted {
  background: #dbeafe;
  color: #1e40af;
}

.status-under_review {
  background: #fef3c7;
  color: #92400e;
}

.status-accepted {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.interests-list {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-view, .btn-review {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-view {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-view:hover {
  background: var(--color-primary);
  color: white;
}

.btn-review {
  color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.btn-review:hover {
  background: var(--color-secondary);
  color: white;
}

.statistics-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: var(--color-background-secondary);
  border-radius: 8px;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-clear {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-secondary-dark);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-clear {
  background: #6b7280;
  color: white;
}

.btn-clear:hover {
  background: #4b5563;
}

.error-message {
  text-align: center;
  padding: 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.error-message p {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .admin-applications {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .bulk-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .bulk-buttons {
    flex-wrap: wrap;
  }
  
  .applications-table {
    overflow-x: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

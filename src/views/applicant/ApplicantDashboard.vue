<template>
  <div class="applicant-dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Welcome, {{ userProfile?.displayName || 'Applicant' }}!</h1>
        <p class="subtitle">Manage your STAIJA program applications</p>
      </div>
      <div class="header-actions">
        <button @click="handleSignOut" class="btn-secondary">Sign Out</button>
      </div>
    </header>
    
    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- Application Overview Card -->
        <div class="dashboard-card">
          <h3>Application Overview</h3>
          <div class="stats-grid">
            <div class="stat">
              <span class="stat-number">{{ applications.length }}</span>
              <span class="stat-label">Total Applications</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ submittedCount }}</span>
              <span class="stat-label">Submitted</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ draftCount }}</span>
              <span class="stat-label">Drafts</span>
            </div>
          </div>
          <button @click="navigateTo('/applicant/applications/new')" class="btn-primary">
            Start New Application
          </button>
        </div>
        
        <!-- Quick Actions Card -->
        <div class="dashboard-card">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button @click="navigateTo('/applicant/applications')" class="btn-action">
              <span class="icon">📋</span>
              View All Applications
            </button>
            <button @click="navigateTo('/programs/stepup-scholars')" class="btn-action">
              <span class="icon">🎓</span>
              StepUp Scholars Info
            </button>
            <button @click="navigateTo('/programs/dynamerge')" class="btn-action">
              <span class="icon">🔬</span>
              Dynamerge Info
            </button>
            <button @click="navigateTo('/contact')" class="btn-action">
              <span class="icon">📧</span>
              Contact Support
            </button>
          </div>
        </div>
        
        <!-- Recent Applications Card -->
        <div class="dashboard-card full-width">
          <h3>Recent Applications</h3>
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading applications...</p>
          </div>
          <div v-else-if="applications.length === 0" class="empty-state">
            <p>No applications yet. Start your first application!</p>
            <button @click="navigateTo('/applicant/applications/new')" class="btn-primary">
              Create Application
            </button>
          </div>
          <div v-else class="applications-list">
            <div 
              v-for="app in recentApplications" 
              :key="app.id" 
              class="application-item"
              @click="navigateTo(`/applicant/applications/${app.id}`)"
            >
              <div class="app-info">
                <h4>{{ app.program === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge' }}</h4>
                <p class="app-date">Created: {{ formatDate(app.createdAt) }}</p>
              </div>
              <div class="app-status">
                <span :class="['status-badge', `status-${app.status}`]">
                  {{ formatStatus(app.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-primary">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, DatabaseService, type UserProfile, type Application } from '../../services/firebase'

const router = useRouter()

// Reactive data
const userProfile = ref<UserProfile | null>(null)
const applications = ref<Application[]>([])
const loading = ref(true)
const error = ref('')

// Computed properties
const submittedCount = computed(() => 
  applications.value.filter(app => app.status === 'submitted').length
)

const draftCount = computed(() => 
  applications.value.filter(app => app.status === 'draft').length
)

const recentApplications = computed(() => 
  applications.value.slice(0, 3) // Show only 3 most recent
)

// Methods
const loadData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    // Load user profile
    const profile = await DatabaseService.getUserProfile(currentUser.uid)
    if (profile) {
      userProfile.value = profile
    }
    
    // Load user applications
    const userApps = await DatabaseService.getUserApplications(currentUser.uid)
    applications.value = userApps
    
  } catch (err: any) {
    error.value = err.message || 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

const handleSignOut = async () => {
  try {
    await AuthService.signOut()
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Failed to sign out'
  }
}

const navigateTo = (path: string) => {
  router.push(path)
}

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Unknown'
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
  loadData()
})
</script>

<style scoped>
.applicant-dashboard {
  min-height: 100vh;
  background: var(--color-background);
  padding: 2rem;
}

.dashboard-header {
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

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.dashboard-card.full-width {
  grid-column: 1 / -1;
}

.dashboard-card h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
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

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: var(--color-text);
}

.btn-action:hover {
  border-color: var(--color-primary);
  background: var(--color-background-secondary);
}

.btn-action .icon {
  font-size: 1.5rem;
}

.applications-list {
  display: grid;
  gap: 1rem;
}

.application-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.application-item:hover {
  border-color: var(--color-primary);
  background: white;
  transform: translateY(-1px);
}

.app-info h4 {
  margin: 0 0 0.25rem;
  color: var(--color-text);
}

.app-date {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
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

.loading-state, .empty-state {
  text-align: center;
  padding: 2rem;
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

.btn-primary, .btn-secondary {
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  .applicant-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .application-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>

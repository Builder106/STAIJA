<template>
  <div class="applicant-dashboard">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Welcome back, {{ userProfile?.displayName || 'Applicant' }}! 
              <Icon icon="mdi:hand-wave" class="welcome-icon" />
            </h1>
            <p class="hero-subtitle">
              Track your progress and manage your STAIJA program applications
            </p>
          </div>
          <div class="hero-actions">
            <button @click="navigateTo('/applicant/applications/new')" class="btn btn-primary btn-lg">
              <Icon icon="mdi:file-document-edit" class="icon" />
              Start New Application
            </button>
            <button @click="handleSignOut" class="btn btn-outline">
              <Icon icon="mdi:logout" class="icon" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Dashboard Content -->
    <section class="dashboard-section">
      <div class="container">
        <!-- Stats Overview -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">
              <Icon icon="mdi:chart-bar" />
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ applications.length }}</span>
              <span class="stat-label">Total Applications</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <Icon icon="mdi:check-circle" />
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ submittedCount }}</span>
              <span class="stat-label">Submitted</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <Icon icon="mdi:file-document" />
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ draftCount }}</span>
              <span class="stat-label">Drafts</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <Icon icon="mdi:clock-outline" />
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ underReviewCount }}</span>
              <span class="stat-label">Under Review</span>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
          <!-- Quick Actions -->
          <div class="dashboard-card quick-actions-card">
            <div class="card-header">
              <h3 class="card-title">
                <Icon icon="mdi:lightning-bolt" class="icon" />
                Quick Actions
              </h3>
              <p class="card-subtitle">Access your most important tools</p>
            </div>
            <div class="quick-actions-grid">
              <button @click="navigateTo('/applicant/applications')" class="action-button">
                <div class="action-icon">
                  <Icon icon="mdi:clipboard-list" />
                </div>
                <div class="action-content">
                  <span class="action-title">View All Applications</span>
                  <span class="action-description">Manage and track your submissions</span>
                </div>
              </button>
              <button @click="navigateTo('/programs/stepup-scholars')" class="action-button">
                <div class="action-icon">
                  <Icon icon="mdi:school" />
                </div>
                <div class="action-content">
                  <span class="action-title">StepUp Scholars</span>
                  <span class="action-description">Learn about the program</span>
                </div>
              </button>
              <button @click="navigateTo('/programs/dynamerge')" class="action-button">
                <div class="action-icon">
                  <Icon icon="mdi:microscope" />
                </div>
                <div class="action-content">
                  <span class="action-title">Dynamerge</span>
                  <span class="action-description">Explore research opportunities</span>
                </div>
              </button>
              <button @click="navigateTo('/contact')" class="action-button">
                <div class="action-icon">
                  <Icon icon="mdi:message-text" />
                </div>
                <div class="action-content">
                  <span class="action-title">Contact Support</span>
                  <span class="action-description">Get help when you need it</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Recent Applications -->
          <div class="dashboard-card applications-card">
            <div class="card-header">
              <h3 class="card-title">
                <Icon icon="mdi:file-document-multiple" class="icon" />
                Recent Applications
              </h3>
              <button @click="navigateTo('/applicant/applications')" class="btn btn-ghost btn-sm">
                View All
              </button>
            </div>
            
            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>Loading your applications...</p>
            </div>
            
            <div v-else-if="applications.length === 0" class="empty-state">
              <div class="empty-icon">
                <Icon icon="mdi:file-document-edit" />
              </div>
              <h4 class="empty-title">No applications yet</h4>
              <p class="empty-text">Start your journey by creating your first application</p>
              <button @click="navigateTo('/applicant/applications/new')" class="btn btn-primary">
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
                  <div class="app-header">
                    <h4 class="app-title">
                      {{ app.program === 'stepup_scholars' ? 'StepUp Scholars' : 'Dynamerge' }}
                    </h4>
                    <span :class="['status-badge', `status-${app.status}`]">
                      {{ formatStatus(app.status) }}
                    </span>
                  </div>
                  <p class="app-date">Created {{ formatDate(app.createdAt) }}</p>
                  <div class="app-progress">
                    <div class="progress-bar">
                      <div 
                        :class="['progress-fill', `progress-${app.status}`]"
                        :style="{ width: getProgressWidth(app.status) }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ getProgressText(app.status) }}</span>
                  </div>
                </div>
                <div class="app-arrow">
                  <Icon icon="mdi:chevron-right" class="icon" />
                </div>
              </div>
            </div>
          </div>

          <!-- Program Insights -->
          <div class="dashboard-card insights-card">
            <div class="card-header">
              <h3 class="card-title">
                <Icon icon="mdi:trending-up" class="icon" />
                Program Insights
              </h3>
            </div>
            <div class="insights-content">
              <div class="insight-item">
                <div class="insight-icon">
                  <Icon icon="mdi:target" />
                </div>
                <div class="insight-text">
                  <strong>StepUp Scholars</strong> focuses on leadership development and mentorship
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-icon">
                  <Icon icon="mdi:microscope" />
                </div>
                <div class="insight-text">
                  <strong>Dynamerge</strong> emphasizes research collaboration and innovation
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-icon">
                  <Icon icon="mdi:star" />
                </div>
                <div class="insight-text">
                  Both programs offer unique opportunities for African scientists
                </div>
              </div>
            </div>
            <div class="insights-actions">
              <button @click="navigateTo('/programs/stepup-scholars')" class="btn btn-outline btn-sm">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <div class="error-icon">
          <Icon icon="mdi:alert-circle" />
        </div>
        <h3>Something went wrong</h3>
        <p>{{ error }}</p>
        <button @click="loadData" class="btn btn-primary">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
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

const underReviewCount = computed(() => 
  applications.value.filter(app => app.status === 'under_review').length
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

const getProgressWidth = (status: string) => {
  const progressMap: Record<string, string> = {
    draft: '25%',
    submitted: '50%',
    under_review: '75%',
    accepted: '100%',
    rejected: '100%'
  }
  return progressMap[status] || '0%'
}

const getProgressText = (status: string) => {
  const textMap: Record<string, string> = {
    draft: 'In Progress',
    submitted: 'Submitted',
    under_review: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Decision Made'
  }
  return textMap[status] || 'Unknown'
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.applicant-dashboard {
  min-height: 100vh;
  background: var(--neutral-50);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
  color: white;
  padding: var(--space-16) 0;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-8);
  position: relative;
  z-index: 1;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  margin-bottom: var(--space-4);
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.welcome-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.hero-actions .icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Dashboard Section */
.dashboard-section {
  padding: var(--space-16) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-12);
}

.stat-card {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--neutral-200);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
  transform-origin: left;
}

.stat-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-50);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.stat-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--primary-600);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  font-weight: 500;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-8);
}

.dashboard-card {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--neutral-200);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
  transform-origin: left;
}

.dashboard-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-4px);
}

.dashboard-card:hover::before {
  transform: scaleX(1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.card-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-title .icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--primary-600);
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin: var(--space-2) 0 0 0;
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  background: white;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
  width: 100%;
}

.action-button:hover {
  border-color: var(--primary-500);
  background: var(--primary-50);
  transform: translateX(4px);
}

.action-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-100);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  transition: all var(--transition-normal);
}

.action-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--neutral-600);
}

.action-button:hover .action-icon {
  background: var(--primary-100);
  transform: scale(1.1);
}

.action-button:hover .action-icon svg {
  color: var(--primary-600);
}

.action-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.action-title {
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.action-description {
  font-size: var(--text-sm);
  color: var(--neutral-600);
}

/* Applications List */
.applications-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.application-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  background: var(--neutral-50);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.application-item:hover {
  border-color: var(--primary-500);
  background: white;
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.app-info {
  flex: 1;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.app-title {
  font-weight: 600;
  color: var(--neutral-900);
  margin: 0;
}

.app-date {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin: 0 0 var(--space-3) 0;
}

.app-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.progress-draft {
  background: var(--warning-500);
}

.progress-submitted {
  background: var(--primary-500);
}

.progress-under_review {
  background: var(--secondary-500);
}

.progress-accepted {
  background: var(--success-500);
}

.progress-rejected {
  background: var(--error-500);
}

.progress-text {
  font-size: var(--text-xs);
  color: var(--neutral-600);
  font-weight: 500;
  min-width: 80px;
}

.app-arrow {
  color: var(--neutral-400);
  transition: all var(--transition-normal);
}

.app-arrow .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.application-item:hover .app-arrow {
  color: var(--primary-500);
  transform: translateX(4px);
}

/* Status Badges */
.status-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  background: #f3e8ff;
  color: #7c3aed;
}

.status-accepted {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* Insights Card */
.insights-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.insight-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary-50);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.insight-icon svg {
  width: 1rem;
  height: 1rem;
  color: var(--secondary-600);
}

.insight-text {
  font-size: var(--text-sm);
  color: var(--neutral-700);
  line-height: var(--leading-relaxed);
}

.insights-actions {
  text-align: center;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}

.empty-icon {
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-icon svg {
  width: 3rem;
  height: 3rem;
  color: var(--neutral-400);
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: var(--space-2);
}

.empty-text {
  font-size: var(--text-base);
  color: var(--neutral-600);
  margin-bottom: var(--space-6);
  line-height: var(--leading-relaxed);
}

/* Loading States */
.loading-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-600);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--neutral-200);
  border-top: 4px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Overlays */
.loading-overlay, .error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-content, .error-content {
  text-align: center;
  padding: var(--space-8);
}

.error-icon {
  margin-bottom: var(--space-4);
}

.error-icon svg {
  width: 3rem;
  height: 3rem;
  color: var(--error-500);
}

.error-content h3 {
  color: var(--neutral-900);
  margin-bottom: var(--space-2);
}

.error-content p {
  color: var(--neutral-600);
  margin-bottom: var(--space-6);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: var(--space-6);
  }
  
  .hero-title {
    font-size: var(--text-3xl);
  }
  
  .hero-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .hero-section {
    padding: var(--space-12) 0;
  }
  
  .dashboard-section {
    padding: var(--space-12) 0;
  }
}
</style>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Welcome, {{ userProfile?.displayName || 'User' }}!</h1>
        <p class="subtitle">Manage your STAIJA account and content</p>
      </div>
      <div class="header-actions">
        <button @click="handleSignOut" class="btn-secondary">Sign Out</button>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- User Profile Card -->
        <div class="dashboard-card">
          <h3>Profile Information</h3>
          <div class="profile-info">
            <div class="info-item">
              <label>Name:</label>
              <span>{{ userProfile?.displayName || 'Not set' }}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>{{ userProfile?.email }}</span>
            </div>
            <div class="info-item">
              <label>Role:</label>
              <span class="role-badge">{{ userProfile?.role || 'applicant' }}</span>
            </div>
            <div class="info-item">
              <label>Member Since:</label>
              <span>{{ formatDate(userProfile?.createdAt) }}</span>
            </div>
          </div>
          <div v-if="isAlumni" class="action-row">
            <button @click="$router.push('/alumni/profile')" class="btn-primary">Edit Alumni Profile</button>
          </div>
        </div>
        
        <!-- Quick Actions Card -->
        <div class="dashboard-card">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button @click="navigateTo('/programs')" class="btn-action">
              <Icon icon="lucide:book-open" class="icon" />
              View Programs
            </button>
            <button @click="navigateTo('/blog')" class="btn-action">
              <Icon icon="lucide:file-text" class="icon" />
              Read Stories
            </button>
            <button @click="navigateTo('/events')" class="btn-action">
              <Icon icon="lucide:calendar" class="icon" />
              Events
            </button>
            <button @click="navigateTo('/donate')" class="btn-action">
              <Icon icon="lucide:heart" class="icon" />
              Donate
            </button>
          </div>
        </div>
        
        <!-- Content Management Card (for editors/admins) -->
        <div v-if="isContentEditor" class="dashboard-card">
          <h3>Content Management</h3>
          <div class="content-actions">
            <button @click="navigateTo('/content')" class="btn-primary">Content Dashboard</button>
            <button @click="navigateTo('/content/events')" class="btn-secondary">Manage Events</button>
            <button v-if="canAccessAdminPanel" @click="navigateTo('/admin')" class="btn-secondary">Admin Panel</button>
          </div>
          <div class="content-stats">
            <div class="stat">
              <span class="stat-number">{{ contentStats.published }}</span>
              <span class="stat-label">Published</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ contentStats.draft }}</span>
              <span class="stat-label">Drafts</span>
            </div>
          </div>
        </div>
        
        <!-- Student Portal Card (for students) -->
        <div v-if="isStudent" class="dashboard-card">
          <h3>Student Portal</h3>
          <div class="student-actions">
            <button @click="$router.push('/student')" class="btn-primary">My Program</button>
            <button @click="$router.push('/student/assignments')" class="btn-secondary">Assignments</button>
          </div>
          <div class="student-stats">
            <div class="stat">
              <span class="stat-number">{{ studentStats.modules }}</span>
              <span class="stat-label">Modules</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ studentStats.completed }}</span>
              <span class="stat-label">Completed</span>
            </div>
          </div>
        </div>
        
        <!-- Alumni Features Card (for alumni) -->
        <div v-if="isAlumni" class="dashboard-card">
          <h3>Alumni Features</h3>
          <div class="alumni-actions">
            <button @click="$router.push('/alumni')" class="btn-primary">Alumni Directory</button>
            <button @click="$router.push('/alumni/stories')" class="btn-secondary">Share Story</button>
          </div>
          <div class="alumni-stats">
            <div class="stat">
              <span class="stat-number">{{ alumniStats.connections }}</span>
              <span class="stat-label">Connections</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ alumniStats.stories }}</span>
              <span class="stat-label">Stories</span>
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
      <button @click="loadUserProfile" class="btn-primary">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, DatabaseService, PermissionService, type UserProfile } from '../services/firebase'
import { Timestamp } from 'firebase/firestore'
import { Icon } from '@iconify/vue'

const router = useRouter()

// Reactive data
const userProfile = ref<UserProfile | null>(null)
const loading = ref(true)
const error = ref('')

// Mock data for demonstration
const contentStats = ref({
  published: 12,
  draft: 3
})

const alumniStats = ref({
  connections: 45,
  stories: 2
})

const studentStats = ref({
  modules: 12,
  completed: 5
})

// Computed properties
const isContentEditor = computed(() => {
  return userProfile.value ? PermissionService.isContentEditorRole(userProfile.value.role) : false
})

const isAlumni = computed(() => {
  return userProfile.value ? PermissionService.isAlumniRole(userProfile.value.role) : false
})

const canAccessAdminPanel = computed(() => {
  return userProfile.value ? PermissionService.hasPermission(userProfile.value.role, 'view_all_users') : false
})

const isStudent = computed(() => {
  return userProfile.value ? PermissionService.isStudentRole(userProfile.value.role) : false
})

// Methods
const loadUserProfile = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    const profile = await DatabaseService.getUserProfile(currentUser.uid)
    if (profile) {
      userProfile.value = profile
    } else {
      // Fallback if profile doesn't exist yet
      userProfile.value = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'User',
        role: 'applicant',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load user profile'
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

const formatDate = (date: any) => {
  if (!date) return 'Unknown'
  try {
    // Handle Firestore Timestamp
    const d = date instanceof Timestamp ? date.toDate() : 
              date.toDate ? date.toDate() : // Handle duck-typing if class not instance
              new Date(date)
              
    if (isNaN(d.getTime())) return 'Unknown'
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (e) {
    return 'Unknown'
  }
}

// Lifecycle
onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.dashboard {
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
  display: flex;
  flex-direction: column;
}

.dashboard-card h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.profile-info {
  margin-bottom: 1.5rem;
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: var(--color-text);
}

.role-badge {
  background: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
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

.content-actions, .alumni-actions, .student-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.content-stats, .alumni-stats, .student-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  .dashboard {
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
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .content-stats, .alumni-stats {
    grid-template-columns: 1fr;
  }
}
</style>

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
              <span class="role-badge">{{ userProfile?.role || 'student' }}</span>
            </div>
            <div class="info-item">
              <label>Member Since:</label>
              <span>{{ formatDate(userProfile?.createdAt) }}</span>
            </div>
          </div>
          <button @click="editProfile = true" class="btn-primary">Edit Profile</button>
        </div>
        
        <!-- Quick Actions Card -->
        <div class="dashboard-card">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button @click="navigateTo('/programs')" class="btn-action">
              <span class="icon">📚</span>
              View Programs
            </button>
            <button @click="navigateTo('/blog')" class="btn-action">
              <span class="icon">📝</span>
              Read Stories
            </button>
            <button @click="navigateTo('/donate')" class="btn-action">
              <span class="icon">💝</span>
              Make a Donation
            </button>
            <button @click="navigateTo('/contact')" class="btn-action">
              <span class="icon">📧</span>
              Contact Us
            </button>
          </div>
        </div>
        
        <!-- Content Management Card (for editors/admins) -->
        <div v-if="isContentEditor" class="dashboard-card">
          <h3>Content Management</h3>
          <div class="content-actions">
            <button @click="navigateTo('/admin')" class="btn-primary">Admin Panel</button>
            <button @click="createContent = true" class="btn-secondary">Create New Content</button>
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
        
        <!-- Alumni Features Card (for alumni) -->
        <div v-if="isAlumni" class="dashboard-card">
          <h3>Alumni Features</h3>
          <div class="alumni-actions">
            <button @click="shareStory = true" class="btn-primary">Share Your Story</button>
            <button @click="connectNetwork = true" class="btn-secondary">Connect Network</button>
          </div>
          <div class="alumni-stats">
            <div class="stat">
              <span class="stat-number">{{ alumniStats.connections }}</span>
              <span class="stat-label">Connections</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ alumniStats.stories }}</span>
              <span class="stat-label">Stories Shared</span>
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
import { AuthService, DatabaseService, type UserProfile } from '../services/firebase'

const router = useRouter()

// Reactive data
const userProfile = ref<UserProfile | null>(null)
const loading = ref(true)
const error = ref('')
const editProfile = ref(false)
const createContent = ref(false)
const viewContent = ref(false)
const shareStory = ref(false)
const connectNetwork = ref(false)

// Mock data for demonstration
const contentStats = ref({
  published: 12,
  draft: 3
})

const alumniStats = ref({
  connections: 45,
  stories: 2
})

// Computed properties
const isContentEditor = computed(() => {
  return userProfile.value?.role === 'content_editor' || userProfile.value?.role === 'admin'
})

const isAlumni = computed(() => {
  return userProfile.value?.role === 'alumni'
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
      error.value = 'User profile not found'
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

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
}

.dashboard-card h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.profile-info {
  margin-bottom: 1.5rem;
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

.content-actions, .alumni-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.content-stats, .alumni-stats {
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

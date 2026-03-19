<template>
  <div class="student-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Welcome to Your Program!</h1>
        <p class="subtitle">Access your program materials, track your progress, and connect with your mentor</p>
      </div>
      <div class="header-actions">
        <div class="program-badge">
          <span class="program-name">{{ userProgram }}</span>
          <span class="program-status">Active Student</span>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- Program Content Card -->
        <div class="dashboard-card">
          <h3>Program Materials</h3>
          <div class="card-content">
            <p>Access your program curriculum, resources, and learning materials</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-number">{{ programStats.modules }}</span>
                <span class="stat-label">Modules</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ programStats.completed }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/student/program')" class="btn-primary">
                View Program Content
              </button>
            </div>
          </div>
        </div>

        <!-- Assignments Card -->
        <div class="dashboard-card">
          <h3>Assignments & Tasks</h3>
          <div class="card-content">
            <p>Complete your assignments and track your progress</p>
            <div class="assignment-notifications">
              <div v-if="pendingAssignments > 0" class="notification pending">
                <span class="notification-icon"><Icon icon="lucide:file-edit" /></span>
                <span>{{ pendingAssignments }} pending assignments</span>
              </div>
              <div v-if="upcomingDeadlines > 0" class="notification urgent">
                <span class="notification-icon"><Icon icon="lucide:clock" /></span>
                <span>{{ upcomingDeadlines }} due soon</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/student/assignments')" class="btn-primary">
                View Assignments
              </button>
            </div>
          </div>
        </div>

        <!-- Progress Card -->
        <div class="dashboard-card">
          <h3>My Progress</h3>
          <div class="card-content">
            <p>Track your learning journey and achievements</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              <span class="progress-text">{{ progressPercentage }}% Complete</span>
            </div>
            <div class="progress-stats">
              <div class="stat">
                <span class="stat-number">{{ progressStats.achievements }}</span>
                <span class="stat-label">Achievements</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ progressStats.hours }}</span>
                <span class="stat-label">Study Hours</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/student/progress')" class="btn-secondary">
                View Detailed Progress
              </button>
            </div>
          </div>
        </div>

        <!-- Mentor Support Card -->
        <div class="dashboard-card">
          <h3>Mentor Support</h3>
          <div class="card-content">
            <p>Get guidance from your assigned mentor</p>
            <div class="mentor-info">
              <div class="mentor-avatar">{{ mentorInitials }}</div>
              <div class="mentor-details">
                <div class="mentor-name">{{ mentorName }}</div>
                <div class="mentor-role">Program Mentor</div>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/student/mentor')" class="btn-primary">
                Contact Mentor
              </button>
            </div>
          </div>
        </div>

        <!-- Upcoming Events Card -->
        <div class="dashboard-card">
          <h3>Upcoming Events</h3>
          <div class="card-content">
            <p>Join program events and workshops</p>
            <div class="upcoming-events">
              <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
                <div class="event-date">{{ formatDate(event.date) }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-type">{{ event.type }}</div>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/events')" class="btn-secondary">
                View All Events
              </button>
            </div>
          </div>
        </div>

        <!-- Peer Network Card -->
        <div class="dashboard-card">
          <h3>Peer Network</h3>
          <div class="card-content">
            <p>Connect with fellow students in your program</p>
            <div class="network-stats">
              <div class="stat">
                <span class="stat-number">{{ networkStats.connections }}</span>
                <span class="stat-label">Connections</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ networkStats.discussions }}</span>
                <span class="stat-label">Discussions</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/student/network')" class="btn-primary">
                View Network
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions Bar -->
    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <div class="action-buttons">
        <button @click="$router.push('/student/program')" class="quick-action-btn">
          <span class="icon"><Icon icon="lucide:book-open" /></span>
          <span>Study Materials</span>
        </button>
        <button @click="$router.push('/student/assignments')" class="quick-action-btn">
          <span class="icon"><Icon icon="lucide:file-edit" /></span>
          <span>Submit Assignment</span>
        </button>
        <button @click="$router.push('/student/mentor')" class="quick-action-btn">
          <span class="icon"><Icon icon="lucide:presentation" /></span>
          <span>Ask Mentor</span>
        </button>
        <button @click="$router.push('/student/progress')" class="quick-action-btn">
          <span class="icon"><Icon icon="lucide:bar-chart-2" /></span>
          <span>Check Progress</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { AuthService, DatabaseService, type UserProfile } from '../../services/firebase'

const router = useRouter()

// Reactive data
const userProfile = ref<UserProfile | null>(null)

// Mock data - in a real app, this would come from your backend
const userProgram = ref('StepUp Scholars')

const programStats = ref({
  modules: 12,
  completed: 5
})

const pendingAssignments = ref(3)
const upcomingDeadlines = ref(2)

const progressPercentage = ref(42)

const progressStats = ref({
  achievements: 8,
  hours: 67
})

const mentorName = ref('Dr. Sarah Johnson')
const mentorInitials = computed(() => {
  return mentorName.value.split(' ').map(n => n[0]).join('')
})

const upcomingEvents = ref([
  {
    id: 1,
    title: 'Career Development Workshop',
    date: new Date('2024-12-15'),
    type: 'Workshop'
  },
  {
    id: 2,
    title: 'Peer Study Group',
    date: new Date('2024-12-18'),
    type: 'Study Session'
  },
  {
    id: 3,
    title: 'Mentor Q&A Session',
    date: new Date('2024-12-20'),
    type: 'Mentoring'
  }
])

const networkStats = ref({
  connections: 15,
  discussions: 8
})

// Methods
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const loadUserProfile = async () => {
  try {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const profile = await DatabaseService.getUserProfile(currentUser.uid)
    if (profile) {
      userProfile.value = profile
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.student-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
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

.program-badge {
  text-align: right;
}

.program-name {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  color: #007bff;
}

.program-status {
  font-size: 0.9rem;
  color: #28a745;
  font-weight: 500;
}

.dashboard-content {
  margin-bottom: 3rem;
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
  border: 1px solid #e9ecef;
}

.dashboard-card h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.card-content p {
  color: #6c757d;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
}

.assignment-notifications {
  margin-bottom: 1.5rem;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.notification.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.notification.urgent {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  border-radius: 12px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.progress-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mentor-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.mentor-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.mentor-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.mentor-role {
  font-size: 0.9rem;
  color: #6c757d;
}

.upcoming-events {
  margin-bottom: 1.5rem;
}

.event-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.event-date {
  font-size: 0.8rem;
  color: #007bff;
  font-weight: 600;
}

.event-title {
  font-weight: 500;
  color: #2c3e50;
  margin: 0.25rem 0;
}

.event-type {
  font-size: 0.8rem;
  color: #6c757d;
}

.network-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.card-actions {
  text-align: center;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin: 0.25rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.quick-actions h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: #495057;
}

.quick-action-btn:hover {
  border-color: #007bff;
  background: #f8f9fa;
  transform: translateY(-2px);
}

.quick-action-btn .icon {
  font-size: 2rem;
}

.quick-action-btn span:last-child {
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .student-dashboard {
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

  .action-buttons {
    grid-template-columns: 1fr;
  }

  .stats, .progress-stats, .network-stats {
    grid-template-columns: 1fr;
  }
}
</style>

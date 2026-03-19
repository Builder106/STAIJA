<template>
  <div class="content-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Content Management Dashboard</h1>
        <p class="subtitle">Manage STAIJA's content, blog posts, programs, and events</p>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/content/blog/new')" class="btn-primary">
          Create New Blog Post
        </button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- Blog Management Card -->
        <div class="dashboard-card">
          <h3>Blog Posts</h3>
          <div class="card-content">
            <p>Manage blog posts, articles, and stories</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-number">{{ blogStats.published }}</span>
                <span class="stat-label">Published</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ blogStats.draft }}</span>
                <span class="stat-label">Drafts</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/content/blog')" class="btn-secondary">
                Manage Blog Posts
              </button>
            </div>
          </div>
        </div>

        <!-- Program Content Card -->
        <div class="dashboard-card">
          <h3>Program Content</h3>
          <div class="card-content">
            <p>Update program descriptions, benefits, and requirements</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-number">{{ programStats.active }}</span>
                <span class="stat-label">Active Programs</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ programStats.updates }}</span>
                <span class="stat-label">Recent Updates</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/content/programs')" class="btn-secondary">
                Manage Programs
              </button>
            </div>
          </div>
        </div>

        <!-- Events Card -->
        <div class="dashboard-card">
          <h3>Events</h3>
          <div class="card-content">
            <p>Manage upcoming events and workshops</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-number">{{ eventStats.upcoming }}</span>
                <span class="stat-label">Upcoming</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ eventStats.past }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/content/events')" class="btn-secondary">
                Manage Events
              </button>
            </div>
          </div>
        </div>

        <!-- Categories Card -->
        <div class="dashboard-card">
          <h3>Categories</h3>
          <div class="card-content">
            <p>Organize content with categories and tags</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-number">{{ categoryStats.total }}</span>
                <span class="stat-label">Categories</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ categoryStats.used }}</span>
                <span class="stat-label">In Use</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="$router.push('/content/categories')" class="btn-secondary">
                Manage Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon"><Icon :icon="activity.icon" /></div>
          <div class="activity-content">
            <p class="activity-text">{{ activity.text }}</p>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

// Mock data - in a real app, this would come from your backend
const blogStats = ref({
  published: 24,
  draft: 7
})

const programStats = ref({
  active: 2,
  updates: 3
})

const eventStats = ref({
  upcoming: 5,
  past: 12
})

const categoryStats = ref({
  total: 8,
  used: 6
})

const recentActivities = ref([
  {
    id: 1,
    icon: 'lucide:file-edit',
    text: 'Published new blog post: "The Future of Tech Education"',
    time: '2 hours ago'
  },
  {
    id: 2,
    icon: 'lucide:graduation-cap',
    text: 'Updated StepUp Scholars program description',
    time: '1 day ago'
  },
  {
    id: 3,
    icon: 'lucide:calendar',
    text: 'Created new workshop event: "Career Planning 101"',
    time: '2 days ago'
  },
  {
    id: 4,
    icon: 'lucide:tag',
    text: 'Added new category: "Mentorship Programs"',
    time: '3 days ago'
  }
])

onMounted(() => {
  // In a real app, you would fetch actual stats here
  console.log('Content Dashboard mounted')
})
</script>

<style scoped>
.content-dashboard {
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
  margin-bottom: 3rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

.card-content p {
  color: var(--color-text-secondary);
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
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #0056b3);
}

.btn-secondary {
  background: var(--color-secondary, #6c757d);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-secondary-dark, #545b62);
}

.recent-activity {
  max-width: 1200px;
  margin: 0 auto;
}

.recent-activity h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.activity-list {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border-light, #f0f0f0);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  min-width: 2rem;
  text-align: center;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 0.25rem 0;
  color: var(--color-text);
  font-size: 0.95rem;
}

.activity-time {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .content-dashboard {
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

  .stats {
    grid-template-columns: 1fr;
  }
}
</style>

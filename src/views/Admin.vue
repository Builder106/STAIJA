<template>
  <div class="admin-dashboard">
    <div class="admin-header">
      <h1>STAIJA Admin Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ user?.displayName || user?.email }}</span>
        <button @click="signOut" class="btn btn-outline btn-sm">Sign Out</button>
      </div>
    </div>

    <div class="admin-layout">
      <!-- Sidebar Navigation -->
      <aside class="admin-sidebar">
        <nav class="admin-nav">
          <div class="nav-section">
            <h3>Content Management</h3>
            <ul class="nav-list">
              <li>
                <button 
                  @click="activeTab = 'blog-posts'"
                  :class="['nav-item', { active: activeTab === 'blog-posts' }]"
                >
                  <span class="nav-icon">📝</span>
                  Blog Posts
                </button>
              </li>
              <li>
                <button 
                  @click="activeTab = 'authors'"
                  :class="['nav-item', { active: activeTab === 'authors' }]"
                >
                  <span class="nav-icon">👤</span>
                  Authors
                </button>
              </li>
              <li>
                <button 
                  @click="activeTab = 'categories'"
                  :class="['nav-item', { active: activeTab === 'categories' }]"
                >
                  <span class="nav-icon">🏷️</span>
                  Categories
                </button>
              </li>
              <li>
                <button 
                  @click="activeTab = 'programs'"
                  :class="['nav-item', { active: activeTab === 'programs' }]"
                >
                  <span class="nav-icon">🎓</span>
                  Programs
                </button>
              </li>
              <li>
                <button 
                  @click="activeTab = 'events'"
                  :class="['nav-item', { active: activeTab === 'events' }]"
                >
                  <span class="nav-icon">📅</span>
                  Events
                </button>
              </li>
              <li>
                <button 
                  @click="activeTab = 'alumni-stories'"
                  :class="['nav-item', { active: activeTab === 'alumni-stories' }]"
                >
                  <span class="nav-icon">🌟</span>
                  Alumni Stories
                </button>
              </li>
            </ul>
          </div>

          <div class="nav-section">
            <h3>Quick Actions</h3>
            <ul class="nav-list">
              <li>
                <button 
                  @click="createNewContent"
                  class="nav-item btn-primary"
                >
                  <span class="nav-icon">➕</span>
                  Create New {{ getCurrentContentTypeName() }}
                </button>
              </li>
              <li>
                <button 
                  @click="viewAllContent"
                  class="nav-item"
                >
                  <span class="nav-icon">📋</span>
                  View All {{ getCurrentContentTypeName() }}
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="admin-main">
        <div class="content-header">
          <h2>{{ getCurrentContentTypeName() }} Management</h2>
          <div class="content-actions">
            <button @click="createNewContent" class="btn btn-primary">
              Create New {{ getCurrentContentTypeName() }}
            </button>
          </div>
        </div>

        <!-- Content Tabs -->
        <div class="content-tabs">
          <!-- Blog Posts Tab -->
          <div v-if="activeTab === 'blog-posts'" class="tab-content">
            <BlogPostEditor v-if="showEditor" />
            <div v-else class="content-list">
              <h3>Recent Blog Posts</h3>
              <p>No blog posts found. Create your first blog post!</p>
            </div>
          </div>

          <!-- Authors Tab -->
          <div v-if="activeTab === 'authors'" class="tab-content">
            <AuthorEditor v-if="showEditor" />
            <div v-else class="content-list">
              <h3>Authors</h3>
              <p>No authors found. Create your first author!</p>
            </div>
          </div>

          <!-- Categories Tab -->
          <div v-if="activeTab === 'categories'" class="tab-content">
            <CategoryEditor v-if="showEditor" />
            <div v-else class="content-list">
              <h3>Categories</h3>
              <p>No categories found. Create your first category!</p>
            </div>
          </div>

          <!-- Programs Tab -->
          <div v-if="activeTab === 'programs'" class="tab-content">
            <ProgramEditor v-if="showEditor" />
            <div v-else class="content-list">
              <h3>Programs</h3>
              <p>No programs found. Create your first program!</p>
            </div>
          </div>

          <!-- Events Tab -->
          <div v-if="activeTab === 'events'" class="tab-content">
            <EventEditor v-if="showEditor" />
            <div v-else class="content-list">
              <h3>Events</h3>
              <p>No events found. Create your first event!</p>
            </div>
          </div>

          <!-- Alumni Stories Tab -->
          <div v-if="activeTab === 'alumni-stories'" class="tab-content">
            <AlumniStoryEditor v-if="showEditor" />
            <div v-else class="content-list">
              <h3>Alumni Stories</h3>
              <p>No alumni stories found. Create your first story!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth'
import app from '../config/firebase'
import BlogPostEditor from '../components/admin/BlogPostEditor.vue'
import AuthorEditor from '../components/admin/AuthorEditor.vue'
import CategoryEditor from '../components/admin/CategoryEditor.vue'
import ProgramEditor from '../components/admin/ProgramEditor.vue'
import EventEditor from '../components/admin/EventEditor.vue'
import AlumniStoryEditor from '../components/admin/AlumniStoryEditor.vue'

const router = useRouter()
const auth = getAuth(app)

// State
const user = ref<User | null>(null)
const activeTab = ref('blog-posts')
const showEditor = ref(false)

// Computed
const getCurrentContentTypeName = () => {
  const names = {
    'blog-posts': 'Blog Post',
    'authors': 'Author',
    'categories': 'Category',
    'programs': 'Program',
    'events': 'Event',
    'alumni-stories': 'Alumni Story'
  }
  return names[activeTab.value as keyof typeof names] || 'Content'
}

// Methods
const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const createNewContent = () => {
  showEditor.value = true
}

const viewAllContent = () => {
  showEditor.value = false
}

// Lifecycle
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    if (!currentUser) {
      router.push('/login')
    }
  })
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.admin-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-layout {
  display: flex;
  min-height: calc(100vh - 80px);
}

.admin-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 2rem 0;
}

.admin-nav {
  padding: 0 1rem;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #495057;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f8f9fa;
  color: #2c3e50;
}

.nav-item.active {
  background-color: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.nav-item.btn-primary {
  background-color: #1976d2;
  color: white;
}

.nav-item.btn-primary:hover {
  background-color: #1565c0;
}

.nav-icon {
  font-size: 1.125rem;
}

.admin-main {
  flex: 1;
  padding: 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h2 {
  margin: 0;
  color: #2c3e50;
}

.content-tabs {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-content {
  padding: 2rem;
}

.content-list {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.content-list h3 {
  margin-bottom: 1rem;
  color: #495057;
}

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-outline {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-outline:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
  
  .admin-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>

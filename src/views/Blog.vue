<script setup lang="ts">
import { ref, computed } from 'vue'

type Post = {
  id: string
  title: string
  excerpt: string
  author: string
  date: string
  program: 'StepUp' | 'Dynamerge' | 'General'
  topic: 'Research' | 'Story' | 'News'
}

const filters = ref({ program: 'All', topic: 'All', query: '' })

const posts = ref<Post[]>([
  { id: '1', title: 'Building Low-cost Lab Kits', excerpt: 'How StepUp teams prototyped affordable lab kits for schools...', author: 'Adaeze I.', date: '2025-02-10', program: 'StepUp', topic: 'Research' },
  { id: '2', title: 'Dynamerge Fellows Showcase', excerpt: 'Highlights from the recent Dynamerge fellows demo day...', author: 'Femi A.', date: '2025-01-28', program: 'Dynamerge', topic: 'News' },
  { id: '3', title: 'From Student to Scholar', excerpt: 'An alumni story about mentorship and discovery...', author: 'Zainab O.', date: '2024-12-15', program: 'StepUp', topic: 'Story' },
])

const filteredPosts = computed(() => {
  return posts.value.filter((p) => {
    const matchesProgram = filters.value.program === 'All' || p.program === filters.value.program
    const matchesTopic = filters.value.topic === 'All' || p.topic === filters.value.topic
    const q = filters.value.query.trim().toLowerCase()
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
    return matchesProgram && matchesTopic && matchesQuery
  })
})

const setFilter = (key: 'program' | 'topic', value: string) => {
  ;(filters.value as any)[key] = value
}
</script>

<template>
  <section class="blog">
    <div class="container">
      <header class="blog-header">
        <div>
          <h1 class="blog-title">Stories & Research</h1>
          <p class="blog-subtitle">Insights, impact stories, and research highlights from our programs</p>
        </div>
        <div class="blog-controls">
          <div class="control-group">
            <label class="control-label">Program</label>
            <div class="pills">
              <button class="pill" :class="{ active: filters.program === 'All' }" @click="setFilter('program', 'All')">All</button>
              <button class="pill" :class="{ active: filters.program === 'StepUp' }" @click="setFilter('program', 'StepUp')">StepUp</button>
              <button class="pill" :class="{ active: filters.program === 'Dynamerge' }" @click="setFilter('program', 'Dynamerge')">Dynamerge</button>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label">Topic</label>
            <div class="pills">
              <button class="pill" :class="{ active: filters.topic === 'All' }" @click="setFilter('topic', 'All')">All</button>
              <button class="pill" :class="{ active: filters.topic === 'Research' }" @click="setFilter('topic', 'Research')">Research</button>
              <button class="pill" :class="{ active: filters.topic === 'Story' }" @click="setFilter('topic', 'Story')">Stories</button>
              <button class="pill" :class="{ active: filters.topic === 'News' }" @click="setFilter('topic', 'News')">News</button>
            </div>
          </div>
          <div class="search-box">
            <input type="search" v-model="filters.query" placeholder="Search stories..." />
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 blog-grid">
        <article v-for="post in filteredPosts" :key="post.id" class="card blog-card">
          <div class="card-body">
            <div class="blog-meta">
              <span class="badge">{{ post.program }}</span>
              <span class="dot">•</span>
              <span class="muted">{{ post.topic }}</span>
              <span class="dot">•</span>
              <span class="muted">{{ new Date(post.date).toLocaleDateString() }}</span>
            </div>
            <h3 class="blog-card-title">{{ post.title }}</h3>
            <p class="blog-excerpt">{{ post.excerpt }}</p>
            <div class="blog-byline">By {{ post.author }}</div>
            <div class="blog-actions">
              <a href="#" class="btn btn-outline btn-sm">Read more</a>
              <a href="/donate" class="btn btn-secondary btn-sm">Donate</a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.blog-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  align-items: stretch;
  justify-content: space-between;
  margin: var(--space-12) 0 var(--space-8);
}

.blog-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin: 0 0 var(--space-2) 0;
}

.blog-subtitle {
  color: var(--neutral-600);
  margin: 0;
}

.blog-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.control-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--neutral-700);
}

.pills {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pill {
  padding: var(--space-2) var(--space-3);
  background: var(--neutral-100);
  border: 1px solid var(--neutral-300);
  color: var(--neutral-700);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pill.active, .pill:hover {
  background: var(--primary-600);
  border-color: var(--primary-600);
  color: white;
}

.search-box input[type="search"] {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
}

.blog-grid {
  padding-bottom: var(--space-20);
}

.blog-card {
  animation: fadeInUp 600ms ease both;
}

.blog-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  color: var(--neutral-600);
  font-size: var(--text-sm);
}

.badge {
  background: var(--secondary-100);
  color: var(--secondary-700);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.dot { opacity: 0.5; }
.muted { opacity: 0.8; }

.blog-card-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-2);
}

.blog-excerpt { margin-bottom: var(--space-4); }

.blog-byline {
  color: var(--neutral-600);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.blog-actions { display: flex; gap: var(--space-3); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (min-width: 768px) {
  .blog-controls {
    grid-template-columns: auto auto 1fr;
    align-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .blog-card { animation: none; }
}
</style>

<template>
  <section class="directory">
    <h1>Alumni Directory</h1>
    <div class="filters">
      <input v-model="q" placeholder="Search name, headline, skills, location" />
    </div>
    <div class="list">
      <article v-for="al in filtered" :key="al.uid" class="item">
        <h3>{{ al.displayName }}</h3>
        <p class="muted">{{ al.headline }}</p>
        <p class="muted">{{ al.location }}</p>
        <div class="tags">
          <span v-for="s in al.skills || []" :key="s" class="tag">{{ s }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'

type DirAlumni = {
  uid: string
  displayName?: string
  headline?: string
  location?: string
  skills?: string[]
  role?: string
}

const q = ref('')
const all = ref<DirAlumni[]>([])

const load = async () => {
  // Simple role filter on client; consider an index/collection for directory
  const snap = await getDocs(query(collection(db, 'users')))
  all.value = snap.docs
    .map(d => ({ uid: d.id, ...(d.data() as DirAlumni) }))
    .filter(a => a.role === 'alumni' || a.role === 'admin')
}

const normalized = (s?: string) => (s || '').toLowerCase()

const filtered = computed(() => {
  const term = normalized(q.value)
  if (!term) return all.value
  return all.value.filter(a => {
    const blob = [a.displayName, a.headline, a.location, (a.skills || []).join(' ')].map(normalized).join(' ')
    return blob.includes(term)
  })
})

onMounted(load)
</script>

<style scoped>
.directory { padding: 2rem; max-width: 1000px; margin: 0 auto; }
.filters { margin-bottom: 1rem; }
input { width: 100%; border: 1px solid var(--color-border); border-radius: 8px; padding: 0.5rem; }
.list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.item { border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; background: white; }
.muted { color: var(--color-text-secondary); margin: 0.25rem 0; }
.tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
.tag { background: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 999px; padding: 0.25rem 0.5rem; font-size: 0.8rem; }
</style>



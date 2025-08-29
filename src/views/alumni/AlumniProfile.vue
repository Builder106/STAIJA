<template>
  <section class="profile">
    <h1>My Alumni Profile</h1>
    <form @submit.prevent="save">
      <div class="grid">
        <label>
          <span>Display name</span>
          <input v-model="form.displayName" required />
        </label>
        <label>
          <span>Headline</span>
          <input v-model="form.headline" placeholder="e.g., ML Engineer at X" />
        </label>
        <label class="full">
          <span>Bio</span>
          <textarea v-model="form.bio" rows="5"></textarea>
        </label>
        <label>
          <span>Location</span>
          <input v-model="form.location" />
        </label>
        <label>
          <span>Skills (comma separated)</span>
          <input v-model="form.skills" placeholder="Python, ML, Data" />
        </label>
      </div>
      <div class="actions">
        <button class="btn" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
        <p v-if="message" class="message">{{ message }}</p>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AuthService, DatabaseService, type UserProfile } from '../../services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

type AlumniProfile = UserProfile & {
  headline?: string
  bio?: string
  location?: string
  skills?: string[]
}

const form = ref({
  displayName: '',
  headline: '',
  bio: '',
  location: '',
  skills: ''
})
const saving = ref(false)
const message = ref('')

const load = async () => {
  const user = AuthService.getCurrentUser()
  if (!user) return
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (!snap.exists()) return
  const data = snap.data() as AlumniProfile
  form.value.displayName = data.displayName || ''
  form.value.headline = data.headline || ''
  form.value.bio = data.bio || ''
  form.value.location = data.location || ''
  form.value.skills = (data.skills || []).join(', ')
}

const save = async () => {
  saving.value = true
  message.value = ''
  const user = AuthService.getCurrentUser()
  if (!user) return
  const skillsArray = form.value.skills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const updates: Partial<AlumniProfile> = {
    displayName: form.value.displayName,
    headline: form.value.headline,
    bio: form.value.bio,
    location: form.value.location,
    skills: skillsArray,
    role: 'alumni'
  }
  await setDoc(doc(db, 'users', user.uid), { ...(await (await getDoc(doc(db, 'users', user.uid))).data()), ...updates, updatedAt: new Date() })
  await DatabaseService.updateUserProfile(user.uid, {})
  message.value = 'Profile saved'
  saving.value = false
}

onMounted(load)
</script>

<style scoped>
.profile { padding: 2rem; max-width: 800px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 0.5rem; }
input, textarea { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.5rem; }
.actions { margin-top: 1rem; display: flex; align-items: center; gap: 1rem; }
.btn { background: var(--color-primary); color: white; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; }
.message { color: var(--color-text-secondary); }
@media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
</style>



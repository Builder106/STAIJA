<template>
  <div v-if="loading" class="loading">Loading event...</div>
  <div v-else-if="!event" class="error">Event not found</div>
  <div v-else class="event-detail">
    <div class="hero">
      <div class="container">
        <router-link to="/events" class="back-link">← Back to Events</router-link>
        <div class="tags">
          <span v-for="tag in event.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <h1>{{ event.title }}</h1>
        <div class="meta-row">
          <span><Icon icon="lucide:calendar" class="icon" /> {{ formatDate(event.start) }}</span>
          <span><Icon icon="lucide:clock" class="icon" /> {{ formatTime(event.start) }} - {{ formatTime(event.end) }} ({{ event.timezone }})</span>
          <span><Icon icon="lucide:map-pin" class="icon" /> {{ event.location.type === 'online' ? 'Online' : event.location.address }}</span>
        </div>
      </div>
    </div>

    <div class="container content-grid">
      <div class="main">
        <h2>About this event</h2>
        <p class="description">{{ event.description }}</p>
      </div>

      <div class="sidebar">
        <div class="register-card">
          <div v-if="registration">
            <div class="status-msg" :class="registration.status">
              <span v-if="registration.status === 'registered'"><Icon icon="lucide:check-circle" class="icon inline" /> You are registered!</span>
              <span v-else-if="registration.status === 'waitlisted'"><Icon icon="lucide:hourglass" class="icon inline" /> You are on the waitlist</span>
              <span v-else>Registration Cancelled</span>
            </div>
            <div class="actions">
              <a v-if="registration.status === 'registered' && event.location.url" :href="event.location.url" target="_blank" class="btn btn-primary full">Join Event</a>
              <button @click="cancelRegistration" class="btn btn-outline full" :disabled="processing">Cancel Registration</button>
            </div>
          </div>

          <div v-else>
            <div class="spots-info">
              <div v-if="isFull" class="full-warning">Event is full. Join the waitlist.</div>
              <div v-else class="spots-avail">{{ event.capacity - event.registeredCount }} spots remaining</div>
            </div>
            
            <button v-if="user" @click="register" class="btn btn-primary full" :disabled="processing">
              {{ isFull ? 'Join Waitlist' : 'Register Now' }}
            </button>
            <button v-else @click="$router.push(`/login?redirect=/events/${event.id}`)" class="btn btn-primary full">
              Sign in to Register
            </button>
          </div>

          <div class="ics-link" v-if="registration?.status === 'registered'">
             <!-- Placeholder for ICS download -->
             <a href="#" @click.prevent="downloadICS">Add to Calendar</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { EventService, type AppEvent, type EventRegistration } from '../services/eventService'
import { AuthService } from '../services/firebase'
import { Timestamp } from 'firebase/firestore'
import { Icon } from '@iconify/vue'

const route = useRoute()
const event = ref<AppEvent | null>(null)
const registration = ref<EventRegistration | null>(null)
const loading = ref(true)
const processing = ref(false)
const user = AuthService.getCurrentUser()

const isFull = computed(() => {
  if (!event.value) return false
  return event.value.registeredCount >= event.value.capacity
})

const load = async () => {
  loading.value = true
  const id = route.params.id as string
  try {
    event.value = await EventService.getEvent(id)
    if (user && event.value) {
      registration.value = await EventService.getUserRegistration(id, user.uid)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const register = async () => {
  if (!user || !event.value) return
  processing.value = true
  try {
    await EventService.registerForEvent(event.value.id!, user.uid)
    // Reload to get updated counts and status
    await load()
  } catch (e) {
    alert('Registration failed: ' + (e as Error).message)
  } finally {
    processing.value = false
  }
}

const cancelRegistration = async () => {
  if (!user || !event.value) return
  if (!confirm('Are you sure you want to cancel?')) return
  
  processing.value = true
  try {
    await EventService.cancelRegistration(event.value.id!, user.uid)
    registration.value = null
    await load()
  } catch (e) {
    alert('Cancellation failed: ' + (e as Error).message)
  } finally {
    processing.value = false
  }
}

const downloadICS = () => {
  // Basic ICS generation could go here
  alert('Calendar download not implemented yet')
}

const getDateObj = (val: Date | Timestamp | string) => {
  return val instanceof Timestamp ? val.toDate() : new Date(val)
}

const formatDate = (val: Date | Timestamp | string) => {
  return getDateObj(val).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (val: Date | Timestamp | string) => {
  return getDateObj(val).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

onMounted(load)
</script>

<style scoped>
.hero { background: var(--color-background-soft); padding: 4rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 1.5rem; }
.back-link { display: inline-block; margin-bottom: 2rem; color: #666; text-decoration: none; font-weight: 500; }
.tags { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tag { background: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; color: var(--color-primary); }
h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
.meta-row { display: flex; gap: 2rem; color: #555; font-size: 1.1rem; flex-wrap: wrap; }
.meta-row span { display: flex; align-items: center; gap: 0.5rem; }

.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 3rem; margin-top: 3rem; padding-bottom: 4rem; }
.description { font-size: 1.1rem; line-height: 1.6; color: #444; white-space: pre-line; }

.register-card { 
  background: white; padding: 2rem; border-radius: 16px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: sticky; top: 2rem;
}
.btn { padding: 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: center; text-decoration: none; display: inline-block; }
.full { width: 100%; display: block; box-sizing: border-box; }
.btn-primary { background: var(--color-primary); color: white; border: none; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-outline { background: white; border: 1px solid var(--color-error); color: var(--color-error); margin-top: 0.5rem; }

.status-msg { padding: 1rem; border-radius: 8px; text-align: center; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.status-msg.registered { background: #e6fffa; color: #00a88d; }
.status-msg.waitlisted { background: #fffaf0; color: #c05621; }
.inline { font-size: 1.2rem; }

.spots-info { text-align: center; margin-bottom: 1rem; color: #666; }
.full-warning { color: var(--color-error); font-weight: bold; }
.ics-link { margin-top: 1rem; text-align: center; font-size: 0.9rem; }

@media (max-width: 768px) {
  .content-grid { grid-template-columns: 1fr; }
  .meta-row { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
}
</style>

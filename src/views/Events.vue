<template>
  <div class="events-page">
    <div class="header-section">
      <div class="container">
        <h1>Events & Workshops</h1>
        <p>Join us for workshops, webinars, and networking sessions.</p>
      </div>
    </div>

    <div class="container content">
      <div class="filters">
        <button 
          v-for="filter in ['Upcoming', 'Past']" 
          :key="filter"
          :class="{ active: activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <div v-if="loading" class="loading">Loading events...</div>
      
      <div v-else-if="filteredEvents.length === 0" class="empty">
        No {{ activeFilter.toLowerCase() }} events found.
      </div>

      <div v-else class="events-grid">
        <div v-for="event in filteredEvents" :key="event.id" class="event-card" @click="openEvent(event.id)">
          <div class="date-box">
            <span class="month">{{ getMonth(event.start) }}</span>
            <span class="day">{{ getDay(event.start) }}</span>
          </div>
          <div class="details">
            <div class="tags">
              <span v-for="tag in event.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <h3>{{ event.title }}</h3>
            <p class="time"><Icon icon="lucide:clock" class="icon" /> {{ formatTime(event.start) }} - {{ formatTime(event.end) }} ({{ event.timezone }})</p>
            <p class="location"><Icon icon="lucide:map-pin" class="icon" /> {{ event.location.type === 'online' ? 'Online' : event.location.address }}</p>
            
            <div class="meta">
              <span class="capacity" v-if="event.registeredCount >= event.capacity">Waitlist Only</span>
              <span class="spots" v-else>{{ event.capacity - event.registeredCount }} spots left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EventService, type AppEvent } from '../services/eventService'
import { Timestamp } from 'firebase/firestore'
import { Icon } from '@iconify/vue'

const router = useRouter()
const events = ref<AppEvent[]>([])
const loading = ref(true)
const activeFilter = ref('Upcoming')

const loadEvents = async () => {
  loading.value = true
  try {
    events.value = await EventService.getEvents({ publishedOnly: true })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getDateObj = (val: Date | Timestamp | string): Date => {
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}

const filteredEvents = computed(() => {
  const now = new Date()
  return events.value.filter(e => {
    const end = getDateObj(e.end)
    return activeFilter.value === 'Upcoming' ? end >= now : end < now
  })
})

const openEvent = (id?: string) => {
  if(id) router.push(`/events/${id}`)
}

const getMonth = (val: Date | Timestamp | string) => {
  return getDateObj(val).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const getDay = (val: Date | Timestamp | string) => {
  return getDateObj(val).getDate()
}

const formatTime = (val: Date | Timestamp | string) => {
  return getDateObj(val).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

onMounted(loadEvents)
</script>

<style scoped>
.header-section { background: var(--color-background-soft); padding: 4rem 0; text-align: center; margin-bottom: 2rem; }
.header-section h1 { font-size: 2.5rem; margin-bottom: 1rem; color: var(--color-heading); }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

.filters { display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem; }
.filters button {
  background: white; border: 1px solid #eee; padding: 0.75rem 2rem; 
  border-radius: 25px; cursor: pointer; font-weight: 600; color: #666;
  transition: all 0.2s;
}
.filters button.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

.events-grid { display: grid; gap: 1.5rem; }
.event-card { 
  display: flex; gap: 2rem; background: white; padding: 2rem; border-radius: 16px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s;
}
.event-card:hover { transform: translateY(-4px); }

.date-box { 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--color-background-soft); padding: 1rem; border-radius: 12px;
  width: 80px; height: 80px; flex-shrink: 0;
}
.month { font-size: 0.9rem; font-weight: 700; color: var(--color-primary); }
.day { font-size: 1.8rem; font-weight: 800; color: var(--color-heading); line-height: 1; }

.details { flex: 1; }
.tags { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.tag { font-size: 0.75rem; background: #f0f4ff; color: var(--color-primary); padding: 0.25rem 0.75rem; border-radius: 12px; }
h3 { margin: 0.5rem 0; font-size: 1.5rem; }
.time, .location { color: #666; margin: 0.25rem 0; display: flex; align-items: center; gap: 0.5rem; }
.icon { font-size: 1rem; }

.meta { margin-top: 1rem; display: flex; gap: 1rem; }
.capacity { color: var(--color-error); font-weight: 600; font-size: 0.9rem; }
.spots { color: var(--color-success); font-weight: 600; font-size: 0.9rem; }

@media (max-width: 768px) {
  .event-card { flex-direction: column; gap: 1rem; }
  .date-box { width: 60px; height: 60px; align-self: flex-start; }
}
</style>

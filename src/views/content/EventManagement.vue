<template>
  <div class="admin-events">
    <div class="header">
        <h1>Event Management</h1>
      <button class="btn-primary" @click="showEditor = true; selectedEvent = undefined">New Event</button>
    </div>

    <div v-if="showEditor" class="editor-overlay">
      <div class="editor-modal">
        <EventEditor 
          :event="selectedEvent" 
          @save="handleSave" 
          @cancel="showEditor = false" 
        />
      </div>
    </div>

    <div v-else class="list-container">
      <div v-if="loading" class="loading">Loading events...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Capacity</th>
            <th>Registered</th>
            <th>Waitlist</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>{{ event.title }}</td>
            <td>{{ formatDate(event.start) }}</td>
            <td>{{ event.capacity }}</td>
            <td>{{ event.registeredCount }}</td>
            <td>{{ event.waitlistCount }}</td>
            <td>
              <span class="status-badge" :class="{ published: event.published }">
                {{ event.published ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td>
              <button class="btn-sm" @click="editEvent(event)">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { EventService, type AppEvent } from '../../services/eventService'
import EventEditor from '../../components/admin/EventEditor.vue'
import { Timestamp } from 'firebase/firestore'

const events = ref<AppEvent[]>([])
const loading = ref(true)
const showEditor = ref(false)
const selectedEvent = ref<AppEvent | undefined>(undefined)

const loadEvents = async () => {
  loading.value = true
  try {
    events.value = await EventService.getEvents()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const editEvent = (event: AppEvent) => {
  selectedEvent.value = event
  showEditor.value = true
}

const handleSave = async () => {
  showEditor.value = false
  await loadEvents()
}

const formatDate = (val: Date | Timestamp | string) => {
  const d = val instanceof Timestamp ? val.toDate() : new Date(val)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
}

onMounted(loadEvents)
</script>

<style scoped>
.admin-events { padding: 2rem; }
.header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
.btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
.status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; background: #eee; font-size: 0.85rem; }
.status-badge.published { background: #e6fffa; color: #00a88d; }
.btn-sm { padding: 0.25rem 0.5rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; }

.editor-overlay { 
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; 
  padding: 2rem; overflow-y: auto;
}
.editor-modal { width: 100%; max-width: 800px; }
</style>

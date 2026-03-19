<template>
  <form @submit.prevent="save" class="event-editor">
    <div class="header">
      <h2>{{ isEditing ? 'Edit Event' : 'New Event' }}</h2>
      <div class="actions">
        <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Event' }}
        </button>
      </div>
    </div>

    <div class="grid">
      <label class="full">
        <span>Title</span>
        <input v-model="form.title" required />
      </label>

      <label class="full">
        <span>Description</span>
        <textarea v-model="form.description" rows="5" required></textarea>
      </label>

      <label>
        <span>Start Date & Time</span>
        <input type="datetime-local" v-model="form.start" required />
      </label>

      <label>
        <span>End Date & Time</span>
        <input type="datetime-local" v-model="form.end" required />
      </label>

      <label>
        <span>Timezone</span>
        <select v-model="form.timezone">
          <option value="Africa/Lagos">West Africa Time (Lagos)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time (US)</option>
        </select>
      </label>

      <label>
        <span>Capacity</span>
        <input type="number" v-model="form.capacity" min="1" required />
      </label>

      <label class="full">
        <span>Location Type</span>
        <div class="radio-group">
          <label><input type="radio" v-model="form.location.type" value="online" /> Online</label>
          <label><input type="radio" v-model="form.location.type" value="physical" /> Physical</label>
        </div>
      </label>

      <label v-if="form.location.type === 'online'" class="full">
        <span>Meeting URL</span>
        <input v-model="form.location.url" type="url" placeholder="https://zoom.us/..." />
      </label>

      <label v-else class="full">
        <span>Address</span>
        <input v-model="form.location.address" placeholder="123 Main St..." />
      </label>

      <label class="full">
        <span>Tags (comma separated)</span>
        <input v-model="tagsInput" placeholder="Workshop, Career, Tech" />
      </label>

      <label class="full checkbox-label">
        <input type="checkbox" v-model="form.published" />
        <span>Publish immediately</span>
      </label>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { EventService, type AppEvent } from '../../services/eventService'
import { Timestamp } from 'firebase/firestore'

const props = defineProps<{
  event?: AppEvent
}>()

const emit = defineEmits(['save', 'cancel'])

const isEditing = computed(() => !!props.event)
const saving = ref(false)
const tagsInput = ref('')

const form = ref({
  title: '',
  description: '',
  start: '',
  end: '',
  timezone: 'Africa/Lagos',
  capacity: 50,
  location: {
    type: 'online' as 'online' | 'physical',
    url: '',
    address: ''
  },
  published: false
})

onMounted(() => {
  if (props.event) {
    const e = props.event
    form.value = {
      title: e.title,
      description: e.description,
      start: toDateTimeLocal(e.start),
      end: toDateTimeLocal(e.end),
      timezone: e.timezone,
      capacity: e.capacity,
      location: {
        type: e.location.type,
        url: e.location.url || '',
        address: e.location.address || ''
      },
      published: e.published
    }
    tagsInput.value = e.tags.join(', ')
  }
})

const toDateTimeLocal = (val: Date | Timestamp | string) => {
  if (!val) return ''
  const d = val instanceof Timestamp ? val.toDate() : new Date(val)
  // Format: YYYY-MM-DDThh:mm
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const save = async () => {
  saving.value = true
  try {
    const eventData = {
      ...form.value,
      start: new Date(form.value.start),
      end: new Date(form.value.end),
      tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
      createdBy: 'admin' // In real app, get from auth
    }

    if (props.event?.id) {
      await EventService.updateEvent(props.event.id, eventData)
    } else {
      await EventService.createEvent(eventData)
    }
    emit('save')
  } catch (e) {
    alert('Failed to save event: ' + (e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.event-editor { background: white; padding: 2rem; border-radius: 8px; max-width: 800px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.full { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 0.5rem; font-weight: 500; }
input, textarea, select { padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; }
.actions { display: flex; gap: 1rem; }
.btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
.btn-secondary { background: #eee; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
.radio-group { display: flex; gap: 1.5rem; font-weight: normal; }
.radio-group label { flex-direction: row; align-items: center; }
.checkbox-label { flex-direction: row; align-items: center; gap: 1rem; }
</style>

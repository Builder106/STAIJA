<template>
  <div class="event-management">
    <div class="header">
      <div class="header-content">
        <h1>Event Management</h1>
        <p class="subtitle">Create and manage upcoming events and workshops</p>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/content/events/new')" class="btn-primary">
          <span class="icon">➕</span>
          New Event
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="filters">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search events..."
          class="search-input"
        >
        <select v-model="statusFilter" class="status-filter">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select v-model="typeFilter" class="type-filter">
          <option value="">All Types</option>
          <option value="workshop">Workshop</option>
          <option value="webinar">Webinar</option>
          <option value="conference">Conference</option>
          <option value="networking">Networking</option>
        </select>
      </div>
    </div>

    <div class="events-grid" v-if="!isLoading">
      <div
        v-if="filteredEvents.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">📅</div>
        <h3>No events found</h3>
        <p>Create your first event to get started.</p>
        <button @click="$router.push('/content/events/new')" class="btn-primary">
          Create First Event
        </button>
      </div>
      <div
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card"
      >
        <div class="event-header">
          <div class="event-date">
            <div class="date-day">{{ formatDate(event.date, 'day') }}</div>
            <div class="date-month">{{ formatDate(event.date, 'month') }}</div>
          </div>
          <div class="event-actions">
            <button @click="editEvent(event)" class="btn-edit">
              Edit
            </button>
            <button @click="duplicateEvent(event)" class="btn-duplicate">
              Duplicate
            </button>
          </div>
        </div>

        <div class="event-content">
          <h3>{{ event.title }}</h3>
          <p class="event-description">{{ event.description }}</p>

          <div class="event-details">
            <div class="detail-item">
              <span class="detail-icon">📅</span>
              <span>{{ formatDate(event.date, 'full') }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🕒</span>
              <span>{{ event.time }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">📍</span>
              <span>{{ event.location }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">👥</span>
              <span>{{ event.capacity }} attendees</span>
            </div>
          </div>

          <div class="event-tags">
            <span :class="['event-type', event.type]">{{ event.type }}</span>
            <span :class="['event-status', event.status]">{{ event.status }}</span>
          </div>
        </div>

        <div class="event-footer">
          <div class="registration-info">
            <span class="registered-count">{{ event.registered }} registered</span>
            <span class="spots-left">{{ event.capacity - event.registered }} spots left</span>
          </div>
          <div class="event-buttons">
            <button @click="viewRegistrations(event)" class="btn-registrations">
              View Registrations
            </button>
            <button @click="togglePublish(event)" :class="['btn-publish', event.status]">
              {{ event.status === 'published' ? 'Unpublish' : 'Publish' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="events-grid" v-else>
      <div class="loading-state">
        <div class="loading-icon">⏳</div>
        <h3>Loading events...</h3>
      </div>
    </div>

    <!-- Event Statistics -->
    <div class="event-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ totalEvents }}</div>
          <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ upcomingEvents }}</div>
          <div class="stat-label">Upcoming</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalRegistrations }}</div>
          <div class="stat-label">Total Registrations</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ averageAttendance }}</div>
          <div class="stat-label">Avg Attendance</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DatabaseService } from '../../services/firebase'

const router = useRouter()

interface Event {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  type: 'workshop' | 'webinar' | 'conference' | 'networking'
  status: 'draft' | 'published' | 'cancelled'
  capacity: number
  registered: number
}

// Reactive data
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

// Reactive data for events (to be loaded from API)
const events = ref<Event[]>([])

// Loading state
const isLoading = ref(true)

// Computed properties
const filteredEvents = computed(() => {
  let filtered = events.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(event => event.status === statusFilter.value)
  }

  // Filter by type
  if (typeFilter.value) {
    filtered = filtered.filter(event => event.type === typeFilter.value)
  }

  // Sort by date
  filtered.sort((a, b) => a.date.getTime() - b.date.getTime())

  return filtered
})

const totalEvents = computed(() => events.value.length)

const upcomingEvents = computed(() => {
  const now = new Date()
  return events.value.filter(event => event.date > now && event.status === 'published').length
})

const totalRegistrations = computed(() => {
  return events.value.reduce((sum, event) => sum + event.registered, 0)
})

const averageAttendance = computed(() => {
  const publishedEvents = events.value.filter(event => event.status === 'published')
  if (publishedEvents.length === 0) return 0

  const totalCapacity = publishedEvents.reduce((sum, event) => sum + event.capacity, 0)
  return Math.round(totalCapacity / publishedEvents.length)
})

// Methods
const formatDate = (date: Date, format: 'day' | 'month' | 'full' = 'full') => {
  const options: Intl.DateTimeFormatOptions = {
    day: format === 'day' ? 'numeric' : undefined,
    month: format === 'month' ? 'short' : format === 'full' ? 'long' : undefined,
    year: format === 'full' ? 'numeric' : undefined
  }

  if (format === 'day') {
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric' })
  } else if (format === 'month') {
    return new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  } else {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

const editEvent = (event: Event) => {
  router.push(`/content/events/${event.id}/edit`)
}

const duplicateEvent = (event: Event) => {
  const newEvent: Event = {
    ...event,
    id: Date.now().toString(),
    title: `${event.title} (Copy)`,
    status: 'draft',
    registered: 0
  }
  events.value.unshift(newEvent)
}

const viewRegistrations = (event: Event) => {
  router.push(`/content/events/${event.id}/registrations`)
}

const togglePublish = (event: Event) => {
  event.status = event.status === 'published' ? 'draft' : 'published'
}

// Load events data
const loadEvents = async () => {
  try {
    const eventsData = await DatabaseService.getContentItems('event', undefined)
    events.value = eventsData.map(event => ({
      id: event.id,
      title: event.title,
      description: event.content.substring(0, 100) + '...',
      date: event.publishDate?.toDate() || new Date(),
      time: '10:00 AM - 4:00 PM', // This would need to be stored separately
      location: 'Virtual', // This would need to be stored separately
      type: 'workshop' as const, // This would need to be stored separately
      status: event.status,
      capacity: 50, // This would need to be stored separately
      registered: 0 // This would need to be tracked separately
    }))
  } catch (error) {
    console.error('Error loading events:', error)
  } finally {
    isLoading.value = false
  }
}

// Initialize component
onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.event-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #0056b3;
}

.icon {
  font-size: 1.2rem;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.status-filter, .type-filter {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 150px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.empty-state, .loading-state {
  grid-column: 1 / -1;
  padding: 4rem 2rem;
  text-align: center;
  color: #6c757d;
}

.empty-icon, .loading-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3, .loading-state h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 2rem;
}

.empty-state .btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
}

.empty-state .btn-primary:hover {
  background: #0056b3;
}

.event-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
}

.event-date {
  text-align: center;
}

.date-day {
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
  line-height: 1;
}

.date-month {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 600;
  margin-top: 0.25rem;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-duplicate {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-edit {
  background: #007bff;
  color: white;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-duplicate {
  background: #6c757d;
  color: white;
}

.btn-duplicate:hover {
  background: #545b62;
}

.event-content {
  padding: 1.5rem;
}

.event-content h3 {
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
}

.event-description {
  color: #6c757d;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #495057;
  font-size: 0.9rem;
}

.detail-icon {
  font-size: 1rem;
  min-width: 1rem;
}

.event-tags {
  display: flex;
  gap: 0.75rem;
}

.event-type, .event-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.event-type.workshop {
  background: #cce5ff;
  color: #0066cc;
}

.event-type.webinar {
  background: #d1ecf1;
  color: #0c5460;
}

.event-type.conference {
  background: #d4edda;
  color: #155724;
}

.event-type.networking {
  background: #f8d7da;
  color: #721c24;
}

.event-status.published {
  background: #d4edda;
  color: #155724;
}

.event-status.draft {
  background: #fff3cd;
  color: #856404;
}

.event-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.event-footer {
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.registration-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.registered-count {
  font-weight: 600;
  color: #28a745;
}

.spots-left {
  font-weight: 600;
  color: #007bff;
}

.event-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-registrations {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-registrations:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.btn-publish {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-publish.published {
  background: #dc3545;
  color: white;
}

.btn-publish.published:hover {
  background: #c82333;
}

.btn-publish.draft {
  background: #28a745;
  color: white;
}

.btn-publish.draft:hover {
  background: #1e7e34;
}

.event-stats {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-size: 1rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .event-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .filters {
    flex-direction: column;
  }

  .search-input {
    min-width: auto;
  }

  .status-filter, .type-filter {
    min-width: auto;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .event-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .event-actions {
    width: 100%;
    justify-content: center;
  }

  .registration-info {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .event-buttons {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  programName: string
  deadline: string
  timeCommitment: string
  applyUrl: string
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: true
})

const isVisible = ref(false)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  const handleScroll = () => {
    if (prefersReducedMotion) {
      isVisible.value = true
      return
    }
    const scrollY = window.scrollY
    const threshold = 400 // Show after scrolling 400px
    isVisible.value = scrollY > threshold
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // Check initial state
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>

<template>
  <aside 
    class="sticky-apply-box"
    :class="{ 'sticky-apply-box--visible': isVisible }"
    aria-label="Application information"
  >
    <div class="apply-card">
      <div class="apply-header">
        <h3 class="apply-title">Apply to {{ programName }}</h3>
        <div class="status-badge" :class="{ 'status-badge--open': isOpen, 'status-badge--closed': !isOpen }">
          {{ isOpen ? 'Applications Open' : 'Applications Closed' }}
        </div>
      </div>
      
      <div class="apply-details">
        <div class="detail-item">
          <div class="detail-icon">📅</div>
          <div class="detail-content">
            <div class="detail-label">Deadline</div>
            <div class="detail-value">{{ deadline }}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon">⏰</div>
          <div class="detail-content">
            <div class="detail-label">Time Commitment</div>
            <div class="detail-value">{{ timeCommitment }}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon">🎯</div>
          <div class="detail-content">
            <div class="detail-label">Program Type</div>
            <div class="detail-value">Research & Mentorship</div>
          </div>
        </div>
      </div>
      
      <div class="apply-actions">
        <a 
          :href="applyUrl" 
          class="btn btn-primary btn-lg apply-btn"
          :class="{ 'apply-btn--disabled': !isOpen }"
          :aria-disabled="!isOpen"
        >
          <span v-if="isOpen">Apply Now</span>
          <span v-else>Applications Closed</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        
        <p class="apply-note">
          <span v-if="isOpen">Takes ~10-15 minutes to complete</span>
          <span v-else>Check back for next cohort</span>
        </p>
      </div>
      
      <div class="apply-footer">
        <a href="/contact" class="contact-link">
          Questions? Contact us
        </a>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sticky-apply-box {
  position: fixed;
  top: 100px;
  right: 0;
  width: 320px;
  z-index: 40;
  transform: translateX(100%);
  transition: transform var(--transition-normal);
  pointer-events: none;
}

.sticky-apply-box--visible {
  transform: translateX(0);
  pointer-events: auto;
}

.apply-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-2xl) 0 0 var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-6);
  margin-right: var(--space-4);
}

.apply-header {
  margin-bottom: var(--space-6);
}

.apply-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-3);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge--open {
  background: var(--success-500);
  color: white;
}

.status-badge--closed {
  background: var(--neutral-300);
  color: var(--neutral-700);
}

.apply-details {
  margin-bottom: var(--space-6);
}

.detail-item {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-icon {
  font-size: var(--text-lg);
  width: 1.5rem;
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.detail-value {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--neutral-900);
}

.apply-actions {
  margin-bottom: var(--space-6);
}

.apply-btn {
  width: 100%;
  justify-content: center;
  margin-bottom: var(--space-3);
}

.apply-btn--disabled {
  background: var(--neutral-300);
  color: var(--neutral-600);
  cursor: not-allowed;
}

.apply-btn--disabled:hover {
  background: var(--neutral-300);
  transform: none;
  box-shadow: var(--shadow-sm);
}

.apply-note {
  font-size: var(--text-xs);
  color: var(--neutral-500);
  text-align: center;
  margin: 0;
}

.apply-footer {
  text-align: center;
}

.contact-link {
  font-size: var(--text-sm);
  color: var(--primary-600);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.contact-link:hover {
  color: var(--primary-500);
  text-decoration: underline;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

@media (max-width: 1280px) {
  .sticky-apply-box {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sticky-apply-box {
    transition: none;
  }
}
</style>

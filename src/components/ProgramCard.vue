<script setup lang="ts">
defineProps<{ 
  title: string
  text: string
  href: string
  icon?: string
  featured?: boolean
}>()
</script>

<template>
  <article class="program-card" :class="{ 'program-card--featured': featured }">
    <div class="program-card__header">
      <div class="program-card__icon">
        <span v-if="icon">{{ icon }}</span>
        <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div v-if="featured" class="program-card__badge">
        Featured
      </div>
    </div>
    
    <div class="program-card__content">
      <h3 class="program-card__title">{{ title }}</h3>
      <p class="program-card__text">{{ text }}</p>
    </div>
    
    <div class="program-card__footer">
      <a :href="href" class="program-card__link">
        <span>Learn more</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  </article>
</template>

<style scoped>
.program-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  overflow: hidden;
  height: 100%;
  opacity: 0;
  transform: translateY(12px);
  animation: fadeInUp 700ms ease forwards;
}

.program-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-4px);
  border-color: var(--primary-300);
}

.program-card--featured {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, white 0%, var(--primary-50) 100%);
}

.program-card--featured:hover {
  box-shadow: var(--shadow-2xl);
}

.program-card__header {
  position: relative;
  padding: var(--space-6) var(--space-6) 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.program-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
  color: white;
  border-radius: var(--radius-xl);
  font-size: var(--text-xl);
  box-shadow: var(--shadow-md);
}

.program-card__badge {
  padding: var(--space-1) var(--space-3);
  background: var(--primary-500);
  color: white;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.program-card__content {
  flex: 1;
  padding: var(--space-6);
}

.program-card__title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-3);
  line-height: var(--leading-tight);
}

.program-card__text {
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: 0;
}

.program-card__footer {
  padding: 0 var(--space-6) var(--space-6);
}

.program-card__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--primary-600);
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.program-card__link:hover {
  color: var(--primary-500);
  gap: var(--space-3);
  text-decoration: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .program-card {
    opacity: 1;
    transform: none;
    animation: none;
  }
}

.program-card__link:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-8 {
  width: 2rem;
}

.h-8 {
  height: 2rem;
}
</style>
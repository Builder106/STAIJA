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
  position: relative;
}

.program-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
  transform-origin: left;
}

.program-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-6px);
  border-color: var(--primary-300);
}

.program-card:hover::before {
  transform: scaleX(1);
}

.program-card--featured {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-hover);
  background: linear-gradient(135deg, white 0%, var(--primary-50) 100%);
}

.program-card--featured::before {
  transform: scaleX(1);
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
  box-shadow: var(--shadow-glow);
  transition: all var(--transition-normal);
}

.program-card:hover .program-card__icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-hover);
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
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.program-card__link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-500);
  transition: width var(--transition-normal);
}

.program-card__link:hover {
  color: var(--primary-500);
  gap: var(--space-3);
  text-decoration: none;
}

.program-card__link:hover::before {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .program-card:hover,
  .program-card:hover .program-card__icon {
    transform: none;
  }
  
  .program-card__badge {
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
<script setup lang="ts">
import { Icon } from '@iconify/vue'

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
        <Icon v-if="icon" :icon="icon" />
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
  border-radius: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  height: 100%;
  position: relative;
  z-index: 1;
}

.program-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(45deg, var(--primary-100) 0, var(--primary-100) 1px, transparent 1px, transparent 20px);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.program-card:hover {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
  border-color: var(--primary-300);
}

.program-card:hover::after {
  opacity: 0.4;
}

.program-card--featured {
  background: linear-gradient(135deg, white 0%, var(--primary-50) 100%);
  border-color: var(--primary-200);
}

.program-card--featured::after {
  background-image: repeating-linear-gradient(45deg, var(--primary-200) 0, var(--primary-200) 1px, transparent 1px, transparent 20px);
  opacity: 0.3;
}

.program-card__header {
  position: relative;
  padding: var(--space-8) var(--space-8) 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.program-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: var(--neutral-900);
  color: white;
  border-radius: 0;
  font-size: var(--text-2xl);
  clip-path: polygon(0 0, 100% 0, 100% 75%, 75% 100%, 0 100%);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.program-card:hover .program-card__icon {
  transform: scale(1.05);
  background: var(--primary-600);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}

.program-card__badge {
  padding: var(--space-2) var(--space-4);
  background: var(--primary-500);
  color: white;
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 0;
  border: none;
  clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.3);
}

.program-card__content {
  flex: 1;
  padding: var(--space-6) var(--space-8);
}

.program-card__title {
  font-size: var(--text-2xl);
  font-weight: 900;
  color: var(--neutral-900);
  margin-bottom: var(--space-4);
  line-height: 1.1;
  text-transform: uppercase;
}

.program-card__text {
  color: var(--neutral-800);
  line-height: var(--leading-relaxed);
  font-weight: 500;
  font-size: var(--text-base);
  margin-bottom: 0;
}

.program-card__footer {
  padding: 0 var(--space-8) var(--space-8);
}

.program-card__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--neutral-900);
  font-weight: 900;
  font-size: var(--text-base);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  position: relative;
  padding-bottom: 4px;
}

.program-card__link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--neutral-900);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.program-card__link:hover {
  color: var(--primary-600);
  gap: var(--space-3);
  text-decoration: none;
}

.program-card__link:hover::before {
  transform: scaleX(1);
  background: var(--primary-600);
}

@media (prefers-reduced-motion: reduce) {
  .program-card:hover,
  .program-card:hover .program-card__icon {
    transform: none;
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
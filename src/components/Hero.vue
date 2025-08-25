<script setup lang="ts">
defineProps<{ 
  title: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
}>()
</script>

<template>
  <section class="hero">
    <div class="hero-background">
      <div class="hero-pattern"></div>
    </div>
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-text">🧬 Science • Technology • Innovation</span>
        </div>
        <h1 class="hero-title">{{ title }}</h1>
        <p v-if="subtitle" class="hero-subtitle">{{ subtitle }}</p>
        <div v-if="ctaText && ctaHref" class="hero-actions">
          <a :href="ctaHref" class="btn btn-primary btn-lg">
            {{ ctaText }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a v-if="secondaryCtaText && secondaryCtaHref" :href="secondaryCtaHref" class="btn btn-outline btn-lg">
            {{ secondaryCtaText }}
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-number">500+</div>
            <div class="stat-label">Students Mentored</div>
          </div>
          <div class="stat">
            <div class="stat-number">50+</div>
            <div class="stat-label">Research Projects</div>
          </div>
          <div class="stat">
            <div class="stat-number">25+</div>
            <div class="stat-label">Partner Organizations</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding: var(--space-20) 0 var(--space-16);
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, var(--primary-100) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, var(--secondary-100) 0%, transparent 50%);
  opacity: 0.6;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: white;
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
}

.badge-text {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-700);
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  line-height: var(--leading-tight);
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
  background: linear-gradient(135deg, var(--neutral-900), var(--primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  margin-bottom: var(--space-12);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-8);
  max-width: 600px;
  margin: 0 auto;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--primary-600);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

/* Responsive Design */
@media (min-width: 640px) {
  .hero {
    padding: var(--space-24) 0 var(--space-20);
  }
  
  .hero-title {
    font-size: var(--text-5xl);
  }
  
  .hero-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--text-6xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-2xl);
  }
}
</style>
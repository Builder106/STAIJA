<script setup lang="ts">
const props = defineProps<{ 
  title: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  backgroundImageUrl?: string
}>()
</script>

<template>
  <section class="hero" :style="props.backgroundImageUrl ? { backgroundImage: `linear-gradient(rgba(10,14,23,0.55), rgba(10,14,23,0.55)), url(${props.backgroundImageUrl})` } : {}">
    <div class="container">
      <div class="hero-inner" aria-labelledby="hero-heading">
        <h1 id="hero-heading" class="hero-title">{{ props.title || "Nurturing Africa's next generation of scientist‑leaders" }}</h1>
        <p v-if="subtitle" class="hero-subtitle">{{ subtitle }}</p>
        <div class="hero-actions">
          <RouterLink class="btn btn-primary" :to="ctaHref || '/apply'">{{ ctaText || 'Apply' }}</RouterLink>
          <RouterLink class="btn btn-secondary" :to="secondaryCtaHref || '/donate'">{{ secondaryCtaText || 'Donate' }}</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  min-height: 72vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--primary-50), var(--secondary-50));
  background-size: cover;
  background-position: center;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-inner {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  text-align: center;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--neutral-900);
  margin: 0 0 var(--space-4) 0;
}

.hero-subtitle {
  font-size: clamp(1.0625rem, 2.2vw, 1.375rem);
  color: var(--neutral-700);
  line-height: 1.7;
  margin: 0 auto;
  max-width: 900px;
}

.hero-actions {
  margin-top: var(--space-8);
  display: inline-flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-full);
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--primary-700);
  color: white;
  border-color: var(--primary-800);
}

.btn-primary:hover { background: var(--primary-800); }

.btn-secondary {
  background: white;
  color: var(--primary-800);
  border-color: var(--primary-200);
}

.btn-secondary:hover { background: var(--primary-50); }

.btn:focus-visible {
  outline: 3px solid var(--secondary-400);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .hero { min-height: 82vh; }
  .hero-title { font-size: clamp(3rem, 5.5vw, 4.25rem); }
  .hero-subtitle { font-size: clamp(1.125rem, 1.8vw, 1.5rem); }
}

@media (max-width: 639px) {
  .hero { min-height: 64vh; }
}
</style>
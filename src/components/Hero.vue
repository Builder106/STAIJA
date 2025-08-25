<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; ctaText?: string; ctaHref?: string }>()
</script>

<template>
  <section class="hero">
    <div class="inner">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
      <p v-if="ctaText && ctaHref">
        <a class="btn" :href="ctaHref">{{ ctaText }}</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 4rem 1rem 2rem;
  background: linear-gradient(90deg, #8b5cf633, #06b6d433);
  border-radius: 16px;
}
.inner { max-width: 900px; margin: 0 auto; text-align: center; }
.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(90deg, #8b5cf6, #06b6d4);
  color: #fff;
  border-radius: 10px;
}
</style>



<script setup lang="ts">
defineProps<{ title: string; text: string; href: string }>()
</script>

<template>
  <a class="card" :href="href">
    <h3>{{ title }}</h3>
    <p>{{ text }}</p>
    <span class="link">Learn more →</span>
  </a>
  
</template>

<style scoped>
.card {
  display: block;
  padding: 1.25rem;
  border: 1px solid #e5e7eb55;
  border-radius: 12px;
  text-align: left;
}
.link { color: #06b6d4 }
</style>



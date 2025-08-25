<script setup lang="ts">
import { ref } from 'vue'
</script>

<template>
  <header class="nav">
    <a class="brand" href="/">
      <img src="/staija-logo.svg" alt="STAIJA" height="28" />
    </a>
    <nav aria-label="Primary">
      <RouterLink to="/programs">Programs</RouterLink>
      <RouterLink to="/get-involved">Get Involved</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/blog">Stories</RouterLink>
      <RouterLink class="btn" to="/donate">Donate</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}
nav a {
  margin-left: 1rem;
}
.btn {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  background: linear-gradient(90deg, #8b5cf6, #06b6d4);
  color: #fff;
}
</style>



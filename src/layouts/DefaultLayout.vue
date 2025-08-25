<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <div class="layout">
    <NavBar />
    <main class="container">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>



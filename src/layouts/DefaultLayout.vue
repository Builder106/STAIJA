<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <div class="layout">
    <NavBar />
    <main class="main-content">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
}
</style>



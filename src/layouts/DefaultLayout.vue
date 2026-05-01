<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <div class="brand-surface min-h-screen flex flex-col bg-paper">
    <SiteHeader />
    <main class="flex-1 flex flex-col">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>

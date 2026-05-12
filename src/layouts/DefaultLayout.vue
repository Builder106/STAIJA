<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <div class="brand-surface min-h-screen flex flex-col bg-paper">
    <SiteHeader />
    <main class="flex-1 flex flex-col">
      <!-- No <Transition> wrapper here. We previously had:
             <Transition name="page" mode="out-in">
               <component :is="Component" :key="route.path" />
             </Transition>
           Vue 3's <Transition mode="out-in"> + async/lazy-imported
           components has a well-known stale-state bug where the
           "enter" hook fires before the new component is actually
           ready, then the .page-enter-from class (opacity: 0) gets
           pinned to the view and never cleared. Symptom: nav and
           footer render, the middle is "blank", the Selected Element
           panel shows the route component fully mounted with content
           — but invisible. Every route component on the site is
           async (router uses `() => import(...)` for all of them) so
           this fired on any navigation.
           Removed the transition entirely. Individual views still
           have their own motion-v entrance animations, so pages
           still feel alive on mount; we just lose the cross-page
           fade. Acceptable trade for "the site actually loads". -->
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>

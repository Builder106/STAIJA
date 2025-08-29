<template>
  <section class="alumni">
    <header class="alumni-header">
      <h1>Alumni</h1>
      <p class="subtitle">Welcome to the STAIJA alumni community.</p>
    </header>
    <nav class="alumni-nav">
      <RouterLink class="link" :to="{ name: 'alumni-profile' }">My Profile</RouterLink>
      <RouterLink class="link" :to="{ name: 'alumni-directory' }">Directory</RouterLink>
      <RouterLink class="link" :to="{ name: 'alumni-stories' }">Stories</RouterLink>
    </nav>
    <div class="cards">
      <div class="card">
        <h3>Update your profile</h3>
        <p>Keep your information current to help others connect with you.</p>
        <RouterLink class="btn" :to="{ name: 'alumni-profile' }">Edit profile</RouterLink>
      </div>
      <div class="card">
        <h3>Find fellow alumni</h3>
        <p>Discover peers by cohort, skills, or location.</p>
        <RouterLink class="btn" :to="{ name: 'alumni-directory' }">Browse directory</RouterLink>
      </div>
      <div class="card">
        <h3>Share your story</h3>
        <p>Inspire students by sharing your journey after STAIJA.</p>
        <RouterLink class="btn" :to="{ name: 'alumni-stories' }">Share a story</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.alumni { padding: 2rem; max-width: 1000px; margin: 0 auto; }
.alumni-header { margin-bottom: 1.5rem; }
.subtitle { color: var(--color-text-secondary); }
.alumni-nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
.link { text-decoration: none; color: var(--color-primary); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.card { border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; background: white; }
.btn { display: inline-block; margin-top: 0.75rem; background: var(--color-primary); color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; }
</style>



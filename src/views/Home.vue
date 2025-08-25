<script setup lang="ts">
import Hero from '../components/Hero.vue'
import ProgramCard from '../components/ProgramCard.vue'
</script>

<template>
  <Hero
    title="Nurturing Africa’s next generation of scientist‑leaders"
    subtitle="Hands-on research programs, mentorship and community for ambitious students across Nigeria and beyond."
    ctaText="Apply to StepUp Scholars"
    ctaHref="/programs/stepup-scholars"
  />

  <section class="grid">
    <ProgramCard title="StepUp Scholars" text="Hands-on research training and mentorship for students." href="/programs/stepup-scholars" />
    <ProgramCard title="Dynamerge" text="Collaboration and innovation for emerging researchers." href="/programs/dynamerge" />
    <ProgramCard title="Get Involved" text="Volunteer, partner or intern with the STAIJA community." href="/get-involved" />
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}
</style>



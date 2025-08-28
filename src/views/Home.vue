<script setup lang="ts">
import Hero from '../components/Hero.vue'
import ProgramCard from '../components/ProgramCard.vue'
import { Motion } from 'https://esm.sh/motion-v@1.7.0'
</script>

<template>
  <div class="home">
    <!-- Hero Section -->
    <Hero
      title="Nurturing Africa's next generation of scientist‑leaders"
      subtitle="Hands-on research programs, mentorship and community for ambitious students across Nigeria and beyond."
      ctaText="Apply to StepUp Scholars"
      ctaHref="/programs/stepup-scholars"
      secondaryCtaText="Get Involved"
      secondaryCtaHref="/get-involved"
    />

    <!-- Programs Section -->
    <Motion
      :initial="{ opacity: 0, y: 50 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, ease: 'easeOut' }"
      :viewport="{ once: true, margin: '-100px' }"
      class="programs-section"
    >
      <div class="container">
        <Motion
          :initial="{ opacity: 0, y: 30 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6, delay: 0.2, ease: 'easeOut' }"
          :viewport="{ once: true }"
          class="section-header"
        >
          <h2 class="section-title">Our Programs</h2>
          <p class="section-subtitle">
            Empowering the next generation through innovative research and mentorship opportunities
          </p>
        </Motion>

        <div class="programs-grid">
          <Motion
            :initial="{ opacity: 0, y: 30, scale: 0.9 }"
            :whileInView="{ opacity: 1, y: 0, scale: 1 }"
            :transition="{ duration: 0.6, delay: 0.1, ease: 'easeOut' }"
            :viewport="{ once: true }"
            :whileHover="{ y: -8, scale: 1.02 }"
            class="program-card-wrapper"
          >
            <ProgramCard
              title="StepUp Scholars"
              text="Hands-on research training and mentorship for students. Join a supportive cohort community and develop critical scientific skills."
              href="/programs/stepup-scholars"
              icon="🔬"
              :featured="true"
            />
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: 30, scale: 0.9 }"
            :whileInView="{ opacity: 1, y: 0, scale: 1 }"
            :transition="{ duration: 0.6, delay: 0.3, ease: 'easeOut' }"
            :viewport="{ once: true }"
            :whileHover="{ y: -8, scale: 1.02 }"
            class="program-card-wrapper"
          >
            <ProgramCard
              title="Dynamerge"
              text="Collaboration and innovation for emerging researchers. Foster interdisciplinary connections and breakthrough discoveries."
              href="/programs/dynamerge"
              icon="⚡"
            />
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: 30, scale: 0.9 }"
            :whileInView="{ opacity: 1, y: 0, scale: 1 }"
            :transition="{ duration: 0.6, delay: 0.5, ease: 'easeOut' }"
            :viewport="{ once: true }"
            :whileHover="{ y: -8, scale: 1.02 }"
            class="program-card-wrapper"
          >
            <ProgramCard
              title="Get Involved"
              text="Volunteer, partner or intern with the STAIJA community. Make a meaningful impact on scientific education in Africa."
              href="/get-involved"
              icon="🤝"
            />
          </Motion>
        </div>
      </div>
    </Motion>


    <!-- CTA Section -->
    <Motion
      :initial="{ opacity: 0, y: 50 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, ease: 'easeOut' }"
      :viewport="{ once: true, margin: '-100px' }"
      class="cta-section"
    >
      <div class="container">
        <div class="cta-content">
          <Motion
            :initial="{ opacity: 0, y: 30 }"
            :whileInView="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.2, ease: 'easeOut' }"
            :viewport="{ once: true }"
          >
            <h2 class="cta-title">Ready to Shape the Future of Science in Africa?</h2>
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: 20 }"
            :whileInView="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.4, ease: 'easeOut' }"
            :viewport="{ once: true }"
          >
            <p class="cta-description">
              Join our community of passionate researchers, mentors, and innovators. Whether you're a student
              looking to develop your skills or a professional wanting to give back, there's a place for you at STAIJA.
            </p>
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: 20 }"
            :whileInView="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.6, ease: 'easeOut' }"
            :viewport="{ once: true }"
            class="cta-actions"
          >
            <Motion
              :initial="{ opacity: 0, x: -30 }"
              :whileInView="{ opacity: 1, x: 0 }"
              :transition="{ duration: 0.5, delay: 0.7, ease: 'easeOut' }"
              :viewport="{ once: true }"
              :whileHover="{ scale: 1.05, y: -2 }"
              :whileTap="{ scale: 0.98 }"
            >
              <a href="/programs/stepup-scholars" class="btn btn-primary btn-lg">
                Apply Now
                <Motion
                  :initial="{ x: -5, opacity: 0 }"
                  :whileInView="{ x: 0, opacity: 1 }"
                  :transition="{ duration: 0.4, delay: 1.0, ease: 'easeOut' }"
                  :viewport="{ once: true }"
                  class="inline-block"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Motion>
              </a>
            </Motion>

            <Motion
              :initial="{ opacity: 0, x: 30 }"
              :whileInView="{ opacity: 1, x: 0 }"
              :transition="{ duration: 0.5, delay: 0.8, ease: 'easeOut' }"
              :viewport="{ once: true }"
              :whileHover="{ scale: 1.05, y: -2 }"
              :whileTap="{ scale: 0.98 }"
            >
              <a href="/donate" class="btn btn-secondary btn-lg">
                Support Our Mission
              </a>
            </Motion>
          </Motion>
        </div>
      </div>
    </Motion>
  </div>
</template>

<style scoped>
.home {
  width: 100%;
}

/* Programs Section */
.programs-section {
  padding: var(--space-20) 0;
  background: white;
  width: 100%;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-4);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.programs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

.program-card-wrapper {
  display: block;
  transition: transform 0.3s ease;
}

.inline-block {
  display: inline-block;
}

/* Impact Section */
.impact-section {
  padding: var(--space-20) 0;
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--primary-50) 100%);
  width: 100%;
}

.impact-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
}

.impact-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.impact-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.impact-highlights {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.highlight {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.highlight-icon {
  font-size: var(--text-2xl);
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.highlight-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.highlight-text {
  color: var(--neutral-600);
  margin: 0;
}

.impact-visual {
  display: flex;
  justify-content: center;
}

.impact-card {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  max-width: 400px;
  width: 100%;
}

.impact-stat {
  text-align: center;
}

.stat-number {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--primary-600);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  font-weight: 500;
}

/* CTA Section */
.cta-section {
  padding: var(--space-20) 0;
  background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
  color: white;
  width: 100%;
}

.cta-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.cta-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: var(--space-6);
  color: white;
}

.cta-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
  color: rgba(255, 255, 255, 0.9);
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

/* Responsive Design */
@media (min-width: 640px) {
  .programs-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .impact-highlights {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .highlight {
    flex: 1;
    min-width: 250px;
  }
  
  .cta-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (min-width: 768px) {
  .section-title {
    font-size: var(--text-4xl);
  }
  
  .impact-title {
    font-size: var(--text-4xl);
  }
  
  .cta-title {
    font-size: var(--text-4xl);
  }
}

@media (min-width: 1024px) {
  .impact-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .impact-highlights {
    flex-direction: column;
  }
}
</style>
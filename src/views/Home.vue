<script setup lang="ts">
import Hero from '../components/Hero.vue'
import ProgramCard from '../components/ProgramCard.vue'
</script>

<template>
  <div class="home">
    <!-- Hero Section -->
    <Hero
      title="Nurturing Africa's next generation of scientist‑leaders"
      subtitle="Hands-on research programs, mentorship and community for ambitious students across Nigeria and beyond."
      ctaText="Apply to StepUp Scholars"
      ctaHref="/programs/stepup-scholars"
      secondaryCtaText="Explore Programs"
      secondaryCtaHref="/programs"
    />

    <!-- Programs Section -->
    <section class="programs-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Our Programs</h2>
          <p class="section-subtitle">
            Empowering the next generation through innovative research and mentorship opportunities
          </p>
        </div>
        
        <div class="programs-grid">
          <ProgramCard 
            title="StepUp Scholars" 
            text="Hands-on research training and mentorship for students. Join a supportive cohort community and develop critical scientific skills."
            href="/programs/stepup-scholars"
            icon="🔬"
            :featured="true"
          />
          <ProgramCard 
            title="Dynamerge" 
            text="Collaboration and innovation for emerging researchers. Foster interdisciplinary connections and breakthrough discoveries."
            href="/programs/dynamerge"
            icon="⚡"
          />
          <ProgramCard 
            title="Get Involved" 
            text="Volunteer, partner or intern with the STAIJA community. Make a meaningful impact on scientific education in Africa."
            href="/get-involved"
            icon="🤝"
          />
        </div>
      </div>
    </section>

    <!-- Impact Section -->
    <section class="impact-section">
      <div class="container">
        <div class="impact-content">
          <div class="impact-text">
            <h2 class="impact-title">Making a Real Impact</h2>
            <p class="impact-description">
              Through our programs, we're building a network of scientist-leaders who are driving innovation 
              and economic growth across Africa. Our alumni go on to pursue advanced degrees, lead research 
              projects, and create solutions to real-world challenges.
            </p>
            <div class="impact-highlights">
              <div class="highlight">
                <div class="highlight-icon">🎓</div>
                <div class="highlight-content">
                  <h3 class="highlight-title">Alumni Success</h3>
                  <p class="highlight-text">85% of our alumni pursue advanced STEM degrees</p>
                </div>
              </div>
              <div class="highlight">
                <div class="highlight-icon">🔬</div>
                <div class="highlight-content">
                  <h3 class="highlight-title">Research Excellence</h3>
                  <p class="highlight-text">50+ peer-reviewed publications by program participants</p>
                </div>
              </div>
              <div class="highlight">
                <div class="highlight-icon">🌍</div>
                <div class="highlight-content">
                  <h3 class="highlight-title">Continental Reach</h3>
                  <p class="highlight-text">Students from 15+ African countries</p>
                </div>
              </div>
            </div>
          </div>
          <div class="impact-visual">
            <div class="impact-card">
              <div class="impact-stat">
                <div class="stat-number">500+</div>
                <div class="stat-label">Students Mentored</div>
              </div>
              <div class="impact-stat">
                <div class="stat-number">50+</div>
                <div class="stat-label">Research Projects</div>
              </div>
              <div class="impact-stat">
                <div class="stat-number">25+</div>
                <div class="stat-label">Partner Organizations</div>
              </div>
              <div class="impact-stat">
                <div class="stat-number">15+</div>
                <div class="stat-label">Countries Represented</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Shape the Future of Science in Africa?</h2>
          <p class="cta-description">
            Join our community of passionate researchers, mentors, and innovators. Whether you're a student 
            looking to develop your skills or a professional wanting to give back, there's a place for you at STAIJA.
          </p>
          <div class="cta-actions">
            <a href="/programs/stepup-scholars" class="btn btn-primary btn-lg">
              Apply Now
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a href="/donate" class="btn btn-secondary btn-lg">
              Support Our Mission
            </a>
          </div>
        </div>
      </div>
    </section>
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
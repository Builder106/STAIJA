<script setup lang="ts">
import Hero from '../components/Hero.vue'
</script>

<template>
  <div>
    <!-- Hero -->
    <Hero
      title="Get involved with STAIJA"
      subtitle="Volunteer, partner, or intern to empower the next generation of scientist‑leaders across Africa."
      ctaText="Become a volunteer"
      ctaHref="/get-involved#volunteer"
      secondaryCtaText="Partner with us"
      secondaryCtaHref="/get-involved#partner"
    />

    <!-- Ways to Get Involved -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Ways to help</h2>
          <p class="section-subtitle">Choose the path that fits your time, skills, or organization</p>
        </div>

        <div class="cards-grid">
          <!-- Volunteer -->
          <article id="volunteer" class="card">
            <div class="card-icon">🤝</div>
            <h3 class="card-title">Volunteer or mentor</h3>
            <p class="card-text">
              Guide students through research projects, career exploration and soft‑skills. Flexible time commitments and clear curricula provided.
            </p>
            <ul class="card-list" aria-label="Volunteer benefits">
              <li>Curriculum and training included</li>
              <li>Remote and on‑site options</li>
              <li>Mentor community + support</li>
            </ul>
            <div class="card-actions">
              <a href="mailto:hello@staija.org?subject=Volunteer%20with%20STAIJA" class="btn btn-primary">Email to volunteer</a>
              <a href="/programs/stepup-scholars" class="btn btn-outline">See our programs</a>
            </div>
          </article>

          <!-- Partner -->
          <article id="partner" class="card">
            <div class="card-icon">🏫</div>
            <h3 class="card-title">Partner with STAIJA</h3>
            <p class="card-text">
              Schools, labs, companies and foundations can co‑host programs, provide equipment, sponsor cohorts, or offer expert workshops.
            </p>
            <ul class="card-list" aria-label="Partnership options">
              <li>Program sponsorships</li>
              <li>Equipment and lab access</li>
              <li>Expert seminars + site visits</li>
            </ul>
            <div class="card-actions">
              <a href="mailto:hello@staija.org?subject=Partner%20with%20STAIJA" class="btn btn-secondary">Contact partnerships</a>
              <a href="/donate" class="btn btn-outline">Sponsor a cohort</a>
            </div>
          </article>

          <!-- Intern -->
          <article id="intern" class="card">
            <div class="card-icon">🧪</div>
            <h3 class="card-title">Internships</h3>
            <p class="card-text">
              Join our team to build curriculum, coordinate programs, conduct impact research, or support operations and communications.
            </p>
            <ul class="card-list" aria-label="Intern tracks">
              <li>Education + curriculum</li>
              <li>Program ops + community</li>
              <li>Research + data insights</li>
            </ul>
            <div class="card-actions">
              <a href="mailto:hello@staija.org?subject=Internship%20interest" class="btn btn-primary">Apply via email</a>
              <a href="/blog" class="btn btn-outline">Learn about our impact</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Impact / Benefits -->
    <section class="section section-alt">
      <div class="container">
        <div class="impact">
          <div class="impact-text">
            <h2 class="section-title">Your involvement multiplies impact</h2>
            <p class="lead">Support students to gain hands‑on research experience, mentorship and a pathway into science and technology careers.</p>
            <ul class="benefits" aria-label="Why get involved">
              <li><span class="benefit-dot"></span> Expand high‑quality STEM opportunities across Nigeria and beyond</li>
              <li><span class="benefit-dot"></span> Build a diverse pipeline of scientist‑leaders</li>
              <li><span class="benefit-dot"></span> Join a collaborative community of mentors and partners</li>
            </ul>
            <div class="impact-ctas">
              <a href="/donate" class="btn btn-secondary">Donate to accelerate access</a>
              <a href="mailto:hello@staija.org" class="btn btn-outline">Email hello@staija.org</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact CTA -->
    <section class="section">
      <div class="container contact-cta">
        <h3 class="contact-title">Have another idea?</h3>
        <p class="contact-text">We’d love to hear from you.</p>
        <a href="mailto:hello@staija.org" class="btn btn-primary">Get in touch</a>
      </div>
    </section>
  </div>
  
</template>

<style scoped>
.section {
  padding: var(--space-16) 0;
}

.section-alt {
  background: linear-gradient(180deg, var(--neutral-100), #ffffff);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-10);
}

.section-title {
  margin-bottom: var(--space-3);
}

.section-subtitle {
  color: var(--neutral-600);
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

@media (min-width: 800px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.card {
  background: white;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: var(--space-4);
}

.card-title {
  margin-bottom: var(--space-3);
}

.card-text {
  margin-bottom: var(--space-4);
}

.card-list {
  margin: 0 0 var(--space-6) 0;
  padding-left: 1.25rem;
  color: var(--neutral-700);
}

.card-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.impact {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  align-items: center;
}

@media (min-width: 900px) {
  .impact {
    grid-template-columns: 1.2fr 0.8fr;
  }
}

.benefits {
  list-style: none;
  padding: 0;
  margin: var(--space-6) 0;
}

.benefits li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.benefit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
  box-shadow: var(--shadow-glow);
}

.impact-ctas {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
  flex-wrap: wrap;
}

.impact-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat {
  background: white;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  text-align: center;
}

.stat-number {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--primary-700);
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: .05em;
}

.contact-cta {
  text-align: center;
  background: white;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-2xl);
  padding: var(--space-12);
  box-shadow: var(--shadow-sm);
}

.contact-title {
  margin-bottom: var(--space-2);
}

.contact-text {
  margin-bottom: var(--space-6);
}
</style>

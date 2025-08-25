<template>
  <div class="about">
    <!-- Hero Section -->
    <section class="about-hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">About STAIJA</h1>
          <p class="hero-subtitle">
            Advancing scientific and intellectual study across Africa, nurturing critical‑thinking 
            scientist‑leaders who drive innovation and economic growth.
          </p>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="mission-section">
      <div class="container">
        <div class="mission-content">
          <div class="mission-text">
            <h2 class="section-title">Our Mission</h2>
            <p class="mission-description">
              STAIJA is dedicated to promoting scientific research, mentorship, and community building 
              across Africa. We believe that by investing in young scientists and researchers, we can 
              drive innovation-led economic growth and create lasting positive change across the continent.
            </p>
            <div class="mission-values">
              <div class="value">
                <div class="value-icon">🔬</div>
                <div class="value-content">
                  <h3 class="value-title">Scientific Excellence</h3>
                  <p class="value-text">Promoting rigorous research and evidence-based thinking</p>
                </div>
              </div>
              <div class="value">
                <div class="value-icon">🤝</div>
                <div class="value-content">
                  <h3 class="value-title">Collaborative Community</h3>
                  <p class="value-text">Building networks that transcend borders and disciplines</p>
                </div>
              </div>
              <div class="value">
                <div class="value-icon">🌱</div>
                <div class="value-content">
                  <h3 class="value-title">Sustainable Impact</h3>
                  <p class="value-text">Creating lasting change through education and mentorship</p>
                </div>
              </div>
            </div>
          </div>
          <div class="mission-visual">
            <div class="mission-card">
              <h3 class="card-title">Our Approach</h3>
              <ul class="approach-list">
                <li>Hands-on research training</li>
                <li>One-on-one mentorship</li>
                <li>Peer collaboration</li>
                <li>Industry partnerships</li>
                <li>Publication opportunities</li>
                <li>Career development</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Structure Section -->
    <section class="structure-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Organizational Structure</h2>
          <p class="section-subtitle">
            STAIJA promotes a non-hierarchical environment where interns work alongside executive 
            members and have an equal voice in decision-making.
          </p>
        </div>
        
        <div class="structure-grid">
          <div class="structure-card">
            <div class="card-icon">👥</div>
            <h3 class="card-title">Collaborative Leadership</h3>
            <p class="card-text">
              Our flat organizational structure ensures that every voice is heard and valued, 
              from interns to executive members.
            </p>
          </div>
          <div class="structure-card">
            <div class="card-icon">⏰</div>
            <h3 class="card-title">Flexible Commitment</h3>
            <p class="card-text">
              Internships typically last a year and can be extended, requiring less than 2 hours 
              per week to ensure accessibility.
            </p>
          </div>
          <div class="structure-card">
            <div class="card-icon">🎯</div>
            <h3 class="card-title">Equal Voice</h3>
            <p class="card-text">
              Every team member, regardless of their role, has an equal say in organizational 
              decisions and strategic direction.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Impact Section -->
    <section class="impact-section">
      <div class="container">
        <div class="impact-content">
          <div class="impact-stats">
            <h2 class="section-title">Our Impact</h2>
            <p class="impact-description">
              Since our founding, STAIJA has grown into a continental network of scientist-leaders 
              who are making meaningful contributions to research, innovation, and economic development.
            </p>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">500+</div>
                <div class="stat-label">Students Mentored</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">50+</div>
                <div class="stat-label">Research Projects</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">25+</div>
                <div class="stat-label">Partner Organizations</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">15+</div>
                <div class="stat-label">Countries Represented</div>
              </div>
            </div>
          </div>
          <div class="impact-testimonial">
            <blockquote class="testimonial">
              <p class="testimonial-text">
                "STAIJA transformed my understanding of what it means to be a scientist in Africa. 
                The mentorship and community I found here has been invaluable in shaping my career path."
              </p>
              <footer class="testimonial-footer">
                <cite class="testimonial-author">— Alumni, StepUp Scholars Program</cite>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Join Our Mission</h2>
          <p class="cta-description">
            Whether you're a student, researcher, or organization, there are many ways to get 
            involved with STAIJA and help shape the future of science in Africa.
          </p>
          <div class="cta-actions">
            <RouterLink to="/get-involved" class="btn btn-primary btn-lg">
              Get Involved
            </RouterLink>
            <RouterLink to="/contact" class="btn btn-outline btn-lg">
              Contact Us
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about {
  min-height: 100vh;
}

/* Hero Section */
.about-hero {
  padding: var(--space-20) 0 var(--space-16);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
  text-align: center;
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  max-width: 800px;
  margin: 0 auto;
}

/* Mission Section */
.mission-section {
  padding: var(--space-20) 0;
  background: white;
}

.mission-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.mission-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.mission-values {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.value {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.value-icon {
  font-size: var(--text-2xl);
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-100);
  border-radius: var(--radius-xl);
  flex-shrink: 0;
}

.value-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.value-text {
  color: var(--neutral-600);
  margin: 0;
}

.mission-visual {
  display: flex;
  justify-content: center;
}

.mission-card {
  background: var(--neutral-50);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--neutral-200);
  max-width: 400px;
  width: 100%;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-4);
}

.approach-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.approach-list li {
  padding: var(--space-2) 0;
  color: var(--neutral-700);
  position: relative;
  padding-left: var(--space-6);
}

.approach-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary-600);
  font-weight: bold;
}

/* Structure Section */
.structure-section {
  padding: var(--space-20) 0;
  background: var(--neutral-50);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.structure-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

.structure-card {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: all var(--transition-normal);
}

.structure-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.card-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
}

.card-text {
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* Impact Section */
.impact-section {
  padding: var(--space-20) 0;
  background: white;
}

.impact-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
}

.impact-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
}

.stat-item {
  text-align: center;
  padding: var(--space-4);
}

.stat-number {
  font-size: var(--text-3xl);
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

.impact-testimonial {
  display: flex;
  justify-content: center;
}

.testimonial {
  background: var(--primary-50);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  border-left: 4px solid var(--primary-500);
  max-width: 500px;
  margin: 0;
}

.testimonial-text {
  font-size: var(--text-lg);
  color: var(--neutral-700);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
  font-style: italic;
}

.testimonial-footer {
  text-align: right;
}

.testimonial-author {
  color: var(--neutral-600);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* CTA Section */
.cta-section {
  padding: var(--space-20) 0;
  background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
  color: white;
}

.cta-content {
  text-align: center;
  max-width: 600px;
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

/* Responsive Design */
@media (min-width: 640px) {
  .structure-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .cta-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (min-width: 768px) {
  .hero-title {
    font-size: var(--text-5xl);
  }
  
  .section-title {
    font-size: var(--text-4xl);
  }
  
  .cta-title {
    font-size: var(--text-4xl);
  }
}

@media (min-width: 1024px) {
  .mission-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .impact-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .hero-title {
    font-size: var(--text-6xl);
  }
}
</style>
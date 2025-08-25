<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <!-- Brand Section -->
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="/staija-logo.svg" alt="STAIJA" class="footer-logo-img" />
            <span class="footer-title">STAIJA</span>
          </div>
          <p class="footer-description">
            Nurturing Africa's next generation of scientist-leaders through research, mentorship, and community.
          </p>
          <div class="footer-social">
            <a href="#" class="social-link" aria-label="Follow us on Twitter">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="Follow us on LinkedIn">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="Follow us on Instagram">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.864 3.708 13.713 3.708 12.416s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.275c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.608c-.807 0-1.418-.612-1.418-1.418s.612-1.418 1.418-1.418 1.418.612 1.418 1.418-.611 1.418-1.418 1.418zm0 0"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
          <h3 class="footer-heading">Programs</h3>
          <nav class="footer-nav" aria-label="Programs">
            <RouterLink to="/programs/stepup-scholars" class="footer-link">StepUp Scholars</RouterLink>
            <RouterLink to="/programs/dynamerge" class="footer-link">Dynamerge</RouterLink>
            <RouterLink to="/programs" class="footer-link">All Programs</RouterLink>
          </nav>
        </div>

        <!-- Get Involved -->
        <div class="footer-section">
          <h3 class="footer-heading">Get Involved</h3>
          <nav class="footer-nav" aria-label="Get Involved">
            <RouterLink to="/get-involved" class="footer-link">Volunteer</RouterLink>
            <RouterLink to="/get-involved" class="footer-link">Partner</RouterLink>
            <RouterLink to="/get-involved" class="footer-link">Internships</RouterLink>
            <RouterLink to="/donate" class="footer-link">Donate</RouterLink>
          </nav>
        </div>

        <!-- Organization -->
        <div class="footer-section">
          <h3 class="footer-heading">Organization</h3>
          <nav class="footer-nav" aria-label="Organization">
            <RouterLink to="/about" class="footer-link">About</RouterLink>
            <RouterLink to="/blog" class="footer-link">Stories</RouterLink>
            <RouterLink to="/contact" class="footer-link">Contact</RouterLink>
          </nav>
        </div>
      </div>

      <!-- Newsletter Signup -->
      <div class="footer-newsletter">
        <div class="newsletter-content">
          <h3 class="newsletter-title">Stay Updated</h3>
          <p class="newsletter-description">Get the latest news about our programs and impact stories.</p>
        </div>
        <form class="newsletter-form" @submit.prevent="handleNewsletterSubmit">
          <div class="newsletter-input-group">
            <label for="newsletter-email" class="sr-only">Email address</label>
            <input 
              id="newsletter-email"
              type="email" 
              placeholder="Enter your email"
              class="newsletter-input"
              required
            />
            <button type="submit" class="btn btn-primary">
              Subscribe
            </button>
          </div>
        </form>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p class="footer-copyright">
            © {{ new Date().getFullYear() }} STAIJA. All rights reserved.
          </p>
          <nav class="footer-legal" aria-label="Legal">
            <a href="/privacy" class="footer-legal-link">Privacy Policy</a>
            <a href="/terms" class="footer-legal-link">Terms of Service</a>
            <a href="/accessibility" class="footer-legal-link">Accessibility</a>
          </nav>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const handleNewsletterSubmit = () => {
  // Newsletter signup logic would go here
  console.log('Newsletter signup submitted')
}
</script>

<style scoped>
.footer {
  background: var(--neutral-900);
  color: var(--neutral-300);
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  padding: var(--space-16) 0 var(--space-12);
}

.footer-brand {
  max-width: 320px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.footer-logo-img {
  height: 2rem;
  width: auto;
  filter: brightness(0) invert(1);
}

.footer-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: white;
  letter-spacing: -0.025em;
}

.footer-description {
  color: var(--neutral-400);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-6);
}

.footer-social {
  display: flex;
  gap: var(--space-4);
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--neutral-800);
  color: var(--neutral-400);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.social-link:hover {
  background: var(--primary-600);
  color: white;
  transform: translateY(-2px);
  text-decoration: none;
}

.footer-section {
  min-width: 0;
}

.footer-heading {
  font-size: var(--text-lg);
  font-weight: 600;
  color: white;
  margin-bottom: var(--space-4);
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer-link {
  color: var(--neutral-400);
  text-decoration: none;
  transition: color var(--transition-fast);
  font-size: var(--text-sm);
}

.footer-link:hover {
  color: var(--primary-400);
  text-decoration: none;
}

.footer-newsletter {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  padding: var(--space-8) 0;
  border-top: 1px solid var(--neutral-800);
  border-bottom: 1px solid var(--neutral-800);
}

.newsletter-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: white;
  margin-bottom: var(--space-2);
}

.newsletter-description {
  color: var(--neutral-400);
  margin-bottom: 0;
}

.newsletter-form {
  max-width: 400px;
}

.newsletter-input-group {
  display: flex;
  gap: var(--space-3);
}

.newsletter-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--neutral-800);
  border: 1px solid var(--neutral-700);
  border-radius: var(--radius-lg);
  color: white;
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.newsletter-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.newsletter-input::placeholder {
  color: var(--neutral-500);
}

.footer-bottom {
  padding: var(--space-6) 0;
}

.footer-bottom-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  text-align: center;
}

.footer-copyright {
  color: var(--neutral-500);
  font-size: var(--text-sm);
  margin: 0;
}

.footer-legal {
  display: flex;
  gap: var(--space-6);
  flex-wrap: wrap;
  justify-content: center;
}

.footer-legal-link {
  color: var(--neutral-500);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--transition-fast);
}

.footer-legal-link:hover {
  color: var(--neutral-300);
  text-decoration: none;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

/* Responsive Design */
@media (min-width: 640px) {
  .footer-content {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
  
  .newsletter-input-group {
    flex-direction: row;
  }
  
  .footer-bottom-content {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}

@media (min-width: 768px) {
  .footer-newsletter {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}
</style>
<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <!-- Brand Section -->
        <div class="footer-brand">
          <div class="footer-logo">
            <span class="footer-title">STAIJA</span>
          </div>
          <p class="footer-description">
            Nurturing Africa's next generation of scientist-leaders through research, mentorship, and community.
          </p>
          <div class="footer-social">
            <a href="https://www.threads.com/@staija_ng" class="social-link" aria-label="Follow us on Threads">
              <img src="../assets/threads.svg" alt="Threads" width="24" height="24" />
            </a>
            <a href="https://www.instagram.com/staija_ng/" class="social-link" aria-label="Follow us on Instagram">
              <Icon icon="mdi:instagram" width="24" height="24" />
            </a>
            <a href="https://www.linkedin.com/company/staija-ng/" class="social-link" aria-label="Follow us on LinkedIn">
              <Icon icon="mdi:linkedin" width="24" height="24" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
          <h3 class="footer-heading">Programs</h3>
          <nav class="footer-nav" aria-label="Programs">
            <RouterLink to="/programs/stepup-scholars" class="footer-link">StepUp Scholars</RouterLink>
            <RouterLink to="/programs/dynamerge" class="footer-link">Dynamerge</RouterLink>
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
import { Icon } from '@iconify/vue'

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
  font-family: 'Cairo', sans-serif;
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



/* Responsive Design */
@media (min-width: 640px) {
  .footer-content {
    grid-template-columns: 2fr 1fr 1fr;
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
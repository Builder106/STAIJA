<template>
  <div class="login-page">
    <div class="page-container">
      <div class="auth-header">
        <router-link to="/" class="logo-link">
          <img src="/public/staija-logo.svg" alt="STAIJA Logo" class="logo" />
        </router-link>
      </div>
      
      <div class="auth-content">
        <LoginForm />
      </div>
      
      <div class="auth-footer">
        <p>&copy; 2025 STAIJA. All rights reserved.</p>
        <div class="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '../components/auth/LoginForm.vue'
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.page-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.auth-header {
  text-align: center;
}

.logo-link {
  display: inline-block;
  text-decoration: none;
}

.logo {
  height: 60px;
  width: auto;
}

.auth-content {
  flex: 1;
}

.auth-footer {
  text-align: center;
  color: white;
  font-size: 0.9rem;
}

.auth-footer p {
  margin-bottom: 1rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.footer-links a:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }
  
  .page-container {
    gap: 1.5rem;
  }
  
  .logo {
    height: 50px;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

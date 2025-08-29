<template>
  <div class="signup-page">
    <!-- Background Pattern -->
    <div class="background-pattern">
      <div class="pattern-circle pattern-circle-1"></div>
      <div class="pattern-circle pattern-circle-2"></div>
      <div class="pattern-circle pattern-circle-3"></div>
      <div class="pattern-grid"></div>
    </div>
    
    <div class="page-container">
      <!-- Header Section -->
      <div class="auth-header">
        <router-link to="/" class="logo-link">
          <div class="logo-container">
            <img src="../assets/staija-logo.svg" alt="STAIJA Logo" class="logo" height="100" width="100"/>
          </div>
        </router-link>
      </div>
      
      <!-- Main Content -->
      <div class="auth-content">
        <div class="welcome-section">
          <h1 class="welcome-title">Join STAIJA</h1>
          <p class="welcome-subtitle">Create your account to start your journey with STAIJA programs</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SignUpForm from '../components/auth/SignUpForm.vue'
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* Background Pattern */
.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.pattern-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.pattern-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation: float 6s ease-in-out infinite;
}

.pattern-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite reverse;
}

.pattern-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  animation: float 10s ease-in-out infinite;
}

.pattern-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.page-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  position: relative;
  z-index: 2;
}

/* Header Section */
.auth-header {
  text-align: center;
}

.logo-link {
  display: inline-block;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.05);
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  height: 100px;
  width: 100px;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3));
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 1rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto;
}

.auth-content {
  flex: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .signup-page {
    padding: 1.5rem;
  }
  
  .page-container {
    gap: 2rem;
    max-width: 100%;
  }
  
  .page-container {
    max-width: 500px;
  }
  
  .welcome-title {
    font-size: 1.75rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .signup-page {
    padding: 1rem;
  }
  
  .page-container {
    gap: 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .welcome-subtitle {
    font-size: 0.9rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .pattern-circle,
  .pattern-grid {
    animation: none;
  }
  
  .logo-link:hover {
    transform: none;
  }
}
</style>

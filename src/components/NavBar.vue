<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="navbar">
    <div class="container">
      <div class="navbar-content">
        <!-- Logo -->
        <RouterLink to="/" class="navbar-brand" @click="closeMenu">
          <span class="navbar-title">STAIJA</span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="navbar-nav" aria-label="Primary navigation">
          <RouterLink to="/get-involved" class="nav-link">Get Involved</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
          <RouterLink to="/blog" class="nav-link">Stories</RouterLink>
          <div class="navbar-ctas">
            <RouterLink to="/programs/stepup-scholars" class="btn btn-outline btn-sm">Apply</RouterLink>
            <RouterLink to="/donate" class="btn btn-secondary btn-sm">Donate</RouterLink>
          </div>
        </nav>

        <!-- Mobile Menu Button -->
        <button 
          class="mobile-menu-button"
          @click="toggleMenu"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
        >
          <svg class="menu-icon" :class="{ 'menu-icon--open': isMenuOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path class="menu-line menu-line-1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18" />
            <path class="menu-line menu-line-2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18" />
            <path class="menu-line menu-line-3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 18h18" />
          </svg>
        </button>
      </div>

      <!-- Mobile Navigation -->
      <nav 
        id="mobile-menu"
        class="mobile-nav"
        :class="{ 'mobile-nav--open': isMenuOpen }"
        aria-label="Mobile navigation"
      >
        <div class="mobile-nav-content">
          <RouterLink to="/get-involved" class="mobile-nav-link" @click="closeMenu">Get Involved</RouterLink>
          <RouterLink to="/about" class="mobile-nav-link" @click="closeMenu">About</RouterLink>
          <RouterLink to="/blog" class="mobile-nav-link" @click="closeMenu">Stories</RouterLink>
          <div class="mobile-nav-cta">
            <div class="mobile-cta-row">
              <RouterLink to="/programs/stepup-scholars" class="btn btn-outline" @click="closeMenu">Apply</RouterLink>
              <RouterLink to="/donate" class="btn btn-secondary" @click="closeMenu">Donate</RouterLink>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-sm);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--neutral-900);
  font-weight: 700;
  font-size: var(--text-xl);
  transition: opacity var(--transition-fast);
}

.navbar-brand:hover {
  opacity: 0.8;
  text-decoration: none;
}

.navbar-logo {
  height: 2rem;
  width: auto;
}

.navbar-title {
  font-family: 'Cairo', sans-serif;
  letter-spacing: -0.025em;
}

.navbar-nav {
  display: none;
  align-items: center;
  gap: var(--space-6);
}

.navbar-ctas {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-link {
  color: var(--neutral-700);
  font-weight: 500;
  text-decoration: none;
  transition: color var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  color: var(--primary-600);
  text-decoration: none;
}

.nav-link.router-link-active {
  color: var(--primary-600);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-500);
  border-radius: var(--radius-full);
}

.mobile-menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  color: var(--neutral-700);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.mobile-menu-button:hover {
  background: var(--neutral-100);
  color: var(--primary-600);
}

.mobile-menu-button:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.menu-icon {
  width: 1.5rem;
  height: 1.5rem;
  transition: transform var(--transition-normal);
}

.menu-line {
  transition: all var(--transition-normal);
  transform-origin: center;
}

.menu-icon--open .menu-line-1 {
  transform: rotate(45deg) translate(6px, 6px);
}

.menu-icon--open .menu-line-2 {
  opacity: 0;
}

.menu-icon--open .menu-line-3 {
  transform: rotate(-45deg) translate(6px, -6px);
}

.mobile-nav {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-lg);
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.mobile-nav--open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.mobile-nav-content {
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.mobile-nav-link {
  color: var(--neutral-700);
  font-weight: 500;
  font-size: var(--text-lg);
  text-decoration: none;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--neutral-100);
  transition: color var(--transition-fast);
}

.mobile-nav-link:hover {
  color: var(--primary-600);
  text-decoration: none;
}

.mobile-nav-link.router-link-active {
  color: var(--primary-600);
  font-weight: 600;
}

.mobile-nav-cta {
  padding-top: var(--space-4);
  border-top: 1px solid var(--neutral-200);
}

.mobile-cta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

/* Desktop Navigation */
@media (min-width: 768px) {
  .navbar-nav {
    display: flex;
  }
  
  .mobile-menu-button {
    display: none;
  }
  
  .mobile-nav {
    display: none;
  }
}
</style>
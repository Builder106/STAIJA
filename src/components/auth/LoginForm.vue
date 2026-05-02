<template>
  <div class="login-form">
    <div class="form-container">
      <h2 id="login-heading">Sign In to STAIJA</h2>
      <p class="subtitle">Access your account to manage content and connect with the community</p>
      
      <form @submit.prevent="handleLogin" class="form" role="form" aria-labelledby="login-heading">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
            :class="{ 'error': !email && showValidation }"
            autocomplete="username"
          />
          <span v-if="!email && showValidation" class="error-message" role="alert">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            Email is required
          </span>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-container">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="Enter your password"
              autocomplete="current-password"
              :disabled="loading"
              :class="{ 'error': !password && showValidation }"
              @input="clearValidation"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <Icon v-if="showPassword" icon="mdi:eye-off" class="icon" />
              <Icon v-else icon="mdi:eye" class="icon" />
            </button>
          </div>
          <span v-if="!password && showValidation" class="error-message" role="alert">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            Password is required
          </span>
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="loading || !email || !password"
            class="btn-primary"
            :class="{ 'loading': loading }"
          >
            <div v-if="loading" class="loading-content">
              <div class="loading-spinner"></div>
              <span>Signing In...</span>
            </div>
            <span v-else>Sign In</span>
          </button>
          
          <button
            type="button"
            @click="forgotPassword"
            class="btn-link"
            :disabled="loading"
          >
            Forgot Password?
          </button>
        </div>
      </form>
      
      <div class="divider">
        <span>or</span>
      </div>
      
      <div class="social-login">
        <button
          @click="signInWithGoogle"
          :disabled="loading"
          class="btn-social google"
          aria-label="Sign in with Google account"
        >
          <div class="social-icon">
            <Icon icon="logos:google-icon" class="icon" aria-hidden="true" />
          </div>
          <span class="social-text">Continue with Google</span>
        </button>

        <button
          @click="signInWithGitHub"
          :disabled="loading"
          class="btn-social github"
          aria-label="Sign in with GitHub account"
        >
          <div class="social-icon">
            <Icon icon="mdi:github" class="icon" aria-hidden="true" />
          </div>
          <span class="social-text">Continue with GitHub</span>
        </button>

        <button
          @click="signInWithEmailLink"
          :disabled="loading"
          class="btn-social email-link"
          aria-label="Sign in with email link"
        >
          <div class="social-icon">
            <Icon icon="mdi:email" class="icon" aria-hidden="true" />
          </div>
          <span class="social-text">Sign in with Email Link</span>
        </button>
      </div>
      
      <div class="signup-link">
        <p>Don't have an account? <router-link to="/signup">Sign up</router-link></p>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="error" class="error-modal">
      <div class="error-content">
        <h3>Sign In Error</h3>
        <p>{{ error }}</p>
        <button @click="error = ''" class="btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, DatabaseService, postLoginRouteName } from '../../services/firebase'
import { Icon } from '@iconify/vue'

const router = useRouter()

// Reactive data
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showValidation = ref(false)
const showPassword = ref(false)

// Watch for form changes to hide validation errors
watch([email, password], () => {
  if (showValidation.value && email.value && password.value) {
    showValidation.value = false
  }
})

// Methods
const handleLogin = async () => {
  if (!email.value || !password.value) {
    showValidation.value = true
    return
  }
  
  loading.value = true
  error.value = ''
  showValidation.value = false
  
  try {
    await AuthService.signIn(email.value, password.value)
    await redirectByRole()
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}

async function redirectByRole() {
  const user = AuthService.getCurrentUser()
  let role = null
  if (user) {
    try {
      const profile = await DatabaseService.getUserProfile(user.uid)
      role = profile?.role ?? null
    } catch {
      // Fall through with role=null — postLoginRouteName returns 'home'
    }
  }
  router.push({ name: postLoginRouteName(role) })
}

const clearValidation = () => {
  if (showValidation.value && email.value && password.value) {
    showValidation.value = false
  }
}

// Keyboard navigation and accessibility helpers
const handleKeyDown = (event: KeyboardEvent) => {
  // Close error modal with Escape key
  if (event.key === 'Escape' && error.value) {
    error.value = ''
  }
}

// Add event listeners for keyboard navigation
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await AuthService.signInWithGoogle()
    await redirectByRole()
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in with Google.'
  } finally {
    loading.value = false
  }
}

const signInWithGitHub = async () => {
  loading.value = true
  error.value = ''

  try {
    await AuthService.signInWithGitHub()
    await redirectByRole()
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in with GitHub.'
  } finally {
    loading.value = false
  }
}

const signInWithEmailLink = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address first.'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    // Determine role based on email domain
    const isStaff = email.value.endsWith('@staija.org')
    const role = isStaff ? 'staff' : 'applicant'
    
    await AuthService.sendSignInLink(email.value, role)
    
    // Show success message
    error.value = ''
    showSuccessMessage('Check your email! We\'ve sent you a sign-in link.')
    
    // Clear email field
    email.value = ''
    
  } catch (err: any) {
    error.value = err.message || 'Failed to send sign-in link. Please try again.'
  } finally {
    loading.value = false
  }
}

const showSuccessMessage = (message: string) => {
  // You can implement a toast notification here
  alert(message) // Simple implementation - replace with proper toast
}

const forgotPassword = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address first.'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    await AuthService.resetPassword(email.value)
    error.value = 'Password reset email sent! Check your inbox.'
  } catch (err: any) {
    error.value = err.message || 'Failed to send password reset email.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Iconify Icon Styling */
iconify-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}

.login-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.form-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 20px 20px 0 0;
}

.form-container:hover {
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
}

h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #1f2937;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.5;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: var(--neutral-700);
}

input {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
  background: white;
}

input:disabled {
  background-color: var(--neutral-100);
  cursor: not-allowed;
}

input.error {
  border-color: var(--error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--error-500);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  animation: slideInError 0.3s ease-out;
}

.error-icon {
  width: 1rem;
  height: 1rem;
  fill: var(--error-500);
  flex-shrink: 0;
}

@keyframes slideInError {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.password-toggle:hover:not(:disabled) {
  color: #374151;
  background: rgba(0, 0, 0, 0.05);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-toggle .icon {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}

.error-message {
  color: var(--error-500);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary.loading {
  pointer-events: none;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-600);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
}

.btn-link:hover:not(:disabled) {
  color: var(--primary-500);
  transform: scale(1.05);
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

/* .divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--neutral-300);
} */

.divider span {
  background: white;
  padding: 0 1rem;
  color: var(--neutral-600);
}

.social-login {
  margin-bottom: 1.5rem;
}

.social-login-header {
  text-align: center;
  margin-bottom: 1rem;
  position: relative;
}

.social-login-header::before,
.social-login-header::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 3rem);
  height: 1px;
  background: #e5e7eb;
}

.social-login-header::before {
  left: 0;
}

.social-login-header::after {
  right: 0;
}

.social-login-header span {
  background: white;
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-social {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  color: #374151;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
}

.btn-social:last-child {
  margin-bottom: 0;
}

.btn-social::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.5s;
}

.btn-social:hover:not(:disabled) {
  background: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.btn-social:hover:not(:disabled)::before {
  left: 100%;
}

.btn-social:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.social-text {
  font-weight: 500;
  letter-spacing: 0.025em;
}

.btn-social.email-link {
  background: var(--primary-600);
  color: white;
  border-color: var(--primary-600);
}

.btn-social.email-link:hover:not(:disabled) {
  background: var(--primary-700);
  border-color: var(--primary-700);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.btn-social:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  width: 20px;
  height: 20px;
}

.signup-link {
  text-align: center;
  margin-top: 1rem;
}

.signup-link a {
  color: var(--primary-600);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.signup-link a:hover {
  text-decoration: underline;
  color: var(--primary-500);
}

.error-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  box-shadow: var(--shadow-2xl);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.error-content h3 {
  color: var(--error-500);
  margin-bottom: 1rem;
}

.btn-secondary {
  background: var(--secondary-600);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all var(--transition-normal);
}

.btn-secondary:hover {
  background: var(--secondary-700);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .login-form {
    max-width: 100%;
    padding: 1rem;
  }
  
  .form-container {
    padding: 2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .form-container:hover,
  input:focus,
  .btn-primary:hover:not(:disabled),
  .btn-link:hover:not(:disabled),
  .btn-social:hover:not(:disabled),
  .btn-secondary:hover {
    transform: none;
  }
  
  .btn-primary:hover::before {
    left: -100%;
  }
  
  .error-content {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .login-form {
    padding: 1rem;
    max-width: 100%;
  }

  .form-container {
    padding: 1.5rem;
    border-radius: 16px;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .form {
    gap: 1rem;
  }

  .form-group {
    gap: 0.375rem;
  }

  input {
    padding: 0.875rem;
    font-size: 1rem;
  }

  .btn-primary {
    padding: 0.875rem;
    font-size: 1rem;
  }

  .password-toggle {
    right: 0.75rem;
  }

  .social-login-header::before,
  .social-login-header::after {
    width: calc(50% - 2rem);
  }

  .social-login-header span {
    font-size: 0.8rem;
  }

  .btn-link {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .login-form {
    padding: 0.5rem;
  }

  .form-container {
    padding: 1.25rem;
    border-radius: 12px;
  }

  h2 {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .form-group {
    gap: 0.25rem;
  }

  input {
    padding: 0.75rem;
    font-size: 0.95rem;
  }

  .btn-primary {
    padding: 0.75rem;
    font-size: 0.95rem;
  }

  .error-modal {
    margin: 1rem;
  }

  .error-content {
    max-width: none;
    width: calc(100vw - 2rem);
  }

  .btn-link {
    font-size: 0.8rem;
  }

  .checkbox-label {
    font-size: 0.85rem;
  }
}

/* Touch-friendly interactions */
@media (hover: none) and (pointer: coarse) {
  .btn-primary:hover:not(:disabled),
  .btn-social:hover:not(:disabled),
  .btn-link:hover:not(:disabled) {
    transform: none;
  }

  .btn-primary:active:not(:disabled),
  .btn-social:active:not(:disabled),
  .btn-link:active {
    transform: scale(0.98);
  }

  input:focus {
    transform: none;
  }

  .password-toggle:active {
    transform: scale(0.95);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-container {
    border: 2px solid currentColor;
  }

  input {
    border-width: 2px;
  }

  .btn-primary {
    border: 2px solid transparent;
  }

  .btn-social {
    border-width: 2px;
  }
}
</style>

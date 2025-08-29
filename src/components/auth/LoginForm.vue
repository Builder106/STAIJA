<template>
  <div class="login-form">
    <div class="form-container">
      <h2>Sign In to STAIJA</h2>
      <p class="subtitle">Access your account to manage content and connect with the community</p>
      
      <form @submit.prevent="handleLogin" class="form">
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
          <span v-if="!email && showValidation" class="error-message">Email is required</span>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            autocomplete="current-password"
            :disabled="loading"
            :class="{ 'error': !password && showValidation }"
          />
          <span v-if="!password && showValidation" class="error-message">Password is required</span>
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="loading || !email || !password"
            class="btn-primary"
          >
            <span v-if="loading">
              <div class="loading-spinner"></div>
              Signing In...
            </span>
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
        >
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <button
          @click="signInWithEmailLink"
          :disabled="loading"
          class="btn-social email-link"
        >
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          Sign in with Email Link
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, DatabaseService } from '../../services/firebase'

const router = useRouter()

// Reactive data
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showValidation = ref(false)

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
    
    // Get user profile to determine redirect
    const user = AuthService.getCurrentUser()
    if (user) {
      try {
        const profile = await DatabaseService.getUserProfile(user.uid)
        if (profile) {
          switch (profile.role) {
            case 'applicant':
              router.push('/applicant')
              break
            case 'admin':
            case 'staff':
              router.push('/admin')
              break
            case 'alumni':
              router.push('/alumni')
              break
            default:
              router.push('/dashboard')
          }
        } else {
          router.push('/dashboard')
        }
      } catch {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await AuthService.signInWithGoogle()
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in with Google.'
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
.login-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
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

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--neutral-300);
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: var(--neutral-600);
}

.social-login {
  margin-bottom: 1.5rem;
}

.btn-social {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #374151;
}

.btn-social:hover:not(:disabled) {
  background: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
</style>

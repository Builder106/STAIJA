<template>
  <div class="signup-form">
    <div class="form-container">
      <h2>Join STAIJA</h2>
      <p class="subtitle">Create your account to access programs, connect with alumni, and stay updated</p>
      
      <form @submit.prevent="handleSignUp" class="form">
        <div class="form-group">
          <label for="displayName">Full Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            required
            placeholder="Enter your full name"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Create a password"
            :disabled="loading"
            minlength="8"
          />
          <small class="password-hint">Password must be at least 8 characters long</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Confirm your password"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="role">I am a:</label>
          <select
            id="role"
            v-model="role"
            required
            :disabled="loading"
          >
            <option value="">Select your role</option>
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
            <option value="content_editor">Content Editor</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="agreeToTerms"
              required
              :disabled="loading"
            />
            <span class="checkmark"></span>
            I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
          </label>
        </div>
        
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="subscribeNewsletter"
              :disabled="loading"
            />
            <span class="checkmark"></span>
            Subscribe to our newsletter for updates and opportunities
          </label>
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn-primary"
          >
            <span v-if="loading">Creating Account...</span>
            <span v-else>Create Account</span>
          </button>
        </div>
      </form>
      
      <div class="divider">
        <span>or</span>
      </div>
      
      <div class="social-login">
        <button
          @click="signUpWithGoogle"
          :disabled="loading"
          class="btn-social google"
        >
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>
      </div>
      
      <div class="login-link">
        <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="error" class="error-modal">
      <div class="error-content">
        <h3>Sign Up Error</h3>
        <p>{{ error }}</p>
        <button @click="error = ''" class="btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../../services/firebase'

const router = useRouter()

// Reactive data
const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('')
const agreeToTerms = ref(false)
const subscribeNewsletter = ref(false)
const loading = ref(false)
const error = ref('')

// Computed properties
const isFormValid = computed(() => {
  return (
    displayName.value.trim() &&
    email.value.trim() &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value &&
    role.value &&
    agreeToTerms.value
  )
})

const passwordMatch = computed(() => {
  return password.value === confirmPassword.value || !confirmPassword.value
})

// Methods
const handleSignUp = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await AuthService.signUp(email.value, password.value, displayName.value)
    
    // Update user role if not default
    if (role.value !== 'student') {
      // TODO: Update user role in Firestore
      console.log('Role update not implemented yet')
    }
    
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}

const signUpWithGoogle = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // TODO: Implement Google sign-up
    console.log('Google sign-up not implemented yet')
  } catch (err: any) {
    error.value = err.message || 'Failed to sign up with Google.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signup-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
}

.subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
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
  color: var(--color-text);
}

input, select {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--color-primary);
}

input:disabled, select:disabled {
  background-color: var(--color-background-secondary);
  cursor: not-allowed;
}

.password-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.checkbox-group {
  flex-direction: row;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.4;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  width: auto;
}

.checkbox-label a {
  color: var(--color-primary);
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  background: var(--color-border);
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: var(--color-text-secondary);
}

.social-login {
  margin-bottom: 1.5rem;
}

.btn-social {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-social:hover:not(:disabled) {
  background: var(--color-background-secondary);
}

.btn-social:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  width: 20px;
  height: 20px;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
}

.login-link a {
  color: var(--color-primary);
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
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
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
}

.error-content h3 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-secondary:hover {
  background: var(--color-secondary-dark);
}
</style>

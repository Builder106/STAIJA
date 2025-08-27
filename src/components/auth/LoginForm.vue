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
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
          />
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="loading || !email || !password"
            class="btn-primary"
          >
            <span v-if="loading">Signing In...</span>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../../services/firebase'

const router = useRouter()

// Reactive data
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Methods
const handleLogin = async () => {
  if (!email.value || !password.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await AuthService.signIn(email.value, password.value)
    router.push('/dashboard')
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
    // TODO: Implement Google sign-in
    console.log('Google sign-in not implemented yet')
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in with Google.'
  } finally {
    loading.value = false
  }
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
  max-width: 400px;
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

input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
}

input:disabled {
  background-color: var(--color-background-secondary);
  cursor: not-allowed;
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

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-link:hover:not(:disabled) {
  color: var(--color-primary-dark);
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

.signup-link {
  text-align: center;
  margin-top: 1rem;
}

.signup-link a {
  color: var(--color-primary);
  text-decoration: none;
}

.signup-link a:hover {
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

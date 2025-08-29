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
            autocomplete="username"
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
            autocomplete="new-password"
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
            autocomplete="new-password"
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
            <option value="applicant">Program Applicant</option>
            <option value="staff">Staff Member</option>
            <option value="alumni">Alumni</option>
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
    
    <!-- Google Sign Up Modal -->
    <div v-if="showGoogleModal" class="google-modal">
      <div class="google-modal-content">
        <div class="modal-header">
          <h3>Complete Your Profile</h3>
          <p>Please set a password and select your role to complete your registration</p>
        </div>
        
        <form @submit.prevent="completeGoogleSignUp" class="modal-form">
          <div class="form-group">
            <label for="googlePassword">Password</label>
            <input
              id="googlePassword"
              v-model="googlePassword"
              type="password"
              required
              placeholder="Create a password"
              minlength="8"
              autocomplete="new-password"
            />
            <small class="password-hint">Password must be at least 8 characters long</small>
          </div>
          
          <div class="form-group">
            <label for="googleConfirmPassword">Confirm Password</label>
            <input
              id="googleConfirmPassword"
              v-model="googleConfirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              autocomplete="new-password"
            />
          </div>
          
          <div class="form-group">
            <label for="googleRole">I am a:</label>
            <select
              id="googleRole"
              v-model="googleRole"
              required
            >
              <option value="">Select your role</option>
              <option value="applicant">Program Applicant</option>
              <option value="staff">Staff Member</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="googleAgreeToTerms"
                required
              />
              <span class="checkmark"></span>
              I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
            </label>
          </div>
          
          <div class="modal-actions">
            <button
              type="submit"
              :disabled="loading || !googlePassword || !googleConfirmPassword || !googleRole || !googleAgreeToTerms"
              class="btn-primary"
            >
              <span v-if="loading">Completing...</span>
              <span v-else>Complete Registration</span>
            </button>
            <button
              type="button"
              @click="showGoogleModal = false"
              class="btn-secondary"
              :disabled="loading"
            >
              Cancel
            </button>
          </div>
        </form>
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
    await AuthService.signUp(email.value, password.value, displayName.value, role.value as 'applicant' | 'staff')
    
    // Redirect based on role
    if (role.value === 'applicant') {
      router.push('/applicant')
    } else if (role.value === 'staff') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}

const showGoogleModal = ref(false)
const googlePassword = ref('')
const googleConfirmPassword = ref('')
const googleRole = ref('')
const googleAgreeToTerms = ref(false)

const signUpWithGoogle = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await AuthService.signInWithGoogle()
    
    // Check if this is a new user (first time signing up)
    if (result?.additionalUserInfo?.isNewUser) {
      // Show modal to collect additional info
      showGoogleModal.value = true
    } else {
      // Existing user, redirect to appropriate dashboard
      const user = AuthService.getCurrentUser()
      if (user) {
        try {
          const profile = await AuthService.getUserProfile()
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
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to sign up with Google.'
  } finally {
    loading.value = false
  }
}

const completeGoogleSignUp = async () => {
  if (!googlePassword.value || !googleConfirmPassword.value || !googleRole.value || !googleAgreeToTerms.value) {
    error.value = 'Please fill in all required fields.'
    return
  }
  
  if (googlePassword.value !== googleConfirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  
  if (googlePassword.value.length < 8) {
    error.value = 'Password must be at least 8 characters long.'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const user = AuthService.getCurrentUser()
    if (!user) {
      error.value = 'No user found. Please try signing in again.'
      return
    }
    
    // Update user profile with role and set password
    await AuthService.updatePassword(googlePassword.value)
    await AuthService.createUserProfile({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: googleRole.value as 'applicant' | 'staff' | 'alumni',
      createdAt: new Date()
    })
    
    // Close modal and redirect
    showGoogleModal.value = false
    googlePassword.value = ''
    googleConfirmPassword.value = ''
    googleRole.value = ''
    googleAgreeToTerms.value = false
    
    // Redirect based on role
    if (googleRole.value === 'applicant') {
      router.push('/applicant')
    } else if (googleRole.value === 'staff') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to complete sign up. Please try again.'
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
  color: #374151;
}

input, select {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

input:focus, select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
  background: white;
}

input:disabled, select:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.password-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
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
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.checkbox-label a:hover {
  text-decoration: underline;
  color: #5a67d8;
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
  background: #e5e7eb;
}

.divider span {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 1rem;
  color: #6b7280;
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
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
  color: #5a67d8;
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
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlideIn 0.3s ease-out;
}

.error-content h3 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.google-modal {
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

.google-modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: modalSlideIn 0.3s ease-out;
  position: relative;
}

.google-modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 20px 20px 0 0;
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-header h3 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.modal-header p {
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.modal-actions .btn-primary {
  flex: 1;
}

.modal-actions .btn-secondary {
  flex: 1;
  background: #6b7280;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-actions .btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #4b5563;
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
</style>

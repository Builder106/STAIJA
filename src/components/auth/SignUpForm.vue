<template>
  <div class="signup-form">
    <div class="form-container">
      <h2 id="signup-heading">Join STAIJA</h2>
      <p class="subtitle">Create your account to access programs, connect with alumni, and stay updated</p>
      
      <form @submit.prevent="handleSignUp" class="form" role="form" aria-labelledby="signup-heading">
        <div class="form-group">
          <label for="displayName">Full Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            required
            placeholder="Enter your full name"
            :disabled="loading"
            :class="{ 'error': !displayName.trim() && showValidation }"
            @input="clearFieldError('displayName')"
          />
          <span v-if="!displayName.trim() && showValidation" class="error-message" role="alert">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            Full name is required
          </span>
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
            :class="{ 'error': !email.trim() && showValidation }"
            @input="clearFieldError('email')"
          />
          <span v-if="!email.trim() && showValidation" class="error-message" role="alert">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            Email address is required
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
            placeholder="Create a password"
            :disabled="loading"
            minlength="8"
            autocomplete="new-password"
              @input="validatePassword"
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
          <div class="password-requirements" v-if="password" role="list" aria-label="Password requirements">
            <div class="requirement" :class="{ 'met': password.length >= 8 }" role="listitem" :aria-label="password.length >= 8 ? 'Requirement met: At least 8 characters' : 'Requirement not met: At least 8 characters'">
              <Icon icon="mdi:check" class="icon" :aria-hidden="true" />
              At least 8 characters
            </div>
            <div class="requirement" :class="{ 'met': /[A-Z]/.test(password) }" role="listitem" :aria-label="/[A-Z]/.test(password) ? 'Requirement met: One uppercase letter' : 'Requirement not met: One uppercase letter'">
              <Icon icon="mdi:check" class="icon" :aria-hidden="true" />
              One uppercase letter
            </div>
            <div class="requirement" :class="{ 'met': /[a-z]/.test(password) }" role="listitem" :aria-label="/[a-z]/.test(password) ? 'Requirement met: One lowercase letter' : 'Requirement not met: One lowercase letter'">
              <Icon icon="mdi:check" class="icon" :aria-hidden="true" />
              One lowercase letter
            </div>
            <div class="requirement" :class="{ 'met': /\d/.test(password) }" role="listitem" :aria-label="/\d/.test(password) ? 'Requirement met: One number' : 'Requirement not met: One number'">
              <Icon icon="mdi:check" class="icon" :aria-hidden="true" />
              One number
            </div>
          </div>
          <div v-if="password && !isPasswordValid" class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :style="{ width: passwordStrength + '%' }" :class="'strength-' + passwordStrengthLevel"></div>
            </div>
            <small class="strength-text">{{ passwordStrengthText }}</small>
        </div>
        </div>
        
        <div class="form-group">
          <label for="role">I am a:</label>
          <div class="custom-dropdown" :class="{ 'error': !role && showValidation, 'open': showRoleMenu }">
            <button
              type="button"
              class="dropdown-trigger"
              @click="toggleRoleMenu"
              :disabled="loading"
              :aria-expanded="showRoleMenu"
              aria-haspopup="listbox"
            >
              <span class="selected-role">
                {{ getRoleDisplayText(role) }}
              </span>
              <Icon 
                icon="mdi:chevron-down" 
                class="dropdown-icon"
                :class="{ 'rotated': showRoleMenu }"
              />
            </button>
            
            <div v-if="showRoleMenu" class="dropdown-menu" role="listbox">
              <div
                v-for="option in roleOptions"
                :key="option.value"
                class="dropdown-option"
                :class="{ 'selected': role === option.value }"
                @click="selectRole(option.value)"
                role="option"
                :aria-selected="role === option.value"
              >
                <Icon :icon="option.icon" class="option-icon" />
                <span class="option-text">{{ option.label }}</span>
                <Icon v-if="role === option.value" icon="mdi:check" class="check-icon" />
              </div>
            </div>
          </div>
          <span v-if="!role && showValidation" class="error-message" role="alert">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            Please select your role
          </span>
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
            :class="{ 'loading': loading }"
          >
            <div v-if="loading" class="loading-content">
              <div class="loading-spinner"></div>
              <span>Creating Account...</span>
            </div>
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
          aria-label="Sign up with Google account"
        >
                    <div class="social-icon">
            <Icon icon="logos:google-icon" class="icon" aria-hidden="true" />
          </div>
          <span class="social-text">Continue with Google</span>
        </button>
      </div>
      
      <div class="login-link">
        <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="error" class="error-modal" @click.self="error = ''">
      <div class="error-content">
                <div class="error-header">
          <Icon icon="mdi:alert-circle" class="error-modal-icon" />
        <h3>Sign Up Error</h3>
        </div>
        <p class="error-description">{{ error }}</p>
        <div class="error-actions">
          <button @click="error = ''" class="btn-secondary">Try Again</button>
        </div>
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
            <div class="password-input-container">
            <input
              id="googlePassword"
              v-model="googlePassword"
                :type="showGooglePassword ? 'text' : 'password'"
              required
              placeholder="Create a password"
              minlength="8"
              autocomplete="new-password"
                @input="validateGooglePassword"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showGooglePassword = !showGooglePassword"
                :aria-label="showGooglePassword ? 'Hide password' : 'Show password'"
              >
                <Icon v-if="showGooglePassword" icon="mdi:eye-off" class="icon" />
                <Icon v-else icon="mdi:eye" class="icon" />
              </button>
          </div>
            <div class="password-requirements" v-if="googlePassword">
              <div class="requirement" :class="{ 'met': googlePassword.length >= 8 }">
                <Icon icon="mdi:check" class="icon" />
                At least 8 characters
              </div>
              <div class="requirement" :class="{ 'met': /[A-Z]/.test(googlePassword) }">
                <Icon icon="mdi:check" class="icon" />
                One uppercase letter
              </div>
              <div class="requirement" :class="{ 'met': /[a-z]/.test(googlePassword) }">
                <Icon icon="mdi:check" class="icon" />
                One lowercase letter
              </div>
              <div class="requirement" :class="{ 'met': /\d/.test(googlePassword) }">
                <Icon icon="mdi:check" class="icon" />
                One number
              </div>
            </div>
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
              :disabled="loading || !googlePassword || !googleRole || !googleAgreeToTerms || !isGooglePasswordValid"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, PermissionService, type PublicAssignableRole } from '../../services/firebase'
import { Icon } from '@iconify/vue'

const router = useRouter()

// Reactive data
const displayName = ref('')
const email = ref('')
const password = ref('')
const role = ref<PublicAssignableRole>('applicant')
const agreeToTerms = ref(false)
const subscribeNewsletter = ref(false)
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const showValidation = ref(false)
const showRoleMenu = ref(false)
const passwordStrength = ref(0)
const passwordStrengthLevel = ref('weak')
const passwordStrengthText = ref('')
const isPasswordValid = ref(false)

// Computed properties
const isFormValid = computed(() => {
  return (
    displayName.value.trim() &&
    email.value.trim() &&
    isPasswordValid.value &&
    role.value &&
    agreeToTerms.value
  )
})

// Methods
const handleSignUp = async () => {
  if (!isFormValid.value) {
    showValidation.value = true
    return
  }
  
  loading.value = true
  error.value = ''
  showValidation.value = false
  
  try {
    await AuthService.signUp(email.value, password.value, displayName.value, role.value)

    // Redirect based on permissions
    if (PermissionService.hasPermission(role.value, 'view_own_applications')) {
      router.push('/applicant')
    } else if (PermissionService.hasPermission(role.value, 'access_alumni_portal')) {
      router.push('/alumni')
    } else {
      router.push('/dashboard')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}

const validatePassword = () => {
  const pwd = password.value
  let score = 0
  let valid = true

  // Length check (8+ characters)
  if (pwd.length >= 8) score += 25
  else valid = false

  // Uppercase letter check
  if (/[A-Z]/.test(pwd)) score += 25
  else valid = false

  // Lowercase letter check
  if (/[a-z]/.test(pwd)) score += 25
  else valid = false

  // Number check
  if (/\d/.test(pwd)) score += 25
  else valid = false

  // Update reactive values
  passwordStrength.value = score
  isPasswordValid.value = valid

  // Set strength level and text
  if (score < 25) {
    passwordStrengthLevel.value = 'very-weak'
    passwordStrengthText.value = 'Very weak'
  } else if (score < 50) {
    passwordStrengthLevel.value = 'weak'
    passwordStrengthText.value = 'Weak'
  } else if (score < 75) {
    passwordStrengthLevel.value = 'fair'
    passwordStrengthText.value = 'Fair'
  } else if (score < 100) {
    passwordStrengthLevel.value = 'good'
    passwordStrengthText.value = 'Good'
  } else {
    passwordStrengthLevel.value = 'strong'
    passwordStrengthText.value = 'Strong'
  }
}

// Role options for custom dropdown
const roleOptions = [
  { value: 'applicant', label: 'Program Applicant', icon: 'mdi:account-graduate' },
  { value: 'staff', label: 'Staff Member', icon: 'mdi:account-tie' },
  { value: 'alumni', label: 'Alumni', icon: 'mdi:account-star' }
]

const getRoleDisplayText = (roleValue: string) => {
  if (!roleValue) return 'Select your role'
  const option = roleOptions.find(opt => opt.value === roleValue)
  return option ? option.label : 'Select your role'
}

const toggleRoleMenu = () => {
  if (!loading.value) {
    showRoleMenu.value = !showRoleMenu.value
  }
}

const selectRole = (selectedRole: string) => {
  role.value = selectedRole
  showRoleMenu.value = false
  clearFieldError('role')
}

const clearFieldError = (field: string) => {
  if (showValidation.value) {
    // Check if all required fields are now filled
    const allFieldsValid = displayName.value.trim() && email.value.trim() && role.value && agreeToTerms.value
    if (allFieldsValid) {
      showValidation.value = false
    }
  }
}

// Keyboard navigation and accessibility helpers
const handleKeyDown = (event: KeyboardEvent) => {
  // Close modals with Escape key
  if (event.key === 'Escape') {
    if (error.value) {
      error.value = ''
    } else if (showGoogleModal.value) {
      showGoogleModal.value = false
    } else if (showRoleMenu.value) {
      showRoleMenu.value = false
    }
  }
}

// Add event listeners for keyboard navigation and click outside
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.custom-dropdown')) {
    showRoleMenu.value = false
  }
}

const validateGooglePassword = () => {
  const pwd = googlePassword.value
  let score = 0
  let valid = true

  // Length check (8+ characters)
  if (pwd.length >= 8) score += 25
  else valid = false

  // Uppercase letter check
  if (/[A-Z]/.test(pwd)) score += 25
  else valid = false

  // Lowercase letter check
  if (/[a-z]/.test(pwd)) score += 25
  else valid = false

  // Number check
  if (/\d/.test(pwd)) score += 25
  else valid = false

  // Update reactive values
  googlePasswordStrength.value = score
  isGooglePasswordValid.value = valid

  // Set strength level and text
  if (score < 25) {
    googlePasswordStrengthLevel.value = 'very-weak'
    googlePasswordStrengthText.value = 'Very weak'
  } else if (score < 50) {
    googlePasswordStrengthLevel.value = 'weak'
    googlePasswordStrengthText.value = 'Weak'
  } else if (score < 75) {
    googlePasswordStrengthLevel.value = 'fair'
    googlePasswordStrengthText.value = 'Fair'
  } else if (score < 100) {
    googlePasswordStrengthLevel.value = 'good'
    googlePasswordStrengthText.value = 'Good'
  } else {
    googlePasswordStrengthLevel.value = 'strong'
    googlePasswordStrengthText.value = 'Strong'
  }
}

const showGoogleModal = ref(false)
const googlePassword = ref('')
const googleRole = ref('')
const googleAgreeToTerms = ref(false)
const showGooglePassword = ref(false)
const googlePasswordStrength = ref(0)
const googlePasswordStrengthLevel = ref('weak')
const googlePasswordStrengthText = ref('')
const isGooglePasswordValid = ref(false)

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
  if (!googlePassword.value || !googleRole.value || !googleAgreeToTerms.value) {
    error.value = 'Please fill in all required fields.'
    return
  }
  
  if (!isGooglePasswordValid.value) {
    error.value = 'Please create a valid password that meets all requirements.'
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
    googleRole.value = ''
    googleAgreeToTerms.value = false
    showGooglePassword.value = false
    isGooglePasswordValid.value = false
    
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
/* Iconify Icon Styling */
iconify-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}

.signup-form {
  max-width: 700px;
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
  width: 100%;
  box-sizing: border-box;
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

/* Custom Dropdown Styles */
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  box-sizing: border-box;
}

.dropdown-trigger:hover:not(:disabled) {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
  background: white;
}

.dropdown-trigger:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
  background: white;
}

.dropdown-trigger:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.selected-role {
  color: #374151;
  font-weight: 500;
}

.dropdown-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  animation: dropdownSlideIn 0.2s ease-out;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-option {
  padding: 0.875rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-option:last-child {
  border-bottom: none;
}

.dropdown-option:hover {
  background: #f8fafc;
}

.dropdown-option.selected {
  background: #eff6ff;
  color: #1d4ed8;
}

.option-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  flex-shrink: 0;
}

.dropdown-option.selected .option-icon {
  color: #1d4ed8;
}

.option-text {
  flex: 1;
  font-weight: 500;
}

.check-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #10b981;
  flex-shrink: 0;
}

.custom-dropdown.error .dropdown-trigger {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  animation: shake 0.5s ease-in-out;
}

.custom-dropdown.open .dropdown-trigger {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  border-radius: 12px 12px 0 0;
}

.custom-dropdown.open .dropdown-menu {
  border-color: #667eea;
}

input.error, select.error {
  border-color: #ef4444;
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
  color: #ef4444;
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
  fill: #ef4444;
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

.password-toggle:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.05);
}

.password-toggle .icon {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}

.password-requirements {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  transition: all 0.2s ease;
}

.requirement .icon {
  width: 1rem;
  height: 1rem;
  fill: #ef4444;
  flex-shrink: 0;
}

.requirement.met {
  color: #10b981;
}

.requirement.met .icon {
  fill: #10b981;
}

.password-strength {
  margin-top: 0.75rem;
}

.strength-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 2px;
}

.strength-very-weak {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.strength-weak {
  background: linear-gradient(90deg, #f97316, #ea580c);
}

.strength-fair {
  background: linear-gradient(90deg, #eab308, #ca8a04);
}

.strength-good {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.strength-strong {
  background: linear-gradient(90deg, #10b981, #059669);
}

.strength-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.checkbox-group {
  flex-direction: row;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: nowrap;
  flex-wrap: nowrap;
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
  background: #e5e7eb;
} */

.divider span {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 1rem;
  color: #6b7280;
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
  background: rgba(255, 255, 255, 0.95);
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
  padding: 0;
  border-radius: 20px;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.error-header {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid rgba(220, 38, 38, 0.1);
}

.error-modal-icon {
  width: 3rem;
  height: 3rem;
  fill: #dc2626;
  margin: 0 auto 1rem;
  display: block;
}

.error-content h3 {
  color: #dc2626;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-description {
  padding: 2rem;
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 1rem;
}

.error-actions {
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid #f3f4f6;
}

.error-actions .btn-secondary {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-actions .btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  max-width: 700px;
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

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .signup-form {
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

  input, select {
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
}

@media (max-width: 480px) {
  .signup-form {
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

  input, select {
    padding: 0.75rem;
    font-size: 0.95rem;
  }

  .btn-primary {
    padding: 0.75rem;
    font-size: 0.95rem;
  }

  .checkbox-label {
    font-size: 0.85rem;
  }

  .password-requirements {
    gap: 0.25rem;
  }

  .requirement {
    font-size: 0.8rem;
  }

  .error-modal,
  .google-modal {
    margin: 1rem;
  }

  .error-content,
  .google-modal-content {
    max-width: none;
    width: calc(100vw - 2rem);
  }
}

/* Touch-friendly interactions */
@media (hover: none) and (pointer: coarse) {
  .btn-primary:hover:not(:disabled),
  .btn-social:hover:not(:disabled),
  .btn-secondary:hover {
    transform: none;
  }

  .btn-primary:active:not(:disabled),
  .btn-social:active:not(:disabled),
  .btn-secondary:active {
    transform: scale(0.98);
  }

  input:focus,
  select:focus {
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

  input, select {
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

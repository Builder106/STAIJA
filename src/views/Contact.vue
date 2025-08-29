<template>
  <section class="contact">
    <div class="contact-container">
      <header class="header">
        <h1 class="title">Get in Touch</h1>
        <p class="subtitle">Have questions about our programs? Want to collaborate? We'd love to hear from you.</p>
        <div class="contact-info">
          <div class="info-item">
            <span class="icon">📧</span>
            <a href="mailto:hello@staija.org" class="link">hello@staija.org</a>
          </div>
          <div class="info-item">
            <span class="icon">📍</span>
            <span>Lagos, Nigeria</span>
          </div>
        </div>
      </header>

      <form class="form" novalidate @submit.prevent="onSubmit" aria-describedby="form-help">
        <div class="form-grid">
          <div class="field">
            <label for="name">Full name</label>
            <input
              id="name"
              v-model.trim="form.name"
              type="text"
              :class="{ error: errors.name }"
              :aria-invalid="Boolean(errors.name)"
              :aria-describedby="errors.name ? 'name-error' : undefined"
              required
              autocomplete="name"
              placeholder="Your full name"
            />
            <p v-if="errors.name" id="name-error" class="error-message">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label for="email">Email address</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              :class="{ error: errors.email }"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'email-error' : undefined"
              required
              autocomplete="email"
              placeholder="you@example.com"
            />
            <p v-if="errors.email" id="email-error" class="error-message">{{ errors.email }}</p>
          </div>
        </div>

        <div class="field">
          <label for="subject">Subject</label>
          <input
            id="subject"
            v-model.trim="form.subject"
            type="text"
            :class="{ error: errors.subject }"
            :aria-invalid="Boolean(errors.subject)"
            :aria-describedby="errors.subject ? 'subject-error' : undefined"
            required
            placeholder="How can we help?"
          />
          <p v-if="errors.subject" id="subject-error" class="error-message">{{ errors.subject }}</p>
        </div>

        <div class="field">
          <label for="message">Message</label>
          <textarea
            id="message"
            v-model.trim="form.message"
            rows="6"
            :class="{ error: errors.message }"
            :aria-invalid="Boolean(errors.message)"
            :aria-describedby="errors.message ? 'message-error' : undefined"
            required
            placeholder="Tell us more about your inquiry..."
          ></textarea>
          <p v-if="errors.message" id="message-error" class="error-message">{{ errors.message }}</p>
        </div>

        <p id="form-help" class="help-text">All fields are required. We'll get back to you within 24 hours.</p>

        <div class="actions">
          <button class="btn" type="submit" :disabled="submitting">
            <span v-if="submitting" class="spinner" aria-hidden="true"></span>
            {{ submitting ? 'Sending…' : 'Send message' }}
          </button>
          <p v-if="success" class="success" role="status">
            <span class="success-icon">✓</span>
            Message sent successfully! We'll get back to you within 24 hours.
          </p>
          <p v-if="submitError" class="error" role="alert">{{ submitError }}</p>
        </div>
      </form>
    </div>
  </section>
  
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const errors = reactive<{ name?: string; email?: string; subject?: string; message?: string }>({})
const submitting = ref(false)
const success = ref(false)
const submitError = ref('')

const validate = () => {
  errors.name = form.name ? '' : 'Please enter your name.'
  const emailOk = /.+@.+\..+/.test(form.email)
  errors.email = emailOk ? '' : 'Please enter a valid email.'
  errors.subject = form.subject ? '' : 'Please add a subject.'
  errors.message = form.message && form.message.length >= 10 ? '' : 'Message must be at least 10 characters.'
  return !errors.name && !errors.email && !errors.subject && !errors.message
}

const onSubmit = async () => {
  if (!validate()) return
  
  submitting.value = true
  success.value = false
  submitError.value = ''

  try {
    // Store message in Firestore
    await addDoc(collection(db, 'contact_messages'), {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      timestamp: serverTimestamp(),
      status: 'new'
    })

    // Clear form and show success
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    success.value = true
    
    // Reset success message after 5 seconds
    setTimeout(() => {
      success.value = false
    }, 5000)
    
  } catch (error: any) {
    console.error('Error submitting form:', error)
    submitError.value = 'Failed to send message. Please try again or email us directly at hello@staija.org'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.contact { 
  min-height: 100vh; 
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem 1rem;
}

.contact-container { 
  max-width: 800px; 
  margin: 0 auto; 
  display: grid; 
  gap: 3rem; 
  align-items: start;
}

.header { 
  text-align: center; 
  margin-bottom: 2rem; 
}

.title { 
  font-size: 2.5rem; 
  font-weight: 700; 
  margin: 0 0 1rem; 
  background: linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle { 
  font-size: 1.125rem; 
  color: var(--color-text-secondary); 
  margin: 0 0 2rem; 
  line-height: 1.6;
}

.contact-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.icon {
  font-size: 1.25rem;
}

.link { 
  color: var(--color-primary); 
  text-decoration: none; 
  font-weight: 500;
  transition: color 0.2s;
}
.link:hover { 
  color: #4f46e5; 
  text-decoration: underline; 
}

.form { 
  background: white; 
  border-radius: 16px; 
  padding: 2.5rem; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.field { 
  display: grid; 
  gap: 0.5rem; 
}

label { 
  font-weight: 600; 
  color: var(--color-text); 
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

input, textarea { 
  border: 2px solid var(--color-border); 
  border-radius: 12px; 
  padding: 0.875rem 1rem; 
  font-size: 1rem; 
  transition: all 0.2s;
  background: #fafafa;
}

input:focus, textarea:focus { 
  outline: none; 
  border-color: var(--color-primary); 
  box-shadow: 0 0 0 4px rgba(76, 110, 245, 0.1); 
  background: white;
  transform: translateY(-1px);
}

input.error, textarea.error { 
  border-color: #dc2626; 
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); 
}

.error-message { 
  color: #dc2626; 
  font-size: 0.875rem; 
  font-weight: 500;
}

.help-text { 
  color: var(--color-text-secondary); 
  font-size: 0.875rem; 
  margin: 0 0 1.5rem; 
  text-align: center;
}

.actions { 
  display: flex; 
  flex-direction: column;
  align-items: center; 
  gap: 1rem; 
}

.btn { 
  background: linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%);
  color: white; 
  border: none; 
  border-radius: 12px; 
  padding: 1rem 2rem; 
  font-weight: 600; 
  font-size: 1rem;
  cursor: pointer; 
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

.btn:disabled { 
  opacity: 0.7; 
  cursor: not-allowed; 
  transform: none;
}

.spinner { 
  width: 18px; 
  height: 18px; 
  border: 2px solid rgba(255,255,255,0.3); 
  border-top-color: white; 
  border-radius: 50%; 
  display: inline-block; 
  margin-right: 8px; 
  animation: spin 1s linear infinite; 
}

.success { 
  color: #059669; 
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-icon {
  background: #10b981;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.error {
  color: #dc2626;
  font-weight: 500;
  text-align: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background-color: #fef3f2;
  border: 1px solid #fca5a5;
}

@keyframes spin { 
  to { transform: rotate(360deg); } 
}

@media (max-width: 768px) {
  .contact-container { gap: 2rem; }
  .title { font-size: 2rem; }
  .form { padding: 1.5rem; }
  .form-grid { grid-template-columns: 1fr; }
  .contact-info { gap: 1rem; }
  .info-item { padding: 0.5rem 0.75rem; }
}

@media (max-width: 480px) {
  .contact { padding: 1rem 0.5rem; }
  .form { padding: 1rem; }
  .title { font-size: 1.75rem; }
}
</style>
<template>
  <div class="donate">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-text">💝 Support Our Mission</span>
          </div>
          <h1 class="hero-title">Fuel Research & Opportunity</h1>
          <p class="hero-subtitle">
            Your donation directly supports mentorship programs, research equipment, student stipends, and 
            the development of Africa's next generation of scientist-leaders.
          </p>
          <div class="hero-stats">
            <div class="stat">
              <div class="stat-number">₦5,000</div>
              <div class="stat-label">Workshop Access</div>
            </div>
            <div class="stat">
              <div class="stat-number">₦25,000</div>
              <div class="stat-label">Research Stipend</div>
            </div>
            <div class="stat">
              <div class="stat-number">₦100,000</div>
              <div class="stat-label">Full Program Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Impact Section -->
    <section class="impact-section">
      <div class="container">
        <div class="impact-content">
          <div class="impact-text">
            <h2 class="section-title">Your Impact</h2>
            <p class="impact-description">
              Every donation makes a real difference in the lives of young scientists and researchers across Africa. 
              Here's how your contribution creates lasting change:
            </p>
            <div class="impact-breakdown">
              <div class="impact-item">
                <div class="impact-icon">🎓</div>
                <div class="impact-content">
                  <h3 class="impact-title">Student Scholarships</h3>
                  <p class="impact-text">Fund full program participation for talented students who otherwise couldn't afford it</p>
                </div>
              </div>
              <div class="impact-item">
                <div class="impact-icon">🔬</div>
                <div class="impact-content">
                  <h3 class="impact-title">Research Equipment</h3>
                  <p class="impact-text">Provide essential tools and technology for hands-on research projects</p>
                </div>
              </div>
              <div class="impact-item">
                <div class="impact-icon">🤝</div>
                <div class="impact-content">
                  <h3 class="impact-title">Mentorship Programs</h3>
                  <p class="impact-text">Connect students with experienced researchers and industry professionals</p>
                </div>
              </div>
              <div class="impact-item">
                <div class="impact-icon">🌍</div>
                <div class="impact-content">
                  <h3 class="impact-title">Community Building</h3>
                  <p class="impact-text">Create networks and opportunities for collaboration across Africa</p>
                </div>
              </div>
            </div>
          </div>
          <div class="impact-visual">
            <div class="impact-card">
              <h3 class="card-title">Recent Impact</h3>
              <div class="impact-stats">
                <div class="impact-stat">
                  <div class="stat-number">500+</div>
                  <div class="stat-label">Students Supported</div>
                </div>
                <div class="impact-stat">
                  <div class="stat-number">50+</div>
                  <div class="stat-label">Research Projects Funded</div>
                </div>
                <div class="impact-stat">
                  <div class="stat-number">₦10M+</div>
                  <div class="stat-label">Total Impact Generated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Donation Options -->
    <section class="donation-section">
      <div class="container">
        <div class="donation-content">
          <h2 class="section-title">Choose Your Impact</h2>
          <p class="donation-description">
            Select a donation amount that matches your desired impact, or choose a custom amount. 
            Every contribution, no matter the size, makes a difference.
          </p>
          
          <div class="donation-tiers">
            <div class="tier-card" :class="{ 'tier-card--selected': selectedTier === 'starter' }" @click="selectTier('starter')">
              <div class="tier-header">
                <div class="tier-amount">₦2,500</div>
                <div class="tier-badge">Starter</div>
              </div>
              <h3 class="tier-title">Research Materials</h3>
              <p class="tier-description">Provides essential research materials and supplies for one student</p>
              <ul class="tier-benefits">
                <li>Lab supplies and equipment</li>
                <li>Research methodology guide</li>
                <li>Digital learning resources</li>
                <li>Certificate of support</li>
              </ul>
            </div>
            
            <div class="tier-card" :class="{ 'tier-card--selected': selectedTier === 'workshop' }" @click="selectTier('workshop')">
              <div class="tier-header">
                <div class="tier-amount">₦5,000</div>
                <div class="tier-badge">Popular</div>
              </div>
              <h3 class="tier-title">Workshop Access</h3>
              <p class="tier-description">Provides one student with access to research workshops and training sessions</p>
              <ul class="tier-benefits">
                <li>Research methodology training</li>
                <li>Skill development workshops</li>
                <li>Peer networking opportunities</li>
                <li>Certificate of participation</li>
              </ul>
            </div>
            
            <div class="tier-card" :class="{ 'tier-card--selected': selectedTier === 'stipend' }" @click="selectTier('stipend')">
              <div class="tier-header">
                <div class="tier-amount">₦25,000</div>
                <div class="tier-badge">High Impact</div>
              </div>
              <h3 class="tier-title">Research Stipend</h3>
              <p class="tier-description">Funds a student's research project with stipend and equipment support</p>
              <ul class="tier-benefits">
                <li>Monthly research stipend</li>
                <li>Equipment and materials</li>
                <li>Mentor guidance</li>
                <li>Publication opportunities</li>
              </ul>
            </div>
            
            <div class="tier-card" :class="{ 'tier-card--selected': selectedTier === 'program' }" @click="selectTier('program')">
              <div class="tier-header">
                <div class="tier-amount">₦100,000</div>
                <div class="tier-badge">Transformative</div>
              </div>
              <h3 class="tier-title">Full Program Support</h3>
              <p class="tier-description">Comprehensive support for a student's entire research journey</p>
              <ul class="tier-benefits">
                <li>Full program participation</li>
                <li>International conference attendance</li>
                <li>Research publication support</li>
                <li>Career development guidance</li>
              </ul>
            </div>
            
            <div class="tier-card" :class="{ 'tier-card--selected': selectedTier === 'custom' }" @click="selectTier('custom')">
              <div class="tier-header">
                <div class="tier-amount">Custom</div>
                <div class="tier-badge">Flexible</div>
              </div>
              <h3 class="tier-title">Custom Amount</h3>
              <p class="tier-description">Choose any amount that works for you and your desired impact</p>
              <div class="custom-amount-input">
                <label for="customAmount" class="form-label">Amount (₦)</label>
                <input 
                  id="customAmount"
                  v-model="customAmount"
                  type="number"
                  min="1000"
                  step="1000"
                  class="form-input"
                  placeholder="Enter amount"
                  @input="handleCustomAmount"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Donation Form -->
    <section class="form-section">
      <div class="container">
        <div class="form-content">
          <h2 class="section-title">Complete Your Donation</h2>
          
          <form class="donation-form" @submit.prevent="handleDonationSubmit">
            <div class="form-grid">
              <!-- Personal Information -->
              <div class="form-section-group">
                <h3 class="form-section-title">Personal Information</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName" class="form-label">First Name *</label>
                    <input 
                      id="firstName"
                      v-model="form.firstName"
                      type="text" 
                      class="form-input" 
                      required
                    />
                  </div>
                  <div class="form-group">
                    <label for="lastName" class="form-label">Last Name *</label>
                    <input 
                      id="lastName"
                      v-model="form.lastName"
                      type="text" 
                      class="form-input" 
                      required
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label for="email" class="form-label">Email Address *</label>
                  <input 
                    id="email"
                    v-model="form.email"
                    type="email" 
                    class="form-input" 
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="phone" class="form-label">Phone Number</label>
                  <input 
                    id="phone"
                    v-model="form.phone"
                    type="tel" 
                    class="form-input"
                  />
                </div>
              </div>

              <!-- Donation Details -->
              <div class="form-section-group">
                <h3 class="form-section-title">Donation Details</h3>
                <div class="donation-summary">
                  <div class="summary-item">
                    <span class="summary-label">Selected Amount:</span>
                    <span class="summary-value">₦{{ formatAmount(selectedAmount) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Frequency:</span>
                    <select v-model="form.frequency" class="form-select">
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="message" class="form-label">Message (Optional)</label>
                  <textarea 
                    id="message"
                    v-model="form.message"
                    class="form-textarea" 
                    rows="3"
                    placeholder="Share why you're supporting STAIJA or leave a message for our students..."
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="form.anonymous"
                      class="checkbox-input"
                    />
                    Make this donation anonymous
                  </label>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <div class="payment-options">
                <button 
                  type="button" 
                  class="btn btn-primary btn-lg payment-btn" 
                  :disabled="isSubmitting || !canProceed"
                  @click="initializePaystack"
                >
                  <span v-if="isSubmitting">Processing...</span>
                  <span v-else>
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Donate ₦{{ formatAmount(selectedAmount) }} via Paystack
                  </span>
                </button>
                
                <div class="payment-alternatives">
                  <p class="payment-note">Other payment methods:</p>
                  <div class="payment-methods">
                    <button type="button" class="payment-method-btn" @click="showBankDetails = true">
                      <span>🏦</span>
                      Bank Transfer
                    </button>
                    <button type="button" class="payment-method-btn" @click="showMobileMoney = true">
                      <span>📱</span>
                      Mobile Money
                    </button>
                  </div>
                </div>
              </div>
              
              <p class="form-note">
                Your donation is secure and tax-deductible. You'll receive a receipt via email.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <h2 class="section-title">Frequently Asked Questions</h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h3 class="faq-question">Is my donation tax-deductible?</h3>
            <p class="faq-answer">
              Yes, donations to STAIJA are tax-deductible in Nigeria. You'll receive a receipt for your records.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">How will my donation be used?</h3>
            <p class="faq-answer">
              Your donation directly supports student programs, research equipment, mentorship initiatives, and 
              community building activities. We provide regular updates on how funds are utilized.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">Can I make a recurring donation?</h3>
            <p class="faq-answer">
              Yes, you can set up monthly, quarterly, or annual recurring donations to provide sustained support 
              for our programs.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">What payment methods do you accept?</h3>
            <p class="faq-answer">
              We accept credit/debit cards, bank transfers, and mobile money payments through Paystack. 
              All transactions are secure and encrypted.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">Can I donate anonymously?</h3>
            <p class="faq-answer">
              Yes, you can choose to make your donation anonymous. Your information will be kept private.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">How can I get a receipt?</h3>
            <p class="faq-answer">
              You'll automatically receive a receipt via email after your donation is processed. 
              You can also request additional copies by contacting us.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Make a Difference?</h2>
          <p class="cta-description">
            Join our community of supporters who are investing in Africa's future through science and innovation. 
            Every donation, no matter the size, creates lasting impact.
          </p>
          <div class="cta-actions">
            <a href="#donate" class="btn btn-primary btn-lg">Donate Now</a>
            <RouterLink to="/contact" class="btn btn-outline btn-lg">Contact Us</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Bank Transfer Modal -->
    <div v-if="showBankDetails" class="modal-overlay" @click="showBankDetails = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Bank Transfer Details</h3>
          <button class="modal-close" @click="showBankDetails = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="bank-details">
            <div class="bank-item">
              <span class="bank-label">Bank Name:</span>
              <span class="bank-value">First Bank of Nigeria</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">Account Name:</span>
              <span class="bank-value">STAIJA Foundation</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">Account Number:</span>
              <span class="bank-value">1234567890</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">Amount:</span>
              <span class="bank-value">₦{{ formatAmount(selectedAmount) }}</span>
            </div>
          </div>
          <p class="bank-note">
            Please include your name as reference when making the transfer. 
            You'll receive a confirmation email once the payment is verified.
          </p>
        </div>
      </div>
    </div>

    <!-- Mobile Money Modal -->
    <div v-if="showMobileMoney" class="modal-overlay" @click="showMobileMoney = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Mobile Money Payment</h3>
          <button class="modal-close" @click="showMobileMoney = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="mobile-note">
            Mobile money payments are processed through our secure payment partners. 
            Please contact us directly for mobile money payment instructions.
          </p>
          <div class="contact-info">
            <p><strong>Email:</strong> donations@staija.org</p>
            <p><strong>Phone:</strong> +234 123 456 7890</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmation" class="modal-overlay">
      <div class="modal-content confirmation-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Thank You for Your Donation! 🎉</h3>
        </div>
        <div class="modal-body">
          <div class="confirmation-content">
            <div class="confirmation-icon">✅</div>
            <h4 class="confirmation-amount">₦{{ formatAmount(selectedAmount) }}</h4>
            <p class="confirmation-message">
              Your donation has been processed successfully. You will receive a receipt via email within 24 hours.
            </p>
            <div class="confirmation-actions">
              <button class="btn btn-primary" @click="showConfirmation = false">Close</button>
              <a href="/" class="btn btn-outline">Return to Home</a>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const isSubmitting = ref(false)
const selectedTier = ref('workshop')
const customAmount = ref('')
const paystackLoaded = ref(false)
const showBankDetails = ref(false)
const showMobileMoney = ref(false)
const showConfirmation = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  frequency: 'one-time',
  message: '',
  anonymous: false
})

const tierAmounts = {
  starter: 2500,
  workshop: 5000,
  stipend: 25000,
  program: 100000,
  custom: 0
}

const selectedAmount = computed(() => {
  if (selectedTier.value === 'custom') {
    return parseInt(customAmount.value) || 0
  }
  return tierAmounts[selectedTier.value as keyof typeof tierAmounts]
})

const canProceed = computed(() => {
  return form.firstName && form.lastName && form.email && selectedAmount.value > 0
})

const selectTier = (tier: string) => {
  selectedTier.value = tier
  if (tier !== 'custom') {
    customAmount.value = ''
  }
}

const handleCustomAmount = () => {
  if (customAmount.value) {
    selectedTier.value = 'custom'
  }
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-NG')
}

const generateReference = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `STAIJA_${timestamp}_${random}`.toUpperCase()
}

const initializePaystack = async () => {
  if (!canProceed.value) {
    alert('Please fill in all required fields and select a donation amount.')
    return
  }

  isSubmitting.value = true

  try {
    // Check if Paystack is loaded
    if (typeof (window as any).PaystackPop === 'undefined') {
      throw new Error('Paystack is not loaded. Please check your internet connection and try again.')
    }

    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: selectedAmount.value * 100, // Convert to kobo
      currency: 'NGN',
      ref: generateReference(),
      callback: (response: any) => {
        handlePaymentSuccess(response)
      },
      onClose: () => {
        handlePaymentClose()
      },
      metadata: {
        donor_name: `${form.firstName} ${form.lastName}`,
        donor_email: form.email,
        donor_phone: form.phone,
        donation_tier: selectedTier.value,
        donation_frequency: form.frequency,
        anonymous: form.anonymous,
        message: form.message,
        custom_fields: {
          donor_name: `${form.firstName} ${form.lastName}`,
          donor_email: form.email,
          donation_purpose: 'STAIJA Research and Education Programs'
        }
      }
    })

    handler.openIframe()
  } catch (error) {
    console.error('Error initializing Paystack:', error)
    alert('There was an error initializing the payment. Please try again.')
    isSubmitting.value = false
  }
}

const handlePaymentSuccess = async (response: any) => {
  console.log('Payment successful:', response)
  
  try {
    // Here you would typically send the payment verification to your backend
    // For now, we'll simulate a successful donation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Show confirmation modal
    showConfirmation.value = true
    
    // Reset form
    Object.assign(form, {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      frequency: 'one-time',
      message: '',
      anonymous: false
    })
    selectedTier.value = 'workshop'
    customAmount.value = ''
    
  } catch (error) {
    console.error('Error processing payment success:', error)
    alert('Payment was successful, but there was an error processing your donation details. Please contact us.')
  } finally {
    isSubmitting.value = false
  }
}

const handlePaymentClose = () => {
  console.log('Payment window closed')
  isSubmitting.value = false
}

const handleDonationSubmit = async () => {
  // This is now handled by the Paystack integration
  initializePaystack()
}

onMounted(() => {
  // Load Paystack script dynamically
  const loadPaystackScript = () => {
    if (typeof (window as any).PaystackPop === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.onload = () => {
        paystackLoaded.value = true
      }
      script.onerror = () => {
        console.error('Failed to load Paystack script')
      }
      document.head.appendChild(script)
    } else {
      paystackLoaded.value = true
    }
  }
  
  loadPaystackScript()
})
</script>

<style scoped>
.donate {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  padding: var(--space-20) 0 var(--space-16);
  background: linear-gradient(135deg, var(--accent-500) 0%, var(--primary-600) 100%);
  text-align: center;
  color: white;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
}

.badge-text {
  font-size: var(--text-sm);
  font-weight: 600;
  color: white;
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  margin-bottom: var(--space-6);
  color: white;
}

.hero-subtitle {
  font-size: var(--text-xl);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin: 0 auto var(--space-8);
  color: rgba(255, 255, 255, 0.9);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  max-width: 600px;
  margin: 0 auto;
}

.stat {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
}

.stat-number {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Impact Section */
.impact-section {
  padding: var(--space-20) 0;
  background: white;
}

.impact-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: start;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.impact-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.impact-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.impact-item {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.impact-icon {
  font-size: var(--text-2xl);
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-100);
  border-radius: var(--radius-xl);
  flex-shrink: 0;
}

.impact-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.impact-text {
  color: var(--neutral-600);
  margin: 0;
}

.impact-visual {
  display: flex;
  justify-content: center;
}

.impact-card {
  background: var(--neutral-50);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--neutral-200);
  max-width: 400px;
  width: 100%;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
  text-align: center;
}

.impact-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.impact-stat {
  text-align: center;
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* Donation Section */
.donation-section {
  padding: var(--space-20) 0;
  background: var(--neutral-50);
}

.donation-content {
  text-align: center;
  margin-bottom: var(--space-12);
}

.donation-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin: 0 auto var(--space-8);
}

.donation-tiers {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  max-width: 1000px;
  margin: 0 auto;
}

.tier-card {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
}

.tier-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.tier-card--selected {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-lg);
  background: var(--primary-50);
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.tier-amount {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--primary-600);
}

.tier-badge {
  padding: var(--space-1) var(--space-3);
  background: var(--primary-500);
  color: white;
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tier-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-2);
}

.tier-description {
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.tier-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tier-benefits li {
  padding: var(--space-1) 0;
  color: var(--neutral-700);
  position: relative;
  padding-left: var(--space-6);
}

.tier-benefits li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary-600);
  font-weight: bold;
}

.custom-amount-input {
  margin-top: var(--space-4);
}

/* Form Section */
.form-section {
  padding: var(--space-20) 0;
  background: white;
}

.form-content {
  text-align: center;
  margin-bottom: var(--space-12);
}

.donation-form {
  background: var(--neutral-50);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  max-width: 800px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  gap: var(--space-8);
}

.form-section-group {
  border-bottom: 1px solid var(--neutral-200);
  padding-bottom: var(--space-8);
}

.form-section-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.form-section-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
  text-align: left;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: var(--space-2);
  text-align: left;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  font-weight: 500;
  color: var(--neutral-700);
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--primary-600);
}

.donation-summary {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-6);
  border: 1px solid var(--neutral-200);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-label {
  font-weight: 600;
  color: var(--neutral-700);
}

.summary-value {
  font-weight: 700;
  color: var(--primary-600);
  font-size: var(--text-lg);
}

.form-actions {
  text-align: center;
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--neutral-200);
}

.payment-options {
  margin-bottom: var(--space-6);
}

.payment-btn {
  margin-bottom: var(--space-6);
}

.payment-alternatives {
  border-top: 1px solid var(--neutral-200);
  padding-top: var(--space-6);
}

.payment-note {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin-bottom: var(--space-4);
}

.payment-methods {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.payment-method-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--neutral-100);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--neutral-700);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.payment-method-btn:hover {
  background: var(--neutral-200);
  border-color: var(--neutral-400);
}

.form-note {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin-top: var(--space-4);
}

/* Modal Styles */
.modal-overlay {
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
  padding: var(--space-4);
}

.modal-content {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6);
  border-bottom: 1px solid var(--neutral-200);
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--neutral-900);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  color: var(--neutral-500);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.modal-body {
  padding: var(--space-6);
}

.bank-details {
  background: var(--neutral-50);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-6);
}

.bank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--neutral-200);
}

.bank-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.bank-label {
  font-weight: 600;
  color: var(--neutral-700);
}

.bank-value {
  font-weight: 700;
  color: var(--primary-600);
}

.bank-note {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin: 0;
}

.mobile-note {
  font-size: var(--text-lg);
  color: var(--neutral-700);
  margin-bottom: var(--space-6);
}

.contact-info {
  background: var(--neutral-50);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.contact-info p {
  margin: var(--space-2) 0;
  color: var(--neutral-700);
}

.confirmation-modal {
  text-align: center;
}

.confirmation-content {
  padding: var(--space-4) 0;
}

.confirmation-icon {
  font-size: var(--text-4xl);
  margin-bottom: var(--space-4);
}

.confirmation-amount {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--primary-600);
  margin-bottom: var(--space-4);
}

.confirmation-message {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  margin-bottom: var(--space-6);
}

.confirmation-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

/* FAQ Section */
.faq-section {
  padding: var(--space-20) 0;
  background: var(--neutral-50);
}

.faq-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--neutral-200);
}

.faq-question {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-3);
}

.faq-answer {
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* CTA Section */
.cta-section {
  padding: var(--space-20) 0;
  background: linear-gradient(135deg, var(--primary-600), var(--accent-500));
  color: white;
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: var(--space-6);
  color: white;
}

.cta-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
  color: rgba(255, 255, 255, 0.9);
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

/* Responsive Design */
@media (min-width: 640px) {
  .hero-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .cta-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (min-width: 768px) {
  .hero-title {
    font-size: var(--text-5xl);
  }
  
  .section-title {
    font-size: var(--text-4xl);
  }
  
  .cta-title {
    font-size: var(--text-4xl);
  }
}

@media (min-width: 1024px) {
  .impact-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .donation-tiers {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-title {
    font-size: var(--text-6xl);
  }
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.mr-2 {
  margin-right: var(--space-2);
}
</style>



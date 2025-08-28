<template>
  <div class="stepup">
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-text">🔬 Nigeria's Premier Research Program</span>
          </div>
          <h1 class="hero-title">StepUp Scholars</h1>
          <p class="hero-subtitle">
            Hands-on research training, mentorship and a supportive cohort community for high school and gap year students in Nigeria.
          </p>
          <div class="hero-actions">
            <a href="#apply" class="btn btn-primary btn-lg">
              Apply Now
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a href="#learn-more" class="btn btn-outline btn-lg">Learn More</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Program Overview -->
    <section id="learn-more" class="overview-section">
      <div class="container">
        <div class="overview-content">
          <div class="overview-text">
            <h2 class="section-title">Program Overview</h2>
            <p class="overview-description">
              StepUp Scholars is Nigeria's premier research program designed to provide high school and gap year students 
              with hands-on research experience, mentorship from leading scientists, and the skills needed to excel in 
              scientific careers.
            </p>
            <div class="program-highlights">
              <div class="highlight">
                <div class="highlight-icon">🎯</div>
                <div class="highlight-content">
                  <h3 class="highlight-title">Research Excellence</h3>
                  <p class="highlight-text">Work on real research projects with guidance from experienced mentors</p>
                </div>
              </div>
              <div class="highlight">
                <div class="highlight-icon">🤝</div>
                <div class="highlight-content">
                  <h3 class="highlight-title">Mentorship</h3>
                  <p class="highlight-text">One-on-one guidance from leading scientists and researchers</p>
                </div>
              </div>
              <div class="highlight">
                <div class="highlight-icon">🌍</div>
                <div class="highlight-content">
                  <h3 class="highlight-title">Community</h3>
                  <p class="highlight-text">Join a supportive cohort of like-minded students across Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Eligibility & Timeline -->
    <section class="eligibility-section">
      <div class="container">
        <div class="eligibility-content">
          <h2 class="section-title">Eligibility & Timeline</h2>
          <div class="eligibility-grid">
            <div class="eligibility-card">
              <div class="card-icon">🎓</div>
              <h3 class="card-title">Who Can Apply</h3>
              <ul class="eligibility-list">
                <li>High school students in Nigeria</li>
                <li>Gap year students</li>
                <li>Students with strong academic performance</li>
                <li>Passionate about scientific research</li>
                <li>Available for program duration</li>
              </ul>
            </div>
            <div class="eligibility-card">
              <div class="card-icon">⏰</div>
              <h3 class="card-title">Time Commitment</h3>
              <ul class="eligibility-list">
                <li>~2–4 hours per week</li>
                <li>12-week program duration</li>
                <li>Flexible scheduling options</li>
                <li>Virtual and in-person sessions</li>
                <li>Final project presentation</li>
              </ul>
            </div>
            <div class="eligibility-card">
              <div class="card-icon">📅</div>
              <h3 class="card-title">Application Timeline</h3>
              <ul class="eligibility-list">
                <li><strong>Applications Open:</strong> January 2025</li>
                <li><strong>Application Deadline:</strong> May 1st, 2025</li>
                <li><strong>Interviews:</strong> May 2025</li>
                <li><strong>Program Start:</strong> June 2025</li>
                <li><strong>Program End:</strong> September 2025</li>
    </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Application Process -->
    <section class="application-section">
      <div class="container">
        <div class="application-content">
          <h2 class="section-title">Application Process</h2>
          <div class="process-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3 class="step-title">Online Application</h3>
                <p class="step-description">Complete the online form with personal information and academic background</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3 class="step-title">Optional Essays</h3>
                <p class="step-description">Submit optional essays to showcase your research interests and motivation</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3 class="step-title">Reading Assessment</h3>
                <p class="step-description">Complete required reading passages and comprehension exercises</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3 class="step-title">Interview</h3>
                <p class="step-description">Participate in a virtual interview with program mentors</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">5</div>
              <div class="step-content">
                <h3 class="step-title">Final Selection</h3>
                <p class="step-description">Receive notification of acceptance and program details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Application Form -->
    <section id="apply" class="apply-section">
      <div class="container">
        <div class="apply-content">
          <h2 class="section-title">Apply Now</h2>
          <p class="apply-description">
            Ready to join the next generation of scientist-leaders? Complete your application for the 2025 StepUp Scholars program.
          </p>
          
          <form class="application-form" @submit.prevent="handleApplicationSubmit">
            <!-- Progress Bar -->
            <div class="apply-progress" role="progressbar" :aria-valuenow="currentStep" :aria-valuemin="1" :aria-valuemax="totalSteps">
              <div class="apply-progress__track">
                <div class="apply-progress__bar" :style="{ width: Math.round((currentStep/totalSteps)*100) + '%' }"></div>
              </div>
              <div class="apply-progress__labels">
                <span :class="{ 'is-active': currentStep === 1 }">Details</span>
                <span :class="{ 'is-active': currentStep === 2 }">Interests</span>
                <span :class="{ 'is-active': currentStep === 3 }">Review</span>
              </div>
            </div>

            <div class="form-grid">
              <!-- Personal Information -->
              <div class="form-section" v-if="currentStep === 1">
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
                <div class="form-row">
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
                <div class="form-group">
                  <label for="location" class="form-label">City/State *</label>
                  <input 
                    id="location"
                    v-model="form.location"
                    type="text" 
                    class="form-input" 
                    required
                  />
                </div>
              </div>

              <!-- Academic Information -->
              <div class="form-section" v-if="currentStep === 1">
                <h3 class="form-section-title">Academic Information</h3>
                <div class="form-group">
                  <label for="school" class="form-label">Current School *</label>
                  <input 
                    id="school"
                    v-model="form.school"
                    type="text" 
                    class="form-input" 
                    required
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="grade" class="form-label">Current Grade/Year *</label>
                    <select 
                      id="grade"
                      v-model="form.grade"
                      class="form-select" 
                      required
                    >
                      <option value="">Select Grade</option>
                      <option value="SS1">SS1 (Senior Secondary 1)</option>
                      <option value="SS2">SS2 (Senior Secondary 2)</option>
                      <option value="SS3">SS3 (Senior Secondary 3)</option>
                      <option value="gap-year">Gap Year</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="gpa" class="form-label">GPA (if available)</label>
                    <input 
                      id="gpa"
                      v-model="form.gpa"
                      type="number" 
                      step="0.1"
                      min="0"
                      max="5"
                      class="form-input"
                      placeholder="e.g., 4.0"
                    />
                  </div>
                </div>
              </div>

              <!-- Research Interests -->
              <div class="form-section" v-if="currentStep === 2">
                <h3 class="form-section-title">Research Interests</h3>
                <div class="form-group">
                  <label for="interests" class="form-label">Areas of Interest *</label>
                  <select 
                    id="interests"
                    v-model="form.interests"
                    class="form-select" 
                    required
                  >
                    <option value="">Select Primary Interest</option>
                    <option value="biology">Biology & Life Sciences</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="physics">Physics</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="computer-science">Computer Science</option>
                    <option value="engineering">Engineering</option>
                    <option value="medicine">Medicine & Health Sciences</option>
                    <option value="environmental">Environmental Science</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="motivation" class="form-label">Why do you want to join StepUp Scholars? *</label>
                  <textarea 
                    id="motivation"
                    v-model="form.motivation"
                    class="form-textarea" 
                    rows="4"
                    placeholder="Tell us about your interest in research and what you hope to gain from this program..."
                    required
                  ></textarea>
                </div>
              </div>

              <!-- Additional Information -->
              <div class="form-section" v-if="currentStep === 2">
                <h3 class="form-section-title">Additional Information</h3>
                <div class="form-group">
                  <label for="experience" class="form-label">Previous Research Experience</label>
                  <textarea 
                    id="experience"
                    v-model="form.experience"
                    class="form-textarea" 
                    rows="3"
                    placeholder="Describe any previous research experience, science projects, or relevant activities..."
                  ></textarea>
                </div>
                <div class="form-group">
                  <label for="availability" class="form-label">Availability *</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="form.availability.weekdays"
                        class="checkbox-input"
                      />
                      Weekdays (2-4 hours/week)
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="form.availability.weekends"
                        class="checkbox-input"
                      />
                      Weekends
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="form.availability.virtual"
                        class="checkbox-input"
                      />
                      Virtual sessions
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="form.availability.inperson"
                        class="checkbox-input"
                      />
                      In-person sessions (if available)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Review Step -->
            <div class="review-section" v-if="currentStep === 3">
              <h3 class="form-section-title">Review Your Application</h3>
              <div class="review-grid">
                <div class="review-item"><strong>Name:</strong> {{ form.firstName }} {{ form.lastName }}</div>
                <div class="review-item"><strong>Email:</strong> {{ form.email }}</div>
                <div class="review-item"><strong>Phone:</strong> {{ form.phone || '—' }}</div>
                <div class="review-item"><strong>Location:</strong> {{ form.location }}</div>
                <div class="review-item"><strong>School:</strong> {{ form.school }}</div>
                <div class="review-item"><strong>Grade:</strong> {{ form.grade }}</div>
                <div class="review-item"><strong>GPA:</strong> {{ form.gpa || '—' }}</div>
                <div class="review-item"><strong>Interest:</strong> {{ form.interests }}</div>
                <div class="review-item"><strong>Motivation:</strong> {{ form.motivation }}</div>
                <div class="review-item"><strong>Availability:</strong>
                  <span v-if="form.availability.weekdays">Weekdays</span>
                  <span v-if="form.availability.weekends">, Weekends</span>
                  <span v-if="form.availability.virtual">, Virtual</span>
                  <span v-if="form.availability.inperson">, In-person</span>
                </div>
              </div>
            </div>

            <div class="form-actions form-actions--wizard">
              <button v-if="currentStep > 1" type="button" class="btn btn-outline" @click="prevStep">Back</button>
              <button v-if="currentStep < totalSteps" type="button" class="btn btn-primary" @click="nextStep" :disabled="!canGoNext">
                Next
              </button>
              <button v-if="currentStep === totalSteps" type="submit" class="btn btn-primary btn-lg" :disabled="isSubmitting">
                <span v-if="isSubmitting">Submitting...</span>
                <span v-else>Submit Application</span>
              </button>
              <p class="form-note">
                Applications close on May 1st, 2025. You'll receive a confirmation email within 24 hours.
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
            <h3 class="faq-question">Is the program free to participate?</h3>
            <p class="faq-answer">
              Yes, StepUp Scholars is completely free for selected participants. We believe in making quality research 
              opportunities accessible to all talented students regardless of financial background.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">What happens after I submit my application?</h3>
            <p class="faq-answer">
              You'll receive a confirmation email within 24 hours. Selected candidates will be invited for interviews 
              in May 2025, and final decisions will be announced by the end of May.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">Do I need prior research experience?</h3>
            <p class="faq-answer">
              No prior research experience is required. We're looking for students with curiosity, strong academic 
              performance, and a passion for scientific inquiry.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">What kind of research projects will I work on?</h3>
            <p class="faq-answer">
              Projects span various scientific disciplines including biology, chemistry, physics, computer science, 
              and engineering. You'll be matched with mentors based on your interests and background.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">Will I receive a certificate upon completion?</h3>
            <p class="faq-answer">
              Yes, all participants who successfully complete the program will receive a certificate of completion 
              and can request letters of recommendation from their mentors.
            </p>
          </div>
          <div class="faq-item">
            <h3 class="faq-question">How can I prepare for the application?</h3>
            <p class="faq-answer">
              Focus on your academic performance, think about your research interests, and be prepared to discuss 
              why you want to participate in scientific research. The optional essays are a great way to showcase your passion.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Start Your Research Journey?</h2>
          <p class="cta-description">
            Join hundreds of students who have transformed their scientific careers through StepUp Scholars. 
            Applications are now open for the 2025 cohort.
          </p>
          <div class="cta-actions">
            <a href="#apply" class="btn btn-primary btn-lg">Apply Now</a>
            <RouterLink to="/contact" class="btn btn-outline btn-lg">Contact Us</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import StickyApplyBox from '../components/StickyApplyBox.vue'

const isSubmitting = ref(false)
const currentStep = ref(1)
const totalSteps = 3

const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    return Boolean(form.firstName && form.lastName && form.email && form.location && form.school && form.grade)
  }
  if (currentStep.value === 2) {
    return Boolean(form.interests && form.motivation)
  }
  return true
})

const nextStep = () => {
  if (currentStep.value < totalSteps) currentStep.value += 1
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value -= 1
}

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  school: '',
  grade: '',
  gpa: '',
  interests: '',
  motivation: '',
  experience: '',
  availability: {
    weekdays: false,
    weekends: false,
    virtual: false,
    inperson: false
  }
})

const handleApplicationSubmit = async () => {
  isSubmitting.value = true
  
  try {
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would typically send the data to your backend
    console.log('Application submitted:', form)
    
    // Show success message (you could use a toast notification here)
    alert('Application submitted successfully! You will receive a confirmation email within 24 hours.')
    
    // Reset form
    Object.assign(form, {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      school: '',
      grade: '',
      gpa: '',
      interests: '',
      motivation: '',
      experience: '',
      availability: {
        weekdays: false,
        weekends: false,
        virtual: false,
        inperson: false
      }
    })
  } catch (error) {
    console.error('Error submitting application:', error)
    alert('There was an error submitting your application. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.stepup {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  padding: var(--space-20) 0 var(--space-16);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: white;
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
}

.badge-text {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-700);
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin: 0 auto var(--space-8);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

/* Overview Section */
.overview-section {
  padding: var(--space-20) 0;
  background: white;
}

.overview-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: start;
  max-width: 1000px;
  margin: 0 auto;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.overview-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.program-highlights {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.highlight {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.highlight-icon {
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

.highlight-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.highlight-text {
  color: var(--neutral-600);
  margin: 0;
}

.overview-visual {
  display: flex;
  justify-content: center;
}

.stats-card {
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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--primary-600);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  font-weight: 500;
}

/* Eligibility Section */
.eligibility-section {
  padding: var(--space-20) 0;
  background: var(--neutral-50);
}

.eligibility-content {
  text-align: center;
  margin-bottom: var(--space-12);
}

.eligibility-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

.eligibility-card {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: all var(--transition-normal);
}

.eligibility-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.card-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
}

.eligibility-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.eligibility-list li {
  padding: var(--space-2) 0;
  color: var(--neutral-700);
  position: relative;
  padding-left: var(--space-6);
}

.eligibility-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary-600);
  font-weight: bold;
}

/* Application Process */
.application-section {
  padding: var(--space-20) 0;
  background: white;
}

.application-content {
  text-align: center;
  margin-bottom: var(--space-12);
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.step {
  display: flex;
  gap: var(--space-6);
  align-items: flex-start;
  text-align: left;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: var(--primary-600);
  color: white;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.step-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.step-description {
  color: var(--neutral-600);
  margin: 0;
}

/* Apply Section */
.apply-section {
  padding: var(--space-20) 0;
  background: var(--neutral-50);
}

.apply-content {
  text-align: center;
  margin-bottom: var(--space-12);
}

.apply-description {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin: 0 auto var(--space-8);
}

.application-form {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  max-width: 800px;
  margin: 0 auto;
}

.apply-progress {
  margin-bottom: var(--space-8);
}

.apply-progress__track {
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.apply-progress__bar {
  height: 8px;
  background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
  border-radius: var(--radius-full);
  width: 33%;
  transition: width var(--transition-normal);
}

.apply-progress__labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--neutral-600);
  margin-top: var(--space-2);
}

.apply-progress__labels .is-active {
  color: var(--primary-600);
  font-weight: 600;
}

.form-grid {
  display: grid;
  gap: var(--space-8);
}

.form-section {
  border-bottom: 1px solid var(--neutral-200);
  padding-bottom: var(--space-8);
}

.form-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.form-section-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
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
  min-height: 100px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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

.form-actions {
  text-align: center;
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--neutral-200);
}

.form-actions--wizard {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.form-note {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin-top: var(--space-4);
}

/* FAQ Section */
.faq-section {
  padding: var(--space-20) 0;
  background: white;
}

.faq-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: var(--neutral-50);
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
  background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
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
  .hero-actions {
    flex-direction: row;
    justify-content: center;
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
  
  .step {
    text-align: center;
  }
  
  .step-number {
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .overview-content {
    grid-template-columns: 1fr;
  }
  
  .eligibility-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .process-steps {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .step {
    flex: 1;
    min-width: 200px;
    max-width: 250px;
  }
  
  .hero-title {
    font-size: var(--text-6xl);
  }
  
  /* Add right margin for sticky apply box */
}
</style>



<template>
  <div class="progress-tracking">
    <div class="header">
      <h1>My Progress</h1>
      <p class="subtitle">Track your learning journey and achievements</p>
    </div>

    <div class="progress-overview">
      <div class="overview-card">
        <h3>Overall Progress</h3>
        <div class="progress-circle">
          <div class="circle">
            <span class="percentage">67%</span>
          </div>
        </div>
        <p class="progress-description">2 of 3 program phases completed</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">24</div>
          <div class="stat-label">Modules Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">156</div>
          <div class="stat-label">Study Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">8</div>
          <div class="stat-label">Achievements</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">92%</div>
          <div class="stat-label">Assignment Score</div>
        </div>
      </div>
    </div>

    <div class="progress-details">
      <div class="phase-progress">
        <h3>Program Phases</h3>
        <div class="phase-list">
          <div class="phase-item completed">
            <div class="phase-info">
              <h4>Phase 1: Foundation</h4>
              <p>Basic concepts and fundamental skills</p>
            </div>
            <div class="phase-status">
              <span class="status-badge completed">Completed</span>
              <span class="completion-date">Oct 15, 2024</span>
            </div>
          </div>

          <div class="phase-item completed">
            <div class="phase-info">
              <h4>Phase 2: Advanced Learning</h4>
              <p>Advanced concepts and practical applications</p>
            </div>
            <div class="phase-status">
              <span class="status-badge completed">Completed</span>
              <span class="completion-date">Nov 20, 2024</span>
            </div>
          </div>

          <div class="phase-item in-progress">
            <div class="phase-info">
              <h4>Phase 3: Capstone Project</h4>
              <p>Final project and portfolio development</p>
            </div>
            <div class="phase-status">
              <span class="status-badge in-progress">In Progress</span>
              <span class="due-date">Due: Dec 31, 2024</span>
            </div>
          </div>
        </div>
      </div>

      <div class="achievements">
        <h3>Recent Achievements</h3>
        <div class="achievements-grid">
          <div class="achievement-card">
            <div class="achievement-icon"><Icon icon="lucide:trophy" /></div>
            <div class="achievement-content">
              <h4>Research Excellence</h4>
              <p>Awarded for outstanding research paper</p>
              <span class="achievement-date">Nov 25, 2024</span>
            </div>
          </div>

          <div class="achievement-card">
            <div class="achievement-icon"><Icon icon="lucide:star" /></div>
            <div class="achievement-content">
              <h4>Perfect Attendance</h4>
              <p>100% attendance in program sessions</p>
              <span class="achievement-date">Nov 20, 2024</span>
            </div>
          </div>

          <div class="achievement-card">
            <div class="achievement-icon"><Icon icon="lucide:rocket" /></div>
            <div class="achievement-content">
              <h4>Fast Learner</h4>
              <p>Completed 10 modules ahead of schedule</p>
              <span class="achievement-date">Nov 15, 2024</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<style scoped>
.progress-tracking {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
}

.progress-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  text-align: center;
}

.overview-card h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.progress-circle {
  margin: 2rem 0;
}

.circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(#007bff 67%, #e9ecef 67%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
}

.circle::before {
  content: '';
  position: absolute;
  width: 90px;
  height: 90px;
  background: white;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.percentage {
  position: relative;
  z-index: 1;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.progress-description {
  color: #6c757d;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.progress-details {
  display: grid;
  gap: 2rem;
}

.phase-progress, .achievements {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.phase-progress h3, .achievements h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.phase-list {
  display: grid;
  gap: 1.5rem;
}

.phase-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.phase-item.completed {
  background: #d4edda;
  border-color: #c3e6cb;
}

.phase-info h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.phase-info p {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.phase-status {
  text-align: right;
}

.status-badge {
  display: block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.status-badge.completed {
  background: #28a745;
  color: white;
}

.status-badge.in-progress {
  background: #ffc107;
  color: #212529;
}

.completion-date, .due-date {
  color: #6c757d;
  font-size: 0.8rem;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.achievement-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.achievement-icon {
  font-size: 2rem;
  min-width: 2rem;
  text-align: center;
}

.achievement-content h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.achievement-content p {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.achievement-date {
  color: #6c757d;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .progress-overview {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .phase-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .phase-status {
    text-align: center;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>

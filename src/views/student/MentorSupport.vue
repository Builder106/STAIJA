<template>
  <div class="mentor-support">
    <div class="header">
      <h1>Mentor Support</h1>
      <p class="subtitle">Get guidance from your assigned mentor</p>
    </div>

    <div class="mentor-info">
      <div class="mentor-card">
        <div class="mentor-avatar">JD</div>
        <div class="mentor-details">
          <h3>Dr. Jane Doe</h3>
          <p class="mentor-title">Senior Program Mentor</p>
          <p class="mentor-specialty">Specializes in Research & Career Development</p>
        </div>
      </div>

      <div class="contact-options">
        <button class="btn-primary">
          <span class="icon">💬</span>
          Schedule Meeting
        </button>
        <button class="btn-secondary">
          <span class="icon">✉️</span>
          Send Message
        </button>
        <button class="btn-secondary">
          <span class="icon">📅</span>
          View Availability
        </button>
      </div>
    </div>

    <div class="recent-activity">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        <div class="activity-item">
          <div class="activity-icon">💬</div>
          <div class="activity-content">
            <p>You scheduled a meeting for Dec 18, 2024</p>
            <span class="activity-time">2 days ago</span>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">📧</div>
          <div class="activity-content">
            <p>Mentor sent feedback on your research paper</p>
            <span class="activity-time">1 week ago</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder component - to be implemented with actual mentor functionality
</script>

<style scoped>
.mentor-support {
  max-width: 1000px;
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

.mentor-info {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  margin-bottom: 2rem;
}

.mentor-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.mentor-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
}

.mentor-details h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.mentor-title {
  color: #007bff;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.mentor-specialty {
  color: #6c757d;
  font-size: 0.9rem;
}

.contact-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.icon {
  font-size: 1.2rem;
}

.recent-activity h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.activity-list {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  min-width: 2rem;
  text-align: center;
}

.activity-content p {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.activity-time {
  color: #6c757d;
  font-size: 0.9rem;
}
</style>

<template>
  <div class="assignments">
    <div class="header">
      <h1>Assignments</h1>
      <p class="subtitle">Complete your assignments and track your progress</p>
    </div>

    <div class="assignments-list">
      <div class="assignment-card">
        <div class="assignment-header">
          <h3>Research Paper Submission</h3>
          <span class="due-date">Due: Dec 20, 2024</span>
        </div>
        <p>Submit your research paper on sustainable development practices</p>
        <div class="assignment-status pending">
          <span>Pending Submission</span>
        </div>
      </div>

      <div class="assignment-card">
        <div class="assignment-header">
          <h3>Group Project Presentation</h3>
          <span class="due-date">Due: Dec 25, 2024</span>
        </div>
        <p>Prepare and submit your group project presentation</p>
        <div class="assignment-status in-progress">
          <span>In Progress</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder component - to be implemented with actual assignment functionality
</script>

<style scoped>
.assignments {
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

.assignments-list {
  display: grid;
  gap: 1.5rem;
}

.assignment-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.assignment-header h3 {
  color: #2c3e50;
  margin: 0;
}

.due-date {
  color: #dc3545;
  font-weight: 600;
  font-size: 0.9rem;
}

.assignment-card p {
  color: #6c757d;
  margin-bottom: 1rem;
}

.assignment-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.assignment-status.pending {
  background: #fff3cd;
  color: #856404;
}

.assignment-status.in-progress {
  background: #cce5ff;
  color: #0066cc;
}
</style>

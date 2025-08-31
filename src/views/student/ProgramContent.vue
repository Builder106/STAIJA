<template>
  <div class="program-content">
    <div class="header">
      <h1>Program Content</h1>
      <p class="subtitle">Access your program materials and resources</p>
    </div>

    <div class="content-grid">
      <div class="content-card">
        <h3>📚 Curriculum Materials</h3>
        <p>Access course materials, lectures, and study guides</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 65%"></div>
          <span class="progress-text">65% Complete</span>
        </div>
      </div>

      <div class="content-card">
        <h3>🎯 Program Resources</h3>
        <p>Download templates, tools, and additional resources</p>
        <button class="btn-primary">Browse Resources</button>
      </div>

      <div class="content-card">
        <h3>📖 Reading Materials</h3>
        <p>Access recommended readings and research papers</p>
        <button class="btn-secondary">View Library</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder component - to be implemented with actual program content
</script>

<style scoped>
.program-content {
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

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.content-card h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.content-card p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  border-radius: 12px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-primary, .btn-secondary {
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
</style>

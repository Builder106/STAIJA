<template>
  <footer class="footer">
    <div class="container">
      <p>© {{ new Date().getFullYear() }} STAIJA. All rights reserved.</p>
      <nav aria-label="Footer">
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/privacy">Privacy</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid #e5e7eb33;
  padding: 2rem 1rem;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
nav a { margin-left: 1rem; }
</style>



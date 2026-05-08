/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    server: {
      port: 5190,
      strictPort: true,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      environment: 'happy-dom',
      include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      // Shims a working localStorage for tests — happy-dom 20 ships a
      // window.localStorage whose methods aren't reachable in this
      // vitest combo. See tests/setup.ts for the diagnosis + workaround.
      setupFiles: ['tests/setup.ts'],
    },
  }
})

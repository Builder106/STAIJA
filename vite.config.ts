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
      rollupOptions: {
        output: {
          // Opaque hash-only filenames for route + component chunks.
          // Vite's default is `[name]-[hash].js`, which leaks our view
          // file names (Settings, Apply, Donate, etc.) into the URL —
          // and common content-blocker filter lists match patterns
          // like `settings*.js$script` because trackers often live
          // under those names (cookie-settings.js, ad-settings.js).
          // Net effect was that ~30% of Safari users with broad
          // blockers couldn't load /account/settings, /donate, etc.
          // Stripping the name kills the false-positive surface
          // entirely; the hash still makes each chunk uniquely
          // cacheable.
          chunkFileNames: 'assets/[hash].js',
          entryFileNames: 'assets/[hash].js',
          // Keep assetFileNames (images, fonts, CSS) descriptive —
          // filter lists rarely target those by source name, and the
          // descriptive form is useful for debugging.
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
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

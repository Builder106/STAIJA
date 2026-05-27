/// <reference types="vitest" />
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/**
 * Emit `/version.txt` containing the deploy's commit SHA (or a "dev"
 * stub when building locally without Vercel's env). The running app
 * fetches this on tab focus and triggers a reload when the SHA no
 * longer matches the SHA baked into the running bundle — that's how
 * users with long-lived tabs find out a new deploy is live without
 * having to manually refresh.
 */
function emitVersionFile(buildId: string): PluginOption {
  return {
    name: 'staija-version-txt',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.txt',
        source: buildId,
      })
    },
  }
}

export default defineConfig(async ({ mode }) => {
  loadEnv(mode, process.cwd(), '')

  // Vercel exposes the commit SHA as VERCEL_GIT_COMMIT_SHA at build
  // time. Falls back to a timestamp for local builds so dev never
  // accidentally collides with a real deploy ID.
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA ?? `dev-${Date.now().toString(36)}`

  return {
    plugins: [
      vue(),
      tailwindcss(),
      emitVersionFile(buildId),
      // Bundle visualizer — open the generated dist/stats.html after a
      // build to see what's actually in each chunk. Skip in CI/Vercel
      // builds to avoid bloating the output directory.
      ...(process.env.ANALYZE === '1'
        ? [(await import('rollup-plugin-visualizer')).visualizer({
            filename: 'dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          })]
        : []),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_ID__: JSON.stringify(buildId),
    },
    server: {
      port: 5190,
      strictPort: true,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Default warning fires at 500 kB. With Firebase + Tiptap in the
      // tree this is unrealistic for the framework chunk; we split them
      // out explicitly via manualChunks below. Bump the threshold so
      // the build log only flags genuinely-too-big chunks.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Split heavy third-party dependencies into their own chunks
          // so the browser can parallel-load them and so they can be
          // cached independently of app code (vendor hashes change much
          // less often than app code hashes). Without this, all of
          // firebase + framework + tiptap end up in one ~3.2 MB gzipped
          // blob that blocks mobile FCP for 8+ seconds on average
          // West African mobile networks.
          //
          // Order matters here — more-specific entries are tried first
          // by rollup, so put narrowly-scoped subpaths above the
          // catch-all firebase entry.
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('@firebase/firestore')) return 'firebase-firestore'
              if (id.includes('@firebase/storage')) return 'firebase-storage'
              if (id.includes('@firebase/functions')) return 'firebase-functions'
              if (id.includes('@firebase/auth')) return 'firebase-auth'
              if (id.includes('@firebase/app-check') || id.includes('@firebase/app')) return 'firebase-core'
              if (id.includes('@firebase/analytics') || id.includes('@firebase/performance')) return 'firebase-misc'
              if (id.includes('firebase/')) return 'firebase-core'
              if (id.includes('@tiptap') || id.includes('prosemirror')) return 'tiptap'
              if (id.includes('@contentful') || id.includes('contentful')) return 'contentful'
              if (id.includes('@dicebear')) return 'dicebear'
              if (id.includes('motion-v')) return 'motion'
              if (id.includes('@iconify')) return 'iconify'
              if (id.includes('vue-router') || id.includes('@vue') || id.includes('vue-i18n') || id.includes('@intlify')) return 'vue'
            }
            return null
          },
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

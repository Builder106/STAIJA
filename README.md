# STAIJA

Vue 3 + Vite + Firebase web app for STAIJA's StepUp Scholars and Dynamerge
programs.

## Toolchain

npm + Node for both the frontend (this directory) and Cloud Functions
(under [`functions/`](./functions), which has its own `package.json`).

## Common tasks

```bash
npm install          # one-time
npm run dev          # Vite dev server on :5190
npm run build        # vue-tsc + vite build → dist/
npm run preview      # serve the built dist/ locally
npm test             # vitest run
npm run test:watch   # vitest in watch mode
```

## Deploying

```bash
npm run build
firebase deploy --only hosting              # static frontend
firebase deploy --only functions            # Cloud Functions (uses functions/package.json)
firebase deploy --only firestore,storage    # rules + indexes
```

See [`docs/INFRASTRUCTURE.md`](./docs/INFRASTRUCTURE.md) for cost notes and
the secret-rotation runbook.

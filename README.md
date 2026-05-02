# STAIJA

Web platform for STAIJA's StepUp Scholars and Dynamerge programs — application management, applicant tracking, mentorship, and public content for STEM students across Nigeria.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + TypeScript |
| Auth | Firebase Authentication (email/password, Google) |
| Database | Cloud Firestore |
| File storage | Firebase Storage |
| Backend logic | Firebase Cloud Functions (Node 22) |
| CMS | Contentful → mirrored to Firestore via webhook |
| Email | Mailgun (transactional + newsletters) |
| Payments | Paystack (donations) |
| Hosting | Vercel (frontend SPA) |

## Prerequisites

- Node 22+
- Firebase CLI: `npm install -g firebase-tools` then `firebase login`
- A Firebase project on the **Blaze** plan (required for Cloud Functions — see [`docs/INFRASTRUCTURE.md`](./docs/INFRASTRUCTURE.md))

## Local development

```bash
# 1. Install frontend dependencies
npm install

# 2. Copy the env template and fill in your Firebase + Contentful keys
cp .env.example .env

# 3. Start the dev server (http://localhost:5190)
npm run dev
```

### Environment variables

All frontend config is injected at build time via `VITE_*` variables in `.env`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_PUBLIC_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID

VITE_CONTENTFUL_SPACE_ID
VITE_CONTENTFUL_DELIVERY_TOKEN
VITE_CONTENTFUL_PREVIEW_TOKEN
VITE_CONTENTFUL_MANAGEMENT_TOKEN
VITE_CONTENTFUL_ENV_ID

VITE_PAYSTACK_PUBLIC_KEY
VITE_NEWSLETTER_ENDPOINT
VITE_APP_URL
```

`.env` is gitignored. It is only read by the Vite build — Cloud Functions read secrets from Firebase Secret Manager, not from `.env`.

## Cloud Functions

Functions live in [`functions/`](./functions) with their own `package.json`.

```bash
cd functions && npm install
```

Secrets are stored in Firebase Secret Manager (not `.env`). Before first deploy:

```bash
echo -n "<value>" | firebase functions:secrets:set MAILGUN_API_KEY          --data-file -
echo -n "<value>" | firebase functions:secrets:set MAILGUN_DOMAIN           --data-file -
echo -n "<value>" | firebase functions:secrets:set MAILGUN_LIST_ADDRESS     --data-file -
echo -n "<value>" | firebase functions:secrets:set PAYSTACK_SECRET_KEY      --data-file -
echo -n "<value>" | firebase functions:secrets:set CONTENTFUL_WEBHOOK_SECRET --data-file -
echo -n "<value>" | firebase functions:secrets:set REFERENCE_TOKEN_SECRET   --data-file -
```

See [`docs/INFRASTRUCTURE.md`](./docs/INFRASTRUCTURE.md) for the full secret inventory, the Mailgun sandbox-vs-verified-domain setup, and cost notes.

## Tests

```bash
npm test             # vitest run (all tests, single pass)
npm run test:watch   # vitest in watch mode
```

Tests live in [`tests/`](./tests). Service-layer tests mock Firebase; component tests use `@vue/test-utils` with `happy-dom`.

## Build & deploy

```bash
# Build
npm run build

# Deploy frontend (Vercel picks this up automatically on push to main,
# or run manually)
vercel --prod

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules + indexes and Storage rules
firebase deploy --only firestore,storage
```

## User roles

| Role | Who |
|---|---|
| `applicant` | Anyone who creates an account |
| `student` | Accepted and active program participants |
| `alumni` | Past participants |
| `mentor` | Assigned mentors |
| `staff` | STAIJA team (@staija.org email, verified) |
| `admin` | Full access |

## Docs

| Doc | Contents |
|---|---|
| [`docs/INFRASTRUCTURE.md`](./docs/INFRASTRUCTURE.md) | Service costs, Firebase Blaze notes, Mailgun setup, secret rotation |
| [`docs/PRD.md`](./docs/PRD.md) | Product requirements |
| [`docs/PLAN.md`](./docs/PLAN.md) | Technical implementation plan |
| [`docs/CONTEXT.md`](./docs/CONTEXT.md) | Project background and mission |

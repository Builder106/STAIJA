# JOURNAL — STAIJA

> Dated log of decisions, pivots, incidents, and quotes. Add entries as
> things happen — retrospectives need this raw material to land.
> Reverse-chronological; one paragraph max per entry.

## 2026-05-26 — Policy: staging is internal-only; use Shareable Links for ad-hoc sharing, Protection Bypass for automation #decision

`staging.staija.org` runs as a Vercel Preview deployment, which means Vercel SSO protection is on by default — only Vercel team members (just me right now) can load the page in a browser. Decision: keep it that way. Staging is for internal QA, not for external references uploading letters, not for applicants. Two escape hatches exist when bypass is genuinely needed: (a) **Shareable Links** — per-deployment tokenized URLs (`?_vercel_share=<token>`), revocable independently, blast radius is one deployment — use for one-off shares with designers / stakeholders; (b) **Protection Bypass for Automation** — a single project-wide secret sent as `x-vercel-protection-bypass` header or query param — use only when a machine (CI, uptime monitor, Lighthouse runner, Playwright in GitHub Actions) needs scriptable access. Not adding the automation secret today — no concrete consumer yet, and an unused secret is another credential to rotate. Webhooks are unaffected because they hit Cloud Functions URLs directly (`*.cloudfunctions.net`), not the Vercel-fronted domain.

## 2026-05-26 — Design rule: which Cloud Functions can be `onRequest` (public HTTP) vs `onCall` #decision

A function gets `onRequest` (publicly callable HTTP endpoint) only when **all four** of the following hold: (a) the caller is genuinely anonymous — no Firebase Auth session exists at call time; (b) the response is an explicit allowlist of fields, never a full doc dump, so future schema additions stay private by default; (c) any user-influenced behavior is gated on consent flags (`directoryHidden`, opt-in toggles) or one-time tokens issued by a trusted server path; (d) input is validated against a strict shape before any database read. Today the only three endpoints that meet all four are `getPublicMentors` (mentor showcase grid), `resolveReferrerName` (referral hero personalization), and `submitReferenceLetter` (referee uploads via tokenized link). All three sit behind App Check + per-endpoint validation + output-field allowlists. Anything that doesn't meet all four conditions must be `onCall` with explicit role checks — examples already in the codebase: `submitAssignment`, `gradeSubmission`, `enrollStudent`, `deleteAccount`. Adding a fourth `onRequest` endpoint should require a JOURNAL entry justifying why each of the four conditions is satisfied.

## 2026-05-25 — Adopted: real-mode reCAPTCHA staging soak before each application-open window #decision

Staging runs App Check in debug mode by default (`isDebugAppCheckEnv` includes `staging.staija.org` in [src/config/firebase.ts](src/config/firebase.ts)) so callables work without a staging-specific reCAPTCHA Enterprise site key. Debug mode masks the kind of App Check bugs that only fire under real enforcement — missing-token attachment in a form, an over-aggressive score threshold, a domain mis-registration. To catch those before applicants are affected: ~48 hours before each application-open window for StepUp / Dynamerge, register a staging-specific reCAPTCHA Enterprise site key for `staging.staija.org`, remove `staging.staija.org` from `isDebugAppCheckEnv`, redeploy, and run every form-bearing flow end-to-end in real mode. Revert after the soak. Trigger conditions for unscheduled real-mode runs: new `enforceAppCheck: true` on any function/resource, prod App Check rejection incident, post-reCAPTCHA-platform-update behavior changes.

## 2026-05-25 — Mailgun domain `mg.staija.org` not yet verified #incident (open)

Surfaced while planning the staging test-flow run from `guide.md`. The `MAILGUN_DOMAIN` secret is set to `mg.staija.org` on both prod and staging Firebase projects, but the DNS records at IONOS (SPF / DKIM / MX / tracking CNAME) per `docs/mailgun-domain-setup.md` haven't been added — so every `sendMailgun` call to Mailgun's API fails at the network layer. The staging allowlist short-circuit still blocks non-allowlisted recipients before any API call (no leakage risk), but allowlisted sends record `lastEmailFailure` on the application doc. State transitions (status flips, role changes, cohort placement, enrollment) still land correctly because they happen before the email throw. Action: complete steps 1–3 of `docs/mailgun-domain-setup.md` when next at IONOS DNS.

## 2026-05-25 — Staging environment bootstrapped #milestone #decision

Stood up `staging.staija.org` end-to-end: separate Firebase project (`staija-staging`), separate Cloud Functions deploy, separate Vercel branch alias tracking the `staging` git branch, and a branch-conditional Vercel build command (`[ "$VERCEL_GIT_COMMIT_REF" = "staging" ] && npm run build:staging || npm run build`) so the `--mode staging` flag fires automatically. All `VITE_*` env vars scoped per-environment in Vercel UI (Preview · staging vs All Environments). Driving need: a Contentful schema change is coming and the team wants to test against real Cloud Functions + Firestore without polluting prod data.

## 2026-05-25 — Mailgun shares prod's sending domain on staging, gated by in-code allowlist #decision

Free-plan Mailgun caps accounts at one sending domain, so `mg.staija.org` is shared between prod and staging. To prevent a staging bug (or a prod Firestore export landing in `staija-staging`) from emailing real applicants, `sendMailgun` in `functions/src/emailTemplates.ts` short-circuits non-prod sends behind a `STAGING_EMAIL_ALLOWLIST` after Gmail-alias canonicalization (dots / `+tag` / `googlemail.com` all collapse to the canonical inbox). Defer Option B (separate `mg.staging.staija.org` domain) until paid Mailgun plan or provider switch.

## 2026-05-25 — Renamed `VITE_CONTENTFUL_MANAGEMENT_TOKEN` → `CONTENTFUL_MANAGEMENT_TOKEN` #decision

The `VITE_` prefix was a security landmine. Vite inlines any `import.meta.env.VITE_*` reference into the browser bundle, so a single misplaced reference in client code would have shipped a write/delete-capable Contentful token to every visitor. Dropped the prefix in `tools/lms-seed/*`, `README.md`; left historical-context comments in `src/services/lmsContent.ts` and `functions/src/lmsContentAdmin.ts` intact because they explain *why* the migration happened. The Firebase Functions secret was already named correctly — only the CLI scripts and docs had drifted.

## 2026-05-25 — Prod gap: `resolveReferrerName` was exported in source but never deployed #incident

Discovered while wiring up staging env vars. `functions/src/index.ts` exports `resolveReferrerName`, but `firebase functions:list --project staija` didn't include it. Result: the referral hero personalization on `/stay-connected` (`?ref=u-<uid>` → *"&lt;Name&gt; sent you here."*) has been silently broken in prod since the feature shipped — `referrals.ts:176` falls back to `null` and the hero renders generic copy. Surgically deployed via `firebase deploy --only functions:resolveReferrerName --project prod`. Lesson: prod functions can drift from source if past deploys were selective (`--only functions:foo,bar`). Worth a periodic `comm -23` audit between `index.ts` exports and the prod functions list.

## 2026-05-25 — Email templates hardcode `https://staija.org` #decision (deferred)

Every absolute URL in `functions/src/emailTemplates.ts` and `newsletterTemplates.ts` is a `https://staija.org/...` literal. On staging, when the allowlist guardrail lets an email through to a teammate inbox, every link in the email yanks the recipient out of the staging environment back into prod (`/applicant/applications/<id>` resolves against prod Firestore). Documented as a TODO at the top of `functions/src/emailTemplates.ts` proposing a server-side `APP_URL` Functions param. Deferred — not blocking because the allowlist already restricts staging mail to teammates who'll notice.

## 2026-05-20 — Staging scaffolding (`.firebaserc`, `.env.staging`, npm scripts) #milestone

Commit `252f00d`. Added the `staging` project alias, the `.env.staging` template with all `VITE_*` keys documented (most blank until later turns filled them), and `deploy:staging` / `deploy:staging:rules` / `deploy:staging:functions` npm scripts. Set the stage for today's full bootstrap.

## 2026-05-19 — Retired `NewApplication.vue`; apply button gates on remaining open programs #pivot

Commit `f7042fe`. The generic "start application" entry point was confusing applicants when their program of interest wasn't currently in its application window. New flow: the apply button only surfaces when there's at least one program accepting; otherwise the page nudges toward `/stay-connected`.

## 2026-05-18 — Retired legacy `/student/*` routes for `/learn` #pivot

Commit `058f983`. URL hierarchy now reflects the LMS-first navigation: `/learn`, `/learn/sessions`. Old `/student/*` paths still redirect for any in-flight links.

## 2026-05-15 — Split admin and staff URLs (`/admin/*` vs `/staff/*`) #decision

Commit `6b2a5e9`. Admin-only views moved under `/admin/`; staff views (a superset for both roles) stay at `/staff/`. Cross-prefix guard at `router/index.ts:316-326` preserves sub-path + query on redirect, so pasting `/admin/applications/<id>/review?response=deferred` as staff still lands correctly. End-to-end verified 2026-05-20 (Flow 9 in `guide.md`).

## Ongoing — PCSE microgrant approved: Campus Ambassador Kits #milestone

$500, execution window Jun–Oct 2026, public report due end of October 2026. Execution tracker at `docs/NVA/Kit-Execution.md`. Drives the timeline for community-facing tooling and the `/stay-connected` referral attribution feature that the prod gap above silently broke.

## Ongoing — Paystack donations gated pending compliance #decision

Donations infrastructure exists but is gated off via `src/config/features.ts:donationsEnabled`. Re-enable checklist (4 steps, order matters): set `PAYSTACK_SECRET_KEY` in Secret Manager → configure live webhook URL in Paystack dashboard → re-export `paystackWebhook` + `cancelSubscription` in `functions/src/index.ts` → flip `donationsEnabled` to true.

## Ongoing — Animated layered-avatar pipeline paused #pivot

The `tools/tag_potrait.py` + Hugging Face + Vectorizer.AI pipeline that produced animated profile pictures is paused, not abandoned. May extract to a separate project. `HF_TOKEN`, `VECTORIZER_API_ID`, `VECTORIZER_API_SECRET` stay documented in `.env.example` until that decision lands.

/**
 * Shared origin allowlist for the public-facing HTTP functions
 * (`subscribeNewsletter`, `getPublicMentors`, `resolveReferrerName`).
 *
 * Accepts:
 *   - The two production hostnames (`staija.org`, `www.staija.org`)
 *   - The two local dev ports we ship in this repo (5190 + 5173)
 *   - Any Vercel preview deployment under `*.vercel.app` — branch
 *     previews like `staija-git-feature-x-staija.vercel.app` should
 *     be able to round-trip against production functions, otherwise
 *     reviewers can't actually test the newsletter or mentor showcase
 *     on a preview URL.
 *
 * Anything else returns false and the caller skips emitting the
 * `Access-Control-Allow-Origin` header — the browser then blocks
 * the request, which is the right outcome for an unknown origin.
 */

const EXACT_ALLOWED = new Set<string>([
  'https://staija.org',
  'https://www.staija.org',
  'http://localhost:5190',
  'http://localhost:5173',
])

// Vercel preview deploys. The exact subdomain varies per branch and
// commit; we accept any `https://<subdomain>.vercel.app` under our
// project — the subdomain shape Vercel mints is alphanumeric plus
// hyphen. Restrictive on protocol (https only) so a hijacked DNS
// entry pointing at http can't slip through.
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]{1,255}\.vercel\.app$/

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false
  if (EXACT_ALLOWED.has(origin)) return true
  if (VERCEL_PREVIEW_RE.test(origin)) return true
  return false
}

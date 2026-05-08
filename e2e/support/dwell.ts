import type { Page } from '@playwright/test'

const DEMO = process.env.DEMO === '1'
const DEFAULT_MS = Number(process.env.DEMO_DWELL_MS ?? 1500)

/**
 * Pause the page for `ms` milliseconds when running in demo mode.
 *
 * slowMo only pauses between Playwright actions — it doesn't cover
 * `page.goto()` or assertions. Without explicit dwells, modals that
 * "appear and assert" with no follow-up action flash on screen and the
 * viewer can't read what happened. Call this at every "thing just
 * appeared" beat.
 */
export async function dwellForDemo(page: Page, ms: number = DEFAULT_MS): Promise<void> {
  if (!DEMO) return
  try {
    await page.waitForTimeout(ms)
  } catch {
    /* page already closed */
  }
}

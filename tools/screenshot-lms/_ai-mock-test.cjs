// One-off test: mocks the lessonMediaAssist callable and verifies the
// AI panel renders results + the Insert buttons mutate the body.
const { chromium } = require('playwright')
const path = require('node:path')

const MOCK_RESULT = {
  videoQueries: [
    { query: 'research methodology explained for students', rationale: 'A beginner-friendly walkthrough that mirrors the lesson framing.' },
    { query: 'how scientists design experiments YouTube', rationale: 'Shows a concrete experimental-design example a student can recognise.' },
    { query: 'wet lab vs field study comparison', rationale: 'Bridges the three methodologies the lesson contrasts.' },
  ],
  imageQueries: [
    { query: 'african students science lab', rationale: 'Establishes a locally grounded scene before the methodology discussion.' },
    { query: 'lab notebook handwritten observations', rationale: 'Visual anchor for the lessons reference to documenting.' },
    { query: 'population study demographic data', rationale: 'Pairs with the population-study example.' },
  ],
  narrationScript:
    'Hey, welcome back. In this lesson we look at three methodologies side by side — a wet-lab experiment, a population study, and a computational simulation. The point is not to memorise definitions; it is to notice what they share. Every one of them starts with a question you can actually answer, defines what you would collect, and ends with a check on whether the data settled the question. Once you spot that shape, you can spot a sloppy methodology a mile away. Take ten minutes after the lesson and try sketching the shape for your own question. That is the muscle we are building.',
  keyConcepts: [
    'Methodology is the plan: question, data, decision criterion.',
    'Wet-lab, population, and simulation methods share the same underlying shape.',
    'A method is sloppy when the data cannot actually settle the question.',
    'Documenting choices is part of the method, not a chore after.',
  ],
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    baseURL: 'http://localhost:5190',
    storageState: 'tools/screenshot-lms/.auth/staff.json',
  })
  // Intercept both prod and emulator-style callable URLs.
  await ctx.route(/lessonMediaAssist/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: MOCK_RESULT }),
    })
  })
  const page = await ctx.newPage()
  page.on('pageerror', (err) => console.log('page-err:', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('console-err:', msg.text())
  })

  await page.goto('/admin/content/lessons')
  await page.waitForTimeout(4500)
  const firstLink = page.locator('a[href^="/admin/content/lessons/"]').first()
  await page.goto(await firstLink.getAttribute('href'))
  await page.waitForTimeout(4500)

  await page.locator('button:has-text("AI media assist")').click()
  await page.waitForTimeout(600)
  await page.locator('button:has-text("Suggest media")').click()
  await page.waitForTimeout(2500)

  await page.getByText('Narration script', { exact: true }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'tools/screenshot-lms/.state/lesson-ai-results.png', fullPage: true })
  console.log('captured results')

  await page.locator('button:has-text("Insert into body")').click()
  await page.waitForTimeout(500)
  await page.locator('button:has-text("Insert as section")').click()
  await page.waitForTimeout(800)

  await page.locator('text=Body').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'tools/screenshot-lms/.state/lesson-ai-inserted.png', fullPage: true })
  console.log('captured inserted')

  await ctx.close()
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })

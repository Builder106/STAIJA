#!/usr/bin/env node
/**
 * Render tools/banner/banner.html to banner-light.png and banner-dark.png
 * at 1600x400. The README's <picture> element switches between the two
 * based on the reader's prefers-color-scheme.
 *
 * Run: `npm run banner:capture`
 */
const path = require('path')
const { chromium } = require('playwright')

const HERE = __dirname
const HTML = path.join(HERE, 'banner.html')

;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1600, height: 400 },
    deviceScaleFactor: 2, // retina-sharp; GitHub will downscale gracefully
  })

  for (const theme of ['light', 'dark']) {
    const page = await context.newPage()
    await page.goto('file://' + HTML + '?theme=' + theme, { waitUntil: 'networkidle' })
    // Wait for webfonts so the wordmark doesn't render in the system fallback.
    await page.evaluate(() => document.fonts.ready)

    const out = path.join(HERE, `banner-${theme}.png`)
    await page.screenshot({
      path: out,
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: 1600, height: 400 },
    })
    await page.close()
    console.log(`Wrote ${out}`)
  }

  await browser.close()
})()

/**
 * Demo video reporter.
 *
 * Playwright records every test as a webm. This reporter:
 *   1. Collects { slug, sourcePath } pairs in onTestEnd (defers the
 *      heavy work to onEnd because Playwright doesn't guarantee the
 *      video file is fully flushed when onTestEnd fires).
 *   2. In onEnd, walks each pair and:
 *        - skips warmup tests (their videos are throwaway)
 *        - skips zero-byte webms (the first-test 0-byte bug)
 *        - converts the rest to mp4 in e2e/videos/
 *        - removes the source webm + its empty per-test folder
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const OUT_DIR = path.resolve(__dirname, 'videos')

function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isWarmup(featureTitle, scenarioTitle) {
  const f = String(featureTitle ?? '').toLowerCase()
  const s = String(scenarioTitle ?? '').toLowerCase()
  return f === 'warmup' || s.startsWith('warmup')
}

function tryRmdir(dir) {
  try {
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
  } catch {
    /* ignore */
  }
}

class DemoVideoReporter {
  constructor() {
    this.pending = []
  }

  onTestEnd(test, result) {
    const video = result.attachments.find((a) => a.name === 'video')
    if (!video?.path) return

    // playwright-bdd's generated specs wrap each feature in
    // describe(featureTitle, ...) — the closest non-root parent.
    const scenarioTitle = test.title
    let featureTitle = ''
    let parent = test.parent
    while (parent) {
      const t = (parent.title || '').replace(/^Feature:\s*/, '').trim()
      if (t) {
        featureTitle = t
        break
      }
      parent = parent.parent
    }

    this.pending.push({
      featureTitle,
      scenarioTitle,
      sourcePath: video.path,
    })
  }

  async onEnd() {
    if (this.pending.length === 0) return

    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

    for (const { featureTitle, scenarioTitle, sourcePath } of this.pending) {
      const folder = path.dirname(sourcePath)

      try {
        if (isWarmup(featureTitle, scenarioTitle)) {
          if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath)
          tryRmdir(folder)
          continue
        }

        if (!fs.existsSync(sourcePath)) continue
        const stat = fs.statSync(sourcePath)
        if (stat.size === 0) {
          fs.unlinkSync(sourcePath)
          tryRmdir(folder)
          console.warn(`[demo] skipping 0-byte video for "${scenarioTitle}"`)
          continue
        }

        const slug = `${slugify(featureTitle)}-${slugify(scenarioTitle)}`
        const mp4 = path.join(OUT_DIR, `${slug}.mp4`)

        execSync(
          `ffmpeg -y -i "${sourcePath}" -c:v libx264 -preset veryfast -pix_fmt yuv420p -movflags +faststart "${mp4}"`,
          { stdio: 'inherit' },
        )

        fs.unlinkSync(sourcePath)
        tryRmdir(folder)
        console.log(`[demo] wrote ${path.relative(process.cwd(), mp4)}`)
      } catch (err) {
        console.error(`[demo] failed to process ${scenarioTitle}:`, err.message)
      }
    }
  }
}

module.exports = DemoVideoReporter

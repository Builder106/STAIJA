/**
 * Generate small PNG thumbnails from the raw portrait images and
 * write them to `public/avatars/portrait-<slot>.png` so they can be
 * served as static assets at `/avatars/portrait-<slot>.png`.
 *
 * Why thumbnails instead of inlined SVG: each cleaned portrait is a
 * 1.4 MB color-traced SVG. Rendering 10 of them at once
 * (AvatarPicker, AvatarPreview) parses ~14 MB of paths and crashes
 * Chrome on modest hardware. A 256×256 PNG is ~40–80 KB, decodes in
 * milliseconds, and looks identical at the sizes we display
 * (32–160px). The full-resolution SVGs remain in `parts.ts` for any
 * surface that needs vector — but production rendering paths now
 * default to the static thumbs.
 *
 * Format note: WebP would be ~3× smaller than PNG, but jimp 1.6
 * doesn't ship a WebP encoder by default. Switching is possible
 * (sharp, or jimp + webp plugin) — left as a follow-up if 256×256
 * PNG totals turn out too heavy.
 *
 * Run with:
 *   npm run avatars:thumbs
 *   npm run avatars:thumbs -- --force      # overwrite existing
 */

import { mkdir, readdir, access } from 'node:fs/promises'
import { join, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Jimp } from 'jimp'
import { PROMPTS } from './prompts.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const RAW_DIR = join(HERE, 'raw')
const OUT_DIR = join(HERE, '..', '..', 'public', 'avatars')

const argv = process.argv.slice(2)
const FORCE = argv.includes('--force')

// Output spec. 256×256 covers up to 128px display at 2× DPR (most of
// our surfaces); the 160px hero accepts a slight upscale.
const SIZE = 256

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  let raws: string[]
  try {
    const entries = await readdir(RAW_DIR)
    raws = entries.filter((f) =>
      ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase()),
    )
  } catch {
    console.error(`No raw/ directory at ${RAW_DIR}. Run avatars:generate first.`)
    process.exit(1)
  }

  // Walk PROMPTS so output filenames are slot-indexed (`portrait-0.webp`,
  // not `portrait-afro-medium.webp`) — the production code references
  // them by slot, not slug, so this insulates the runtime from prompt
  // name changes.
  let written = 0
  let skipped = 0
  let failed = 0

  for (let slot = 0; slot < PROMPTS.length; slot++) {
    const prompt = PROMPTS[slot]
    const sourceName = raws.find((f) => basename(f, extname(f)) === prompt.name)
    if (!sourceName) {
      console.warn(`! slot ${slot} (${prompt.name}): no raw image found, skipping`)
      failed++
      continue
    }

    const inPath = join(RAW_DIR, sourceName)
    const outPath = join(OUT_DIR, `portrait-${slot}.png`)

    if (!FORCE && (await fileExists(outPath))) {
      console.log(`✓ portrait-${slot}.png already exists, skipping (use --force to regen)`)
      skipped++
      continue
    }

    process.stdout.write(`→ slot ${slot} (${prompt.name}) ... `)
    try {
      const image = await Jimp.read(inPath)
      // Resize covers from the largest dimension. The raw portraits
      // are square 768×768 so this is effectively a downscale.
      image.resize({ w: SIZE, h: SIZE })
      await image.write(outPath as `${string}.png`)
      console.log('done')
      written++
    } catch (err) {
      console.log('FAILED')
      console.error(`  ${err instanceof Error ? err.message : err}`)
      failed++
    }
  }

  console.log(`\nWrote ${written}, skipped ${skipped}, failed ${failed}`)
  console.log(`Output: ${OUT_DIR}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

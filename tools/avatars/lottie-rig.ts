/**
 * Hand-written Lottie rigger. Produces self-contained `slot-<N>.json`
 * files in `src/assets/avatar-lotties/` for surfaces that opt into
 * Phase 4 character motion (Settings hero, future profile cards).
 *
 * Why not Lottie Creator: project creation in Creator's web app is
 * paid-tier-only as of 2026-05. Lottie itself is just JSON, and the
 * motion brief (one image layer, two property tracks: rotation +
 * position-y) is well within hand-written territory. This module
 * gives us a reproducible, versionable rig pipeline that doesn't
 * depend on a third-party GUI.
 *
 * Usage:
 *   npm run avatars:lottie -- --slot 6
 *   npm run avatars:lottie -- --slot 6 --force      # overwrite existing
 *   npm run avatars:lottie -- --all                  # rig every slot with a config
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOTION_CONFIGS, type MotionConfig } from './lottie-motions.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const THUMBS_DIR = join(HERE, '..', '..', 'public', 'avatars')
const OUT_DIR = join(HERE, '..', '..', 'src', 'assets', 'avatar-lotties')

const argv = process.argv.slice(2)
const FORCE = argv.includes('--force')
const ALL = argv.includes('--all')

const slotFlagIdx = argv.indexOf('--slot')
const SLOT =
  slotFlagIdx >= 0 && argv[slotFlagIdx + 1]
    ? Number.parseInt(argv[slotFlagIdx + 1], 10)
    : null

// Lottie schema version we target. lottie-web 5.x reads this fine.
const LOTTIE_VERSION = '5.7.4'

// Composition spec — kept identical across all slots so the wrapper's
// breath cycle stays consistent in scale and the Settings hero isn't
// special-cased.
const FRAMERATE = 60
const DURATION_S = 10
const TOTAL_FRAMES = FRAMERATE * DURATION_S // 600
const CANVAS_SIZE = 256

interface LottieKeyframeScalar {
  t: number
  s: [number]
  i?: { x: [number]; y: [number] }
  o?: { x: [number]; y: [number] }
  h?: 0 | 1
}

interface LottieKeyframeVector {
  t: number
  s: [number, number, number]
  i?: { x: number[]; y: number[] }
  o?: { x: number[]; y: number[] }
  h?: 0 | 1
}

/** Convert our config-shaped scalar keyframes (frame/value/easing) into
 *  the Lottie JSON shape with proper in/out tangents on every step. */
function buildScalarKeyframes(
  steps: ReadonlyArray<{ frame: number; value: number; easing?: [number, number, number, number] }>,
): LottieKeyframeScalar[] {
  return steps.map((step, i) => {
    const last = i === steps.length - 1
    const next = steps[i + 1]
    const easing = step.easing ?? [0.42, 0, 0.58, 1]
    const out: LottieKeyframeScalar = {
      t: step.frame,
      s: [step.value],
      h: 0,
    }
    if (!last && next) {
      out.o = { x: [easing[0]], y: [easing[1]] }
      out.i = { x: [easing[2]], y: [easing[3]] }
    }
    return out
  })
}

function buildVectorKeyframes(
  steps: ReadonlyArray<{
    frame: number
    value: { x: number; y: number; z?: number }
    easing?: [number, number, number, number]
  }>,
): LottieKeyframeVector[] {
  return steps.map((step, i) => {
    const last = i === steps.length - 1
    const next = steps[i + 1]
    const easing = step.easing ?? [0.42, 0, 0.58, 1]
    const out: LottieKeyframeVector = {
      t: step.frame,
      s: [step.value.x, step.value.y, step.value.z ?? 0],
      h: 0,
    }
    if (!last && next) {
      // Lottie tangents are per-axis arrays; we use the same easing on
      // each component since our motion is uniformly eased.
      out.o = { x: [easing[0], easing[0], easing[0]], y: [easing[1], easing[1], easing[1]] }
      out.i = { x: [easing[2], easing[2], easing[2]], y: [easing[3], easing[3], easing[3]] }
    }
    return out
  })
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function buildLottie(slot: number, motion: MotionConfig): Promise<unknown> {
  const pngPath = join(THUMBS_DIR, `portrait-${slot}.png`)
  const png = await readFile(pngPath)
  const base64 = png.toString('base64')
  const dataUri = `data:image/png;base64,${base64}`

  const rotationKeyframes = buildScalarKeyframes(motion.rotation)
  const positionKeyframes = buildVectorKeyframes(
    motion.position.map((p) => ({
      frame: p.frame,
      value: { x: p.x, y: p.y },
      easing: p.easing,
    })),
  )

  return {
    v: LOTTIE_VERSION,
    fr: FRAMERATE,
    ip: 0,
    op: TOTAL_FRAMES,
    w: CANVAS_SIZE,
    h: CANVAS_SIZE,
    nm: `staija-avatar-slot-${slot}`,
    ddd: 0,
    assets: [
      {
        id: 'image_0',
        w: CANVAS_SIZE,
        h: CANVAS_SIZE,
        u: '',
        p: dataUri,
        e: 1,
      },
    ],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 2, // image layer
        nm: `portrait-${slot}`,
        refId: 'image_0',
        sr: 1,
        ks: {
          // Anchor at center of the 256×256 canvas so rotation pivots
          // around the head, not the corner.
          a: { a: 0, k: [CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0] },
          p:
            positionKeyframes.length > 1
              ? { a: 1, k: positionKeyframes }
              : { a: 0, k: [CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0] },
          s: { a: 0, k: [100, 100, 100] },
          r:
            rotationKeyframes.length > 1
              ? { a: 1, k: rotationKeyframes }
              : { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        ip: 0,
        op: TOTAL_FRAMES,
        st: 0,
        bm: 0,
      },
    ],
    meta: {
      g: 'STAIJA lottie-rig',
      slot,
      motion: motion.label,
    },
  }
}

async function rigSlot(slot: number) {
  const motion = MOTION_CONFIGS[slot]
  if (!motion) {
    throw new Error(
      `No motion config for slot ${slot}. Add an entry in tools/avatars/lottie-motions.ts.`,
    )
  }
  const outPath = join(OUT_DIR, `slot-${slot}.json`)
  if (!FORCE && (await fileExists(outPath))) {
    console.log(`✓ slot-${slot}.json already exists, skipping (use --force)`)
    return
  }
  process.stdout.write(`→ rigging slot ${slot} (${motion.label}) ... `)
  const lottie = await buildLottie(slot, motion)
  await writeFile(outPath, JSON.stringify(lottie))
  const sizeKb = ((await readFile(outPath)).length / 1024).toFixed(1)
  console.log(`done (${sizeKb} KB)`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  if (ALL) {
    const slots = Object.keys(MOTION_CONFIGS).map(Number).sort((a, b) => a - b)
    if (slots.length === 0) {
      console.error('No motion configs defined. Edit tools/avatars/lottie-motions.ts.')
      process.exit(1)
    }
    for (const s of slots) await rigSlot(s)
    return
  }

  if (SLOT === null || Number.isNaN(SLOT)) {
    console.error(
      'Usage: tsx tools/avatars/lottie-rig.ts --slot <N> [--force] OR --all',
    )
    process.exit(1)
  }

  await rigSlot(SLOT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

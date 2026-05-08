/**
 * Generate raster avatar parts via either Pollinations.ai (free, no
 * auth) or the Hugging Face Inference SDK (HF's "free tier" is really
 * a small monthly credit budget routed to fal-ai — depletes after a
 * few images).
 *
 * Reads prompts from `./prompts.ts`, saves the resulting PNG to
 * `./raw/{name}.png`. Re-running is safe — existing files are skipped
 * unless --force is passed.
 *
 * Run with:
 *   # Default: Pollinations (free, no token needed)
 *   npx tsx tools/avatars/generate.ts
 *
 *   # HF (paid provider behind the scenes; needs HF_TOKEN env var)
 *   HF_TOKEN=hf_xxxxx npx tsx tools/avatars/generate.ts --provider hf
 *   HF_TOKEN=hf_xxxxx npx tsx tools/avatars/generate.ts --provider hf --model black-forest-labs/FLUX.1-dev
 *
 * Provider tradeoffs:
 *   - pollinations: free, no auth, ~3-8s/image, FLUX-based, slightly
 *     lower fidelity than HF's fal-ai routing but plenty for traced
 *     assets. Has a soft rate limit (one in-flight request) — we
 *     serialize requests below.
 *   - hf: pay-per-call via HF's Inference Providers router (currently
 *     fal-ai for FLUX models). High quality. Free tier is ~3-5 calls.
 */

// Load .env first if present, before any process.env reads. dotenv is
// no-op-safe if .env doesn't exist; it just means env vars must be
// exported in the shell instead.
import 'dotenv/config'
import { writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { InferenceClient } from '@huggingface/inference'
import {
  PROMPTS,
  STYLE_ANCHOR,
  NEGATIVE_BASE,
  type AvatarPrompt,
} from './prompts.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const RAW_DIR = join(HERE, 'raw')

// Flags
const argv = process.argv.slice(2)
const args = new Set(argv)
const FORCE = args.has('--force')
const providerFlagIdx = argv.indexOf('--provider')
const PROVIDER =
  providerFlagIdx >= 0 && argv[providerFlagIdx + 1]
    ? argv[providerFlagIdx + 1]
    : 'pollinations'
const modelFlagIdx = argv.indexOf('--model')
const MODEL =
  modelFlagIdx >= 0 && argv[modelFlagIdx + 1]
    ? argv[modelFlagIdx + 1]
    : 'black-forest-labs/FLUX.1-schnell'

if (PROVIDER !== 'pollinations' && PROVIDER !== 'hf') {
  console.error(`Unknown provider "${PROVIDER}". Valid: pollinations, hf`)
  process.exit(1)
}

// HF only — Pollinations needs nothing.
const HF_TOKEN = process.env.HF_TOKEN
if (PROVIDER === 'hf' && !HF_TOKEN) {
  console.error('--provider hf requires the HF_TOKEN env var.')
  console.error('Get one at https://huggingface.co/settings/tokens (read scope is fine).')
  process.exit(1)
}

const client = HF_TOKEN ? new InferenceClient(HF_TOKEN) : null

const MAX_RETRIES = 6
const FALLBACK_BACKOFF_MS = 8000

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function generateViaHf(p: AvatarPrompt): Promise<Buffer> {
  if (!client) throw new Error('HF client not initialized')
  // Style anchor LEADS the prompt — diffusion models weight earlier
  // tokens more heavily, and trailing the style was losing the
  // tug-of-war against subject-specific priors (e.g. "hijab portrait"
  // pulling toward photorealism).
  const inputs = `${STYLE_ANCHOR}. SUBJECT: ${p.prompt}`
  const negative_prompt = p.extraNegative
    ? `${NEGATIVE_BASE}, ${p.extraNegative}`
    : NEGATIVE_BASE

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // outputType: 'blob' is the default but the SDK has multiple
      // overloads (url / dataUrl / blob / json) and TS picks one based
      // on the options object. Pass it explicitly so we always get a
      // Blob back regardless of TS overload-resolution quirks.
      const blob = await client.textToImage(
        {
          model: MODEL,
          inputs,
          parameters: {
            negative_prompt,
            width: 1024,
            height: 1024,
            num_inference_steps: 4, // schnell is tuned for ~4 steps
          },
        },
        { outputType: 'blob' },
      )
      const arrayBuffer = await blob.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isCold = /503|loading|estimated_time/i.test(message)
      const isRateLimited = /429|rate limit/i.test(message)
      const isCreditDepleted = /depleted|credits|purchase/i.test(message)

      if (isCreditDepleted) {
        // Don't keep retrying when the account is out of money — that
        // just spams the same error. Surface immediately so the loop
        // can mark this prompt failed and move on (or so the user can
        // switch providers).
        throw new Error(
          `${message}\n  → switch to the free provider with: npm run avatars:generate -- --provider pollinations`,
        )
      }

      if (attempt < MAX_RETRIES && (isCold || isRateLimited)) {
        const waitMs = FALLBACK_BACKOFF_MS * attempt
        console.warn(
          `  [${p.name}] ${isCold ? 'cold model' : 'rate limited'} (attempt ${attempt}/${MAX_RETRIES}) — waiting ${Math.round(waitMs / 1000)}s`,
        )
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      throw new Error(`HF SDK error for ${p.name}: ${message}`)
    }
  }
  throw new Error(`Gave up on ${p.name} after ${MAX_RETRIES} attempts`)
}

async function generateViaPollinations(p: AvatarPrompt): Promise<Buffer> {
  // Pollinations.ai: free, no auth, GET endpoint that returns a PNG.
  // Their `prompt/{...}` route compiles the prompt + negative into
  // FLUX inputs and serves the image directly. Negative prompts are
  // baked into the URL via the `negative` query param.
  // Docs: https://pollinations.ai/
  // Style anchor LEADS the prompt — diffusion models weight earlier
  // tokens more heavily, and trailing the style was losing the
  // tug-of-war against subject-specific priors (e.g. "hijab portrait"
  // pulling toward photorealism).
  const inputs = `${STYLE_ANCHOR}. SUBJECT: ${p.prompt}`
  const negative = p.extraNegative
    ? `${NEGATIVE_BASE}, ${p.extraNegative}`
    : NEGATIVE_BASE

  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model: 'flux',
    nologo: 'true',
    private: 'true',
    enhance: 'false', // their built-in "enhance" rewrites the prompt; we don't want that
    negative,
  })
  // Use a stable seed per prompt name so re-runs that succeeded once
  // don't churn the output if you re-generate later. Hash the name so
  // the seed lives in a deterministic small range.
  let seed = 0
  for (const c of p.name) seed = ((seed << 5) - seed + c.charCodeAt(0)) | 0
  params.set('seed', String(Math.abs(seed) % 100000))

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(inputs)}?${params}`

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
      // Pollinations occasionally 502s under load. Retry with backoff.
      if (res.status >= 500 || res.status === 429) {
        const waitMs = FALLBACK_BACKOFF_MS * attempt
        console.warn(
          `  [${p.name}] Pollinations ${res.status} (attempt ${attempt}/${MAX_RETRIES}) — waiting ${Math.round(waitMs / 1000)}s`,
        )
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      const detail = await res.text().catch(() => '')
      throw new Error(`Pollinations ${res.status} for ${p.name}: ${detail.slice(0, 200)}`)
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const waitMs = FALLBACK_BACKOFF_MS * attempt
        console.warn(
          `  [${p.name}] network error (attempt ${attempt}/${MAX_RETRIES}) — waiting ${Math.round(waitMs / 1000)}s`,
        )
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      throw err
    }
  }
  throw new Error(`Gave up on ${p.name} after ${MAX_RETRIES} attempts`)
}

async function generateOne(p: AvatarPrompt): Promise<Buffer> {
  return PROVIDER === 'hf' ? generateViaHf(p) : generateViaPollinations(p)
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true })
  console.log(`Provider: ${PROVIDER}${PROVIDER === 'hf' ? ` (model: ${MODEL})` : ''}`)
  console.log(`Output: ${RAW_DIR}`)
  console.log(`Force regenerate: ${FORCE}\n`)

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const p of PROMPTS) {
    const outPath = join(RAW_DIR, `${p.name}.png`)
    if (!FORCE && (await fileExists(outPath))) {
      console.log(`✓ ${p.name} already exists, skipping (use --force to regenerate)`)
      skipped++
      continue
    }

    process.stdout.write(`→ ${p.name} ... `)
    try {
      const png = await generateOne(p)
      await writeFile(outPath, png)
      console.log('done')
      generated++
    } catch (err) {
      console.log('FAILED')
      console.error(`  ${err instanceof Error ? err.message : err}`)
      failed++
    }
  }

  console.log(`\nGenerated ${generated}, skipped ${skipped}, failed ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

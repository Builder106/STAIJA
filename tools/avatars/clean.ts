import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises'
import { join, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize, type Config } from 'svgo'
import { PROMPTS } from './prompts.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const TRACED_DIR = join(HERE, 'traced')
const CLEAN_DIR = join(HERE, 'clean')
const PARTS_TS = join(HERE, '..', '..', 'src', 'services', 'avatar', 'parts.ts')

const args = new Set(process.argv.slice(2))
const WRITE_PARTS = !args.has('--no-write-parts')

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

type SvgNode = any
const removeBackgroundLayerPlugin = {
  name: 'removeBackgroundLayer',
  fn: () => ({
    element: {
      enter: (node: SvgNode, parentNode: SvgNode) => {
        if (parentNode?.type !== 'element' || parentNode.name !== 'svg') return
        const firstElementChild = parentNode.children.find(
          (c: SvgNode) => c?.type === 'element',
        )
        if (firstElementChild !== node) return
        if (node.name !== 'path' && node.name !== 'rect') return

        const d: string = node.attributes?.d ?? ''
        if (node.name === 'path' && d.length < 800) return

        const fill: string = (node.attributes?.fill ?? '').toLowerCase()
        if (
          fill.includes('8b55ff') ||
          fill.includes('5edbe7') ||
          fill.includes('a878ff') ||
          fill.includes('6b3fe0')
        ) {
          return
        }

        parentNode.children = parentNode.children.filter(
          (c: SvgNode) => c !== node,
        )
      },
    },
  }),
}

/**
 * Custom SVGO plugin: drop the Vectorizer.ai watermark.
 * Watermarks in Vectorizer.ai use stroke paths with vector-effect="non-scaling-stroke".
 * The actual illustration vectors only use fill, not strokes!
 */
const removeWatermarkPlugin = {
  name: 'removeWatermark',
  fn: () => ({
    element: {
      enter: (node: SvgNode, parentNode: SvgNode) => {
        if (node.name !== 'path') return

        // Drop any path with `vector-effect="non-scaling-stroke"`
        if (node.attributes?.['vector-effect'] === 'non-scaling-stroke') {
          parentNode.children = parentNode.children.filter(
            (c: SvgNode) => c !== node,
          )
        }
      },
    },
  }),
}

const svgoConfig: Config = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertPathData: {
            floatPrecision: 2,
            transformPrecision: 2,
            applyTransforms: true,
          },
          cleanupIds: true,
          mergePaths: false,
          collapseGroups: false,
          convertShapeToPath: false,
        },
      },
    },
    removeBackgroundLayerPlugin,
    removeWatermarkPlugin,
    {
      name: 'removeAttrs',
      params: {
        attrs: ['data-.*', 'inkscape:.*', 'sodipodi:.*'],
      },
    },
    'removeDimensions',
  ] as Config['plugins'],
}

interface CleanedSvg {
  inner: string
  origSize: number
}

function cleanOne(svgInput: string): CleanedSvg {
  const result = optimize(svgInput, svgoConfig)
  const optimized = result.data

  const viewBoxMatch = optimized.match(/viewBox="([^"]+)"/)
  const viewBox = viewBoxMatch
    ? viewBoxMatch[1].trim().split(/\s+/).map(Number)
    : [0, 0, 1024, 1024]
  const origSize = Math.max(viewBox[2], viewBox[3])
  const scale = 80 / origSize

  const innerMatch = optimized.match(/<svg[^>]*>([\s\S]*)<\/svg>\s*$/)
  const innerRaw = innerMatch ? innerMatch[1] : optimized

  const inner = `<g transform="scale(${scale.toFixed(6)})">${innerRaw}</g>`

  return { inner, origSize }
}

function buildPartsTs(svgsByName: Map<string, string>): string {
  const portraitEntries = PROMPTS.map((p, i) => {
    const svg = svgsByName.get(p.name)
    if (!svg) {
      return `  // ${i} — ${p.name}: NOT YET CLEANED\n  '',`
    }
    const escaped = svg.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `  // ${i} — ${p.name}\n  '${escaped}',`
  })

  return `/**
 * SVG part library for the STAIJA avatar style.
 *
 * **Generated file** — produced by tools/avatars/clean.ts after the
 * generate → trace → clean pipeline. Hand-edits here will be
 * overwritten on the next \`npm run avatars:clean\`. To change a
 * portrait, edit the prompt in tools/avatars/prompts.ts and re-run
 * the pipeline.
 *
 * Architecture: whole-portrait avatars. Each entry is a complete
 * head/shoulders SVG fragment, scaled to fit the 0 0 80 80 viewBox.
 * The Dicebear style at ./style.ts seed-picks one per scholar.
 */

export const PORTRAITS: string[] = [
${portraitEntries.join('\n')}
]
`
}

async function main() {
  await mkdir(CLEAN_DIR, { recursive: true })

  const entries = await readdir(TRACED_DIR)
  const svgs = entries.filter((f) => extname(f).toLowerCase() === '.svg')

  let cleanedCount = 0
  const svgsByName = new Map<string, string>()

  for (const svg of svgs) {
    const name = basename(svg, '.svg')
    const inPath = join(TRACED_DIR, svg)
    const outPath = join(CLEAN_DIR, svg)

    const raw = await readFile(inPath, 'utf8')
    const { inner, origSize } = cleanOne(raw)

    const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${inner}</svg>`
    await writeFile(outPath, full)
    
    svgsByName.set(name, inner)
    cleanedCount++
  }

  if (WRITE_PARTS) {
    const partsContent = buildPartsTs(svgsByName)
    await writeFile(PARTS_TS, partsContent)
    console.log(`Wrote ${PARTS_TS}: ${cleanedCount} portraits inlined.`)
  }

  console.log(`Cleaned ${cleanedCount} SVGs. Watermarks stripped!`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

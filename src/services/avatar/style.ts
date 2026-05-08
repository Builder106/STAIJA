/**
 * STAIJA Dicebear style — `Style<TOptions>` impl that seed-picks one
 * portrait from the parts library.
 *
 * **Architecture (2026-05-06 pivot):** whole-portrait avatars. The
 * style picks one entry from `PORTRAITS` based on the seeded PRNG and
 * renders it as the entire avatar body. See `./parts.ts` for the
 * rationale behind the pivot away from layered parts.
 *
 * Usage:
 *   import { createAvatar } from '@dicebear/core'
 *   import { staijaStyle } from './style'
 *   const svg = createAvatar(staijaStyle, { seed: user.uid }).toString()
 */

import type { Style, StyleCreate } from '@dicebear/core'
import { PORTRAITS } from './parts'

// Empty options — the seed alone determines which portrait is picked.
// Future user-editable bits (e.g. forced portrait override for an
// "I don't see myself in any of these" preference) go here.
export interface StaijaStyleOptions {}

const create: StyleCreate<StaijaStyleOptions> = ({ prng }) => {
  // Seed-deterministic portrait selection. If PORTRAITS hasn't been
  // populated yet (the parts.ts stubs are empty strings), the avatar
  // renders as an empty body — the framework still produces a valid
  // SVG envelope, just without illustration content.
  const portrait = PORTRAITS.length > 0
    ? prng.pick(PORTRAITS, '')
    : ''

  return {
    attributes: {
      viewBox: '0 0 80 80',
      fill: 'none',
      'shape-rendering': 'auto',
    },
    body: portrait,
  }
}

export const staijaStyle: Style<StaijaStyleOptions> = {
  meta: {
    title: 'STAIJA Scholars',
    creator: 'Olayinka Vaughan',
    license: {
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
  schema: {
    title: 'STAIJA',
    type: 'object',
    properties: {},
  },
  create,
}

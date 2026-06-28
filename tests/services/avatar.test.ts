import { describe, it, expect, vi } from 'vitest'

// @dicebear/core exports via CJS (./lib/index.js) and its import chain
// through svg.ts → style.ts triggers a vitest SSR circular-dep pattern
// where createAvatar resolves as undefined. Mock at the test boundary —
// these tests cover the wrapper contract (correct SVG shape, viewBox,
// determinism), not Dicebear's own rendering.
vi.mock('@dicebear/core', () => ({
  createAvatar: (_style: unknown, opts: { seed: string }) => ({
    toString: () =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">${opts.seed}</svg>`,
    toDataUri: () =>
      `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">${opts.seed}</svg>`)}`,
  }),
}))

import { avatarSvg, avatarDataUri } from '../../src/services/avatar/svg'
import { avatarSeedFor } from '../../src/services/avatar'

describe('avatarSeedFor', () => {
  it('prefers uid over email', () => {
    expect(avatarSeedFor({ uid: 'abc', email: 'foo@bar.com' })).toBe('abc')
  })

  it('falls back to email when uid is missing', () => {
    expect(avatarSeedFor({ email: 'foo@bar.com' })).toBe('foo@bar.com')
  })

  it('falls back to a constant default when both are missing', () => {
    expect(avatarSeedFor({})).toBe('staija-default')
    expect(avatarSeedFor({ email: null })).toBe('staija-default')
  })
})

describe('avatarSvg', () => {
  // Architecture: whole-portrait avatars. PORTRAITS in
  // src/services/avatar/parts.ts is currently empty stubs — actual SVG
  // content lands there after the tools/avatars/ pipeline produces it.
  // These tests cover the framework contract that holds independent of
  // whether portraits are populated: valid SVG shape, correct viewBox,
  // determinism. Once PORTRAITS has real content, add coverage for
  // distinct seeds picking distinct portraits.

  it('returns a valid SVG string', () => {
    const svg = avatarSvg('alice')
    expect(svg).toMatch(/^<svg[^>]*>/)
    expect(svg).toMatch(/<\/svg>$/)
  })

  it('uses the 80x80 viewBox the parts library is authored against', () => {
    expect(avatarSvg('alice')).toMatch(/viewBox="0 0 80 80"/)
  })

  it('is deterministic — same seed always returns the same SVG', () => {
    const a = avatarSvg('amina')
    const b = avatarSvg('amina')
    expect(a).toBe(b)
  })
})

describe('avatarDataUri', () => {
  it('returns a data: URI string', () => {
    const uri = avatarDataUri('alice')
    expect(uri).toMatch(/^data:image\/svg\+xml/)
  })

  it('is deterministic per seed', () => {
    expect(avatarDataUri('amina')).toBe(avatarDataUri('amina'))
  })
})

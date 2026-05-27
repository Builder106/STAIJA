import { describe, it, expect } from 'vitest'
import {
  avatarDataUriForSlot,
  avatarSvgForSlot,
  PORTRAIT_SLOT_COUNT,
} from '../../src/services/avatar'

describe('avatarSvgForSlot', () => {
  it('returns an SVG string with the avatar viewBox', () => {
    const svg = avatarSvgForSlot(0)
    expect(svg).toMatch(/^<svg[^>]*viewBox="0 0 80 80"/)
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('returns different content for different slots when the library is populated', () => {
    if (PORTRAIT_SLOT_COUNT < 2) return // pipeline-not-run guard
    const a = avatarSvgForSlot(0)
    const b = avatarSvgForSlot(1)
    expect(a).not.toBe(b)
  })

  it('throws on an out-of-range slot', () => {
    expect(() => avatarSvgForSlot(PORTRAIT_SLOT_COUNT + 5)).toThrow(
      /out of range/,
    )
    expect(() => avatarSvgForSlot(-1)).toThrow(/out of range/)
  })
})

describe('avatarDataUriForSlot', () => {
  it('returns a data URI prefixed with the SVG mime', () => {
    expect(avatarDataUriForSlot(0)).toMatch(/^data:image\/svg\+xml;utf8,/)
  })
})

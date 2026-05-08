import { describe, it, expect } from 'vitest'
import {
  avatarThumbForSeed,
  avatarThumbForSlot,
  PORTRAIT_SLOT_COUNT,
  resolveAvatarSrc,
} from '../../src/services/avatar'

describe('resolveAvatarSrc', () => {
  it('uploaded photo wins over picked slot and seed', () => {
    const url = 'https://cdn.example.com/me.jpg'
    expect(
      resolveAvatarSrc({
        photoURL: url,
        avatarSlot: 3,
        seed: 'alice',
      }),
    ).toBe(url)
  })

  it('picked slot wins over seed when no photo is uploaded', () => {
    if (PORTRAIT_SLOT_COUNT < 2) return
    const result = resolveAvatarSrc({
      photoURL: null,
      avatarSlot: 1,
      seed: 'alice',
    })
    expect(result).toBe(avatarThumbForSlot(1))
  })

  it('falls back to the seeded thumb when neither override is set', () => {
    const result = resolveAvatarSrc({
      photoURL: null,
      avatarSlot: null,
      seed: 'alice',
    })
    expect(result).toBe(avatarThumbForSeed('alice'))
  })

  it('treats an out-of-range slot as no override (falls back to seed)', () => {
    const result = resolveAvatarSrc({
      photoURL: null,
      avatarSlot: PORTRAIT_SLOT_COUNT + 99,
      seed: 'alice',
    })
    expect(result).toBe(avatarThumbForSeed('alice'))
  })

  it('treats a negative slot as no override', () => {
    const result = resolveAvatarSrc({
      photoURL: null,
      avatarSlot: -1,
      seed: 'alice',
    })
    expect(result).toBe(avatarThumbForSeed('alice'))
  })

  it('empty-string photoURL is not a valid override', () => {
    // Form state often clears photoURL to '' rather than null. The
    // resolver must treat empty string the same as missing.
    const result = resolveAvatarSrc({
      photoURL: '',
      avatarSlot: null,
      seed: 'alice',
    })
    expect(result).toBe(avatarThumbForSeed('alice'))
  })
})

describe('avatarThumbForSlot', () => {
  it('returns the static URL for a valid slot', () => {
    expect(avatarThumbForSlot(0)).toBe('/avatars/portrait-0.png')
    expect(avatarThumbForSlot(9)).toBe('/avatars/portrait-9.png')
  })

  it('throws on out-of-range slot', () => {
    expect(() => avatarThumbForSlot(-1)).toThrow(/out of range/)
    expect(() => avatarThumbForSlot(PORTRAIT_SLOT_COUNT + 1)).toThrow(
      /out of range/,
    )
  })
})

describe('avatarThumbForSeed', () => {
  // The brand chose a single universal default rather than seed-based
  // randomization, so `avatarThumbForSeed` ignores the seed and always
  // returns the same slot's URL. The seed parameter is kept for API
  // symmetry with the other helpers.
  const UNIVERSAL_DEFAULT_URL = '/avatars/portrait-6.png'

  it('returns the universal default URL regardless of seed', () => {
    expect(avatarThumbForSeed('alice')).toBe(UNIVERSAL_DEFAULT_URL)
    expect(avatarThumbForSeed('bob')).toBe(UNIVERSAL_DEFAULT_URL)
    expect(avatarThumbForSeed('')).toBe(UNIVERSAL_DEFAULT_URL)
  })

  it('returns a valid slot URL', () => {
    expect(avatarThumbForSeed('alice')).toMatch(
      /^\/avatars\/portrait-\d\.png$/,
    )
  })
})

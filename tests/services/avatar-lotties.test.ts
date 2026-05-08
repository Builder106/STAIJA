import { describe, it, expect } from 'vitest'
import {
  hasLottieForSlot,
  loadLottieForSlot,
} from '../../src/services/avatar/lotties'
import { PORTRAIT_SLOT_COUNT } from '../../src/services/avatar'

/**
 * The lookup is glob-driven via Vite. With the directory empty
 * (default state — Phase 4 is opt-in), every slot returns false /
 * null. These tests guard the contract: the helper must NOT throw
 * for slots without files; it should silently return null/false so
 * callers can fall back to the static thumbnail.
 *
 * When a real `slot-<N>.json` is dropped into
 * `src/assets/avatar-lotties/`, the corresponding slot will start
 * returning true / a parsed module — at which point a follow-up test
 * can assert that.
 */

describe('hasLottieForSlot', () => {
  it('returns false for every slot when no Lottie files are present', () => {
    for (let slot = 0; slot < PORTRAIT_SLOT_COUNT; slot++) {
      expect(hasLottieForSlot(slot)).toBe(false)
    }
  })

  it('returns false for out-of-range slots without throwing', () => {
    expect(hasLottieForSlot(-1)).toBe(false)
    expect(hasLottieForSlot(PORTRAIT_SLOT_COUNT + 99)).toBe(false)
  })
})

describe('loadLottieForSlot', () => {
  it('resolves to null for slots with no file', async () => {
    expect(await loadLottieForSlot(0)).toBeNull()
    expect(await loadLottieForSlot(6)).toBeNull()
  })

  it('resolves to null for out-of-range slots without throwing', async () => {
    expect(await loadLottieForSlot(-1)).toBeNull()
    expect(await loadLottieForSlot(PORTRAIT_SLOT_COUNT + 99)).toBeNull()
  })
})

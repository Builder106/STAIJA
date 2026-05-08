import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  AVATAR_BREATH_AMPLITUDE,
  AVATAR_DURATIONS,
  AVATAR_EASINGS,
  usePrefersReducedMotion,
} from '../../src/composables/useAvatarMotion'

/**
 * usePrefersReducedMotion needs a host component to exercise its
 * lifecycle hooks. We mount a no-op component and read the ref it
 * exposes.
 */

interface MqlMock extends MediaQueryList {
  trigger: (matches: boolean) => void
}

function buildMatchMediaMock(initial: boolean): MqlMock {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mql = {
    matches: initial,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners.push(fn)
    },
    removeEventListener: (
      _: string,
      fn: (e: MediaQueryListEvent) => void,
    ) => {
      listeners = listeners.filter((l) => l !== fn)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MqlMock
  mql.trigger = (matches: boolean) => {
    mql.matches = matches
    listeners.forEach((fn) =>
      fn({ matches } as unknown as MediaQueryListEvent),
    )
  }
  return mql
}

function mountHost(mql: MqlMock) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => mql)

  let exposed!: ReturnType<typeof usePrefersReducedMotion>
  const Host = defineComponent({
    setup() {
      exposed = usePrefersReducedMotion()
      return () => h('div')
    },
  })
  const wrapper = mount(Host)
  return { wrapper, getRef: () => exposed }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePrefersReducedMotion', () => {
  it('starts false when the OS does not request reduced motion', () => {
    const mql = buildMatchMediaMock(false)
    const { getRef } = mountHost(mql)
    expect(getRef().prefersReducedMotion.value).toBe(false)
  })

  it('starts true when the OS does request reduced motion', () => {
    const mql = buildMatchMediaMock(true)
    const { getRef } = mountHost(mql)
    expect(getRef().prefersReducedMotion.value).toBe(true)
  })

  it('flips reactively when the OS preference changes mid-session', async () => {
    const mql = buildMatchMediaMock(false)
    const { getRef } = mountHost(mql)
    expect(getRef().prefersReducedMotion.value).toBe(false)

    mql.trigger(true)
    await nextTick()
    expect(getRef().prefersReducedMotion.value).toBe(true)

    mql.trigger(false)
    await nextTick()
    expect(getRef().prefersReducedMotion.value).toBe(false)
  })

  it('cleans up its listener on unmount', () => {
    const mql = buildMatchMediaMock(false)
    const removeSpy = vi.spyOn(mql, 'removeEventListener')
    const { wrapper } = mountHost(mql)
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalled()
  })
})

describe('avatar motion constants', () => {
  it('exposes durations in seconds (Motion-V unit)', () => {
    expect(AVATAR_DURATIONS.mount).toBeGreaterThan(0)
    expect(AVATAR_DURATIONS.mount).toBeLessThan(1)
    expect(AVATAR_DURATIONS.breath).toBeGreaterThan(1)
  })

  it('breath amplitudes are small enough to read as subtle motion', () => {
    expect(AVATAR_BREATH_AMPLITUDE.idle).toBeLessThan(0.05)
    expect(AVATAR_BREATH_AMPLITUDE.hero).toBeLessThan(0.05)
    expect(AVATAR_BREATH_AMPLITUDE.hero).toBeGreaterThan(
      AVATAR_BREATH_AMPLITUDE.idle,
    )
  })

  it('exposes cubic-bezier easing tuples', () => {
    expect(AVATAR_EASINGS.back).toHaveLength(4)
    expect(AVATAR_EASINGS.out).toHaveLength(4)
    expect(AVATAR_EASINGS.inOut).toHaveLength(4)
  })
})

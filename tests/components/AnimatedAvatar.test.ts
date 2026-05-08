import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AnimatedAvatar from '../../src/components/avatars/AnimatedAvatar.vue'

/**
 * AnimatedAvatar is a thin Motion-V wrapper. We don't try to assert
 * exact transition values (Motion-V's prop semantics are its own
 * concern) — instead we cover the wrapper's externally-visible
 * contract: that it renders the image, threads alt + size through,
 * and respects `prefers-reduced-motion`.
 *
 * matchMedia is mocked because happy-dom's default doesn't respond to
 * the reduce-motion query.
 */

function mockMatchMedia(prefersReducedMotion: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({
    matches:
      q.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  } as MediaQueryList))
}

const TEST_SRC = 'data:image/svg+xml;utf8,%3Csvg/%3E'

beforeEach(() => {
  mockMatchMedia(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AnimatedAvatar', () => {
  it('renders an img with the provided src and alt', () => {
    const wrapper = mount(AnimatedAvatar, {
      props: { src: TEST_SRC, alt: 'Yinka' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(TEST_SRC)
    expect(img.attributes('alt')).toBe('Yinka')
  })

  it('defaults alt to empty string for decorative avatars', () => {
    const wrapper = mount(AnimatedAvatar, { props: { src: TEST_SRC } })
    expect(wrapper.find('img').attributes('alt')).toBe('')
  })

  it('applies the requested size to width and height', () => {
    const wrapper = mount(AnimatedAvatar, {
      props: { src: TEST_SRC, size: 120 },
    })
    const img = wrapper.find('img')
    expect(img.attributes('width')).toBe('120')
    expect(img.attributes('height')).toBe('120')
  })

  it('marks the image as non-draggable so it stays still during interactions', () => {
    const wrapper = mount(AnimatedAvatar, { props: { src: TEST_SRC } })
    expect(wrapper.find('img').attributes('draggable')).toBe('false')
  })

  it('mounts without throwing when prefers-reduced-motion is set', () => {
    mockMatchMedia(true)
    const wrapper = mount(AnimatedAvatar, {
      props: { src: TEST_SRC, state: 'hero' },
    })
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('mounts every documented state without throwing', () => {
    for (const state of ['idle', 'hero', 'static'] as const) {
      const wrapper = mount(AnimatedAvatar, {
        props: { src: TEST_SRC, state },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    }
  })
})

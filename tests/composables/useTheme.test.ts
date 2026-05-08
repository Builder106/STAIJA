import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// localStorage shim is provided globally by tests/setup.ts.
//
// useTheme keeps a MODULE-LEVEL state (single source of truth across
// the app, intentionally) which means the `choice` ref initializes
// from localStorage exactly once when the module first loads. To
// exercise different starting states, each test seeds localStorage
// and matchMedia FIRST, then dynamically imports the module via
// `vi.resetModules() + await import(...)`. Static `import { useTheme }`
// at the top of the file would lock in the env state at file-load,
// not test-start.

function setMatchMedia(prefersDark: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({
    matches: prefersDark,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  } as MediaQueryList))
}

async function loadFresh() {
  vi.resetModules()
  const mod = await import('../../src/composables/useTheme')
  return mod.useTheme
}

function harness(useTheme: () => ReturnType<Awaited<ReturnType<typeof loadFresh>>>) {
  let captured!: ReturnType<typeof useTheme>
  const Stub = defineComponent({
    setup() {
      captured = useTheme()
      return () => h('div')
    },
  })
  mount(Stub)
  return captured
}

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
    setMatchMedia(false) // OS prefers light by default
  })

  describe('initial choice', () => {
    it('defaults to "system" when nothing is stored', async () => {
      const useTheme = await loadFresh()
      const { choice } = harness(useTheme)
      expect(choice.value).toBe('system')
    })

    it('reads "light" from localStorage', async () => {
      window.localStorage.setItem('staija.theme', 'light')
      const useTheme = await loadFresh()
      const { choice } = harness(useTheme)
      expect(choice.value).toBe('light')
    })

    it('reads "dark" from localStorage', async () => {
      window.localStorage.setItem('staija.theme', 'dark')
      const useTheme = await loadFresh()
      const { choice } = harness(useTheme)
      expect(choice.value).toBe('dark')
    })

    it('falls back to "system" for unrecognized stored values', async () => {
      window.localStorage.setItem('staija.theme', 'midnight')
      const useTheme = await loadFresh()
      const { choice } = harness(useTheme)
      expect(choice.value).toBe('system')
    })
  })

  describe('resolved theme', () => {
    it('forces light when choice is "light"', async () => {
      window.localStorage.setItem('staija.theme', 'light')
      const useTheme = await loadFresh()
      const { resolved } = harness(useTheme)
      expect(resolved.value).toBe('light')
    })

    it('forces dark when choice is "dark"', async () => {
      window.localStorage.setItem('staija.theme', 'dark')
      const useTheme = await loadFresh()
      const { resolved } = harness(useTheme)
      expect(resolved.value).toBe('dark')
    })

    it('follows system preference when choice is "system" (OS=light)', async () => {
      setMatchMedia(false)
      const useTheme = await loadFresh()
      const { resolved } = harness(useTheme)
      expect(resolved.value).toBe('light')
    })

    it('follows system preference when choice is "system" (OS=dark)', async () => {
      setMatchMedia(true)
      const useTheme = await loadFresh()
      const { resolved } = harness(useTheme)
      expect(resolved.value).toBe('dark')
    })
  })

  describe('toggle()', () => {
    it('cycles light → dark → system → light', async () => {
      window.localStorage.setItem('staija.theme', 'light')
      const useTheme = await loadFresh()
      const { choice, toggle } = harness(useTheme)
      expect(choice.value).toBe('light')
      toggle()
      expect(choice.value).toBe('dark')
      toggle()
      expect(choice.value).toBe('system')
      toggle()
      expect(choice.value).toBe('light')
    })

    it('cycles starting from "system"', async () => {
      const useTheme = await loadFresh()
      const { choice, toggle } = harness(useTheme)
      expect(choice.value).toBe('system')
      toggle() // → light
      expect(choice.value).toBe('light')
    })
  })

  describe('setTheme()', () => {
    it('persists to localStorage', async () => {
      const useTheme = await loadFresh()
      const { setTheme } = harness(useTheme)
      setTheme('dark')
      expect(window.localStorage.getItem('staija.theme')).toBe('dark')
    })

    it('updates choice immediately', async () => {
      const useTheme = await loadFresh()
      const { choice, setTheme } = harness(useTheme)
      setTheme('dark')
      expect(choice.value).toBe('dark')
    })
  })

  describe('document side effects', () => {
    it('applies data-theme="dark" to <html> when resolved is dark', async () => {
      window.localStorage.setItem('staija.theme', 'dark')
      const useTheme = await loadFresh()
      harness(useTheme)
      await nextTick()
      expect(document.documentElement.dataset.theme).toBe('dark')
    })

    it('applies data-theme="light" to <html> when resolved is light', async () => {
      window.localStorage.setItem('staija.theme', 'light')
      const useTheme = await loadFresh()
      harness(useTheme)
      await nextTick()
      expect(document.documentElement.dataset.theme).toBe('light')
    })

    it('updates color-scheme to match resolved theme', async () => {
      window.localStorage.setItem('staija.theme', 'dark')
      const useTheme = await loadFresh()
      harness(useTheme)
      await nextTick()
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })

    it('flips data-theme when toggle changes resolved value', async () => {
      window.localStorage.setItem('staija.theme', 'light')
      const useTheme = await loadFresh()
      const { toggle } = harness(useTheme)
      await nextTick()
      expect(document.documentElement.dataset.theme).toBe('light')

      toggle() // → dark
      await nextTick()
      expect(document.documentElement.dataset.theme).toBe('dark')
    })

    it('updates meta[name="theme-color"] when present', async () => {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#ffffff'
      document.head.appendChild(meta)
      try {
        window.localStorage.setItem('staija.theme', 'dark')
        const useTheme = await loadFresh()
        harness(useTheme)
        await nextTick()
        expect(meta.content).toBe('#0B0E12')
      } finally {
        document.head.removeChild(meta)
      }
    })
  })
})

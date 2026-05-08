import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, defineComponent, h, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useAutoSave, type AutoSaveHandle } from '../../src/composables/useAutoSave'

// localStorage shim is provided globally by tests/setup.ts (see comment
// there for the env-quirk diagnosis). Each test just clears between runs.

/**
 * useAutoSave invokes onMounted / onBeforeUnmount and watch(), so the
 * tests need a Vue component context. This harness mounts a stub
 * component, captures the handle on first render, and exposes it back
 * to the test.
 */
function harness<T extends object>(key: string, state: Ref<T>, options?: Parameters<typeof useAutoSave>[2]): AutoSaveHandle {
  let captured!: AutoSaveHandle
  const Stub = defineComponent({
    setup() {
      captured = useAutoSave(key, state, options)
      return () => h('div')
    },
  })
  mount(Stub)
  return captured
}

describe('useAutoSave', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('peek()', () => {
    it('returns null when no draft exists', () => {
      const state = ref({ a: 1 })
      const { peek } = harness('test.peek-empty', state, { skipRestore: true })
      expect(peek()).toBe(null)
    })

    it('returns null for malformed JSON in storage', () => {
      window.localStorage.setItem('staija.draft.test.peek-malformed', '{not-json')
      const state = ref({ a: 1 })
      const { peek } = harness('test.peek-malformed', state, { skipRestore: true })
      expect(peek()).toBe(null)
      // Cleanup happens silently — malformed entry is removed.
      expect(window.localStorage.getItem('staija.draft.test.peek-malformed')).toBe(null)
    })

    it('returns null for drafts past TTL (14 days)', () => {
      const ancient = {
        v: 1,
        savedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        data: { a: 999 },
      }
      window.localStorage.setItem('staija.draft.test.peek-stale', JSON.stringify(ancient))
      const state = ref({ a: 1 })
      const { peek } = harness('test.peek-stale', state, { skipRestore: true })
      expect(peek()).toBe(null)
      // Stale draft is auto-removed.
      expect(window.localStorage.getItem('staija.draft.test.peek-stale')).toBe(null)
    })

    it('returns the savedAt Date for a fresh draft without mutating state', () => {
      const recent = {
        v: 1,
        savedAt: Date.now() - 1000,
        data: { a: 999 },
      }
      window.localStorage.setItem('staija.draft.test.peek-fresh', JSON.stringify(recent))
      const state = ref({ a: 1 })
      const { peek } = harness('test.peek-fresh', state, { skipRestore: true })

      const result = peek()
      expect(result).toBeInstanceOf(Date)
      expect(result?.getTime()).toBe(recent.savedAt)
      // peek is non-destructive — state is untouched.
      expect(state.value.a).toBe(1)
    })

    it('rejects drafts with the wrong schema version', () => {
      const wrongVersion = { v: 99, savedAt: Date.now(), data: { a: 999 } }
      window.localStorage.setItem('staija.draft.test.peek-version', JSON.stringify(wrongVersion))
      const state = ref({ a: 1 })
      const { peek } = harness('test.peek-version', state, { skipRestore: true })
      expect(peek()).toBe(null)
    })
  })

  describe('restore()', () => {
    it('returns false when no draft exists', () => {
      const state = ref({ a: 1 })
      const { restore } = harness('test.restore-empty', state, { skipRestore: true })
      expect(restore()).toBe(false)
      expect(state.value.a).toBe(1)
    })

    it('overwrites state with stored draft and returns true', () => {
      const stored = {
        v: 1,
        savedAt: Date.now() - 1000,
        data: { a: 999, b: 'hello' },
      }
      window.localStorage.setItem('staija.draft.test.restore-fresh', JSON.stringify(stored))
      const state = ref<{ a: number; b?: string; c?: boolean }>({ a: 1, c: true })
      const { restore, restored, lastSavedAt } = harness('test.restore-fresh', state, { skipRestore: true })

      expect(restore()).toBe(true)
      expect(state.value.a).toBe(999)
      expect(state.value.b).toBe('hello')
      // Shallow merge: keys NOT in the stored draft survive (the form's
      // default shape persists when new fields land between sessions).
      expect(state.value.c).toBe(true)
      expect(restored.value).toBe(true)
      expect(lastSavedAt.value?.getTime()).toBe(stored.savedAt)
    })

    it('returns false for stale drafts and clears them', () => {
      const ancient = {
        v: 1,
        savedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        data: { a: 999 },
      }
      window.localStorage.setItem('staija.draft.test.restore-stale', JSON.stringify(ancient))
      const state = ref({ a: 1 })
      const { restore } = harness('test.restore-stale', state, { skipRestore: true })

      expect(restore()).toBe(false)
      expect(state.value.a).toBe(1) // untouched
      expect(window.localStorage.getItem('staija.draft.test.restore-stale')).toBe(null)
    })
  })

  describe('clear()', () => {
    it('removes the persisted draft', () => {
      const stored = { v: 1, savedAt: Date.now(), data: { a: 1 } }
      window.localStorage.setItem('staija.draft.test.clear', JSON.stringify(stored))
      const state = ref({ a: 1 })
      const { clear } = harness('test.clear', state, { skipRestore: true })

      clear()
      expect(window.localStorage.getItem('staija.draft.test.clear')).toBe(null)
    })
  })

  describe('persist on change (debounced)', () => {
    it('writes the form to storage after the debounce window', async () => {
      vi.useFakeTimers()
      try {
        const state = ref({ a: 1 })
        const { peek } = harness('test.persist', state, {
          skipRestore: true,
          debounceMs: 100,
        })
        // Mutate state — should trigger the deep watcher.
        state.value.a = 42
        // Wait for the debounce to fire.
        await vi.advanceTimersByTimeAsync(150)
        const ts = peek()
        expect(ts).toBeInstanceOf(Date)
        const raw = window.localStorage.getItem('staija.draft.test.persist')
        expect(raw).toBeTruthy()
        const parsed = JSON.parse(raw!)
        expect(parsed.data.a).toBe(42)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AvatarPicker from '../../src/components/avatars/AvatarPicker.vue'
import { PORTRAIT_SLOT_COUNT } from '../../src/services/avatar'

/**
 * AvatarPicker is a controlled modal — the parent owns `open` and
 * receives `apply`/`close` events. We mount with the modal open so
 * the Teleport target body has the markup available to query.
 */

beforeEach(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (q: string) =>
      ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

function mountPicker(propsOverride: Partial<{
  open: boolean
  current: number | null
  seed: string
}> = {}) {
  return mount(AvatarPicker, {
    props: {
      open: true,
      current: null,
      seed: 'test-seed',
      ...propsOverride,
    },
    attachTo: document.body,
  })
}

describe('AvatarPicker', () => {
  it('renders a cell for the seeded default plus every library slot', () => {
    mountPicker()
    // Each cell is a button with role; image inside.
    const cells = document.body.querySelectorAll('.picker-cell')
    expect(cells.length).toBe(PORTRAIT_SLOT_COUNT + 1)
  })

  it('marks the current selection as pressed when opened', () => {
    mountPicker({ current: 2 })
    const cells = document.body.querySelectorAll<HTMLButtonElement>('.picker-cell')
    // Cell 0 is the "default" option, then slots 0..N. So slot 2 is at index 3.
    expect(cells[3].getAttribute('aria-pressed')).toBe('true')
  })

  it('marks the default cell as pressed when current is null', () => {
    mountPicker({ current: null })
    const cells = document.body.querySelectorAll<HTMLButtonElement>('.picker-cell')
    expect(cells[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('emits apply with the selected slot when Apply is clicked', async () => {
    const wrapper = mountPicker({ current: null })
    const cells = document.body.querySelectorAll<HTMLButtonElement>('.picker-cell')
    cells[4].click() // index 4 = slot 3
    const applyBtn = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('.picker-btn'),
    ).find((b) => b.textContent?.trim() === 'Apply')!
    applyBtn.click()
    expect(wrapper.emitted('apply')).toEqual([[3]])
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits apply with null when the default cell is selected', async () => {
    const wrapper = mountPicker({ current: 5 })
    const cells = document.body.querySelectorAll<HTMLButtonElement>('.picker-cell')
    cells[0].click() // default
    const applyBtn = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('.picker-btn'),
    ).find((b) => b.textContent?.trim() === 'Apply')!
    applyBtn.click()
    expect(wrapper.emitted('apply')).toEqual([[null]])
  })

  it('emits close on Cancel without emitting apply', async () => {
    const wrapper = mountPicker({ current: 2 })
    const cells = document.body.querySelectorAll<HTMLButtonElement>('.picker-cell')
    cells[1].click() // slot 0 — would change selection if applied
    const cancelBtn = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('.picker-btn'),
    ).find((b) => b.textContent?.trim() === 'Cancel')!
    cancelBtn.click()
    expect(wrapper.emitted('apply')).toBeFalsy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not render anything in the body when closed', () => {
    mountPicker({ open: false })
    expect(document.body.querySelector('.picker-modal')).toBeNull()
  })

  it('emits close on Escape keydown', async () => {
    const wrapper = mountPicker()
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

import { describe, expect, it } from 'vitest'
import { hiddenControlProps, isTopDialog, nextDialogFocus, pushDialog, removeDialog } from './useDialogFocus'

describe('nextDialogFocus', () => {
  const container = 'dialog'
  const targets = ['close', 'option', 'save']
  const inside = (node: string | null) => node === container || (node !== null && targets.includes(node))

  it('moves focus into the dialog when focus is outside it (the trigger behind the sheet)', () => {
    expect(nextDialogFocus(targets, 'page-button', container, false, inside)).toBe('close')
    expect(nextDialogFocus(targets, 'page-button', container, true, inside)).toBe('save')
  })

  it('moves from the dialog itself to its first or last control', () => {
    expect(nextDialogFocus(targets, container, container, false, inside)).toBe('close')
    expect(nextDialogFocus(targets, container, container, true, inside)).toBe('save')
  })

  it('wraps Tab from the last control and Shift+Tab from the first', () => {
    expect(nextDialogFocus(targets, 'save', container, false, inside)).toBe('close')
    expect(nextDialogFocus(targets, 'close', container, true, inside)).toBe('save')
  })

  it('leaves normal Tab moves inside the dialog to the browser', () => {
    expect(nextDialogFocus(targets, 'option', container, false, inside)).toBeNull()
    expect(nextDialogFocus(targets, 'option', container, true, inside)).toBeNull()
  })

  it('keeps focus on the dialog when it has no controls', () => {
    expect(nextDialogFocus([], 'page-button', container, false, inside)).toBe(container)
  })
})

describe('dialog stack', () => {
  it('lets only the most recently opened dialog handle keys', () => {
    const outer = {}
    const inner = {}
    pushDialog(outer)
    expect(isTopDialog(outer)).toBe(true)
    pushDialog(inner)
    expect(isTopDialog(outer)).toBe(false)
    expect(isTopDialog(inner)).toBe(true)
    removeDialog(inner)
    expect(isTopDialog(outer)).toBe(true)
    removeDialog(outer)
    expect(isTopDialog(outer)).toBe(false)
  })
})

describe('hiddenControlProps', () => {
  it('makes a hidden dock inert and hides it from assistive tech', () => {
    expect(hiddenControlProps(true)).toEqual({ inert: '', 'aria-hidden': true })
  })

  it('adds nothing while the control is visible', () => {
    expect(hiddenControlProps(false)).toEqual({})
  })
})

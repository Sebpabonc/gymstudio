import { describe, expect, it } from 'vitest'
import { isTextEntryElement } from './textEntryFocus'

describe('isTextEntryElement', () => {
  it('detects elements that open the keyboard', () => {
    expect(isTextEntryElement({ tagName: 'INPUT', type: 'text' })).toBe(true)
    expect(isTextEntryElement({ tagName: 'INPUT', type: 'number' })).toBe(true)
    expect(isTextEntryElement({ tagName: 'TEXTAREA' })).toBe(true)
    expect(isTextEntryElement({ tagName: 'SELECT' })).toBe(true)
  })

  it('ignores other elements', () => {
    expect(isTextEntryElement({ tagName: 'BUTTON' })).toBe(false)
    expect(isTextEntryElement({ tagName: 'INPUT', type: 'checkbox' })).toBe(false)
    expect(isTextEntryElement(null)).toBe(false)
  })
})

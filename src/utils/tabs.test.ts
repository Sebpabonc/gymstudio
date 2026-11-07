import { describe, expect, it } from 'vitest'
import { tabKeyIndex } from './tabs'

describe('tabKeyIndex', () => {
  it('moves right and left with wrap-around', () => {
    expect(tabKeyIndex('ArrowRight', 0, 4)).toBe(1)
    expect(tabKeyIndex('ArrowRight', 3, 4)).toBe(0)
    expect(tabKeyIndex('ArrowLeft', 0, 4)).toBe(3)
    expect(tabKeyIndex('ArrowLeft', 2, 4)).toBe(1)
  })

  it('jumps to the first and last tab with Home and End', () => {
    expect(tabKeyIndex('Home', 2, 4)).toBe(0)
    expect(tabKeyIndex('End', 0, 4)).toBe(3)
  })

  it('ignores other keys and empty tab lists', () => {
    expect(tabKeyIndex('Enter', 1, 4)).toBeNull()
    expect(tabKeyIndex('Tab', 1, 4)).toBeNull()
    expect(tabKeyIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

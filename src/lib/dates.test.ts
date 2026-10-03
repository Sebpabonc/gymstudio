import { describe, expect, it } from 'vitest'
import { localIsoDate } from './dates'

describe('localIsoDate', () => {
  it('uses the local calendar date, not the UTC date', () => {
    expect(localIsoDate(new Date(2026, 9, 4, 7, 30))).toBe('2026-10-04')
    expect(localIsoDate(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
    expect(localIsoDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
})

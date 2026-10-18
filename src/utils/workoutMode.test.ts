import { describe, expect, it } from 'vitest'
import { nextWorkoutGroupIndex, shouldCollapseCompletedLogger, workoutChipState } from './workoutMode'

describe('nextWorkoutGroupIndex', () => {
  it('selects the next incomplete group after the current one', () => {
    expect(nextWorkoutGroupIndex([true, true, false, false], 1)).toBe(2)
  })

  describe('shouldCollapseCompletedLogger', () => {
    it('collapses a completed exercise from today until explicitly edited', () => {
      expect(shouldCollapseCompletedLogger(true, '2026-10-18T09:30:00.000Z', '2026-10-18', false)).toBe(true)
      expect(shouldCollapseCompletedLogger(true, '2026-10-18', '2026-10-18', true)).toBe(false)
      expect(shouldCollapseCompletedLogger(true, '2026-10-17', '2026-10-18', false)).toBe(false)
      expect(shouldCollapseCompletedLogger(false, '2026-10-18', '2026-10-18', false)).toBe(false)
      expect(shouldCollapseCompletedLogger(true, undefined, '2026-10-18', false)).toBe(false)
    })
  })

  describe('workoutChipState', () => {
    it('marks the current group before considering completion', () => {
      expect(workoutChipState(true, true)).toBe('current')
      expect(workoutChipState(false, true)).toBe('current')
    })

    it('marks completed and upcoming groups', () => {
      expect(workoutChipState(true, false)).toBe('done')
      expect(workoutChipState(false, false)).toBe('upcoming')
    })
  })

  it('skips completed groups and does not wrap to earlier groups', () => {
    expect(nextWorkoutGroupIndex([false, true, true, false], 2)).toBe(3)
    expect(nextWorkoutGroupIndex([false, true, true], 2)).toBe(-1)
  })

  it('starts at the first incomplete group when no group is active', () => {
    expect(nextWorkoutGroupIndex([true, false, false], -1)).toBe(1)
  })
})

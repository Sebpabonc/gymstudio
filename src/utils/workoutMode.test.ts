import { describe, expect, it } from 'vitest'
import { dayWorkoutStatus, nextWorkoutGroupIndex, shouldCollapseCompletedLogger, workoutChipState } from './workoutMode'

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

describe('dayWorkoutStatus', () => {
  const scope = { blockId: 'b6', dayKey: 'd1', weekStart: '2026-10-12', weekEnd: '2026-10-18' }
  const ids = ['bench', 'row', 'press']
  const entry = (exerciseId: string, date: string, dayKey = 'd1', blockId = 'b6') => ({ exerciseId, date, dayKey, blockId })

  it('is not started when nothing of this day was logged this week', () => {
    expect(dayWorkoutStatus(ids, [entry('bench', '2026-10-08'), entry('bench', '2026-10-13', 'd3')], scope))
      .toEqual({ state: 'not-started', done: 0, total: 3, lastDate: undefined })
  })

  it('is in progress with the count when part of the day is logged', () => {
    expect(dayWorkoutStatus(ids, [entry('bench', '2026-10-16T10:00:00Z'), entry('row', '2026-10-16')], scope))
      .toEqual({ state: 'in-progress', done: 2, total: 3, lastDate: '2026-10-16' })
  })

  it('is done when every exercise of the day is logged this week', () => {
    expect(dayWorkoutStatus(ids, ['bench', 'row', 'press'].map((id) => entry(id, '2026-10-12')), scope).state).toBe('done')
  })

  it('ignores the same exercise logged on another day or block', () => {
    expect(dayWorkoutStatus(ids, [entry('bench', '2026-10-15', 'd3'), entry('row', '2026-10-15', 'd1', 'b5')], scope).state)
      .toBe('not-started')
  })
})

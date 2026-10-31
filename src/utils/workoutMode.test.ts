import { describe, expect, it } from 'vitest'
import { canConfirmWorkoutDone, WORKOUT_DONE_GUARD_MS, dayWorkoutStatus, nextSupersetLoggingStep, nextWorkoutGroupIndex, shouldCollapseCompletedLogger, workoutChipState, resumeSupersetLoggingPosition, supersetSwitchSeconds, nextWorkoutLoggingSet } from './workoutMode'

it('B1: accepts a fresh confirmation only after the 600 ms deadline', () => {
  const deadline = 1000 + WORKOUT_DONE_GUARD_MS
  expect(canConfirmWorkoutDone(1000, deadline)).toBe(false)
  expect(canConfirmWorkoutDone(1120, deadline)).toBe(false)
  expect(canConfirmWorkoutDone(1599, deadline)).toBe(false)
  expect(canConfirmWorkoutDone(1600, deadline)).toBe(true)
})

describe('independent superset logging', () => {
  it('never carries a cached last-set cursor into the same exercise on another day', () => {
    expect(nextWorkoutLoggingSet([false, false, false], 3, 2)).toBe(0)
    expect(nextWorkoutLoggingSet([true, false, false], 3, 2)).toBe(1)
    expect(nextWorkoutLoggingSet([true, true, true], 3, 2)).toBe(2)
  })
  it('resumes the unlogged partner after a reload between C1 and C2, without replaying C1', () => {
    expect(resumeSupersetLoggingPosition([1, 0], [3, 3])).toBe(1)
    expect(resumeSupersetLoggingPosition([1, 1], [3, 3])).toBe(0)
    expect(resumeSupersetLoggingPosition([2, 2], [2, 3])).toBe(1)
    expect(resumeSupersetLoggingPosition([3, 3], [3, 3])).toBeUndefined()
  })
  it('caps the initial switch display at exactly ten seconds despite interval drift', () => {
    expect(supersetSwitchSeconds(20_000, 9_100)).toBe(10)
    expect(supersetSwitchSeconds(20_000, 19_100)).toBe(1)
    expect(supersetSwitchSeconds(20_000, 20_100)).toBe(0)
  })
  it('T117/T122: C1 saves independently and switches to C2 without full rest', () => {
    expect(nextSupersetLoggingStep([1, 0], [3, 3], 0)).toEqual({ position: 1, thinSwitch: true })
  })
  it('T125: C2 gets full rest before C1 next set', () => {
    expect(nextSupersetLoggingStep([1, 1], [3, 3], 1)).toEqual({ position: 0, thinSwitch: false })
  })
  it('T121: C1 two sets ahead cannot immediately jump to its partner', () => {
    expect(nextSupersetLoggingStep([2, 0], [3, 3], 0)).toEqual({ position: 0, thinSwitch: false })
    expect(nextSupersetLoggingStep([3, 0], [3, 3], 0)).toEqual({ position: 1, thinSwitch: false })
  })
  it('T147: a finished shorter partner is skipped, with normal rest', () => {
    expect(nextSupersetLoggingStep([2, 2], [4, 2], 1)).toEqual({ position: 0, thinSwitch: false })
    expect(nextSupersetLoggingStep([3, 2], [4, 2], 0)).toEqual({ position: 0, thinSwitch: false })
    expect(nextSupersetLoggingStep([4, 2], [4, 2], 0)).toBeUndefined()
  })
  it('completes only once both independent main-set counts are met', () => {
    expect(nextSupersetLoggingStep([3, 2], [3, 3], 1)).toEqual({ position: 1, thinSwitch: false })
    expect(nextSupersetLoggingStep([3, 3], [3, 3], 1)).toBeUndefined()
  })
})

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
      .toEqual({ state: 'not-started', done: 0, total: 3, loggedSets: 0, lastDate: undefined })
  })

  it('is in progress with the count when part of the day is logged', () => {
    expect(dayWorkoutStatus(ids, [entry('bench', '2026-10-16T10:00:00Z'), entry('row', '2026-10-16')], scope))
      .toEqual({ state: 'in-progress', done: 2, total: 3, loggedSets: 0, lastDate: '2026-10-16' })
  })

  it('is done when every exercise of the day is logged this week', () => {
    expect(dayWorkoutStatus(ids, ['bench', 'row', 'press'].map((id) => entry(id, '2026-10-12')), scope).state).toBe('done')
  })

  it('ignores the same exercise logged on another day or block', () => {
    expect(dayWorkoutStatus(ids, [entry('bench', '2026-10-15', 'd3'), entry('row', '2026-10-15', 'd1', 'b5')], scope).state)
      .toBe('not-started')
  })

  it('T144/T146: partial independent supersets are in progress, never a completed day', () => {
    const set = { tag: 'main' }
    const partial = { ...entry('bench', '2026-10-12'), sets: [set, set] }
    expect(dayWorkoutStatus(['bench'], [partial], scope, [3])).toEqual({
      state: 'in-progress', done: 0, total: 1, loggedSets: 2, lastDate: '2026-10-12',
    })
    expect(dayWorkoutStatus(['bench', 'row'], [
      { ...partial, sets: [set, set, set] },
      { ...entry('row', '2026-10-12'), sets: [set] },
    ], scope, [3, 3])).toMatchObject({ state: 'in-progress', done: 1 })
  })

  it('T153/T155: mini and partial rows never fill the prescribed main-set count', () => {
    const logged = { ...entry('bench', '2026-10-12'), sets: [
      {}, {}, { tag: 'mini' }, { tag: 'partial' },
    ] }
    expect(dayWorkoutStatus(['bench'], [logged], scope, [3]).state).toBe('in-progress')
    expect(dayWorkoutStatus(['bench'], [{ ...logged, sets: [{}, {}, {}] }], scope, [3]).state).toBe('done')
  })

  it('counts only the latest entry per planned exercise, ignoring other slots and empty evidence', () => {
    const first = { ...entry('bench', '2026-10-12'), sets: [{}, {}] }
    const latest = { ...entry('bench', '2026-10-13'), sets: [{}, {}, { tag: 'mini' }] }
    const otherSlot = { ...entry('row', '2026-10-13', 'd3'), sets: [{}, {}, {}] }
    expect(dayWorkoutStatus(ids, [first, latest, otherSlot], scope, [3, 3, 3]))
      .toMatchObject({ done: 0, loggedSets: 2, state: 'in-progress' })
    expect(dayWorkoutStatus(ids, [{ ...first, sets: [] }], scope, [3, 3, 3]))
      .toMatchObject({ done: 0, loggedSets: 0, state: 'not-started' })
  })
})

import { describe, expect, it } from 'vitest'
import type { TrainingBlock, WorkoutEntry } from '../types'
import {
  canCarryWorkoutLoad,
  capUnloggedReps,
  carryWorkoutWeight,
  findComparableLoggingEntry,
  prefillLoggedReps,
  roundDownWorkoutDrop,
} from './effortlessLogging'

describe('approved Big Done prefill (§5.1)', () => {
  it.each([
    ['T112', '6-8', 37.5, 37.5, 7, 7],
    ['T113', '6-8', 40, 37.5, 8, 6],
    ['T115', '8', 40, 37.5, 8, 8],
    ['T116 set 2', '8', 37.5, 37.5, 7, 7],
    ['T116 set 3', '8', 37.5, 37.5, 6, 6],
    ['T117', '8', 37.5, 37.5, 6, 6],
    ['T118', '12', 10, 10, 13, 13],
    ['T119', '12', 42.5, 40, 12, 12],
    ['T120 same load', '6', 40, 40, 5, 5],
    ['T120 new load', '8', 35, 32.5, 7, 8],
    ['T125', '8', 37.5, 37.5, 7, 7],
    ['T150 main', '12+12', 40, 37.5, 10, 12],
  ])('%s', (_, target, weight, previousWeight, previousReps, expected) => {
    expect(prefillLoggedReps({ target, weight, previous: { weight: previousWeight, reps: previousReps } })).toBe(expected)
  })

  it('T114: no history uses the range floor', () => {
    expect(prefillLoggedReps({ target: '6–8', weight: 40 })).toBe(6)
  })

  it('T122: deload uses prescribed reps even at the same load', () => {
    expect(prefillLoggedReps({ target: '10', weight: 40, previous: { weight: 40, reps: 6 }, deload: true })).toBe(10)
  })
})

describe('approved carry (§5.2)', () => {
  it('T126–T128: edits on any set carry only to later untouched unlogged sets', () => {
    expect(carryWorkoutWeight([85, 85, 85], [true, false, false], [false, false, false], 0, 87.5)).toEqual([87.5, 87.5, 87.5])
    expect(carryWorkoutWeight([85, 85, 85], [false, true, false], [true, false, false], 1, 87.5)).toEqual([85, 87.5, 87.5])
    expect(carryWorkoutWeight([85, 85, 80], [true, false, true], [false, false, false], 0, 87.5)).toEqual([87.5, 87.5, 80])
    expect(carryWorkoutWeight([85, 85, 85], [], [false, true, false], 0, 80)).toEqual([80, 85, 80])
  })

  it('T129–T130: never carry reps up, only down at the same load', () => {
    expect(capUnloggedReps([8, 7, 7], [40, 40, 40], [true, false, false], [], 0)).toEqual([8, 7, 7])
    expect(capUnloggedReps([5, 7, 6], [40, 40, 40], [true, false, false], [], 0)).toEqual([5, 5, 5])
    expect(capUnloggedReps([5, 7, 6], [40, 40, 35], [true, false, false], [false, true, false], 0)).toEqual([5, 7, 6])
  })

  it('T131–T132: only equal straight, superset or drop prescriptions carry', () => {
    for (const technique of ['straight', 'superset', 'drop-set']) {
      expect(canCarryWorkoutLoad(technique, ['8', '8', '8'], [40, 40, 40])).toBe(true)
    }
    for (const technique of ['pyramid', 'reverse-pyramid']) {
      expect(canCarryWorkoutLoad(technique, ['8', '8'], [40, 40])).toBe(false)
    }
    expect(canCarryWorkoutLoad('straight', ['8', '10'], [40, 40])).toBe(false)
    expect(canCarryWorkoutLoad('straight', ['8', '8'], [40, 35])).toBe(false)
    expect(canCarryWorkoutLoad('straight', [], [])).toBe(false)
  })

  it('T133: rounds machine logger drops down by 5 kg without changing other equipment steps', () => {
    expect(roundDownWorkoutDrop(45, 'machine')).toBe(30)
    expect(roundDownWorkoutDrop(40, 'machine')).toBe(30)
    expect(roundDownWorkoutDrop(37.5, 'barbell')).toBe(27.5)
    expect(roundDownWorkoutDrop(45, 'cable')).toBe(32.5)
  })

  it('preserves a light machine drop instead of rounding it to zero', () => {
    expect(roundDownWorkoutDrop(5, 'machine')).toBe(2.5)
    expect(roundDownWorkoutDrop(6, 'machine')).toBe(2.5)
  })
})

describe('comparable logging history', () => {
  const block: TrainingBlock = {
    id: 'block', number: 6, name: '', method: '', startDate: '2026-10-05', weeks: 6,
    origin: 'pt', summary: '', insights: [],
    days: [
      { key: 'a', name: 'A', position: 1, exercises: [{ code: 'A1', position: 1, exerciseId: 'press', sets: 3, reps: ['8'], restSeconds: 90, technique: 'straight' }] },
      { key: 'b', name: 'B', position: 2, exercises: [{ code: 'B1', position: 1, exerciseId: 'press', sets: 3, reps: ['12'], restSeconds: 90, technique: 'straight' }] },
      { key: 'tempo', name: 'Tempo', position: 3, exercises: [{ code: 'T1', position: 1, exerciseId: 'press', sets: 3, reps: ['8'], restSeconds: 90, technique: 'straight', notes: 'Tempo' }] },
    ],
  }
  const entry = (id: string, date: string, dayKey: string): WorkoutEntry => ({
    id, date, dayKey, blockId: block.id, exerciseId: 'press', sets: [{ id: `${id}-set`, reps: 7, weight: 40 }],
  })
  const scope = { date: '2026-10-19', blockId: block.id, dayKey: 'a' }

  it('T121/T147: excludes today’s slot, other targets, tempo and future entries', () => {
    const last = entry('last', '2026-10-12', 'a')
    const history = [entry('today', scope.date, 'a'), entry('other-day', '2026-10-18', 'b'),
      entry('tempo', '2026-10-17', 'tempo'), entry('future', '2026-10-20', 'a'), last]
    expect(findComparableLoggingEntry(history, 'press', { min: 8, max: 8 }, false, scope, [block])).toBe(last)
    expect(history[0].id).toBe('today')
  })

  it('compares plan targets, excludes deloads and preserves historical RIR', () => {
    const last = { ...entry('last', '2026-10-12', 'a'), target: { sets: 3, reps: { min: 8, max: 9 } },
      sets: [{ id: 'old', weight: 40, reps: 7, rir: 0 }] }
    const history = [entry('deload', '2026-11-10', 'a'), last]
    expect(findComparableLoggingEntry(history, 'press', { min: 8, max: 8 }, false,
      { ...scope, date: '2026-11-16' }, [block])).toBe(last)
    expect(last.sets[0].rir).toBe(0)
  })

  it('falls back to the stored target only when no plan row exists', () => {
    const offPlan = { ...entry('off', '2026-10-12', 'a'), exerciseId: 'swapped-in', target: { sets: 3, reps: { min: 6, max: 8 } } }
    expect(findComparableLoggingEntry([offPlan], 'swapped-in', { min: 6, max: 8 }, false, scope, [block])).toBe(offPlan)
    expect(findComparableLoggingEntry([offPlan], 'swapped-in', { min: 8, max: 8 }, false, scope, [block])).toBeUndefined()
  })

  it('can use a partial entry from another slot done today', () => {
    const last = entry('other-slot', scope.date, 'b')
    expect(findComparableLoggingEntry([last], 'press', { min: 12, max: 12 }, false, scope, [block])).toBe(last)
  })
})

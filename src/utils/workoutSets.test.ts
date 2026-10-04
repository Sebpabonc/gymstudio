import { describe, expect, it } from 'vitest'
import { WorkoutSet } from '../types'
import {
  copySetOneWeight,
  copyWeightToUntouchedSets,
  filterLoggableSets,
  formatWorkoutSet,
  parseRepPrescription,
  selectCompletedSets,
  stepWorkoutValue,
  workoutMaxWeight,
  workoutVolume,
} from './workoutSets'

describe('workout sets', () => {
  it('copies the first set weight only to untouched rows', () => {
    expect(copyWeightToUntouchedSets([20, 0, 22, 0], [true, false, true, false], 0, 20))
      .toEqual([20, 20, 22, 20])
    expect(copyWeightToUntouchedSets([20, 20, 22, 20], [true, false, true, false], 0, 24))
      .toEqual([24, 24, 22, 24])
  })

  it('does not copy non-positive weights or edits to later sets', () => {
    expect(copyWeightToUntouchedSets([20, 0, 0], [true, false, false], 0, 0)).toEqual([0, 0, 0])
    expect(copyWeightToUntouchedSets([20, 0, 0], [true, false, false], 2, 22)).toEqual([20, 0, 22])
  })

  it('copies set 1 weight to every set when explicitly requested', () => {
    expect(copySetOneWeight([24, 20, 22])).toEqual([24, 24, 24])
    expect(copySetOneWeight([])).toEqual([])
  })

  it('steps values and clamps decrements at zero', () => {
    expect(stepWorkoutValue(20, 1, 2.5)).toBe(22.5)
    expect(stepWorkoutValue(1, -1, 2.5)).toBe(0)
    expect(stepWorkoutValue(8, -1, 1, 1)).toBe(7)
  })

  it('selects only explicitly completed set rows', () => {
    const sets: WorkoutSet[] = [
      { id: 'set-1', reps: 10, weight: 20 },
      { id: 'set-2', reps: 10, weight: 22 },
      { id: 'set-3', reps: 10, weight: 24 },
    ]
    expect(selectCompletedSets(sets, [true, false])).toEqual([sets[0]])
    expect(selectCompletedSets(sets, [])).toEqual([])
    const dropSet: WorkoutSet = {
      id: 'drop-set',
      reps: 12,
      weight: 30,
      drop: { reps: 12, weight: 22 },
    }
    expect(selectCompletedSets([dropSet, sets[0]], [true, false])).toEqual([dropSet])
  })

  it('parses both parts of a drop-set prescription', () => {
    expect(parseRepPrescription('12+12')).toEqual([12, 12])
    expect(parseRepPrescription('15+15')).toEqual([15, 15])
  })

  it('formats drop sets with both parts while preserving straight-set formatting', () => {
    expect(formatWorkoutSet({ id: 'set-1', reps: 12, weight: 30, drop: { reps: 12, weight: 22 } }))
      .toBe('12 × 30 kg → 12 × 22 kg')
    expect(formatWorkoutSet({ id: 'set-2', reps: 8, weight: 60 })).toBe('8 × 60 kg')
  })

  it('counts both parts toward volume but uses only the main weight for max', () => {
    const sets: WorkoutSet[] = [
      { id: 'set-1', reps: 12, weight: 30, drop: { reps: 12, weight: 22 } },
      { id: 'set-2', reps: 8, weight: 40 },
    ]

    expect(workoutVolume(sets)).toBe(12 * 30 + 12 * 22 + 8 * 40)
    expect(workoutMaxWeight(sets)).toBe(40)
    expect(workoutVolume([{ id: 'legacy-set', reps: 8, weight: 50 }])).toBe(400)
  })
})

describe('filterLoggableSets', () => {
  const set = (id: string, reps: number, weight: number, drop?: WorkoutSet['drop']): WorkoutSet => ({ id, reps, weight, drop })

  it('drops untouched rows with 0 kg', () => {
    const result = filterLoggableSets([set('a', 12, 40), set('b', 12, 0)], 'barbell')
    expect(result.map((item) => item.id)).toEqual(['a'])
  })

  it('returns nothing when no row has a weight', () => {
    expect(filterLoggableSets([set('a', 12, 0), set('b', 8, 0)], 'dumbbell')).toEqual([])
  })

  it('omits drop parts with weight 0', () => {
    const [result] = filterLoggableSets([set('a', 12, 30, { reps: 12, weight: 0 })])
    expect(result.drop).toBeUndefined()
    const [kept] = filterLoggableSets([set('a', 12, 30, { reps: 12, weight: 20 })])
    expect(kept.drop).toEqual({ reps: 12, weight: 20 })
  })

  it('keeps bodyweight rows with reps and weight 0', () => {
    const result = filterLoggableSets([set('a', 15, 0), set('b', 0, 0)], 'bodyweight')
    expect(result.map((item) => item.id)).toEqual(['a'])
  })
})

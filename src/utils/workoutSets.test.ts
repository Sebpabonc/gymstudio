import { describe, expect, it } from 'vitest'
import { WorkoutSet } from '../types'
import { filterLoggableSets, formatWorkoutSet, parseRepPrescription, workoutMaxWeight, workoutVolume } from './workoutSets'

describe('workout sets', () => {
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

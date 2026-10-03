import { describe, expect, it } from 'vitest'
import { WorkoutSet } from '../types'
import { formatWorkoutSet, parseRepPrescription, workoutMaxWeight, workoutVolume } from './workoutSets'

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

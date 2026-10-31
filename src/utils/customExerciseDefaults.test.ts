import { describe, expect, it } from 'vitest'
import { userExercisePrescription } from './customExerciseDefaults'

describe('user-created exercise defaults', () => {
  it.each([
    ['Chest', 'barbell', 120, '6-10'],
    ['Back', 'cable', 120, '8-12'],
    ['Legs', 'machine', 90, '8-12'],
    ['Arms', 'dumbbell', 180, '8-12'],
    ['Core', 'cable', 120, '10-15'],
    ['Core', 'barbell', 120, '10-15'],
    ['Back', 'bodyweight', 60, '10-15'],
    ['Glutes', 'other', 120, '8-12'],
    ['Shoulders', undefined, 120, '8-12'],
    ['Legs', 'barbell', 150, '6-10'],
  ])('uses the PT prescription for %s / %s', (bodyRegion, equipment, restSeconds, reps) => {
    expect(userExercisePrescription({ bodyRegion, equipment }, restSeconds as number)).toEqual({
      sets: 3,
      reps,
      restSeconds,
    })
  })

  it('keeps a saved prescription instead of applying metadata-based defaults again', () => {
    const saved = { sets: 4, reps: '5', restSeconds: 150 }
    expect(userExercisePrescription({ bodyRegion: 'Legs', equipment: 'dumbbell' }, 120, saved)).toBe(saved)
  })
})

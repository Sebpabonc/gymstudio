import { describe, expect, it } from 'vitest'
import { getMuscleGroupForExercise } from './workoutPlan'

describe('getMuscleGroupForExercise', () => {
  it('classifies common exercises by name', () => {
    expect(getMuscleGroupForExercise('BB Bench Press')).toBe('Chest')
    expect(getMuscleGroupForExercise('Lat Pulldown (Neutral Grip)')).toBe('Back')
    expect(getMuscleGroupForExercise('V Ups')).toBe('Core')
  })

  it('returns Other for empty or unknown names', () => {
    expect(getMuscleGroupForExercise('   ')).toBe('Other')
    expect(getMuscleGroupForExercise('Juggling')).toBe('Other')
  })
})

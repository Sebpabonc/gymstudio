import type { Exercise } from '../types'

export type CustomExercisePrescription = {
  sets: number
  reps: string
  restSeconds: number
}

export function userExercisePrescription(
  exercise: Pick<Exercise, 'bodyRegion' | 'equipment'>,
  profileRestSeconds: number,
  saved?: CustomExercisePrescription
): CustomExercisePrescription {
  if (saved) return saved
  const reps = exercise.bodyRegion === 'Core' || exercise.equipment === 'bodyweight'
    ? '10-15'
    : exercise.equipment === 'barbell' ? '6-10' : '8-12'
  return { sets: 3, reps, restSeconds: profileRestSeconds }
}

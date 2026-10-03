import { Exercise, ExerciseTip } from '../types'

export const ALL_BODY_REGIONS = 'All'

const bodyRegionOrder = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full Body']

export function getAvailableBodyRegions(exercises: Exercise[]) {
  const presentRegions = new Set(exercises.map((exercise) => exercise.bodyRegion).filter(Boolean))
  return [ALL_BODY_REGIONS, ...bodyRegionOrder.filter((region) => presentRegions.has(region))]
}

export function filterExercises(exercises: Exercise[], query: string, bodyRegion = ALL_BODY_REGIONS) {
  const normalizedQuery = query.trim().toLowerCase()

  return exercises.filter((exercise) => {
    if (bodyRegion !== ALL_BODY_REGIONS && exercise.bodyRegion !== bodyRegion) return false
    if (!normalizedQuery) return true

    const searchableValues = [
      exercise.name,
      ...(exercise.primaryMuscles ?? [exercise.primaryMuscle]),
      ...(exercise.secondaryMuscles ?? (exercise.secondaryMuscle ? [exercise.secondaryMuscle] : [])),
      exercise.equipment,
    ]

    return searchableValues.some((value) => value?.toLowerCase().includes(normalizedQuery))
  })
}

export function getExerciseTips(exercise: Exercise): Array<string | ExerciseTip> {
  return exercise.postureTips !== undefined ? exercise.postureTips : exercise.tips ?? []
}

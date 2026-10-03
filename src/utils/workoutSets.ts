import { WorkoutSet } from '../types'

export function parseRepPrescription(value: string) {
  return value
    .split('+')
    .map((part) => Number.parseInt(part, 10))
    .filter((reps) => Number.isFinite(reps))
}

export function workoutSetVolume(set: WorkoutSet) {
  return set.reps * set.weight + (set.drop ? set.drop.reps * set.drop.weight : 0)
}

export function workoutVolume(sets: WorkoutSet[]) {
  return sets.reduce((total, set) => total + workoutSetVolume(set), 0)
}

export function workoutMaxWeight(sets: WorkoutSet[]) {
  return Math.max(...sets.map((set) => set.weight), 0)
}

export function formatWorkoutSet(set: WorkoutSet) {
  const main = `${set.reps} × ${set.weight} kg`
  return set.drop ? `${main} → ${set.drop.reps} × ${set.drop.weight} kg` : main
}

export function isBodyweightEquipment(equipment?: string) {
  return equipment?.trim().toLowerCase() === 'bodyweight'
}

export function filterLoggableSets(sets: WorkoutSet[], equipment?: string): WorkoutSet[] {
  const bodyweight = isBodyweightEquipment(equipment)

  return sets.flatMap((set) => {
    const reps = Number(set.reps) || 0
    const weight = Number(set.weight) || 0
    if (!(weight > 0 || (bodyweight && reps > 0))) return []

    const { drop, ...rest } = set
    const loggable: WorkoutSet = { ...rest, reps, weight }
    const dropWeight = Number(drop?.weight) || 0
    const dropReps = Number(drop?.reps) || 0
    if (drop && (dropWeight > 0 || (bodyweight && dropReps > 0))) {
      loggable.drop = { reps: dropReps, weight: dropWeight }
    }
    return [loggable]
  })
}

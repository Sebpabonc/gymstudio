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

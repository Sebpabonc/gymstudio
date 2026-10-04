import { WorkoutEntry, WorkoutSet } from '../types'

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

export function getPreviousWorkoutSets(history: WorkoutEntry[], exerciseId?: string) {
  return history
    .filter((entry) => !exerciseId || entry.exerciseId === exerciseId)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.sets ?? []
}

export function copyWeightToUntouchedSets(
  weights: number[],
  touched: boolean[],
  sourceIndex: number,
  weight: number
) {
  return weights.map((currentWeight, index) => {
    if (index === sourceIndex) return weight
    if (sourceIndex === 0 && weight > 0 && !touched[index]) return weight
    return currentWeight
  })
}

export function copySetOneWeight(weights: number[]) {
  return weights.length === 0 ? [] : weights.map(() => weights[0])
}

export function stepWorkoutValue(value: number, direction: -1 | 1, step: number, min = 0) {
  const precision = Math.max(step.toString().split('.')[1]?.length ?? 0, 0)
  const nextValue = Math.max(min, (Number(value) || 0) + direction * step)
  return Number(nextValue.toFixed(precision))
}

export function selectCompletedSets(sets: WorkoutSet[], completed: boolean[]) {
  return sets.filter((_, index) => completed[index])
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

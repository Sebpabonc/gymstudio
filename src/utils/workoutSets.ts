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

export function isProgressionWorkoutSet(set: Pick<WorkoutSet, 'tag'>) {
  return !set.tag || set.tag === 'main'
}

export function workoutMaxWeight(sets: WorkoutSet[]) {
  return Math.max(...sets.filter(isProgressionWorkoutSet).map((set) => set.weight), 0)
}

export function extraSetTagsForPlanNotes(notes?: string): Array<'mini' | 'partial'> {
  const tags: Array<'mini' | 'partial'> = []
  if (/rest-pause|myo-rep/i.test(notes ?? '')) tags.push('mini')
  if (/partial/i.test(notes ?? '')) tags.push('partial')
  return tags
}

/**
 * Starting weight for the first session of the other A/B day. Without rep data: the other day's weight − 10%.
 * With the reps done there and this day's target reps: estimate strength (Epley e1RM) and pick the load for the
 * target reps with ~2 reps in reserve, kept between −20% and the other day's weight. So 26 kg × 12 on day A
 * gives 25 kg for 10 reps on day B, instead of 22.5 kg.
 */
export function scaleWeightForOtherDay(weight: number, doneReps?: number, targetReps?: number) {
  const roundDown = (value: number) => Math.max(0, Math.floor((value + Number.EPSILON) / 2.5) * 2.5)
  if (!doneReps || !targetReps || doneReps <= 0 || targetReps <= 0) return roundDown(weight * 0.9)
  const estimate = (weight * (1 + doneReps / 30)) / (1 + (targetReps + 2) / 30)
  return roundDown(Math.min(weight, Math.max(weight * 0.8, estimate)))
}

export function getPreviousWorkoutSets(history: WorkoutEntry[], exerciseId?: string) {
  const sets = history
    .filter((entry) => !exerciseId || entry.exerciseId === exerciseId)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.sets ?? []
  return sets.filter(isProgressionWorkoutSet)
}

export function getPreviousWorkoutSetRow(previousSetsByExercise: WorkoutSet[][], setIndex: number) {
  return previousSetsByExercise.map((sets) => sets[setIndex])
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

/** Sets ticked as done; when none are ticked, every set counts (the user just pressed Finish). */
export function selectCompletedSets(sets: WorkoutSet[], completed: boolean[]) {
  if (!completed.some(Boolean)) return sets
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

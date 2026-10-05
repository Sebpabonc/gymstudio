import type { WorkoutSet } from '../types'

export type ProgressionType = 'upper' | 'lower' | 'isolation'

export type NextTarget = {
  action: 'increase' | 'hold' | 'reduce' | 'deload'
  weight: number
  reps: number[]
  setCount: number
  shortSets: number[]
  increaseKg: number
  firstSetAboveTarget: boolean
}

export function recommendNextTarget(
  sets: Pick<WorkoutSet, 'weight' | 'reps'>[],
  targetReps: number[],
  progressionType: ProgressionType,
  deload = false
): NextTarget | null {
  const plannedReps = targetReps.filter((reps) => Number.isFinite(reps) && reps > 0)
  const loggedSets = sets.filter((set) => Number.isFinite(set.weight) && Number.isFinite(set.reps))
  if (plannedReps.length === 0 || loggedSets.length === 0 || loggedSets[0].weight < 0) return null

  const weight = loggedSets[0].weight
  const shortSets = plannedReps.flatMap((target, index) =>
    (loggedSets[index]?.reps ?? 0) < target ? [index + 1] : []
  )

  if (deload) {
    const setCount = Math.ceil(plannedReps.length / 2)
    return {
      action: 'deload',
      weight,
      reps: plannedReps.slice(0, setCount),
      setCount,
      shortSets,
      increaseKg: 0,
      firstSetAboveTarget: false,
    }
  }

  const firstSetAboveTarget = loggedSets[0].reps >= plannedReps[0] + 3
  const allSetsHitTarget = plannedReps.every(
    (target, index) => loggedSets[index] !== undefined && loggedSets[index].reps >= target
  )
  const shortByAtLeastThree = plannedReps.filter(
    (target, index) => target - (loggedSets[index]?.reps ?? 0) >= 3
  ).length
  const increaseKg = progressionType === 'lower' ? 5 : progressionType === 'isolation' ? 1 : 2.5

  if (allSetsHitTarget || (firstSetAboveTarget && shortByAtLeastThree === 0)) {
    return {
      action: 'increase',
      weight: Number((weight + increaseKg).toFixed(2)),
      reps: plannedReps,
      setCount: plannedReps.length,
      shortSets,
      increaseKg,
      firstSetAboveTarget,
    }
  }

  if (shortByAtLeastThree >= 2) {
    const roundedWeight = Math.round((weight * 0.925) / 2.5) * 2.5
    return {
      action: 'reduce',
      weight: Math.max(0, Math.min(weight - 2.5, roundedWeight)),
      reps: plannedReps,
      setCount: plannedReps.length,
      shortSets,
      increaseKg: 0,
      firstSetAboveTarget: false,
    }
  }

  return {
    action: 'hold',
    weight,
    reps: plannedReps,
    setCount: plannedReps.length,
    shortSets,
    increaseKg: 0,
    firstSetAboveTarget: false,
  }
}

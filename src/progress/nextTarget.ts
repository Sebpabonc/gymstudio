import type { WorkoutSet } from '../types'
import { equipmentStep, isBodyweight, roundToStep } from '../trainer/engine'

export type ProgressionType = 'upper' | 'lower' | 'isolation'

export type NextTarget = {
  /** add_reps: bodyweight/band work without added load — no kg target (PT super-QA 2026-11-07, F7). */
  action: 'increase' | 'hold' | 'reduce' | 'deload' | 'add_reps'
  weight: number
  reps: number[]
  setCount: number
  shortSets: number[]
  increaseKg: number
  firstSetAboveTarget: boolean
  /** Best reps on the logged sets (used by the add_reps reason). */
  topReps?: number
  /** Band work gets the no-added-load text instead of the bodyweight one (PT super-QA review 2026-11-07). */
  band?: boolean
}

export function recommendNextTarget(
  sets: Pick<WorkoutSet, 'weight' | 'reps'>[],
  targetReps: number[],
  // Kept for callers; the step now comes from the equipment (PT super-QA 2026-11-07).
  _progressionType: ProgressionType,
  deload = false,
  equipment?: string
): NextTarget | null {
  const plannedReps = targetReps.filter((reps) => Number.isFinite(reps) && reps > 0)
  const loggedSets = sets.filter((set) => Number.isFinite(set.weight) && Number.isFinite(set.reps))
  if (plannedReps.length === 0 || loggedSets.length === 0 || loggedSets[0].weight < 0) return null

  // Working weight = the load used on most sets (e.g. 20 / 22.5 / 22.5 → 22.5); ties keep the first set's load.
  const counts = new Map<number, number>()
  for (const set of loggedSets) counts.set(set.weight, (counts.get(set.weight) ?? 0) + 1)
  const weight = loggedSets.reduce(
    (best, set) => ((counts.get(set.weight) ?? 0) > (counts.get(best) ?? 0) ? set.weight : best),
    loggedSets[0].weight
  )
  const topReps = Math.max(...loggedSets.map((set) => set.reps), 0)
  const shortSets = plannedReps.flatMap((target, index) =>
    loggedSets[index] && loggedSets[index].reps < target ? [index + 1] : []
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
      topReps,
    }
  }

  // PT super-QA 2026-11-07 (F7): bodyweight or band work without added load never gets a kg target.
  if (isBodyweight(equipment) && weight === 0) {
    return {
      action: 'add_reps',
      ...(equipment === 'band' ? { band: true } : {}),
      weight: 0,
      reps: plannedReps,
      setCount: plannedReps.length,
      shortSets,
      increaseKg: 0,
      firstSetAboveTarget: false,
      topReps,
    }
  }

  const firstSetAboveTarget = loggedSets[0].reps >= plannedReps[0] + 3
  const allSetsHitTarget = plannedReps.every(
    (target, index) => loggedSets[index] !== undefined && loggedSets[index].reps >= target
  )
  const allSetsLogged = plannedReps.every((_, index) => loggedSets[index] !== undefined)
  const shortByAtLeastThree = plannedReps.filter(
    (target, index) =>
      loggedSets[index] !== undefined && target - loggedSets[index].reps >= 3
  ).length
  // PT super-QA 2026-11-07: weight steps come from the equipment (dumbbell 2 kg, barbell/cable/machine 2.5 kg).
  const step = equipmentStep(equipment)

  if (allSetsHitTarget || (firstSetAboveTarget && shortByAtLeastThree === 0)) {
    const nextWeight = roundToStep(weight + step, step, 'down')
    return {
      action: 'increase',
      weight: nextWeight,
      reps: plannedReps,
      setCount: plannedReps.length,
      shortSets,
      increaseKg: Number((nextWeight - weight).toFixed(2)),
      firstSetAboveTarget,
      topReps,
    }
  }

  if (allSetsLogged && shortByAtLeastThree >= 2) {
    const roundedWeight = roundToStep(weight * 0.925, step, 'nearest')
    return {
      action: 'reduce',
      weight: roundToStep(Math.min(weight - step, roundedWeight), step, 'down'),
      reps: plannedReps,
      setCount: plannedReps.length,
      shortSets,
      increaseKg: 0,
      firstSetAboveTarget: false,
      topReps,
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
    topReps,
  }
}

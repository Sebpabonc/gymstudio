import type { RepRange } from './engine'

export type CompletedSet = { weight: number; reps: number }

export function nextSetHint({
  target,
  plannedWeight,
  completedSets,
  step,
}: {
  target: RepRange
  plannedWeight: number
  completedSets: CompletedSet[]
  step: number
}): null | { kind: 'consider_increase'; weight: number } {
  const lastSet = completedSets[completedSets.length - 1]
  if (
    !lastSet ||
    !(plannedWeight > 0) ||
    !(step > 0) ||
    lastSet.weight !== plannedWeight ||
    lastSet.reps < target.max + 3
  ) {
    return null
  }

  return {
    kind: 'consider_increase',
    weight: Number((plannedWeight + step).toFixed(2)),
  }
}

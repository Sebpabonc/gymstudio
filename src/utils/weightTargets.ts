import { TrainingBlock, WorkoutEntry, WorkoutSet } from '../types'
import { getDayType } from '../progress/utils'

export type WeightTarget = {
  dayType: 'A' | 'B' | null
  increaseKg: number
  baseWeightKg: number
  appliedAt: string
}

export type WeightTargets = Record<string, WeightTarget>

export function targetWeightKg(target: WeightTarget) {
  return Number((target.baseWeightKg + target.increaseKg).toFixed(2))
}

export function dayTypeFromKey(dayKey?: string): 'A' | 'B' | null {
  const key = dayKey?.toLowerCase()
  if (key?.endsWith('-a')) return 'A'
  if (key?.endsWith('-b')) return 'B'
  return null
}

// A target applies on its day type; with no known day type (custom plan) or no target day type it always applies.
export function targetAppliesToDay(target: WeightTarget | undefined, dayKey?: string): target is WeightTarget {
  if (!target) return false
  const dayType = dayTypeFromKey(dayKey)
  return !target.dayType || !dayType || target.dayType === dayType
}

export function maxWorkingWeight(sets: Pick<WorkoutSet, 'weight'>[]) {
  return sets.reduce((max, set) => Math.max(max, Number(set.weight) || 0), 0)
}

// Prefilled main-set weights: last-session weight (or base weight) plus the increase on every set.
export function applyTargetToWeights(baseWeights: (number | undefined)[], target: WeightTarget) {
  return baseWeights.map((weight) =>
    Number(((Number(weight) > 0 ? Number(weight) : target.baseWeightKg) + target.increaseKg).toFixed(2))
  )
}

export function isTargetMet(target: WeightTarget, sets: Pick<WorkoutSet, 'weight'>[]) {
  return maxWorkingWeight(sets) >= targetWeightKg(target)
}

// Heaviest weight of the latest logged session of this exercise on the given A/B day type.
export function baseWeightFromHistory(
  entries: WorkoutEntry[],
  blocks: TrainingBlock[],
  exerciseId: string,
  dayType: 'A' | 'B' | null
) {
  const sessions = entries
    .filter((entry) => entry.exerciseId === exerciseId && entry.sets.length > 0)
    .filter((entry) => !dayType || getDayType(entry, blocks) === dayType)
    .sort((a, b) => b.date.localeCompare(a.date))
  const latestDate = sessions[0]?.date.slice(0, 10)
  return maxWorkingWeight(sessions.filter((entry) => entry.date.slice(0, 10) === latestDate).flatMap((entry) => entry.sets))
}

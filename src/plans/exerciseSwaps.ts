import type { Exercise, TrainingBlock } from '../types'

// Swapping a busy/unavailable exercise (PO 2026-10-06). Alternatives come from the approved catalogue only:
// same primary muscle is required; same movement pattern, same mechanic and shared secondary muscles rank
// higher, and a different piece of equipment ranks higher (the original one is probably taken).

type SwapCandidate = Pick<Exercise, 'id' | 'primaryMuscle' | 'secondaryMuscles' | 'equipment' | 'mechanic' | 'movementPattern'>

export type ExerciseSwap = {
  fromExerciseId: string
  toExerciseId: string
  /** 'today' swaps apply to one date only; 'always' swaps apply to every current and future plan. */
  scope: 'today' | 'always'
  date?: string
}

export function suggestAlternatives<T extends SwapCandidate>(
  exercise: SwapCandidate,
  catalogue: T[],
  excludeIds: string[] = [],
  limit = 3
): T[] {
  const excluded = new Set([exercise.id, ...excludeIds])
  const secondary = new Set(exercise.secondaryMuscles ?? [])
  return catalogue
    .filter((candidate) => !excluded.has(candidate.id) && candidate.primaryMuscle === exercise.primaryMuscle)
    .map((candidate) => {
      let score = 0
      if (exercise.movementPattern && candidate.movementPattern === exercise.movementPattern) score += 4
      if (exercise.mechanic && candidate.mechanic === exercise.mechanic) score += 2
      score += Math.min(2, (candidate.secondaryMuscles ?? []).filter((muscle) => secondary.has(muscle)).length)
      if (candidate.equipment && candidate.equipment !== exercise.equipment) score += 1
      return { candidate, score }
    })
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

/** The swaps that apply on a date: today-only swaps for that date win over permanent ones. */
export function activeSwaps(swaps: ExerciseSwap[], date: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const swap of swaps) if (swap.scope === 'always') map.set(swap.fromExerciseId, swap.toExerciseId)
  for (const swap of swaps) if (swap.scope === 'today' && swap.date === date) map.set(swap.fromExerciseId, swap.toExerciseId)
  return map
}

/** Replaces swapped exercises in every day of the blocks. The bench angle is dropped (it belonged to the old exercise). */
export function applySwaps(blocks: TrainingBlock[], swaps: Map<string, string>, catalogueIds?: Set<string>): TrainingBlock[] {
  if (swaps.size === 0) return blocks
  return blocks.map((block) => ({
    ...block,
    days: block.days.map((day) => {
      const used = new Set(day.exercises.map((exercise) => exercise.exerciseId))
      return {
        ...day,
        exercises: day.exercises.map((exercise) => {
          const next = swaps.get(exercise.exerciseId)
          if (!next || used.has(next) || (catalogueIds && !catalogueIds.has(next))) return exercise
          const { angleDegrees: _angle, ...rest } = exercise
          return { ...rest, exerciseId: next, swappedFrom: exercise.exerciseId }
        }),
      }
    }),
  }))
}

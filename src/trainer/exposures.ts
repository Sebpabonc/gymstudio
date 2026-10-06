import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import type { TrainerRecommendationRow } from '../utils/profileData'
import { bucketFor, type Exposure } from './calibration'
import { buildEvidence } from './evidence'
import { progressionSets } from './engine'

/**
 * Exposures for calibration (continuous-learning spec, Definitions): a shown recommendation with a logged result,
 * accepted or kept original. Deload, double-angle followers, incomplete sessions, return-after-break reductions
 * and bodyweight without load are kept but marked excluded.
 */
export function buildExposures(
  rows: TrainerRecommendationRow[],
  history: WorkoutEntry[],
  blocks: TrainingBlock[],
  catalogue: Pick<Exercise, 'id' | 'movementPattern' | 'equipment'>[]
): Exposure[] {
  const byId = new Map(history.map((entry) => [entry.id, entry]))
  return rows.flatMap((row) => {
    const entry = row.resultEntryId ? byId.get(row.resultEntryId) : undefined
    const weight = row.recommended.weight ?? 0
    if (!entry || !(weight > 0)) return []
    const session = buildEvidence([entry], entry.exerciseId, blocks, '9999-12-31')[0]
    const planned = row.recommended.sets
    const bucket = bucketFor(entry.target?.technique ?? session?.technique)
    const logged = progressionSets(entry.sets, planned)
    // Pyramids: only the heaviest set has a known recommended load (the top set, intended at 1 RIR — PT review).
    const pyramid = bucket === 'reverse-pyramid' || bucket === 'ascending-pyramid'
    const heaviest = logged.reduce((best, set) => (set.weight > best.weight ? set : best), logged[0] ?? { weight: 0, reps: 0 })
    const sets = (pyramid ? (logged.length ? [heaviest] : []) : logged).map(({ weight: w, reps, rir }) => ({
      weight: w,
      reps,
      ...(rir !== undefined ? { rir } : {}),
      ...(pyramid ? { rirTarget: 1 } : {}),
    }))
    const exercise = catalogue.find((item) => item.id === entry.exerciseId)
    const excluded = !!session?.deload || !!session?.follower || logged.length < planned ||
      row.reason === 'long_break' || (exercise?.equipment === 'bodyweight' && weight === 0)
    return [{
      date: entry.date.slice(0, 10),
      exerciseId: entry.exerciseId,
      ...(exercise?.movementPattern ? { pattern: exercise.movementPattern } : {}),
      bucket,
      weightRecommended: weight,
      repsTarget: row.recommended.reps.min,
      rirTarget: 2,
      sets,
      ...(excluded ? { excluded: true } : {}),
    }]
  })
}

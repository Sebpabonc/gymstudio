import type { TrainingBlock, WorkoutEntry } from '../types'
import { blockWeek, findEntryBlock, plannedExerciseForEntry } from '../progress/utils'
import { prescriptionForWeek } from '../plans/weekPrescription'
import { parseRepPrescription } from '../utils/workoutSets'
import { recommend, type RecommendInput, type Recommendation, type SessionEvidence } from './engine'

type SharedRecommendationInput = Omit<RecommendInput, 'history' | 'today' | 'dayKey'>

export function recommendForExercise(options: {
  history: WorkoutEntry[]
  exerciseId: string
  blocks: TrainingBlock[]
  today: string
  dayKey: string
  blockId?: string
  todayDayKey?: string
  input: SharedRecommendationInput
}): { evidence: SessionEvidence[]; recommendation: Recommendation } {
  const evidence = buildEvidence(
    options.history,
    options.exerciseId,
    options.blocks,
    options.today,
    options.todayDayKey
  )
  const recommendation = recommend({
    ...options.input,
    history: evidence,
    today: options.today,
    dayKey: options.dayKey,
    blockId: options.blockId,
  })
  return { evidence, recommendation }
}

export function buildEvidence(
  history: WorkoutEntry[],
  exerciseId: string,
  blocks: TrainingBlock[],
  today: string,
  /** Only today's entry for this day slot is the one being edited; other days done today are evidence. */
  todayDayKey?: string
): SessionEvidence[] {
  return history
    .filter((entry) => entry.exerciseId === exerciseId && entry.sets.length > 0)
    .filter((entry) => entry.date.slice(0, 10) !== today || (todayDayKey !== undefined && entry.dayKey !== todayDayKey))
    .map((entry) => {
      let target = entry.target?.reps
      const block = findEntryBlock(blocks, entry)
      const planned = block ? plannedExerciseForEntry(block, entry) : undefined
      const week = block ? blockWeek(block, entry.date) ?? 1 : 1
      const dayName = entry.dayKey ? block?.days.find((day) => day.key === entry.dayKey)?.name : undefined
      // First number of each planned set ("12+12" drop-set → 12), for pyramids and targets.
      const setReps = planned ? planned.reps.map((rep) => parseRepPrescription(rep)[0]).filter((rep) => rep > 0) : []
      if (!target && planned) {
        const reps = prescriptionForWeek(planned, week).reps.flatMap((rep) => parseRepPrescription(rep).slice(0, 1))
        if (reps.length) target = { min: Math.min(...reps), max: Math.max(...reps) }
      }
      const notes = planned?.notes ?? ''

      return {
        date: entry.date.slice(0, 10),
        ...(entry.dayKey ? { dayKey: entry.dayKey } : {}),
        ...(dayName ? { dayName } : {}),
        ...(entry.blockId ? { blockId: entry.blockId } : {}),
        // Keep the PT spec inputs: set tags (R3/R10), reps in reserve (R1) and the nested drop (R3).
        sets: entry.sets.map(({ weight, reps, tag, rir, drop }) => ({
          weight,
          reps,
          ...(tag ? { tag } : {}),
          ...(rir !== undefined ? { rir } : {}),
          ...(drop ? { drop } : {}),
        })),
        ...(target ? { target } : {}),
        ...(entry.target?.technique || planned?.technique ? { technique: entry.target?.technique ?? planned?.technique } : {}),
        ...(setReps.length ? { setReps } : {}),
        ...(block && week === 6 ? { deload: true } : {}),
        ...(isDoubleAngleFollower(notes) ? { follower: true } : {}),
        ...(/\btempo\b/i.test(notes) ? { tempo: true } : {}),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** R5: the second exercise of a double-angle pair says it reuses the previous exercise's dumbbells. */
export function isDoubleAngleFollower(notes?: string) {
  return /^same (dumbbells|weight|load)\b/i.test((notes ?? '').trim())
}

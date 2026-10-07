import type { TrainingBlock, WorkoutEntry } from '../types'
import { blockWeek, findEntryBlock, plannedExerciseForEntry } from '../progress/utils'
import { prescriptionForWeek } from '../plans/weekPrescription'
import { latestPerExerciseDate } from '../utils/completedExercises'
import { parseRepPrescription } from '../utils/workoutSets'
import type { SessionEvidence } from './engine'

export function buildEvidence(
  history: WorkoutEntry[],
  exerciseId: string,
  blocks: TrainingBlock[],
  today: string,
  /** Only today's entry for this day slot is the one being edited; other days done today are evidence. */
  todayDayKey?: string
): SessionEvidence[] {
  return latestPerExerciseDate(history.filter((entry) => entry.exerciseId === exerciseId && entry.sets.length > 0))
    .filter((entry) => entry.date.slice(0, 10) !== today || (todayDayKey !== undefined && entry.dayKey !== todayDayKey))
    .map((entry) => {
      let target = entry.target?.reps
      const block = findEntryBlock(blocks, entry)
      const planned = block ? plannedExerciseForEntry(block, entry) : undefined
      const week = block ? blockWeek(block, entry.date) ?? 1 : 1
      // First number of each planned set ("12+12" drop-set → 12), for pyramids and targets.
      const setReps = planned ? planned.reps.map((rep) => parseRepPrescription(rep)[0]).filter((rep) => rep > 0) : []
      if (!target && planned) {
        const reps = prescriptionForWeek(planned, week).reps.flatMap((rep) => parseRepPrescription(rep).slice(0, 1))
        if (reps.length) target = { min: Math.min(...reps), max: Math.max(...reps) }
      }
      const notes = planned?.notes ?? ''

      return {
        date: entry.date.slice(0, 10),
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

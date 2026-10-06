import type { TrainingBlock, WorkoutEntry } from '../types'
import { blockWeek, findEntryBlock, plannedExerciseForEntry } from '../progress/utils'
import { prescriptionForWeek } from '../plans/weekPrescription'
import { parseRepPrescription } from '../utils/workoutSets'
import type { SessionEvidence } from './engine'

export function buildEvidence(
  history: WorkoutEntry[],
  exerciseId: string,
  blocks: TrainingBlock[],
  today: string
): SessionEvidence[] {
  return history
    .filter((entry) => entry.exerciseId === exerciseId && entry.date.slice(0, 10) !== today && entry.sets.length > 0)
    .map((entry) => {
      let target = entry.target?.reps
      if (!target) {
        const block = findEntryBlock(blocks, entry)
        const planned = block && plannedExerciseForEntry(block, entry)
        if (block && planned) {
          const week = blockWeek(block, entry.date) ?? 1
          const reps = prescriptionForWeek(planned, week).reps.flatMap(parseRepPrescription)
          if (reps.length) target = { min: Math.min(...reps), max: Math.max(...reps) }
        }
      }

      return {
        date: entry.date.slice(0, 10),
        sets: entry.sets.map(({ weight, reps }) => ({ weight, reps })),
        ...(target ? { target } : {}),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

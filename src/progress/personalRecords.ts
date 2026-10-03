import { TrainingBlock } from '../types'
import { PersonalRecordSession, ProgressEntry, PersonalRecordType } from './types'
import {
  findEntryBlock,
  groupExerciseSessions,
  isDeloadWeek,
  plannedExerciseForEntry,
  prescribedReps,
  sessionE1RM,
  workingSets,
} from './utils'

type RecordSession = ReturnType<typeof groupExerciseSessions>[number]

function minimumPrescribedReps(blocks: TrainingBlock[], session: RecordSession) {
  const block = findEntryBlock(blocks, session)
  if (!block) return 1
  const plan = plannedExerciseForEntry(block, session)
  if (!plan) return 1
  const targets = plan.reps
    .map((_, index) => prescribedReps(plan, index))
    .filter((reps): reps is number => reps !== null)
  return targets.length ? Math.min(...targets) : 1
}

export function personalRecords(
  entries: ProgressEntry[],
  blocks: TrainingBlock[]
): PersonalRecordSession[] {
  const sessions = groupExerciseSessions(entries)
  const records: PersonalRecordSession[] = []
  const previousByExercise = new Map<string, RecordSession[]>()

  for (const session of sessions) {
    const previous = previousByExercise.get(session.exerciseId) ?? []
    const block = findEntryBlock(blocks, session)
    const excluded = isDeloadWeek(block, session.date)
    const priorSets = previous.flatMap((item) => workingSets(item.sets))
    const previousBestWeight = priorSets.reduce((best, set) => Math.max(best, set.weight), 0)
    const sets = workingSets(session.sets)
    const likelyTypoSetIds = sets
      .filter((set) => previousBestWeight > 0 && set.weight > previousBestWeight * 1.5)
      .map((set) => set.id)
    const cleanSets = sets.filter((set) => !likelyTypoSetIds.includes(set.id))
    const badges: PersonalRecordType[] = []

    if (!excluded && previous.length >= 3) {
      const previousE1RM = previous.reduce<number | null>((best, item) => {
        const estimate = sessionE1RM(item.sets)
        return estimate === null ? best : best === null ? estimate : Math.max(best, estimate)
      }, null)
      const currentE1RM = sessionE1RM(cleanSets)
      if (currentE1RM !== null && (previousE1RM === null || currentE1RM >= previousE1RM + 0.5)) {
        badges.push('e1rm')
      }

      const minimumReps = minimumPrescribedReps(blocks, session)
      const currentBestWeight = cleanSets.reduce((best, set) => Math.max(best, set.weight), 0)
      const currentWeightSet = cleanSets.some((set) => set.weight === currentBestWeight && set.reps >= minimumReps)
      if (currentBestWeight > 0 && currentWeightSet && currentBestWeight >= previousBestWeight + 0.5) {
        badges.push('weight')
      }

      const repRecord = cleanSets.some((set) => {
        const previousBestRepsAtLoad = priorSets
          .filter((prior) => prior.weight >= set.weight)
          .reduce((best, prior) => Math.max(best, prior.reps), 0)
        return set.reps > previousBestRepsAtLoad
      })
      if (repRecord) badges.push('reps')
    }

    records.push({
      exerciseId: session.exerciseId,
      date: session.date,
      badges: badges.slice(0, 3),
      likelyTypoSetIds,
    })
    if (!excluded) {
      previousByExercise.set(session.exerciseId, [...previous, { ...session, sets: cleanSets }])
    }
  }
  return records
}

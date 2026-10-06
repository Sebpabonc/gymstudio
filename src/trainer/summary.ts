import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { blockWeek, dateWeekday, findBlockForDate } from '../progress/utils'
import { prescriptionForWeek } from '../plans/weekPrescription'
import { parseRepPrescription } from '../utils/workoutSets'
import { buildEvidence } from './evidence'
import { recommend, workingWeight, type Recommendation, type RepRange } from './engine'

export type WorkoutSummaryRow = {
  exerciseId: string
  trend: 'up' | 'same' | 'down'
  actual: { weight: number; reps: number[] }
  target: { weight?: number; reps: RepRange }
  next: Recommendation
  nextDate?: string
  nextDayKey?: string
}

function dateAfter(date: string, days: number) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function repRange(repetitions: string[]) {
  const reps = repetitions.flatMap(parseRepPrescription)
  return reps.length
    ? { min: Math.min(...reps), max: Math.max(...reps) }
    : { min: 8, max: 8 }
}

function actionTrend(recommendation: Recommendation): WorkoutSummaryRow['trend'] {
  if (recommendation.action === 'increase_weight' || recommendation.action === 'increase_reps') return 'up'
  if (recommendation.action === 'decrease_weight' || recommendation.action === 'regress') return 'down'
  return 'same'
}

export function buildWorkoutSummary(
  todaysEntries: WorkoutEntry[],
  history: WorkoutEntry[],
  blocks: TrainingBlock[],
  catalogue: Exercise[],
  today: string
): WorkoutSummaryRow[] {
  if (!todaysEntries.length) return []

  const block = blocks.find((item) => item.id === todaysEntries.find((entry) => entry.blockId)?.blockId)
    ?? findBlockForDate(blocks, today)
  if (!block) return []

  const currentWeek = blockWeek(block, today) ?? (today < block.startDate ? 1 : block.weeks)
  const currentDayKeys = new Set(todaysEntries.map((entry) => entry.dayKey).filter((key): key is string => !!key))
  const currentPosition = Math.max(
    ...block.days.filter((day) => currentDayKeys.has(day.key)).map((day) => day.position),
    dateWeekday(today) || 1
  )
  const days = [...block.days].sort((a, b) => a.position - b.position)
  const byExercise = new Map<string, WorkoutEntry[]>()
  for (const entry of todaysEntries) {
    if (entry.sets.length === 0) continue
    const group = byExercise.get(entry.exerciseId) ?? []
    group.push(entry)
    byExercise.set(entry.exerciseId, group)
  }

  return [...byExercise].flatMap(([exerciseId, entries]) => {
    const occurrences = days.flatMap((day) => {
      const planned = day.exercises.find((exercise) => exercise.exerciseId === exerciseId)
      if (!planned) return []
      const date = dateAfter(block.startDate, (currentWeek - 1) * 7 + day.position - 1)
      return [{ day, planned, date, week: currentWeek }]
    })
    const nextOccurrence = occurrences
      .filter((occurrence) => occurrence.date > today)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
      ?? days.flatMap((day) => {
        const planned = day.exercises.find((exercise) => exercise.exerciseId === exerciseId)
        if (!planned) return []
        return [{
          day,
          planned,
          date: dateAfter(block.startDate, currentWeek * 7 + day.position - 1),
          week: currentWeek + 1,
        }]
      })[0]
    if (!nextOccurrence) return []

    const currentDay = days.find((day) => currentDayKeys.has(day.key))
      ?? days.find((day) => day.position === currentPosition)
    const currentPlanned = currentDay?.exercises.find((exercise) => exercise.exerciseId === exerciseId)
    const currentPrescription = currentPlanned
      ? prescriptionForWeek(currentPlanned, currentWeek)
      : undefined
    const targetReps = entries.find((entry) => entry.target?.reps)?.target?.reps
      ?? (currentPrescription ? repRange(currentPrescription.reps) : repRange([]))
    const targetWeight = entries.find((entry) => entry.target?.weight !== undefined)?.target?.weight
    const actualSets = entries.flatMap((entry) => entry.sets.map(({ weight, reps }) => ({ weight, reps })))
    const occurrencePrescription = prescriptionForWeek(nextOccurrence.planned, nextOccurrence.week)
    const nextTarget = repRange(occurrencePrescription.reps)
    const entryIds = new Set(entries.map((entry) => entry.id))
    const evidenceHistory = [...history.filter((entry) => !entryIds.has(entry.id)), ...entries]
    const evidence = buildEvidence(evidenceHistory, exerciseId, blocks, nextOccurrence.date)
    const recommendation = recommend({
      history: evidence,
      today: nextOccurrence.date,
      target: nextTarget,
      sets: occurrencePrescription.sets,
      equipment: catalogue.find((exercise) => exercise.id === exerciseId)?.equipment,
      plannedWeight: targetWeight,
      deload: blockWeek(block, nextOccurrence.date) === 6,
    })

    return [{
      exerciseId,
      trend: actionTrend(recommendation),
      actual: { weight: workingWeight(actualSets), reps: actualSets.map((set) => set.reps) },
      target: { ...(targetWeight !== undefined ? { weight: targetWeight } : {}), reps: targetReps },
      next: recommendation,
      nextDate: nextOccurrence.date,
      nextDayKey: nextOccurrence.day.key,
    }]
  })
}

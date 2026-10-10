import { createTranslator, type Language, type Translate } from '../i18n/translate'
import { Exercise, PlannedExercise, TrainingBlock } from '../types'
import { DayType, ProgressEntry, ProgressSet } from './types'
import { defaultActiveBlock } from '../utils/trainingBlocks'
import { PROGRESS_THRESHOLDS } from './thresholds'

const DAY_MS = 24 * 60 * 60 * 1000

export type ProgressI18n = {
  language: Language
  t: Translate
}

export const defaultProgressI18n: ProgressI18n = {
  language: 'en',
  t: createTranslator('en'),
}

export type ExerciseSession = {
  exerciseId: string
  date: string
  sets: ProgressSet[]
  blockId?: string
  dayKey?: string
}

export function dateValue(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function dateWeekday(date: string) {
  return new Date(dateValue(date)).getUTCDay()
}

export function findBlockForDate(blocks: TrainingBlock[], date: string) {
  const value = dateValue(date)
  return blocks.find((block) => {
    const start = dateValue(block.startDate)
    return value >= start && value < start + block.weeks * 7 * DAY_MS
  }) ?? null
}

export function findEntryBlock(blocks: TrainingBlock[], entry: Pick<ProgressEntry, 'date' | 'blockId'>) {
  return (entry.blockId ? blocks.find((block) => block.id === entry.blockId) : undefined)
    ?? findBlockForDate(blocks, entry.date)
}

export function blockWeek(block: TrainingBlock, date: string) {
  const value = dateValue(date)
  const start = dateValue(block.startDate)
  if (value < start || value >= start + block.weeks * 7 * DAY_MS) return null
  return Math.floor((value - start) / (7 * DAY_MS)) + 1
}

export function entriesWithinBlock(entries: ProgressEntry[], block: TrainingBlock) {
  const start = dateValue(block.startDate)
  const end = start + block.weeks * 7 * DAY_MS
  return entries.filter((entry) => {
    const date = dateValue(entry.date)
    return date >= start && date < end
  })
}

export function getDayType(entry: Pick<ProgressEntry, 'date' | 'dayKey'>, blocks: TrainingBlock[]): DayType | null {
  const key = entry.dayKey?.toLowerCase()
  if (key?.endsWith('-a')) return 'A'
  if (key?.endsWith('-b')) return 'B'
  if (!findBlockForDate(blocks, entry.date)) return null
  const weekday = dateWeekday(entry.date)
  if (weekday >= 1 && weekday <= 3) return 'A'
  if (weekday >= 4 && weekday <= 6) return 'B'
  return null
}

export function groupExerciseSessions(entries: ProgressEntry[]): ExerciseSession[] {
  const sessions = new Map<string, ExerciseSession>()
  for (const entry of entries) {
    const key = `${entry.exerciseId}:${entry.date.slice(0, 10)}`
    const session = sessions.get(key) ?? {
      exerciseId: entry.exerciseId,
      date: entry.date.slice(0, 10),
      sets: [],
      blockId: entry.blockId,
      dayKey: entry.dayKey,
    }
    session.sets.push(...entry.sets)
    session.blockId ??= entry.blockId
    session.dayKey ??= entry.dayKey
    sessions.set(key, session)
  }
  return [...sessions.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function workingSets(sets: ProgressSet[]) {
  const maxWeight = sets.reduce((maximum, set) => Math.max(maximum, set.weight), 0)
  if (maxWeight <= 0) return sets
  return sets.filter((set) => set.weight > maxWeight * 0.5)
}

export function bestSetIndex(sets: ProgressSet[]) {
  const eligibleSets = workingSets(sets)
  let bestIndex: number | null = null
  let bestEstimate = 0

  sets.forEach((set, index) => {
    if (!eligibleSets.includes(set) || set.weight <= 0 || set.reps < 1 || set.reps > 12) return
    const estimate = set.weight * (1 + set.reps / 30)
    if (bestIndex === null || estimate > bestEstimate) {
      bestIndex = index
      bestEstimate = estimate
    }
  })

  return bestIndex
}

export function sessionE1RM(sets: ProgressSet[]) {
  const index = bestSetIndex(sets)
  if (index === null) return null
  const set = sets[index]
  return set.weight * (1 + set.reps / 30)
}

export function isDeloadWeek(block: TrainingBlock | null, date: string) {
  if (!block) return false
  const week = blockWeek(block, date)
  return week === PROGRESS_THRESHOLDS.deloadWeek
    || (block.number === PROGRESS_THRESHOLDS.legacyDeloadBlockNumber
      && week === PROGRESS_THRESHOLDS.legacyDeloadWeek)
}

export function exerciseFor(exercises: Exercise[], exerciseId: string) {
  return exercises.find((exercise) => exercise.id === exerciseId)
}

export function plannedDayForEntry(block: TrainingBlock, entry: Pick<ProgressEntry, 'date' | 'dayKey'>) {
  if (entry.dayKey) {
    const exactDay = block.days.find((day) => day.key === entry.dayKey)
    if (exactDay) return exactDay
  }
  const weekday = dateWeekday(entry.date)
  return weekday >= 1 && weekday <= block.days.length
    ? [...block.days].sort((a, b) => a.position - b.position)[weekday - 1] ?? null
    : null
}

export function plannedExerciseForEntry(
  block: TrainingBlock,
  entry: Pick<ProgressEntry, 'date' | 'dayKey' | 'exerciseId'>
) {
  return plannedDayForEntry(block, entry)?.exercises.find((item) => item.exerciseId === entry.exerciseId) ?? null
}

export function prescribedReps(plan: PlannedExercise, index: number) {
  const prescription = plan.reps[index] ?? plan.reps[plan.reps.length - 1] ?? ''
  const match = prescription.match(/\d+/)
  return match ? Number(match[0]) : null
}

export function currentOrLatestBlock(blocks: TrainingBlock[], today: string) {
  return defaultActiveBlock(blocks, today)
}

export function startOfWeek(date: string) {
  const value = dateValue(date)
  const weekday = new Date(value).getUTCDay()
  const offset = weekday === 0 ? 6 : weekday - 1
  const start = new Date(value - offset * DAY_MS)
  return `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`
}

export function percentChange(start: number, end: number) {
  return start === 0 ? null : ((end - start) / start) * 100
}

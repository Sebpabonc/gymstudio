import type { TranslationKey } from '../i18n/en'
import { localeFor, type Language, translate } from '../i18n/translate'
import { TrainingBlock, WorkoutEntry } from '../types'
import { localIsoDate } from '../lib/dates'

const DAY_MS = 24 * 60 * 60 * 1000

function toIsoDate(value: string | Date) {
  if (typeof value === 'string') return value.slice(0, 10)
  return localIsoDate(value)
}

function dateValue(value: string | Date) {
  return new Date(`${toIsoDate(value)}T00:00:00Z`).getTime()
}

function blockEnd(block: TrainingBlock) {
  return dateValue(block.startDate) + block.weeks * 7 * DAY_MS
}

function sortedBlocks(blocks: TrainingBlock[]) {
  return [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.number - b.number)
}

export type TrainingBlockDateStatus = 'Current' | 'Upcoming' | 'Completed'

const methodWordKeys: Record<string, TranslationKey> = {
  ascending: 'workout.method.ascending',
  dup: 'workout.method.dup',
  flat: 'workout.method.flat',
  hypertrophy: 'workout.method.hypertrophy',
  pyramid: 'workout.method.pyramid',
  reverse: 'workout.method.reverse',
  strength: 'workout.method.strength',
  training: 'workout.method.training',
}

const methodPhraseKeys: Record<string, TranslationKey> = {
  'ascending-pyramid': 'workout.methodPhrase.ascendingPyramid',
  'flat-pyramid': 'workout.methodPhrase.flatPyramid',
  'reverse-pyramid': 'workout.methodPhrase.reversePyramid',
  'strength-hypertrophy': 'workout.methodPhrase.strengthHypertrophy',
}

function titleCase(word: string) {
  return `${word[0].toUpperCase()}${word.slice(1)}`
}

export function formatBlockMethod(method: string, language: Language = 'en') {
  const normalizedMethod = method.trim().replace(/[_\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  const phraseKey = methodPhraseKeys[normalizedMethod]
  if (phraseKey) return translate(language, phraseKey)
  const words = method
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/)
  if (!words[0]) return ''
  return words
    .map((word) => {
      const key = methodWordKeys[word]
      return key ? translate(language, key) : titleCase(word)
    })
    .join(' ')
}

export function trainingBlockDateStatus(block: TrainingBlock, today: string | Date = new Date()): TrainingBlockDateStatus {
  const todayValue = dateValue(today)
  if (todayValue < dateValue(block.startDate)) return 'Upcoming'
  return todayValue < blockEnd(block) ? 'Current' : 'Completed'
}

export function defaultActiveBlock(blocks: TrainingBlock[], today: string | Date = new Date()) {
  if (blocks.length === 0) return null
  const todayValue = dateValue(today)
  const sorted = sortedBlocks(blocks)
  const started = sorted.filter((block) => dateValue(block.startDate) <= todayValue)
  return (
    sorted.find((block) => dateValue(block.startDate) <= todayValue && todayValue < blockEnd(block)) ??
    // Between blocks: show the next one if it starts within a week, so the user can prepare.
    sorted.find((block) => {
      const start = dateValue(block.startDate)
      return start > todayValue && start - todayValue <= 7 * DAY_MS
    }) ??
    started[started.length - 1] ??
    sorted[0]
  )
}

export function blockWeek(block: TrainingBlock, today: string | Date = new Date()) {
  const todayValue = dateValue(today)
  const startValue = dateValue(block.startDate)
  if (todayValue < startValue || todayValue >= blockEnd(block)) return null
  return Math.floor((todayValue - startValue) / (7 * DAY_MS)) + 1
}

export function completedTrainingSessions(block: TrainingBlock, history: WorkoutEntry[]) {
  const loggedExercisesBySession = new Map<string, Set<string>>()
  for (const entry of history) {
    if (entry.blockId !== block.id || !entry.dayKey) continue
    const key = `${entry.dayKey}:${entry.date}`
    const exercises = loggedExercisesBySession.get(key) ?? new Set<string>()
    exercises.add(entry.exerciseId)
    loggedExercisesBySession.set(key, exercises)
  }

  return block.days.flatMap((day) => {
    if (day.exercises.length === 0) return []
    const dates = [...loggedExercisesBySession.entries()]
      .filter(
        ([key, exercises]) =>
          key.startsWith(`${day.key}:`) &&
          day.exercises.every((exercise) => exercises.has(exercise.exerciseId))
      )
      .map(([key]) => key.slice(day.key.length + 1))
      .sort()

    return dates.map((date) => ({ dayKey: day.key, date }))
  })
}

export function nextUnloggedDay(
  block: TrainingBlock,
  history: WorkoutEntry[],
  today: string | Date = new Date()
) {
  if (block.days.length === 0) return undefined

  const todayValue = dateValue(today)
  const week = blockWeek(block, today) ?? (todayValue < dateValue(block.startDate) ? 1 : block.weeks)
  const weekStart = dateValue(block.startDate) + (week - 1) * 7 * DAY_MS
  const weekEnd = weekStart + 7 * DAY_MS
  const weekStartDate = new Date(weekStart).toISOString().slice(0, 10)
  const weekEndDate = new Date(weekEnd).toISOString().slice(0, 10)
  const entries = history.filter(
    (entry) => entry.blockId === block.id && entry.date >= weekStartDate && entry.date < weekEndDate
  )
  const days = [...block.days].sort((a, b) => a.position - b.position)

  return (
    days.find(
      (day) =>
        !day.exercises.every((exercise) =>
          entries.some((entry) => entry.dayKey === day.key && entry.exerciseId === exercise.exerciseId)
        )
    ) ?? days[0]
  )
}

export function todayTrainingDay(
  block: TrainingBlock,
  history: WorkoutEntry[],
  today: string | Date = new Date()
) {
  const date = toIsoDate(today)
  const days = [...block.days].sort((a, b) => a.position - b.position)
  const loggedToday = days.find((day) =>
    history.some((entry) => entry.blockId === block.id && entry.dayKey === day.key && entry.date === date)
  )
  return loggedToday ?? nextUnloggedDay(block, history, today)
}

export function formatBenchAngle(angleDegrees?: number | null, language: Language = 'en') {
  if (angleDegrees == null) return null
  if (angleDegrees === 0) return translate(language, 'workout.bench.flat')
  if (angleDegrees === 90) return translate(language, 'workout.bench.upright')
  return angleDegrees > 0
    ? translate(language, 'workout.bench.incline', { degrees: angleDegrees })
    : translate(language, 'workout.bench.decline', { degrees: Math.abs(angleDegrees) })
}

function formatRangeDate(language: Language, value: number) {
  const parts = new Intl.DateTimeFormat(localeFor(language), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).formatToParts(value)
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  const month = (parts.find((part) => part.type === 'month')?.value ?? '').replace(/\.$/, '')
  return `${day} ${month}`
}

export function blockDateRange(block: TrainingBlock, language: Language = 'en') {
  const start = dateValue(block.startDate)
  const end = blockEnd(block) - DAY_MS
  const startYear = new Date(start).getUTCFullYear()
  const endYear = new Date(end).getUTCFullYear()
  return `${formatRangeDate(language, start)}${startYear === endYear ? '' : ` ${startYear}`} – ${formatRangeDate(language, end)} ${endYear}`
}

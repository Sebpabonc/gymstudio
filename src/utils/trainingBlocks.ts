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

export function formatBenchAngle(angleDegrees?: number | null) {
  if (angleDegrees == null) return null
  if (angleDegrees === 0) return 'Flat bench'
  if (angleDegrees === 90) return 'Upright seat'
  return angleDegrees > 0
    ? `Incline ${angleDegrees}°`
    : `Decline ${Math.abs(angleDegrees)}°`
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(value)
}

export function blockDateRange(block: TrainingBlock) {
  const start = dateValue(block.startDate)
  const end = blockEnd(block) - DAY_MS
  const startYear = new Date(start).getUTCFullYear()
  const endYear = new Date(end).getUTCFullYear()
  return `${formatDate(start)}${startYear === endYear ? '' : ` ${startYear}`} – ${formatDate(end)} ${endYear}`
}

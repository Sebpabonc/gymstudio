import { Exercise, TrainingBlock } from '../types'
import {
  AdherenceReport,
  BlockReport,
  PersonalRecordSession,
  ProgressEntry,
  ProgressSuggestion,
  StrengthTrendPoint,
  WeeklyMuscleSets,
} from './types'
import { dateValue, findBlockForDate } from './utils'

export const MAX_SUGGESTIONS = 5
export const MAX_RECORDS = 5
export const MAX_BLOCK_LIFTS = 3
export const SETS_RANGE = { min: 10, max: 20 }

const DAY_MS = 24 * 60 * 60 * 1000

export function limitSuggestions(suggestions: ProgressSuggestion[], max = MAX_SUGGESTIONS) {
  return suggestions.slice(0, max)
}

export function suggestionExerciseId(suggestion: ProgressSuggestion) {
  return 'exerciseId' in suggestion ? suggestion.exerciseId : null
}

export function sessionDots(adherenceReport: AdherenceReport) {
  const { sessionsDone, sessionsPlanned } = adherenceReport.week
  return Array.from({ length: sessionsPlanned }, (_, index) => index < sessionsDone)
}

export function formatPercent(rate: number | null) {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`
}

export function blockAdherenceFor(adherenceReport: AdherenceReport, blockId: string | undefined) {
  return adherenceReport.blocks.find((block) => block.blockId === blockId) ?? null
}

export function recentRecords(records: PersonalRecordSession[], max = MAX_RECORDS) {
  return records
    .filter((record) => record.badges.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, max)
}

export const RECORD_LABELS = { weight: 'Weight PR', reps: 'Rep PR', e1rm: 'e1RM PR' } as const

export function visibleBlockReports(reports: BlockReport[], entries: ProgressEntry[], blocks: TrainingBlock[]) {
  const loggedBlockIds = new Set<string>()
  for (const entry of entries) {
    const block = (entry.blockId ? blocks.find((item) => item.id === entry.blockId) : undefined)
      ?? findBlockForDate(blocks, entry.date)
    if (block) loggedBlockIds.add(block.id)
  }
  return reports.filter((report) => loggedBlockIds.has(report.blockId))
}

export function topLifts(report: BlockReport, max = MAX_BLOCK_LIFTS) {
  return [...report.lifts].sort((a, b) => b.changePercent - a.changePercent).slice(0, max)
}

export function formatChange(value: number | null) {
  if (value === null) return '—'
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

export function muscleRows(weekly: WeeklyMuscleSets) {
  return weekly.groups.filter((group) => group.done > 0 || group.planned > 0)
}

export function muscleScale(rows: ReturnType<typeof muscleRows>) {
  return Math.max(SETS_RANGE.max + 5, ...rows.flatMap((row) => [row.done, row.planned]))
}

export function muscleStatus(row: { done: number; planned: number; band: string }) {
  if (row.band === 'high') {
    return row.planned >= row.done ? 'High — as planned' : 'High'
  }
  if (row.band === 'in-range') return 'In range'
  if (row.band === 'light') return 'Light'
  return 'Low'
}

export function exercisesWithHistory(entries: ProgressEntry[], exercises: Exercise[]) {
  const counts = new Map<string, number>()
  for (const entry of entries) counts.set(entry.exerciseId, (counts.get(entry.exerciseId) ?? 0) + 1)
  return exercises
    .filter((exercise) => counts.has(exercise.id))
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name))
}

export function mainLiftForToday(blocks: TrainingBlock[], today: string) {
  const block = findBlockForDate(blocks, today)
    ?? [...blocks].filter((item) => item.startDate <= today).sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  if (!block) return null
  const weekday = new Date(dateValue(today)).getUTCDay()
  const days = [...block.days].sort((a, b) => a.position - b.position)
  const day = weekday >= 1 && weekday <= days.length ? days[weekday - 1] : days[0]
  return [...(day?.exercises ?? [])].sort((a, b) => a.position - b.position)[0]?.exerciseId ?? null
}

export function defaultExerciseId(
  entries: ProgressEntry[],
  exercises: Exercise[],
  blocks: TrainingBlock[],
  today: string
) {
  const options = exercisesWithHistory(entries, exercises)
  const main = mainLiftForToday(blocks, today)
  if (main && options.some((exercise) => exercise.id === main)) return main
  return options[0]?.id ?? ''
}

export type ChartBand = { blockId: string; label: string; x: number; width: number }
export type ChartPoint = StrengthTrendPoint & { x: number; y: number; isRecord: boolean }
export type ChartModel = {
  width: number
  height: number
  points: ChartPoint[]
  path: string
  bands: ChartBand[]
  yTicks: Array<{ value: number; y: number }>
}

export const CHART_SIZE = { width: 320, height: 190, left: 34, right: 10, top: 12, bottom: 22 }

export function buildChartModel(
  points: StrengthTrendPoint[],
  blocks: TrainingBlock[],
  recordDates: Set<string> = new Set()
): ChartModel {
  const { width, height, left, right, top, bottom } = CHART_SIZE
  if (!points.length) return { width, height, points: [], path: '', bands: [], yTicks: [] }
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const minTime = dateValue(sorted[0].date)
  const maxTime = dateValue(sorted[sorted.length - 1].date)
  const span = Math.max(maxTime - minTime, DAY_MS)
  const values = sorted.map((point) => point.e1rm)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = Math.max((rawMax - rawMin) * 0.15, 1)
  const minY = Math.floor(rawMin - pad)
  const maxY = Math.ceil(rawMax + pad)
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const xFor = (time: number) => left + (Math.min(Math.max(time - minTime, 0), span) / span) * plotWidth
  const yFor = (value: number) => top + (1 - (value - minY) / (maxY - minY)) * plotHeight

  const chartPoints = sorted.map((point) => ({
    ...point,
    x: Number(xFor(dateValue(point.date)).toFixed(1)),
    y: Number(yFor(point.e1rm).toFixed(1)),
    isRecord: recordDates.has(point.date),
  }))

  const bands = blocks
    .map((block) => {
      const start = dateValue(block.startDate)
      const end = start + block.weeks * 7 * DAY_MS
      if (end <= minTime || start > maxTime) return null
      const x1 = xFor(Math.max(start, minTime))
      const x2 = xFor(Math.min(end, maxTime))
      return { blockId: block.id, label: `B${block.number}`, x: Number(x1.toFixed(1)), width: Number((x2 - x1).toFixed(1)) }
    })
    .filter((band): band is ChartBand => band !== null && band.width > 0)

  const yTicks = [minY, (minY + maxY) / 2, maxY].map((value) => ({
    value: Math.round(value),
    y: Number(yFor(value).toFixed(1)),
  }))

  return {
    width,
    height,
    points: chartPoints,
    path: chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' '),
    bands,
    yTicks,
  }
}

export function chartSummary(points: StrengthTrendPoint[], takeaway: string) {
  if (!points.length) return takeaway
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return `${takeaway} ${sorted.length} sessions from ${first.date} (${first.e1rm.toFixed(1)} kg) to ${last.date} (${last.e1rm.toFixed(1)} kg).`
}

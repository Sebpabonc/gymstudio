import { type TranslationKey } from '../i18n/en'
import { formatNumber, formatShortDate } from '../i18n/format'
import type { Language } from '../i18n/translate'
import { Exercise, TrainingBlock } from '../types'
import { filterExercises } from '../utils/exerciseFilters'
import { getExerciseDisplayName } from '../utils/storage'
import {
  AdherenceReport,
  BlockReport,
  MuscleGroup,
  PersonalRecordSession,
  ProgressEntry,
  ProgressSuggestion,
  StrengthTrendPoint,
  WeeklyMuscleSets,
} from './types'
import { dateValue, defaultProgressI18n, findBlockForDate, ProgressI18n, startOfWeek } from './utils'

import { defaultActiveBlock, formatBlockMethod as plainFormatBlockMethod } from '../utils/trainingBlocks'

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

export function formatPercent(rate: number | null, language: Language = 'en') {
  return rate === null ? '—' : `${formatNumber(language, Math.round(rate * 100))}%`
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

export const RECORD_LABELS = {
  weight: 'progress.records.badge.weight',
  reps: 'progress.records.badge.reps',
  e1rm: 'progress.records.badge.e1rm',
} as const
export const RECORD_TOOLTIPS = {
  weight: 'progress.records.tooltip.weight',
  reps: 'progress.records.tooltip.reps',
  e1rm: 'progress.records.tooltip.e1rm',
} as const

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

export function formatChange(value: number | null, language: Language = 'en') {
  if (value === null) return '—'
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${formatNumber(language, Math.abs(rounded))}%`
}

export function muscleRows(weekly: WeeklyMuscleSets) {
  return weekly.groups.filter((group) => group.done > 0 || group.planned > 0)
}

export function muscleScale(rows: ReturnType<typeof muscleRows>) {
  return Math.max(SETS_RANGE.max + 5, ...rows.flatMap((row) => [row.done, row.planned]))
}

export function muscleStatus(row: { done: number; planned: number; band: string }, { t }: ProgressI18n = defaultProgressI18n) {
  if (row.band === 'high') {
    return row.planned >= row.done ? t('progress.muscleStatus.highPlanned') : t('progress.muscleStatus.high')
  }
  if (row.band === 'in-range') return t('progress.muscleStatus.inRange')
  if (row.band === 'light') return t('progress.muscleStatus.light')
  return t('progress.muscleStatus.low')
}

export function exercisesWithHistory(entries: ProgressEntry[], exercises: Exercise[], language: Language = 'en') {
  const latestDates = new Map<string, string>()
  for (const entry of entries) {
    const date = entry.date.slice(0, 10)
    if (date > (latestDates.get(entry.exerciseId) ?? '')) latestDates.set(entry.exerciseId, date)
  }
  return exercises
    .filter((exercise) => latestDates.has(exercise.id))
    .sort((a, b) =>
      (latestDates.get(b.id) ?? '').localeCompare(latestDates.get(a.id) ?? '')
      || getExerciseDisplayName(a, language).localeCompare(getExerciseDisplayName(b, language))
    )
}

export function filterExerciseOptions(exercises: Exercise[], query: string) {
  return filterExercises(exercises, query)
}

export function weeklyPRCount(records: PersonalRecordSession[], weekStart: string) {
  const start = dateValue(weekStart)
  const end = start + 7 * DAY_MS
  return records.filter((record) => {
    const date = dateValue(record.date)
    return record.badges.length > 0 && date >= start && date < end
  }).length
}

export function weeklySummary(
  sessionsDone: number,
  sessionsPlanned: number,
  prCount: number,
  today: string,
  { language, t }: ProgressI18n = defaultProgressI18n
) {
  const weekday = new Date(dateValue(today)).getUTCDay()
  const sessionsExpected = Math.min(weekday === 0 ? 6 : weekday, sessionsPlanned)
  const status = sessionsDone >= sessionsExpected
    ? t('progress.weeklySummary.status.onTrack')
    : t('progress.weeklySummary.status.inProgress')
  return t(prCount === 1 ? 'progress.weeklySummary.one' : 'progress.weeklySummary.other', {
    done: formatNumber(language, sessionsDone),
    planned: formatNumber(language, sessionsPlanned),
    prCount: formatNumber(language, prCount),
    status,
  })
}

export function mainLiftForToday(blocks: TrainingBlock[], today: string) {
  const block = defaultActiveBlock(blocks, today)
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
  today: string,
  language: Language = 'en'
) {
  const options = exercisesWithHistory(entries, exercises, language)
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
  xTicks: Array<{ date: string; label: string; x: number }>
}

export const CHART_SIZE = { width: 320, height: 190, left: 34, right: 10, top: 12, bottom: 22 }

export function buildChartModel(
  points: StrengthTrendPoint[],
  blocks: TrainingBlock[],
  recordDates: Set<string> = new Set(),
  { language, t }: ProgressI18n = defaultProgressI18n
): ChartModel {
  const { width, height, left, right, top, bottom } = CHART_SIZE
  if (!points.length) return { width, height, points: [], path: '', bands: [], yTicks: [], xTicks: [] }
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
      return {
        blockId: block.id,
        label: t('progress.block.short', { number: block.number }),
        x: Number(x1.toFixed(1)),
        width: Number((x2 - x1).toFixed(1)),
      }
    })
    .filter((band): band is ChartBand => band !== null && band.width > 0)

  const yTicks = [minY, (minY + maxY) / 2, maxY].map((value) => ({
    value: Math.round(value),
    y: Number(yFor(value).toFixed(1)),
  }))
  const xTickPoints = [...new Map([
    [chartPoints[0].date, chartPoints[0]],
    [chartPoints[Math.floor((chartPoints.length - 1) / 2)].date, chartPoints[Math.floor((chartPoints.length - 1) / 2)]],
    [chartPoints[chartPoints.length - 1].date, chartPoints[chartPoints.length - 1]],
  ]).values()]
  const xTicks = xTickPoints.map((point) => ({
    date: point.date,
    label: formatShortDate(language, point.date),
    x: point.x,
  }))
  const path = chartPoints.map((point, index) => {
    const startsSegment = index === 0 || point.blockId !== chartPoints[index - 1].blockId
    return `${startsSegment ? 'M' : 'L'}${point.x} ${point.y}`
  }).join(' ')

  return {
    width,
    height,
    points: chartPoints,
    path,
    bands,
    yTicks,
    xTicks,
  }
}

export function chartSummary(
  points: StrengthTrendPoint[],
  takeaway: string,
  { language, t }: ProgressI18n = defaultProgressI18n
) {
  if (!points.length) return takeaway
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return t('progress.chart.summary', {
    takeaway,
    count: formatNumber(language, sorted.length),
    startDate: formatShortDate(language, first.date),
    startValue: formatNumber(language, first.e1rm, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    endDate: formatShortDate(language, last.date),
    endValue: formatNumber(language, last.e1rm, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    unit: t('progress.unit.kg'),
  })
}

export function reportingWeek(entries: Pick<ProgressEntry, 'date'>[], today: string) {
  const current = startOfWeek(today)
  const end = dateValue(current) + 7 * DAY_MS
  let latest: string | null = null
  for (const entry of entries) {
    const date = entry.date.slice(0, 10)
    if (dateValue(date) >= dateValue(current) && dateValue(date) < end) return current
    if (date < current && (latest === null || date > latest)) latest = date
  }
  return latest ? startOfWeek(latest) : current
}

export function reportingBlock(blocks: TrainingBlock[], entries: ProgressEntry[], today: string) {
  const withSessions = new Set<string>()
  for (const entry of entries) {
    const block = (entry.blockId ? blocks.find((item) => item.id === entry.blockId) : undefined)
      ?? findBlockForDate(blocks, entry.date)
    if (block) withSessions.add(block.id)
  }
  const current = findBlockForDate(blocks, today)
  if (current && withSessions.has(current.id)) return current
  return [...blocks]
    .filter((block) => withSessions.has(block.id) && block.startDate <= today)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
}

export function formatWeekLabel(weekStart: string, today: string, { language, t }: ProgressI18n = defaultProgressI18n) {
  if (weekStart === startOfWeek(today)) return t('progress.week.this')
  return t('progress.week.of', { date: formatShortDate(language, weekStart) })
}

const BLOCK_METHOD_LABELS = {
  'flat-pyramid': 'progress.blockMethod.flatPyramid',
  'reverse-pyramid': 'progress.blockMethod.reversePyramid',
  'strength-hypertrophy': 'progress.blockMethod.strengthHypertrophy',
  'ascending-pyramid': 'progress.blockMethod.ascendingPyramid',
} as const satisfies Partial<Record<string, TranslationKey>>

const MUSCLE_GROUP_LABELS = {
  Chest: 'progress.muscle.chest',
  Back: 'progress.muscle.back',
  'Shoulders (side and rear)': 'progress.muscle.shoulders',
  'Front delts': 'progress.muscle.frontDelts',
  Biceps: 'progress.muscle.biceps',
  Triceps: 'progress.muscle.triceps',
  Quads: 'progress.muscle.quads',
  Hamstrings: 'progress.muscle.hamstrings',
  Glutes: 'progress.muscle.glutes',
  Calves: 'progress.muscle.calves',
  Core: 'progress.muscle.core',
  Other: 'progress.muscle.other',
} as const satisfies Record<MuscleGroup, TranslationKey>

export function formatBlockMethod(method: string, { t }: ProgressI18n = defaultProgressI18n) {
  const key = BLOCK_METHOD_LABELS[method as keyof typeof BLOCK_METHOD_LABELS]
  return key ? t(key) : plainFormatBlockMethod(method)
}

export function formatProgressBlockLabel(block: TrainingBlock, { t }: ProgressI18n = defaultProgressI18n) {
  return block.number > 0 ? t('progress.block.label', { number: block.number }) : block.name
}

export function muscleGroupLabel(group: MuscleGroup, { t }: ProgressI18n = defaultProgressI18n) {
  return t(MUSCLE_GROUP_LABELS[group])
}

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { AuthStatus } from '../auth/AuthProvider'
import { formatMessageParams, formatNumber, formatShortDate, useT } from '../i18n'
import { localizeBlocks, useSpanishContentReady } from '../i18n/content'
import { localIsoDate } from '../lib/dates'
import { isDemoMode, isNewUserDemo } from '../utils/demoMode'
import { defaultActiveBlock } from '../utils/trainingBlocks'
import { groupSessions, type LoggedSession } from '../utils/sessions'
import { activeSwaps, applySwaps } from '../plans/exerciseSwaps'
import type { ExerciseSwap } from '../plans/exerciseSwaps'
import { loadDemoBlocks } from '../plans/demoBlock'
import { selectPlanBlocks } from '../plans/selectPlanBlocks'
import { fetchExerciseSwaps } from '../utils/profileData'
import {
  fetchActiveUserPlan,
  fetchTrainingBlocks,
  getCachedActiveUserPlan,
  getCachedTrainingBlocks,
  getExerciseDisplayName,
  loadLocalExerciseSwaps,
  saveLocalExerciseSwaps,
} from '../utils/storage'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import {
  blockLiftComparisons,
  compareLiftSessions,
  consistencyTrend,
  equivalentLiftSessions,
  exerciseVolumeTrend,
  liftTrend,
  liftTrendEvidence,
  muscleTrend,
  overallProgressStatus,
  progressLiftSessions,
  progressiveOverloadRate,
  rangeEnd,
  rangeStart,
  watchObservations,
} from '../progress'
import { dateValue, startOfWeek, workingSets } from '../progress/utils'
import { weeklyBestEstMax } from '../progress/estMax'
import { sessionVolumeComparison } from '../progress/volume'
import type { VolumeContextNote } from '../progress/volume'
import { MUSCLE_CHART_MAXIMUM, MUSCLE_COMMON_RANGE } from '../progress/muscles'
import type { WatchObservation } from '../progress/comparison'
import { baselineSummary, nextSessionWatches, type BaselineSummary } from '../progress/overview'
import type { ProgressStatus } from '../progress/status'
import { onTabListKeyDown } from '../utils/tabs'
import type { TranslationKey } from '../i18n/en'
import type {
  LiftTrend,
  ProgressEntry,
  ProgressLiftSession,
  MuscleGroup,
  ProgressV3Range,
  ProgressV3Tab,
} from '../progress/types'

type Props = {
  entries: WorkoutEntry[]
  exercises: Exercise[]
  initialExerciseId?: string
  onOpenExercise: (exerciseId: string) => void
  onSignIn: () => void
  onDeleteEntry: (entryId: string) => Promise<void>
  onRestoreEntry: (entry: WorkoutEntry) => Promise<void>
  authStatus: AuthStatus
  authUserId?: string | null
}

const RANGE_OPTIONS: Array<{ value: ProgressV3Range; key: TranslationKey }> = [
  { value: '4w', key: 'progress.v3.range.fourWeeks' },
  { value: '8w', key: 'progress.v3.range.eightWeeks' },
  { value: 'block', key: 'progress.v3.range.block' },
  { value: 'all', key: 'progress.v3.range.all' },
]
const TABS: ProgressV3Tab[] = ['overview', 'trends', 'muscles', 'consistency']
const MAIN_PATTERNS = new Set([
  'push horizontal',
  'push vertical',
  'pull horizontal',
  'pull vertical',
  'squat',
  'hinge',
  'lunge',
])
const STATUS_KEYS: Record<ProgressStatus, TranslationKey> = {
  building: 'progress.v3.status.building',
  progressing: 'progress.v3.status.progressing',
  holding: 'progress.v3.status.holding',
  dipping: 'progress.v3.status.dipping',
}
const WATCH_KEYS: Record<WatchObservation['code'], TranslationKey> = {
  W1: 'progress.v3.watch.W1',
  W2: 'progress.v3.watch.W2',
  W3: 'progress.v3.watch.W3',
  W6: 'progress.v3.watch.W6',
}
const NEXT_KEYS: Record<WatchObservation['code'], TranslationKey> = {
  W1: 'progress.v3.next.W1',
  W2: 'progress.v3.next.W2',
  W3: 'progress.v3.next.W3',
  W6: 'progress.v3.next.W6',
}
const MUSCLE_KEYS: Record<MuscleGroup, TranslationKey> = {
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
}

function translatedStatus(status: ProgressStatus, t: ReturnType<typeof useT>['t']) {
  return t(STATUS_KEYS[status])
}

function translatedVerdict(verdict: LiftTrend['verdict'], t: ReturnType<typeof useT>['t']) {
  return t(verdict === 'not-enough-data' ? 'progress.v3.verdict.insufficient' : `progress.v3.verdict.${verdict}`)
}

function planMainLifts(block: TrainingBlock | null, entries: ProgressEntry[], exercises: Exercise[]) {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const historicalIds = new Set(entries.map((entry) => entry.exerciseId))
  const planned = (block?.days ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .flatMap((day) => day.exercises.slice().sort((a, b) => a.position - b.position))
    .map((item) => item.exerciseId)
  const ids = [...new Set([...planned, ...historicalIds])]
  const compounds = ids.filter((id) => {
    const exercise = exerciseMap.get(id)
    if (exercise?.mechanic !== 'compound' || !MAIN_PATTERNS.has(exercise.movementPattern?.trim().toLowerCase() ?? '')) return false
    if (exercise.equipment?.trim().toLowerCase() !== 'bodyweight') return true
    return entries.some((entry) => entry.exerciseId === id && entry.sets.some((set) => set.weight > 0))
  })
  if (compounds.length >= 2) return compounds
  const isolationFallback = ids.filter((id) =>
    exerciseMap.get(id)?.mechanic === 'isolation'
    && entries.filter((entry) => entry.exerciseId === id).length >= 3
  )
  return [...new Set([...compounds, ...isolationFallback])]
}

function rateText(trend: LiftTrend, language: 'en' | 'es', t: ReturnType<typeof useT>['t']) {
  if (trend.kgPerWeek === null) return ''
  if ((trend.verdict === 'improving' && trend.kgPerWeek < 0)
    || (trend.verdict === 'lower' && trend.kgPerWeek > 0)) return ''
  if (trend.verdict === 'held') {
    return t('progress.v3.rate.aboutSame', {
      value: formatNumber(language, Math.abs(trend.percentPerWeek ?? 0), { maximumFractionDigits: 1 }),
    })
  }
  const signed = `${trend.kgPerWeek > 0 ? '+' : ''}${formatNumber(language, trend.kgPerWeek, { maximumFractionDigits: 1 })}`
  return t('progress.v3.rate.perWeek', { value: signed })
}

function bestSetText(language: 'en' | 'es', set: { weight: number; reps: number } | null | undefined) {
  return set
    ? `${formatNumber(language, set.weight, { maximumFractionDigits: 1 })} kg × ${formatNumber(language, set.reps)}`
    : '—'
}

function MiniTrendChart({ trend, t, exercise, language }: {
  trend: LiftTrend
  t: ReturnType<typeof useT>['t']
  exercise: string
  language: 'en' | 'es'
}) {
  const values = trend.points.map((point) => trend.highRep
    ? point.topLoad === null ? null : point.repsAtTop
    : point.e1rm
  ).filter((value): value is number => value !== null)
  if (!values.length) return <div className="pv3-chart-empty" aria-hidden="true" />
  const width = 320
  const height = 76
  const left = 10
  const right = width - 8
  const top = 8
  const bottom = height - 8
  const minTime = dateValue(trend.points[0].date)
  const maxTime = dateValue(trend.points[trend.points.length - 1].date)
  const span = Math.max(maxTime - minTime, 86_400_000)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const ySpan = max - min || 1
  const x = (date: string) => left + (dateValue(date) - minTime) / span * (right - left)
  const y = (value: number) => bottom - (value - min) / ySpan * (bottom - top)
  const line = trend.highRep ? '' : trend.points
    .filter((point) => point.movingAverage !== null)
    .map((point, index, points) => {
      const previous = points[index - 1]
      const starts = !previous || (point.breakDays !== null && point.breakDays >= 21)
      return `${starts ? 'M' : 'L'}${x(point.date).toFixed(1)} ${y(point.movingAverage ?? 0).toFixed(1)}`
    })
    .join(' ')
  const summaryPoints = trend.points.filter((point) => !point.deload && (trend.highRep
    ? point.topLoad !== null
    : point.bestSet !== null))
  const first = summaryPoints[0]
  const last = summaryPoints[summaryPoints.length - 1]
  const ariaLabel = trend.highRep
    ? t('progress.v3.trends.highRepChartAria', {
        exercise,
        verdict: translatedVerdict(trend.verdict, t).toLowerCase(),
        first: first ? bestSetText(language, { weight: first.topLoad ?? 0, reps: first.repsAtTop }) : '—',
        last: last ? bestSetText(language, { weight: last.topLoad ?? 0, reps: last.repsAtTop }) : '—',
      })
    : t('progress.v3.trends.chartAria', {
        exercise,
        verdict: translatedVerdict(trend.verdict, t).toLowerCase(),
        first: bestSetText(language, first?.bestSet),
        last: bestSetText(language, last?.bestSet),
      })
  return (
    <svg className="pv3-mini-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {trend.points.map((point, index) => {
        const value = trend.highRep
          ? point.topLoad === null ? null : point.repsAtTop
          : point.e1rm
        if (value === null) return null
        return trend.highRep
          ? <rect key={`${point.date}-${index}`} x={x(point.date) - 3} y={y(value)} width="6" height={Math.max(2, bottom - y(value))} className={point.deload ? 'pv3-rep-bar pv3-deload' : 'pv3-rep-bar'} />
          : <circle key={`${point.date}-${index}`} cx={x(point.date)} cy={y(value)} r={point.deload ? 3.5 : 2.5} className={point.deload ? 'pv3-point pv3-deload' : 'pv3-point'} />
      })}
      {line && <path className="pv3-moving-average" d={line} />}
    </svg>
  )
}

function LiftTrendChart({
  trend,
  blocks,
  exercise,
  language,
  t,
}: {
  trend: LiftTrend
  blocks: TrainingBlock[]
  exercise: Exercise
  language: 'en' | 'es'
  t: ReturnType<typeof useT>['t']
}) {
  const points = trend.points.filter((point) => trend.highRep || point.e1rm !== null)
  if (!points.length) return <p className="empty-state">{t('progress.v3.verdict.insufficient')}</p>
  const width = 340
  const height = 172
  const left = 30
  const right = 328
  const top = 22
  const bottom = 138
  const times = points.map((point) => dateValue(point.date))
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const timeSpan = Math.max(maxTime - minTime, 86_400_000)
  const x = (date: string) => left + (dateValue(date) - minTime) / timeSpan * (right - left)
  const svgPoints = points.map((point) => ({
    point,
    x: x(point.date),
    value: trend.highRep ? point.repsAtTop : point.e1rm ?? 0,
  }))
  const values = svgPoints.map((point) => point.value)
  const summaryPoints = points.filter((point) => !point.deload)
  const first = summaryPoints[0]
  const last = summaryPoints[summaryPoints.length - 1]
  const ariaLabel = trend.highRep
    ? t('progress.v3.trends.highRepChartAria', {
        exercise: getExerciseDisplayName(exercise, language),
        verdict: translatedVerdict(trend.verdict, t).toLowerCase(),
        first: first ? bestSetText(language, { weight: first.topLoad ?? 0, reps: first.repsAtTop }) : '—',
        last: last ? bestSetText(language, { weight: last.topLoad ?? 0, reps: last.repsAtTop }) : '—',
      })
    : t('progress.v3.trends.chartAria', {
        exercise: getExerciseDisplayName(exercise, language),
        verdict: translatedVerdict(trend.verdict, t).toLowerCase(),
        first: bestSetText(language, first?.bestSet),
        last: bestSetText(language, last?.bestSet),
      })
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const y = (value: number) => bottom - (value - min) / span * (bottom - top)
  const blockMarks = blocks.filter((block) => {
    const start = dateValue(block.startDate)
    return start >= minTime && start <= maxTime
  })
  const swapMarker = blocks.some((block) =>
    block.days.some((day) => day.exercises.some((planned) => planned.exerciseId === exercise.id && planned.swappedFrom))
  )
  if (trend.highRep) {
    const barWidth = Math.min(24, (right - left) / Math.max(points.length, 1) * 0.55)
    const firstLoad = new Map<number, number>()
    const bars = svgPoints.map(({ point, x: pointX, value }, index) => {
      if (!point.deload && point.topLoad !== null && !firstLoad.has(point.topLoad)) firstLoad.set(point.topLoad, value)
      const band = point.topLoad === null ? 0 : (firstLoad.get(point.topLoad) ?? value) * 0.1
      return (
        <g key={`${point.date}-${index}`}>
          {point.topLoad !== null && !point.deload && (
            <rect
              x={pointX - barWidth / 2}
              y={y(value + band)}
              width={barWidth}
              height={Math.max(1, y(value - band) - y(value + band))}
              className="pv3-rep-band"
            />
          )}
          <rect
            x={pointX - barWidth / 2}
            y={y(value)}
            width={barWidth}
            height={Math.max(2, bottom - y(value))}
            className={point.deload ? 'pv3-rep-bar pv3-deload' : 'pv3-rep-bar'}
          />
          <text x={pointX} y={y(value) - 4} textAnchor="middle" className="pv3-chart-value">{formatNumber(language, value)}</text>
          <text x={pointX} y={bottom + 17} textAnchor="middle" className="pv3-chart-date">{formatShortDate(language, point.date)}</text>
        </g>
      )
    })
    return (
      <svg className="pv3-detail-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {blockMarks.map((block) => <line key={block.id} x1={x(block.startDate)} x2={x(block.startDate)} y1={top} y2={bottom} className="pv3-block-marker" />)}
        {bars}
      </svg>
    )
  }
  const averageLine = svgPoints
    .filter((entry) => entry.point.movingAverage !== null)
    .map((entry, index, visible) => {
      const previous = visible[index - 1]
      const starts = !previous || (entry.point.breakDays !== null && entry.point.breakDays >= 21)
      return `${starts ? 'M' : 'L'}${entry.x.toFixed(1)} ${y(entry.point.movingAverage ?? 0).toFixed(1)}`
    })
    .join(' ')
  return (
    <svg className="pv3-detail-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {[0, 0.5, 1].map((fraction) => <line key={fraction} x1={left} x2={right} y1={top + (bottom - top) * fraction} y2={top + (bottom - top) * fraction} className="pv3-grid-line" />)}
      {blockMarks.map((block) => (
        <g key={block.id}>
          <line x1={x(block.startDate)} x2={x(block.startDate)} y1={top} y2={bottom} className="pv3-block-marker" />
          {block.name.trim() && <text x={x(block.startDate) + 2} y={top - 5} className="pv3-chart-date">{block.name}</text>}
        </g>
      ))}
      {swapMarker && <text x={left} y={height - 1} className="pv3-swap-marker">{`⇄ ${t('progress.v3.detail.swap')}`}</text>}
      {svgPoints.map(({ point, x: pointX, value }, index) => (
        <g key={`${point.date}-${index}`}>
          {point.breakDays !== null && <text x={pointX} y={bottom - 4} textAnchor="middle" className="pv3-chart-date">{t('progress.v3.detail.break', { days: point.breakDays })}</text>}
          {point.isBest && !point.deload && <text x={pointX} y={y(value) - 8} textAnchor="middle" className="pv3-best-star">★</text>}
          {point.dayKey?.toLowerCase().endsWith('-b')
            ? <rect x={pointX - 3} y={y(value) - 3} width="6" height="6" className={point.deload ? 'pv3-point pv3-deload' : 'pv3-point pv3-day-b'} />
            : <circle cx={pointX} cy={y(value)} r={point.deload ? 4 : 3} className={point.deload ? 'pv3-point pv3-deload' : 'pv3-point'} />}
          <text x={pointX} y={bottom + 17} textAnchor="middle" className="pv3-chart-date">{formatShortDate(language, point.date)}</text>
        </g>
      ))}
      {averageLine && <path d={averageLine} className="pv3-moving-average pv3-detail-average" />}
    </svg>
  )
}

function SegmentedRange({
  range,
  onChange,
  t,
}: {
  range: ProgressV3Range
  onChange: (range: ProgressV3Range) => void
  t: ReturnType<typeof useT>['t']
}) {
  return (
    <div className="pv3-range" role="group" aria-label={t('progress.v3.range.label')}>
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={range === option.value ? 'active' : ''}
          aria-pressed={range === option.value}
          onClick={() => onChange(option.value)}
        >
          {t(option.key)}
        </button>
      ))}
    </div>
  )
}

function MetricChip({ label, current, previous }: { label: string; current: string; previous: string }) {
  return (
    <div className="pv3-chip">
      <strong>{current}</strong>
      <span>{label}</span>
      {previous && <small>{previous}</small>}
    </div>
  )
}

function Gauge({
  value,
  label,
  averageLabel,
  language,
}: {
  value: number | null
  label: string
  averageLabel: string
  language: 'en' | 'es'
}) {
  const percent = value === null
    ? null
    : Math.max(0, Math.min(value, MUSCLE_CHART_MAXIMUM)) / MUSCLE_CHART_MAXIMUM * 100
  const bandStart = MUSCLE_COMMON_RANGE.min / MUSCLE_CHART_MAXIMUM * 100
  const bandWidth = (MUSCLE_COMMON_RANGE.max - MUSCLE_COMMON_RANGE.min) / MUSCLE_CHART_MAXIMUM * 100
  return (
    <div className="pv3-gauge" role="img" aria-label={value === null ? `${label}: 10–20. ${averageLabel} unavailable` : `${averageLabel}: ${value}. ${label}: 10–20`}>
      {value !== null && <small className="pv3-gauge-average-label">{averageLabel}</small>}
      <div className="pv3-gauge-plot">
        <span className="pv3-gauge-track" />
        <span className="pv3-gauge-band" style={{ left: `${bandStart}%`, width: `${bandWidth}%` }} />
        {value !== null && percent !== null && <>
          <span className="pv3-gauge-marker" style={{ left: `${percent}%` }} />
          <strong className="pv3-gauge-value" style={{ left: `${percent}%` }}>{formatNumber(language, value, { maximumFractionDigits: 1 })}</strong>
        </>}
        <div className="pv3-gauge-axis"><span>0</span><span>{MUSCLE_COMMON_RANGE.min}</span><span>{MUSCLE_COMMON_RANGE.max}</span><span>{MUSCLE_CHART_MAXIMUM}</span></div>
      </div>
      <small className="pv3-gauge-band-label">↑ {MUSCLE_COMMON_RANGE.min}–{MUSCLE_COMMON_RANGE.max} {label}</small>
    </div>
  )
}

function weekDateLabel(language: 'en' | 'es', date: string) {
  return formatShortDate(language, date)
}

function dateString(value: number) {
  return new Date(value).toISOString().slice(0, 10)
}

function progressWeekStart(today: string, block: TrainingBlock | null) {
  if (!block) return startOfWeek(today)
  const blockStart = dateValue(block.startDate)
  const todayValue = dateValue(today)
  if (todayValue < blockStart || todayValue >= blockStart + block.weeks * 7 * 86_400_000) {
    return startOfWeek(today)
  }
  return dateString(blockStart + Math.floor((todayValue - blockStart) / (7 * 86_400_000)) * 7 * 86_400_000)
}

/** One short line for an Overview row: this week's best set, without the week-over-week wording. */
function weeklyBestCompactText(
  summary: ReturnType<typeof weeklyBestEstMax> | undefined,
  language: 'en' | 'es',
  t: ReturnType<typeof useT>['t']
) {
  if (!summary?.current) return ''
  const best = bestSetText(language, summary.current.bestSet)
  return t(summary.currentWeekComplete ? 'progress.v3.weeklyBest.completeFirst' : 'progress.v3.weeklyBest.soFar', { best })
}

function volumeContextText(
  note: VolumeContextNote,
  language: 'en' | 'es',
  t: ReturnType<typeof useT>['t']
) {
  if (note.code === 'fewer-sets') {
    return t('progress.v3.detail.volumeFewerSets', {
      current: formatNumber(language, note.current),
      previous: formatNumber(language, note.previous),
    })
  }
  const key = note.code === 'deload' ? 'volumeDeload'
    : note.code === 'heavier-weight' ? 'volumeHeavier'
      : note.code === 'first-week-back' ? 'volumeFirstBack'
        : note.code === 'best-set-held' ? 'volumeBestHeld'
          : 'volumeDifferentTarget'
  return t(`progress.v3.detail.${key}` as TranslationKey)
}

function nonDeloadHistory(sessions: ProgressLiftSession[]) {
  return sessions.filter((session) => !session.deload)
}

export function worthReason(
  trend: LiftTrend,
  history: ProgressLiftSession[],
  exercise: Exercise,
  blocks: TrainingBlock[],
  t: ReturnType<typeof useT>['t'],
  language: 'en' | 'es'
) {
  if (trend.worthLookingAt) {
    return t('progress.v3.worth.noBest', {
      count: formatNumber(language, trend.worthLookingAt.sessions),
      date: formatShortDate(language, trend.worthLookingAt.date),
    })
  }
  const equivalent = nonDeloadHistory(history).slice().reverse().filter((session, index, reversed) =>
    index === 0 || equivalentLiftSessions(session, reversed[index - 1])
  ).slice(0, 3)
  if (equivalent.length === 3) {
    const recent = [...equivalent].reverse()
    const verdicts = recent.map((session, index) => {
      if (index === 0) return null
      const previous = recent[index - 1]
      return compareLiftSessions(previous, session, exercise, blocks).verdict
    }).filter(Boolean)
    if (verdicts.filter((verdict) => verdict === 'dropped' || verdict === 'mixed').length >= 2) {
      return t('progress.v3.worth.dropped')
    }
  }
  return null
}

function weekMean(weeks: Array<{ adherence: number | null; plannedDays: number; loggedPlannedDays: number }>) {
  const selected = weeks.filter((week) => week.adherence !== null)
  const planned = selected.reduce((total, week) => total + week.plannedDays, 0)
  return planned ? selected.reduce((total, week) => total + week.loggedPlannedDays, 0) / planned : null
}

export default function ProgressScreen({
  entries,
  exercises,
  initialExerciseId,
  onOpenExercise,
  onDeleteEntry,
  onRestoreEntry,
  authStatus,
  authUserId,
}: Props) {
  const { t, language } = useT()
  const demoMode = isDemoMode()
  const today = localIsoDate()
  const spanishReady = useSpanishContentReady(language)
  const [rawBlocks, setBlocks] = useState<TrainingBlock[] | null>(null)
  const [exerciseSwaps, setExerciseSwaps] = useState<ExerciseSwap[]>(() => loadLocalExerciseSwaps())
  const [range, setRange] = useState<ProgressV3Range>('block')
  const [tab, setTab] = useState<ProgressV3Tab>('overview')
  const [selectedLiftId, setSelectedLiftId] = useState(initialExerciseId ?? '')
  const [confirmSession, setConfirmSession] = useState('')
  const [undoEntries, setUndoEntries] = useState<WorkoutEntry[] | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blocks = useMemo(() => rawBlocks
    ? localizeBlocks(
        applySwaps(rawBlocks, activeSwaps(exerciseSwaps, today), new Set(exercises.map((exercise) => exercise.id))),
        language
      )
    : null, [rawBlocks, exerciseSwaps, today, exercises, language, spanishReady])

  useEffect(() => () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (initialExerciseId) setSelectedLiftId(initialExerciseId)
  }, [initialExerciseId])

  useEffect(() => {
    let cancelled = false
    const signedIn = authStatus === 'signed-in' && !demoMode
    const localSwaps = loadLocalExerciseSwaps()
    setExerciseSwaps(localSwaps)
    const personalPlanAllowed = signedIn || isNewUserDemo()
    const cachedPlan = personalPlanAllowed ? getCachedActiveUserPlan() : null
    const globalCache = demoMode ? [] : getCachedTrainingBlocks() ?? []
    const cachedBlocks = selectPlanBlocks(globalCache, cachedPlan, signedIn, demoMode)
    if (cachedBlocks.length) setBlocks(cachedBlocks)
    void Promise.all([
      demoMode ? loadDemoBlocks() : fetchTrainingBlocks(),
      personalPlanAllowed ? fetchActiveUserPlan().catch(() => null) : Promise.resolve(null),
      signedIn ? fetchExerciseSwaps().catch(() => null) : Promise.resolve(null),
    ]).then(([globalBlocks, activePlan, remoteSwaps]) => {
      if (cancelled) return
      if (remoteSwaps) {
        const swaps: ExerciseSwap[] = [
          ...localSwaps.filter((swap) => swap.scope === 'today'),
          ...remoteSwaps.map((swap) => ({ ...swap, scope: 'always' as const })),
        ]
        setExerciseSwaps(saveLocalExerciseSwaps(swaps, today))
      }
      setBlocks(selectPlanBlocks(globalBlocks, activePlan, signedIn, demoMode))
    }).catch(() => {
      if (!cancelled) setBlocks(cachedBlocks)
    })
    return () => {
      cancelled = true
    }
  }, [authStatus, authUserId, demoMode])

  const activeBlock = useMemo(() => blocks ? defaultActiveBlock(blocks, today) : null, [blocks, today])
  const progressEntries = entries as ProgressEntry[]
  const mainLiftIds = useMemo(
    () => planMainLifts(activeBlock, progressEntries, exercises),
    [activeBlock, progressEntries, exercises]
  )
  const allLiftIds = useMemo(() => [...new Set(entries.map((entry) => entry.exerciseId))], [entries])
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises])
  const displayName = (id: string) => {
    const exercise = exerciseById.get(id)
    return exercise ? getExerciseDisplayName(exercise, language) : id
  }
  const trends = useMemo(() => {
    if (!blocks) return new Map<string, LiftTrend>()
    return new Map(allLiftIds.map((id) => {
      const exercise = exerciseById.get(id)
      const fallback: Exercise = exercise ?? { id, name: id, primaryMuscle: 'Other' }
      return [id, liftTrend(progressEntries, blocks, fallback, range, activeBlock, today)]
    }))
  }, [allLiftIds, blocks, exerciseById, progressEntries, range, activeBlock, today])
  const overviewTrends = useMemo(() => {
    if (!blocks) return new Map<string, LiftTrend>()
    return new Map(mainLiftIds.map((id) => [
      id,
      liftTrend(progressEntries, blocks, exerciseById.get(id), 'block', activeBlock, today),
    ]))
  }, [mainLiftIds, blocks, progressEntries, exerciseById, activeBlock, today])
  const mainTrends = mainLiftIds.map((id) => overviewTrends.get(id)).filter((trend): trend is LiftTrend => Boolean(trend))
  const status = overallProgressStatus(mainTrends.map((trend) => trend.verdict))
  const liftSessions = useMemo(
    () => blocks ? progressLiftSessions(progressEntries, blocks) : [],
    [progressEntries, blocks]
  )
  const weeklyBestSummaries = useMemo(() => {
    if (!blocks) return new Map<string, ReturnType<typeof weeklyBestEstMax>>()
    const weekStart = progressWeekStart(today, activeBlock)
    return new Map(mainLiftIds.map((id) => [
      id,
      weeklyBestEstMax(liftSessions, id, weekStart, blocks),
    ]))
  }, [mainLiftIds, blocks, liftSessions, activeBlock, today])
  const watches = useMemo(
    () => blocks ? watchObservations(progressEntries, blocks, exercises, Number.POSITIVE_INFINITY) : [],
    [progressEntries, blocks, exercises]
  )
  const consistency = useMemo(
    () => blocks ? consistencyTrend(progressEntries, blocks, today) : null,
    [progressEntries, blocks, today]
  )
  const muscles = useMemo(
    () => blocks ? muscleTrend(progressEntries, blocks, exercises, activeBlock, today) : null,
    [progressEntries, blocks, exercises, activeBlock, today]
  )
  const overload = useMemo(
    () => blocks ? progressiveOverloadRate(progressEntries, blocks, exercises, today) : null,
    [progressEntries, blocks, exercises, today]
  )
  const blockComparisons = useMemo(
    () => blocks ? blockLiftComparisons(progressEntries, blocks, exercises, activeBlock) : [],
    [progressEntries, blocks, exercises, activeBlock]
  )
  const selectedExercise: Exercise | null = selectedLiftId
    ? exerciseById.get(selectedLiftId) ?? { id: selectedLiftId, name: selectedLiftId, primaryMuscle: 'Other' }
    : null
  const selectedTrend = selectedLiftId ? trends.get(selectedLiftId) : null
  const consistencyData = consistency ?? { weeks: [], currentStreak: 0, longestStreak: 0, adherenceFourWeeks: null }
  const muscleData = muscles ?? { weeks: [], groups: [], averages: {} }
  const start = rangeStart(range, today, activeBlock, progressEntries)
  const end = rangeEnd(range, today, activeBlock)
  const selectedVolume = useMemo(() => selectedExercise && blocks
    ? exerciseVolumeTrend(progressEntries, blocks, selectedExercise, today, start, end)
    : null, [selectedExercise, blocks, progressEntries, today, start, end])
  const volumeProgress = useMemo(() => selectedExercise && blocks
    ? exerciseVolumeTrend(progressEntries, blocks, selectedExercise, today)
    : null, [selectedExercise, blocks, progressEntries, today])
  const selectedSessions = selectedLiftId
    ? liftSessions.filter((session) => session.exerciseId === selectedLiftId && session.date >= start && session.date <= end)
    : []
  const detailSessions = selectedSessions.slice(-8).reverse().map((session) => {
    const prior = [...liftSessions].reverse().find((candidate) =>
      candidate.exerciseId === session.exerciseId
      && candidate.date < session.date
      && equivalentLiftSessions(candidate, session)
    ) ?? null
    return {
      session,
      previous: prior,
      comparison: compareLiftSessions(prior, session, selectedExercise ?? undefined, blocks ?? []),
    }
  })

  const deleteSession = async (session: LoggedSession) => {
    for (const entry of session.entries) await onDeleteEntry(entry.id)
    setConfirmSession('')
    setUndoEntries(session.entries)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => setUndoEntries(null), 8_000)
  }
  const undoDelete = async () => {
    if (!undoEntries) return
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    for (const entry of undoEntries) await onRestoreEntry(entry)
    setUndoEntries(null)
  }
  const sessionLog = useMemo(() => groupSessions(entries), [entries])

  if (!blocks) return <section className="card" aria-live="polite"><p className="empty-state">{t('progress.loading')}</p></section>

  const historyByLift = new Map<string, ProgressLiftSession[]>()
  for (const session of liftSessions) historyByLift.set(session.exerciseId, [...(historyByLift.get(session.exerciseId) ?? []), session])
  const worthReasons = new Map<string, string>()
  for (const id of mainLiftIds) {
    const trend = overviewTrends.get(id)
    const exercise = exerciseById.get(id) ?? { id, name: id, primaryMuscle: 'Other' }
    if (trend) {
      const reason = worthReason(trend, historyByLift.get(id) ?? [], exercise, blocks, t, language)
      if (reason) worthReasons.set(id, reason)
    }
  }
  const completeWeeks = consistencyData.weeks.filter((week) => week.complete)
  const baseline = baselineSummary(mainTrends, completeWeeks.length)
  const nextWatches = nextSessionWatches(watches)
  const recentFour = completeWeeks.slice(-4)
  const previousFour = completeWeeks.slice(-8, -4)
  const currentAdherence = weekMean(recentFour)
  const previousAdherence = previousFour.length === 4 ? weekMean(previousFour) : null
  const trendSessions = progressLiftSessions(progressEntries, blocks)
  const fourWeekStart = dateValue(today) - 27 * 86_400_000
  const previousFourStart = dateValue(today) - 55 * 86_400_000
  const dayCount = (from: number, to: number) => new Set(trendSessions
    .filter((session) => dateValue(session.date) >= from && dateValue(session.date) <= to)
    .map((session) => session.date)).size
  const currentDays = dayCount(fourWeekStart, dateValue(today))
  const previousDays = dayCount(previousFourStart, fourWeekStart - 86_400_000)
  const previousOverload = progressiveOverloadRate(
    progressEntries,
    blocks,
    exercises,
    new Date(dateValue(today) - 28 * 86_400_000).toISOString().slice(0, 10)
  )
  const mainChangeValues = mainLiftIds.flatMap((id) => {
    const sessions = liftSessions.filter((session) => session.exerciseId === id && !session.deload)
    const current = sessions.filter((session) => dateValue(session.date) >= fourWeekStart && dateValue(session.date) <= dateValue(today))
    const previous = sessions.filter((session) => dateValue(session.date) >= previousFourStart && dateValue(session.date) < fourWeekStart)
    const currentValues = current.map((session) => trends.get(id)?.points.find((point) => point.date === session.date)?.e1rm ?? null).filter((value): value is number => value !== null)
    const previousValues = previous.map((session) => {
      const entryPoint = liftTrend(progressEntries, blocks, exerciseById.get(id), 'all', activeBlock, today).points.find((point) => point.date === session.date)
      return entryPoint?.e1rm ?? null
    }).filter((value): value is number => value !== null)
    if (currentValues.length < 2 || previousValues.length < 2) return []
    const currentMean = currentValues.reduce((sum, value) => sum + value, 0) / currentValues.length
    const previousMean = previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
    return previousMean ? [((currentMean / previousMean) - 1) * 100] : []
  })
  const averageMainChange = mainChangeValues.length
    ? mainChangeValues.reduce((sum, value) => sum + value, 0) / mainChangeValues.length
    : null
  const unlockedMuscleWeeks = muscleData.weeks.filter((week) => week.complete && !week.deload).length

  // One action heading per watch type ("Hit every target rep"), then each lift with the existing evidence line.
  const nextGroups = nextWatches.reduce<Array<{ code: WatchObservation['code']; watches: WatchObservation[] }>>((groups, watch) => {
    const last = groups[groups.length - 1]
    if (last?.code === watch.code && watch.code !== 'W1') last.watches.push(watch)
    else groups.push({ code: watch.code, watches: [watch] })
    return groups
  }, [])
  const renderNextGroup = (group: (typeof nextGroups)[number]) => (
    <li key={`${group.code}-${group.watches[0].exerciseId}`} className={`pv3-next-${group.code}`}>
      <strong>{t(NEXT_KEYS[group.code], formatMessageParams(language, group.watches[0].params))}</strong>
      {group.watches.map((watch) => (
        <span key={watch.exerciseId}>
          {displayName(watch.exerciseId)} <small>· {t(WATCH_KEYS[watch.code], formatMessageParams(language, watch.params))}</small>
        </span>
      ))}
    </li>
  )

  const consistencyLine = currentAdherence !== null
    ? t(consistencyData.currentStreak === 1 ? 'progress.v3.overview.consistency.one' : 'progress.v3.overview.consistency', {
        adherence: formatNumber(language, currentAdherence * 100, { maximumFractionDigits: 0 }),
        streak: formatNumber(language, consistencyData.currentStreak),
      })
    : ''

  const renderBaseline = (summary: BaselineSummary) => {
    const best = mainLiftIds
      .map((id) => ({ id, text: weeklyBestCompactText(weeklyBestSummaries.get(id), language, t) }))
      .find((row) => row.text)
    return (
      <section className="card pv3-card pv3-baseline">
        <h3>{t('progress.v3.baseline.title')}</h3>
        <p>{t('progress.v3.baseline.body', {
          sessions: t('progress.v3.unlock.sessions', { count: formatNumber(language, summary.sessions) }),
        })}</p>
        <p className="pv3-caption">{t(summary.sessions < summary.target ? 'progress.v3.baseline.caption' : 'progress.v3.baseline.captionSpan')}</p>
        {best && <p className="pv3-baseline-best"><strong>{displayName(best.id)}</strong> <span>{best.text}</span></p>}
      </section>
    )
  }

  const renderOverview = () => baseline ? renderBaseline(baseline) : (
    <>
      <section className={`card pv3-status pv3-status-${status.status}`}>
        <div className="pv3-status-heading">
          <strong className="pv3-status-word">{translatedStatus(status.status, t)}</strong>
          <details className="pv3-info">
            <summary aria-label={t('progress.v3.status.about')}>ⓘ</summary>
            <small>{t('progress.v3.status.explainer')}</small>
          </details>
        </div>
        <p>{t('progress.v3.status.reason', {
          improving: formatNumber(language, status.counts.improving),
          total: formatNumber(language, status.counts.eligible),
          held: formatNumber(language, status.counts.held),
          lower: formatNumber(language, status.counts.lower),
        })}</p>
        {consistencyLine && <p>{consistencyLine}</p>}
      </section>

      <section className="card pv3-card">
        <h3>{t('progress.v3.yourLifts')}</h3>
        <ul className="pv3-lift-list">
          {mainLiftIds.map((id) => {
            const trend = overviewTrends.get(id)
            if (!trend) return null
            const hasVerdict = Boolean(liftTrendEvidence(trend)) && trend.verdict !== 'not-enough-data'
            const number = (hasVerdict ? rateText(trend, language, t) : '')
              || weeklyBestCompactText(weeklyBestSummaries.get(id), language, t)
            return (
              <li key={id}>
                <button type="button" className="pv3-lift-row" onClick={() => setSelectedLiftId(id)} aria-label={t('progress.strength.openDetail', { exercise: displayName(id) })}>
                  <span className="pv3-lift-copy">
                    <strong>{displayName(id)}</strong>
                    <span>{translatedVerdict(hasVerdict ? trend.verdict : 'not-enough-data', t)}{number ? ` · ${number}` : ''}</span>
                  </span>
                  <span className="pv3-lift-chevron" aria-hidden="true">›</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card pv3-card">
        <h3>{t('progress.v3.next.title')}</h3>
        {nextWatches.length
          ? <ul className="pv3-watch-list pv3-next-list">{nextGroups.map(renderNextGroup)}</ul>
          : <p className="pv3-caption">{t('progress.v3.summary.empty')}</p>}
      </section>
    </>
  )

  const renderTrends = () => {
    const currentAdherenceText = currentAdherence === null ? '—' : `${formatNumber(language, currentAdherence * 100, { maximumFractionDigits: 0 })}%`
    const previousAdherenceText = previousAdherence === null ? '—' : `${formatNumber(language, previousAdherence * 100, { maximumFractionDigits: 0 })}%`
    const mainChangeText = averageMainChange === null ? '—' : `${averageMainChange > 0 ? '+' : ''}${formatNumber(language, averageMainChange, { maximumFractionDigits: 1 })}%`
    const currentOverloadText = overload?.rate === null || overload?.rate === undefined ? '—' : `${formatNumber(language, Math.round(overload.rate * 100))}%`
    const previousOverloadText = previousOverload.rate === null ? '—' : `${formatNumber(language, Math.round(previousOverload.rate * 100))}%`
    const previousLabel = (value: string) => t('progress.v3.trends.previous', { value })
    // A chip is only a comparison when both periods have a value; "Previous: —" chips are hidden (PO 2026-11-07).
    // Main-lift strength is already a change between the two periods, so it has no "previous" line.
    const compareChips = [
      { label: t('progress.v3.trends.trainingDays'), current: formatNumber(language, currentDays), previous: previousDays ? formatNumber(language, previousDays) : '—' },
      { label: t('progress.v3.trends.adherence'), current: currentAdherenceText, previous: previousAdherenceText },
      { label: t('progress.v3.trends.mainLift'), current: mainChangeText, previous: null },
      { label: t('progress.v3.trends.overload'), current: currentOverloadText, previous: previousOverloadText },
    ].filter((chip) => chip.previous === null ? chip.current !== '—' : chip.previous !== '—')
      .map((chip) => ({ ...chip, previous: chip.previous === null ? '' : previousLabel(chip.previous) }))
    const showPreviousBlock = blockComparisons.some((row) => !row.newInBlock)
    const windowStart = rangeStart(range, today, activeBlock, progressEntries)
    const windowEnd = rangeEnd(range, today, activeBlock)
    const rangeLiftIds = [...new Set([...mainLiftIds, ...allLiftIds])]
      .filter((id) => (historyByLift.get(id) ?? []).some((session) => session.date >= windowStart && session.date <= windowEnd))
    return (
      <>
        {/* Always a fixed 4-week comparison, so it sits above the range control that drives the cards below. */}
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.compare')}</h3>
          {compareChips.length
            ? <div className="pv3-chip-grid">
              {compareChips.map((chip) => <MetricChip key={chip.label} label={chip.label} current={chip.current} previous={chip.previous} />)}
            </div>
            : <p className="pv3-caption">{t('progress.v3.trends.compareEmpty')}</p>}
        </section>
        <SegmentedRange range={range} onChange={setRange} t={t} />
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.strength')}</h3>
          {mainLiftIds.map((id) => {
            const trend = trends.get(id)
            if (!trend) return null
            return (
              <button type="button" className="pv3-trend-lift" key={id} onClick={() => setSelectedLiftId(id)}>
                <span className="pv3-trend-heading"><strong>{displayName(id)}</strong><span>{translatedVerdict(trend.verdict, t)}</span></span>
                {trend.verdict !== 'not-enough-data' && <span className="pv3-trend-detail">{rateText(trend, language, t)}{rateText(trend, language, t) ? ' · ' : ''}{t(`progress.v3.confidence.${trend.confidence === 'based-on' ? 'basedOn' : trend.confidence ?? 'early'}`, { count: formatNumber(language, trend.points.filter((point) => !point.deload).length) })}</span>}
                <MiniTrendChart trend={trend} t={t} exercise={displayName(id)} language={language} />
              </button>
            )
          })}
          <p className="pv3-caption">{t('progress.v3.trends.rawLegend')}</p>
        </section>
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.blockCompare')}</h3>
          {blockComparisons.length ? (
            <div className="pv3-table-wrap">
              <table className={showPreviousBlock ? 'pv3-table pv3-table-with-previous' : 'pv3-table'}>
                <thead><tr>
                  <th>{t('progress.strength.exercise')}</th>
                  {showPreviousBlock && <th>{t('progress.v3.trends.previousBlock')}</th>}
                  <th>{t('progress.v3.trends.blockStart')}</th>
                  <th>{t('progress.v3.trends.blockEnd')}</th>
                </tr></thead>
                <tbody>
                  {blockComparisons.map((row) => (
                    <tr key={row.exerciseId}>
                      <th scope="row">{displayName(row.exerciseId)}</th>
                      {showPreviousBlock && <td data-label={t('progress.v3.trends.previousBlock')}>{row.newInBlock ? t('progress.v3.trends.newBlock') : bestSetText(language, row.previousEndBestSet)}</td>}
                      <td data-label={t('progress.v3.trends.blockStart')}>{bestSetText(language, row.startBestSet)}</td>
                      <td data-label={t('progress.v3.trends.blockEnd')}>
                        {bestSetText(language, row.endBestSet)}
                        {row.changePercent !== null && <small className="pv3-table-change"> {row.changePercent > 0 ? '+' : ''}{formatNumber(language, row.changePercent, { maximumFractionDigits: 1 })}%</small>}
                        {row.differentRepTarget && <small className="pv3-table-note">{t('progress.v3.trends.differentTarget')}</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="pv3-caption">{t('progress.v3.unlock.secondBlock')}</p>}
          {blockComparisons.length > 0 && !showPreviousBlock && <p className="pv3-caption">{t('progress.v3.trends.allNew')}</p>}
          <p className="pv3-caption">{t('progress.v3.trends.blockNote')}</p>
        </section>
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.allExercises')}</h3>
          <ul className="pv3-all-exercises">
            {rangeLiftIds.map((id) => {
              const trend = trends.get(id)
              return (
                <li key={id}>
                  <button type="button" onClick={() => setSelectedLiftId(id)}>
                    <span>{displayName(id)}</span>
                    <strong>{trend ? translatedVerdict(trend.verdict, t) : '—'}</strong>
                  </button>
                </li>
              )
            })}
          </ul>
          {!rangeLiftIds.length && <p className="empty-state">{t('progress.v3.verdict.insufficient')}</p>}
        </section>
      </>
    )
  }

  const renderMuscles = () => {
    const startDate = rangeStart(range, today, activeBlock, progressEntries)
    const selectedWeeks = (muscles?.weeks ?? []).filter((week) => week.weekStart >= startDate)
    const visibleWeeks = selectedWeeks.slice(-12)
    const groupNames = muscles?.groups ?? []
    const weekBlock = (weekStart: string) => {
      const weekTime = dateValue(weekStart)
      return blocks.find((block) =>
        weekTime < dateValue(block.startDate) + block.weeks * 7 * 86_400_000
        && weekTime + 7 * 86_400_000 > dateValue(block.startDate)
      )
    }
    const weekNumberLabel = (weekStart: string) => {
      const block = weekBlock(weekStart)
      return block
        ? `${t('progress.v3.muscles.week')}${formatNumber(language, Math.max(1, Math.floor((dateValue(weekStart) - dateValue(block.startDate)) / (7 * 86_400_000)) + 1))}`
        : formatShortDate(language, weekStart)
    }
    // Block names are shown once for the whole chart instead of wrapping inside a narrow week column.
    const blockStarts = visibleWeeks.flatMap((week) => {
      const block = weekBlock(week.weekStart)
      const weekTime = dateValue(week.weekStart)
      return block && dateValue(block.startDate) >= weekTime && dateValue(block.startDate) < weekTime + 7 * 86_400_000
        ? [{ key: `${block.id}-${week.weekStart}`, text: t('progress.v3.muscles.blockStart', { week: weekNumberLabel(week.weekStart), block: block.name }) }]
        : []
    })
    return (
      <>
        <SegmentedRange range={range} onChange={setRange} t={t} />
        <section className="card pv3-card">
          <h3>{t('progress.v3.muscles.title')}</h3>
          <p className="pv3-caption">{t('progress.v3.muscles.legend')}</p>
          <p className="pv3-caption">{t('progress.v3.muscles.scale')}</p>
          {blockStarts.map((item) => <p className="pv3-caption pv3-block-start" key={item.key}>{item.text}</p>)}
          {groupNames.length ? groupNames.map((group) => {
            const average = muscles?.averages[group]
            const title = t(MUSCLE_KEYS[group])
            return (
              <article className="pv3-muscle-row" key={group}>
                <h4>{title}</h4>
                <>
                  <Gauge
                    value={average ?? null}
                    label={t('progress.v3.muscles.common')}
                    averageLabel={t('progress.v3.muscles.average')}
                    language={language}
                  />
                  {average !== undefined
                    ? <>
                      <p className="pv3-muscle-takeaway">{t('progress.v3.muscles.takeaway', {
                        muscle: title,
                        sets: formatNumber(language, average, { maximumFractionDigits: 1 }),
                        range: t(average < MUSCLE_COMMON_RANGE.min
                          ? 'progress.v3.muscles.belowRange'
                          : average > MUSCLE_COMMON_RANGE.max
                            ? 'progress.v3.muscles.aboveRange'
                            : 'progress.v3.muscles.insideRange'),
                      })}</p>
                    </>
                    : <p className="pv3-caption">{t('progress.v3.muscles.unlock', { count: formatNumber(language, Math.min(unlockedMuscleWeeks, 4)) })}</p>}
                </>
                <div className="pv3-week-bars" style={{ gridTemplateColumns: `repeat(${Math.max(visibleWeeks.length, 1)}, minmax(0, 1fr))` }}>
                  {visibleWeeks.map((week) => {
                    const value = week.values[group] ?? 0
                    return (
                      <div className="pv3-week-column" key={`${group}-${week.weekStart}`} title={`${weekDateLabel(language, week.weekStart)}: ${formatNumber(language, value)}`}>
                        <strong>{value ? formatNumber(language, value, { maximumFractionDigits: 1 }) : '–'}</strong>
                        <div className="pv3-week-track">
                          <span className="pv3-week-band" />
                          <span
                            className={week.deload ? 'pv3-week-fill pv3-week-deload' : 'pv3-week-fill'}
                            style={{ height: `${Math.min(value / 30, 1) * 100}%` }}
                          />
                        </div>
                        <small>{weekNumberLabel(week.weekStart)}</small>
                        <small>{week.deload
                          ? t('progress.v3.muscles.deload')
                          : value === 0
                            ? t(week.complete ? 'progress.v3.muscles.noTraining' : 'progress.v3.muscles.thisWeek')
                            : formatShortDate(language, week.weekStart)}</small>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          }) : <p className="empty-state">{t('progress.v3.verdict.insufficient')}</p>}
          <p className="pv3-caption">{t('progress.v3.muscles.note')}</p>
        </section>
      </>
    )
  }

  const renderConsistency = () => {
    const weeksText = (count: number) => t(count === 1 ? 'progress.v3.consistency.weeks.one' : 'progress.v3.consistency.weeks.other', {
      count: formatNumber(language, count),
    })
    const blockForWeek = (weekStart: string) => blocks.find((item) => {
      const startTime = dateValue(item.startDate)
      return dateValue(weekStart) >= startTime && dateValue(weekStart) < startTime + item.weeks * 7 * 86_400_000
    })
    return (
    <>
      <section className="card pv3-card">
        <h3>{t('progress.v3.consistency.title')}</h3>
        {consistencyData.adherenceFourWeeks === null
          ? <p className="pv3-caption">{t('progress.v3.consistency.unlock', { count: formatNumber(language, completeWeeks.length) })}</p>
          : <div className="pv3-consistency-summary">
              <div><strong>{weeksText(consistencyData.currentStreak)}</strong><span>{t('progress.v3.consistency.currentStreak')}</span></div>
              <div><strong>{weeksText(consistencyData.longestStreak)}</strong><span>{t('progress.v3.consistency.longestStreak')}</span></div>
              <div><strong>{formatNumber(language, consistencyData.adherenceFourWeeks * 100, { maximumFractionDigits: 0 })}%</strong><span>{t('progress.v3.consistency.adherence4w')}</span></div>
            </div>}
        <div className="pv3-consistency-weeks">
          {consistencyData.weeks.slice(-12).map((week, index, list) => {
            const block = blockForWeek(week.weekStart)
            const previousBlock = index > 0 ? blockForWeek(list[index - 1].weekStart) : undefined
            const percent = week.adherence === null ? null : Math.round(week.adherence * 100)
            return (
              <React.Fragment key={week.weekStart}>
              {block && block.id !== previousBlock?.id && <h4 className="pv3-consistency-block">{block.name}</h4>}
              <div className="pv3-consistency-week">
                <div className="pv3-consistency-week-label">
                  <strong>{t('progress.v3.consistency.week', { number: block ? Math.max(1, Math.floor((dateValue(week.weekStart) - dateValue(block.startDate)) / (7 * 86_400_000)) + 1) : formatShortDate(language, week.weekStart) })}</strong>
                </div>
                <div className="pv3-day-dots" aria-label={week.plannedDays ? t('progress.v3.consistency.days', {
                  done: week.loggedPlannedDays,
                  planned: week.plannedDays,
                  percent: percent ?? 0,
                }) : t('progress.v3.consistency.sessions', { count: week.sessions })}>
                  {Array.from({ length: Math.min(week.plannedDays || Math.max(week.sessions, 1), 8) }, (_, index) => (
                    <span key={index} className={index < week.loggedPlannedDays ? 'done' : ''} />
                  ))}
                </div>
                <span className="pv3-consistency-value">
                  {week.complete
                    ? t('progress.v3.consistency.days', {
                        done: week.loggedPlannedDays,
                        planned: week.plannedDays,
                        percent: percent ?? 0,
                      })
                    : t('progress.v3.consistency.currentDays', {
                        done: week.loggedPlannedDays,
                        planned: week.plannedDays,
                      })}
                </span>
                {week.sessions > week.loggedPlannedDays && <small>{t('progress.v3.consistency.sessions', { count: week.sessions })}</small>}
              </div>
              </React.Fragment>
            )
          })}
        </div>
      </section>
      <details className="card pv3-card pv3-session-log">
        <summary>{t('progress.v3.sessionLog')}</summary>
        {undoEntries && (
          <p role="status" className="pv3-undo">
            {t('progress.sessions.deleted', { count: undoEntries.length })}
            <button type="button" className="text-button" onClick={() => void undoDelete()}>{t('progress.v3.undo')}</button>
          </p>
        )}
        {sessionLog.length ? (
          <ul className="pv3-session-list">
            {sessionLog.slice(0, 16).map((session) => (
              <li key={session.key}>
                <span><strong>{formatShortDate(language, session.date)}</strong><small>{t('progress.sessions.count', { count: session.entries.length })}</small></span>
                {confirmSession === session.key
                  ? <span className="pv3-confirm"><span>{t('progress.v3.deleteConfirm')}</span><button type="button" onClick={() => void deleteSession(session)}>{t('progress.v3.delete')}</button><button type="button" onClick={() => setConfirmSession('')}>{t('progress.delete.cancel')}</button></span>
                  : <button type="button" className="text-button" onClick={() => setConfirmSession(session.key)}>{t('progress.v3.delete')}</button>}
              </li>
            ))}
          </ul>
        ) : <p className="pv3-caption">{t('progress.v3.sessionLog.empty')}</p>}
      </details>
    </>
  )
  }

  const renderDetail = () => {
    if (!selectedExercise || !selectedTrend) return null
    const validPoints = selectedTrend.points.filter((point) => !point.deload && (selectedTrend.highRep ? point.topLoad !== null : point.e1rm !== null))
    const first = validPoints[0]
    const last = validPoints[validPoints.length - 1]
    const confidence = selectedTrend.confidence === 'based-on'
      ? t('progress.v3.confidence.basedOn', { count: validPoints.length })
      : selectedTrend.confidence === 'solid'
        ? t('progress.v3.confidence.solid', { count: validPoints.length })
        : selectedTrend.confidence === 'early' ? t('progress.v3.confidence.early') : ''
    const takeaway = selectedTrend.highRep
      ? t('progress.v3.detail.highRepTakeaway', {
          exercise: displayName(selectedLiftId),
          verdict: translatedVerdict(selectedTrend.verdict, t).toLowerCase(),
          start: formatNumber(language, first?.topLoad ?? 0, { maximumFractionDigits: 1 }),
          end: formatNumber(language, last?.topLoad ?? 0, { maximumFractionDigits: 1 }),
          firstReps: formatNumber(language, first?.repsAtTop ?? 0),
          lastReps: formatNumber(language, last?.repsAtTop ?? 0),
        })
      : t('progress.v3.detail.takeaway', {
          exercise: displayName(selectedLiftId),
          verdict: translatedVerdict(selectedTrend.verdict, t).toLowerCase(),
          start: bestSetText(language, first?.bestSet),
          end: bestSetText(language, last?.bestSet),
        })
    const volumeWeeks = selectedVolume?.weeks ?? []
    const currentVolumeWeek = volumeProgress?.weeks.find((week) => week.weekStart === startOfWeek(today))
    const volumeSummary = !currentVolumeWeek || volumeProgress?.bodyweightUnloaded
      ? ''
      : currentVolumeWeek.deload
        ? t('progress.v3.detail.volumeDeload')
        : !currentVolumeWeek.complete && currentVolumeWeek.volume !== null
          ? t('progress.v3.detail.volumeSoFar', {
              current: formatNumber(language, currentVolumeWeek.volume, { maximumFractionDigits: 0 }),
              logged: formatNumber(language, currentVolumeWeek.loggedDayCount),
              planned: formatNumber(language, currentVolumeWeek.plannedDayCount),
            })
          : currentVolumeWeek.change && currentVolumeWeek.previousVolume !== null
            ? t('progress.v3.detail.volumeTakeaway', {
                change: t(`progress.v3.detail.volume${currentVolumeWeek.change === 'more' ? 'More' : currentVolumeWeek.change === 'less' ? 'Less' : 'Same'}` as TranslationKey),
                current: formatNumber(language, currentVolumeWeek.volume ?? 0, { maximumFractionDigits: 0 }),
                previous: formatNumber(language, currentVolumeWeek.previousVolume, { maximumFractionDigits: 0 }),
              })
            : currentVolumeWeek.contextNote
              ? volumeContextText(currentVolumeWeek.contextNote, language, t)
              : ''
    const volumeNote = currentVolumeWeek?.change === 'less' && currentVolumeWeek.contextNote
      ? volumeContextText(currentVolumeWeek.contextNote, language, t)
      : ''
    const blockTrend = volumeProgress?.blockTrend
    const blockTrendText = blockTrend
      ? t('progress.v3.detail.volumeBlockTrend', {
          firstWeek: formatNumber(language, blockTrend.firstWeek),
          lastWeek: formatNumber(language, blockTrend.lastWeek),
          first: formatNumber(language, blockTrend.firstVolume, { maximumFractionDigits: 0 }),
          last: formatNumber(language, blockTrend.lastVolume, { maximumFractionDigits: 0 }),
          percent: `${blockTrend.changePercent > 0 ? '+' : blockTrend.changePercent < 0 ? '−' : ''}${formatNumber(language, Math.abs(blockTrend.changePercent), { maximumFractionDigits: 1 })}%`,
          change: t(`progress.v3.detail.volumeBlock${blockTrend.change === 'more' ? 'More' : blockTrend.change === 'less' ? 'Less' : 'Same'}` as TranslationKey),
        })
      : ''
    const maxVolume = Math.max(1, ...volumeWeeks.map((week) => week.volume ?? 0))
    return (
      <div className="pv3-detail">
        <button type="button" className="pv3-back" onClick={() => setSelectedLiftId('')}>{t('progress.v3.detail.back')}</button>
        <div className="pv3-detail-title">
          <h2>{displayName(selectedLiftId)}</h2>
          <button type="button" className="secondary-button" onClick={() => onOpenExercise(selectedLiftId)}>{t('progress.strength.openExercise')}</button>
        </div>
        <SegmentedRange range={range} onChange={setRange} t={t} />
        <section className="card pv3-card">
          <p className="pv3-detail-takeaway">{validPoints.length ? takeaway : t('progress.v3.verdict.insufficient')}</p>
          <p className="pv3-detail-rate">
            {rateText(selectedTrend, language, t)}
            {confidence && ` · ${confidence}`}
          </p>
          <LiftTrendChart trend={selectedTrend} blocks={blocks} exercise={selectedExercise} language={language} t={t} />
          <p className="pv3-caption">{t(selectedTrend.highRep ? 'progress.v3.trends.highRepNote' : 'progress.v3.trends.e1rmNote')}</p>
          <p className="pv3-caption">{t('progress.v3.detail.chartLegend')}</p>
          {selectedTrend.verdict === 'not-enough-data' && (
            <p className="pv3-caption">{t('progress.v3.detail.unlock', {
              sessions: selectedTrend.points.filter((point) => !point.deload).length,
              days: selectedTrend.points.length > 1 ? Math.max(0, Math.round((dateValue(selectedTrend.points[selectedTrend.points.length - 1].date) - dateValue(selectedTrend.points[0].date)) / 86_400_000)) : 0,
            })}</p>
          )}
          {worthReasons.has(selectedLiftId) && <p className="pv3-worth-tag">{t('progress.v3.worthLooking')}: {worthReasons.get(selectedLiftId)}</p>}
        </section>

        <section className="card pv3-card">
          <h3>{t('progress.v3.detail.volume')}</h3>
          {volumeProgress?.bodyweightUnloaded && <p className="pv3-caption">{t('progress.v3.detail.bodyweightUnloaded')}</p>}
          {!volumeProgress?.bodyweightUnloaded && (
            <>
              {selectedExercise.equipment?.trim().toLowerCase() === 'bodyweight' && <p className="pv3-caption">{t('progress.v3.detail.bodyweightVolume')}</p>}
              <div className="pv3-volume-chart">
                {volumeWeeks.slice(-12).map((week) => (
                  <div className="pv3-volume-column" key={week.weekStart}>
                    <strong>{week.volume === null ? '—' : formatNumber(language, week.volume, { maximumFractionDigits: 0 })}</strong>
                    <span className={week.deload ? 'pv3-volume-bar pv3-deload' : 'pv3-volume-bar'} style={{ height: `${Math.max(2, (week.volume ?? 0) / maxVolume * 80)}px` }} />
                    <small>{formatShortDate(language, week.weekStart)}</small>
                    {week.deload && <small>{t('progress.v3.muscles.deload')}</small>}
                  </div>
                ))}
              </div>
              {volumeSummary && <p>{volumeSummary}</p>}
              {volumeNote && <p className="pv3-caption">{volumeNote}</p>}
              {blockTrendText && <p>{blockTrendText}</p>}
              {!volumeSummary && !blockTrendText && <p className="pv3-caption">{t('progress.v3.detail.volumeBarsOnly')}</p>}
              <p className="pv3-caption">{t('progress.v3.detail.volumeNote')}</p>
            </>
          )}
        </section>

        <section className="card pv3-card">
          <h3>{t('progress.v3.detail.sessions')}</h3>
          <div className="pv3-history-list">
            {detailSessions.length ? detailSessions.map(({ session, previous, comparison }, rowIndex) => {
              const total = sessionVolumeComparison(session, previous, selectedExercise)
              const day = session.dayKey?.toLowerCase().endsWith('-b') ? 'B' : 'A'
              return (
              <article className="pv3-history-session" key={`${session.date}-${session.blockId}-${session.dayKey}-${rowIndex}`}>
                <div className="pv3-history-heading">
                  <strong>{formatShortDate(language, session.date)}{session.dayKey ? ` · ${session.dayKey.toLowerCase().endsWith('-b') ? 'B' : 'A'}` : ''}</strong>
                  <span className={`pv3-comparison pv3-comparison-${comparison.verdict}`}>{t(`progress.v3.detail.${comparison.verdict === 'target-changed' ? 'targetChanged' : comparison.verdict}`)}</span>
                </div>
                <ul className="pv3-history-sets">
                  {workingSets(session.sets).map((set, index) => {
                    const previousSet = previous ? workingSets(previous.sets)[index] : null
                    return (
                      <li key={`${set.id}-${index}`}>
                        <span>{formatNumber(language, set.weight)} kg × {formatNumber(language, set.reps)}{set.drop && ` → ${formatNumber(language, set.drop.weight)} kg × ${formatNumber(language, set.drop.reps)}`}</span>
                        {previousSet && <small>← {formatNumber(language, previousSet.weight)} kg × {formatNumber(language, previousSet.reps)}</small>}
                      </li>
                    )
                  })}
                </ul>
                {total && <small className="pv3-history-previous">{t('progress.v3.detail.volumeSession', {
                  current: formatNumber(language, total.current, { maximumFractionDigits: 0 }),
                  previous: formatNumber(language, total.previous, { maximumFractionDigits: 0 }),
                  day,
                  heavier: total.heavierWeight ? t('progress.v3.detail.volumeHeavierSuffix') : '',
                })}</small>}
                {previous && <small className="pv3-history-previous">{t('progress.v3.detail.change')}: {formatShortDate(language, previous.date)}</small>}
              </article>
              )
            }) : <p className="empty-state">{t('progress.liftDetail.empty')}</p>}
          </div>
        </section>
      </div>
    )
  }

  const content = tab === 'overview'
    ? renderOverview()
    : tab === 'trends'
      ? renderTrends()
      : tab === 'muscles'
        ? renderMuscles()
        : renderConsistency()

  return (
    <div className="progress-v3">
      {undoEntries && (
        <aside className="pv3-toast" role="status" aria-live="polite">
          <span>{t('progress.sessions.deleted', { count: formatNumber(language, undoEntries.length) })}</span>
          <button type="button" className="text-button" onClick={() => void undoDelete()}>{t('progress.v3.undo')}</button>
        </aside>
      )}
      {selectedLiftId
        ? renderDetail()
        : <>
            <div className="pv3-page-heading">
              {activeBlock?.name.trim() && <span>{activeBlock.name}</span>}
            </div>
            <div className="pv3-tabs" role="tablist" aria-label={t('progress.title')} onKeyDown={(event) => onTabListKeyDown(event, TABS, tab, setTab)}>
              {TABS.map((item) => (
                <button
                  key={item}
                  id={`pv3-tab-${item}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  aria-controls="pv3-panel"
                  tabIndex={tab === item ? 0 : -1}
                  className={tab === item ? 'active' : ''}
                  onClick={() => setTab(item)}
                >
                  {t(`progress.v3.tab.${item}`)}
                </button>
              ))}
            </div>
            <div role="tabpanel" id="pv3-panel" className="pv3-panel" aria-labelledby={`pv3-tab-${tab}`}>
              {content}
            </div>
          </>}
    </div>
  )
}

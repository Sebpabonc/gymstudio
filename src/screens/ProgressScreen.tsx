import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { AuthStatus } from '../auth/AuthProvider'
import { formatNumber, formatShortDate, useT } from '../i18n'
import { localizeBlocks, useSpanishContentReady } from '../i18n/content'
import { localIsoDate } from '../lib/dates'
import { isDemoMode } from '../utils/demoMode'
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
  liftTrendIndexPoints,
  latestEquivalentComparisons,
  muscleTrend,
  overallProgressStatus,
  progressLiftSessions,
  progressiveOverloadRate,
  rangeEnd,
  rangeStart,
  watchObservations,
} from '../progress'
import { workingSets, dateValue } from '../progress/utils'
import { MUSCLE_CHART_MAXIMUM, MUSCLE_COMMON_RANGE } from '../progress/muscles'
import type { WatchObservation } from '../progress/comparison'
import type { ProgressStatus } from '../progress/status'
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
  W4: 'progress.v3.watch.W4',
  W5: 'progress.v3.watch.W5',
  W6: 'progress.v3.watch.W6',
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

function Sparkline({ trend, min, max, exercise }: { trend: LiftTrend; min: number; max: number; exercise?: Exercise }) {
  const points = liftTrendIndexPoints(trend, exercise)
  if (!points.length) {
    return <svg className="pv3-sparkline" viewBox="0 0 100 28" aria-hidden="true"><line x1="2" y1="14" x2="98" y2="14" /></svg>
  }
  const span = max - min || 1
  const plotted = points.map((point, index) => ({
    ...point,
    x: 3 + index / Math.max(points.length - 1, 1) * 94,
    y: 24 - (point.value - min) / span * 20,
  }))
  const path = plotted.map((point, index) => `${index === 0 || point.breakBefore ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const latest = plotted[plotted.length - 1]
  return (
    <svg className="pv3-sparkline" viewBox="0 0 100 28" aria-hidden="true">
      <line x1="2" y1="24" x2="98" y2="24" />
      <path d={path} />
      <circle cx={latest.x} cy={latest.y} r="3" />
    </svg>
  )
}

function MiniTrendChart({ trend, t }: { trend: LiftTrend; t: ReturnType<typeof useT>['t'] }) {
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
  return (
    <svg className="pv3-mini-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t(trend.highRep ? 'progress.v3.trends.highRepNote' : 'progress.v3.trends.e1rmNote')}>
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
      <svg className="pv3-detail-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t('progress.v3.trends.highRepNote')}>
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
    <svg className="pv3-detail-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={exercise.name}>
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
      <small>{previous}</small>
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

function nonDeloadHistory(sessions: ProgressLiftSession[]) {
  return sessions.filter((session) => !session.deload)
}

function worthReason(
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
    if (trend.verdict !== 'improving' && recent.every((session) => {
      const sets = workingSets(session.sets)
      return sets[sets.length - 1]?.rir === 0
    })) return t('progress.v3.worth.rir')
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
    const cachedPlan = signedIn ? getCachedActiveUserPlan() : null
    const globalCache = demoMode ? [] : getCachedTrainingBlocks() ?? []
    const cachedBlocks = selectPlanBlocks(globalCache, cachedPlan, signedIn, demoMode)
    if (cachedBlocks.length) setBlocks(cachedBlocks)
    void Promise.all([
      demoMode ? loadDemoBlocks() : fetchTrainingBlocks(),
      signedIn ? fetchActiveUserPlan().catch(() => null) : Promise.resolve(null),
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
  const comparisons = useMemo(
    () => blocks ? latestEquivalentComparisons(progressEntries, blocks, exercises) : [],
    [progressEntries, blocks, exercises]
  )
  const watches = useMemo(
    () => blocks ? watchObservations(progressEntries, blocks, exercises, 3) : [],
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
  const allIndexValues = [...overviewTrends.entries()].flatMap(([id, trend]) =>
    liftTrendIndexPoints(trend, exerciseById.get(id)).map((point) => point.value)
  )
  const sparkMin = allIndexValues.length ? Math.min(...allIndexValues, 0) : -6
  const sparkMax = allIndexValues.length ? Math.max(...allIndexValues, 0) : 6
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

  const comparisonCounts = comparisons.reduce((counts, row) => {
    if (row.comparison.verdict === 'improved') counts.improved += 1
    else if (row.comparison.verdict === 'held') counts.held += 1
    return counts
  }, { improved: 0, held: 0 })
  const latestComparisons = new Map(comparisons.map((row) => [row.exerciseId, row]))
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
  const muscleAverageRows = muscles
    ? muscles.groups.flatMap((group) => {
        const value = muscles.averages[group]
        return value === undefined ? [] : [{ group, value }]
      })
    : []
  const insideRange = muscleAverageRows.filter((row) => row.value >= 10 && row.value <= 20).length
  const unlockedMuscleWeeks = muscleData.weeks.filter((week) => week.complete && !week.deload).length

  const renderWatch = (watch: WatchObservation) => (
    <li key={`${watch.exerciseId}-${watch.code}`}>
      <strong>{displayName(watch.exerciseId)}:</strong> {t(WATCH_KEYS[watch.code], watch.params)}
    </li>
  )

  const renderOverview = () => (
    <>
      <section className={`card pv3-status pv3-status-${status.status}`}>
        <strong className="pv3-status-word">{translatedStatus(status.status, t)}</strong>
        <p>{status.counts.eligible
          ? t('progress.v3.status.reason', {
              improving: formatNumber(language, status.counts.improving),
              total: formatNumber(language, status.counts.eligible),
              held: formatNumber(language, status.counts.held),
              lower: formatNumber(language, status.counts.lower),
            })
          : t('progress.v3.status.buildingReason')}</p>
        <small>{t('progress.v3.status.explainer')}</small>
      </section>

      <section className="card pv3-card">
        <h3>{t('progress.v3.mainLifts')}</h3>
        {mainLiftIds.length ? (
          <ul className="pv3-lift-list">
            {mainLiftIds.map((id) => {
              const trend = overviewTrends.get(id)
              if (!trend) return null
              const latest = trend.points.some((point) => !point.deload && (trend.highRep
                ? point.topLoad !== null && point.repsAtTop > 0
                : point.e1rm !== null))
              const reason = worthReasons.get(id)
              const comparison = latestComparisons.get(id)?.comparison
              return (
                <li key={id}>
                  <button type="button" className="pv3-lift-row" onClick={() => setSelectedLiftId(id)} aria-label={t('progress.strength.openDetail', { exercise: displayName(id) })}>
                    <span className="pv3-lift-copy">
                      <strong>{displayName(id)}</strong>
                      <span>{translatedVerdict(trend.verdict, t)}</span>
                      {rateText(trend, language, t) && <small>{rateText(trend, language, t)}</small>}
                      {!latest && <small>{t('progress.v3.unlock.sessions', { count: formatNumber(language, trend.points.filter((point) => !point.deload).length) })}</small>}
                      {comparison?.messages[0]?.startsWith('sets:') && <small>{t('progress.v3.summary.setCount', {
                        current: comparison.workingSetCount,
                        previous: comparison.previousWorkingSetCount,
                      })}</small>}
                      {reason && <em className="pv3-worth-tag">{t('progress.v3.worthLooking')}: {reason}</em>}
                    </span>
                    <Sparkline trend={trend} min={sparkMin} max={sparkMax} exercise={exerciseById.get(id)} />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : <p className="empty-state">{t('progress.v3.verdict.insufficient')}</p>}
        <p className="pv3-caption">{mainTrends.some((trend) => trend.highRep) ? t('progress.v3.sparklineHighRepNote') : t('progress.v3.sparklineNote')}</p>
      </section>

      <section className="card pv3-card">
        <h3>{t('progress.v3.summary.title')}</h3>
        <div className="pv3-summary-counts">
          <div><strong>{formatNumber(language, comparisonCounts.improved)}</strong><span>{t('progress.v3.summary.improved')}</span></div>
          <div><strong>{formatNumber(language, comparisonCounts.held)}</strong><span>{t('progress.v3.summary.held')}</span></div>
          <div><strong>{formatNumber(language, watches.length)}</strong><span>{t('progress.v3.summary.watch')}</span></div>
        </div>
        {watches.length
          ? <ul className="pv3-watch-list">{watches.slice(0, 3).map(renderWatch)}</ul>
          : <p className="pv3-caption">{t('progress.v3.summary.empty')}</p>}
      </section>

      <section className="card pv3-card">
        <h3>{t('progress.v3.consistency.title')} · {t('progress.v3.muscles.title')}</h3>
        {currentAdherence !== null
          ? <p>{t('progress.v3.overview.consistency', {
              adherence: formatNumber(language, currentAdherence * 100, { maximumFractionDigits: 0 }),
              streak: formatNumber(language, consistencyData.currentStreak),
            })}</p>
          : <p>{t('progress.v3.overview.building', {
              count: formatNumber(language, completeWeeks.length),
              total: 4,
            })}</p>}
        {muscleAverageRows.length
          ? <p>{t('progress.v3.overview.muscles', {
              inside: formatNumber(language, insideRange),
              total: formatNumber(language, muscleAverageRows.length),
            })}</p>
          : <p className="pv3-caption">{t('progress.v3.muscles.unlock', {
              count: formatNumber(language, Math.min(unlockedMuscleWeeks, 4)),
            })}</p>}
        {overload?.rate !== null && overload?.rate !== undefined
          ? <p>{t('progress.v3.overview.overload', { rate: formatNumber(language, Math.round(overload.rate * 100)) })}</p>
          : <p className="pv3-caption">{t('progress.v3.unlock.equivalent', { count: formatNumber(language, overload?.comparable ?? 0) })}</p>}
      </section>
    </>
  )

  const renderTrends = () => {
    const currentAdherenceText = currentAdherence === null ? '—' : `${formatNumber(language, currentAdherence * 100, { maximumFractionDigits: 0 })}%`
    const previousAdherenceText = previousAdherence === null ? '—' : `${formatNumber(language, previousAdherence * 100, { maximumFractionDigits: 0 })}%`
    const mainChangeText = averageMainChange === null ? '—' : `${averageMainChange > 0 ? '+' : ''}${formatNumber(language, averageMainChange, { maximumFractionDigits: 1 })}%`
    const currentOverloadText = overload?.rate === null || overload?.rate === undefined ? '—' : `${formatNumber(language, Math.round(overload.rate * 100))}%`
    const previousOverloadText = previousOverload.rate === null ? '—' : `${formatNumber(language, Math.round(previousOverload.rate * 100))}%`
    const windowStart = rangeStart(range, today, activeBlock, progressEntries)
    const windowEnd = rangeEnd(range, today, activeBlock)
    const rangeLiftIds = [...new Set([...mainLiftIds, ...allLiftIds])]
      .filter((id) => (historyByLift.get(id) ?? []).some((session) => session.date >= windowStart && session.date <= windowEnd))
    return (
      <>
        <SegmentedRange range={range} onChange={setRange} t={t} />
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.compare')}</h3>
          <div className="pv3-chip-grid">
            <MetricChip label={t('progress.v3.trends.trainingDays')} current={formatNumber(language, currentDays)} previous={`${t('progress.v3.trends.notEnough')}: ${formatNumber(language, previousDays)}`} />
            <MetricChip label={t('progress.v3.trends.adherence')} current={currentAdherenceText} previous={previousAdherenceText} />
            <MetricChip label={t('progress.v3.trends.mainLift')} current={mainChangeText} previous="—" />
            <MetricChip label={t('progress.v3.trends.overload')} current={currentOverloadText} previous={previousOverloadText} />
          </div>
          {overload?.rate === null && <p className="pv3-caption">{t('progress.v3.unlock.equivalent', { count: formatNumber(language, overload.comparable) })}</p>}
        </section>
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.strength')}</h3>
          {mainLiftIds.map((id) => {
            const trend = trends.get(id)
            if (!trend) return null
            return (
              <button type="button" className="pv3-trend-lift" key={id} onClick={() => setSelectedLiftId(id)}>
                <span className="pv3-trend-heading"><strong>{displayName(id)}</strong><span>{translatedVerdict(trend.verdict, t)}</span></span>
                {trend.verdict !== 'not-enough-data' && <span className="pv3-trend-detail">{rateText(trend, language, t)}{rateText(trend, language, t) ? ' · ' : ''}{t(`progress.v3.confidence.${trend.confidence === 'based-on' ? 'basedOn' : trend.confidence ?? 'early'}`, { count: formatNumber(language, trend.points.filter((point) => !point.deload).length) })}</span>}
                <MiniTrendChart trend={trend} t={t} />
              </button>
            )
          })}
          <p className="pv3-caption">{t('progress.v3.trends.rawLegend')}</p>
        </section>
        <section className="card pv3-card">
          <h3>{t('progress.v3.trends.blockCompare')}</h3>
          {blockComparisons.length ? (
            <div className="pv3-table-wrap">
              <table className="pv3-table">
                <thead><tr>
                  <th>{t('progress.strength.exercise')}</th>
                  <th>{t('progress.v3.trends.previousBlock')}</th>
                  <th>{t('progress.v3.trends.blockStart')}</th>
                  <th>{t('progress.v3.trends.blockEnd')}</th>
                </tr></thead>
                <tbody>
                  {blockComparisons.map((row) => (
                    <tr key={row.exerciseId}>
                      <th scope="row">{displayName(row.exerciseId)}</th>
                      <td>{row.newInBlock ? t('progress.v3.trends.newBlock') : row.previousEnd === null ? '—' : `${formatNumber(language, row.previousEnd, { maximumFractionDigits: 1 })} kg`}</td>
                      <td>{row.start === null ? '—' : `${formatNumber(language, row.start, { maximumFractionDigits: 1 })} kg`}</td>
                      <td>
                        {row.end === null ? '—' : `${formatNumber(language, row.end, { maximumFractionDigits: 1 })} kg`}
                        {row.changePercent !== null && <small className="pv3-table-change"> {row.changePercent > 0 ? '+' : ''}{formatNumber(language, row.changePercent, { maximumFractionDigits: 1 })}%</small>}
                        {row.differentRepTarget && <small className="pv3-table-note">{t('progress.v3.trends.differentTarget')}</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="pv3-caption">{t('progress.v3.unlock.secondBlock')}</p>}
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
    return (
      <>
        <SegmentedRange range={range} onChange={setRange} t={t} />
        <section className="card pv3-card">
          <h3>{t('progress.v3.muscles.title')}</h3>
          <p className="pv3-caption">{t('progress.v3.muscles.legend')}</p>
          <p className="pv3-caption">{t('progress.v3.muscles.scale')}</p>
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
                    const weekTime = dateValue(week.weekStart)
                    const weekBlock = blocks.find((block) =>
                      weekTime < dateValue(block.startDate) + block.weeks * 7 * 86_400_000
                      && weekTime + 7 * 86_400_000 > dateValue(block.startDate)
                    )
                    const blockStartThisWeek = weekBlock
                      && dateValue(weekBlock.startDate) >= weekTime
                      && dateValue(weekBlock.startDate) < weekTime + 7 * 86_400_000
                    const weekNumber = weekBlock
                      ? Math.max(1, Math.floor((weekTime - dateValue(weekBlock.startDate)) / (7 * 86_400_000)) + 1)
                      : null
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
                        <small>{weekNumber === null ? formatShortDate(language, week.weekStart) : `${t('progress.v3.muscles.week')}${formatNumber(language, weekNumber)}`}</small>
                        <small className="pv3-week-block" title={blockStartThisWeek ? weekBlock.name : undefined}>{blockStartThisWeek ? weekBlock.name : ''}</small>
                        <small>{week.deload ? t('progress.v3.muscles.deload') : value === 0 ? t('progress.v3.muscles.noTraining') : formatShortDate(language, week.weekStart)}</small>
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

  const renderConsistency = () => (
    <>
      {consistencyData.adherenceFourWeeks === null
        ? <section className="card pv3-card"><h3>{t('progress.v3.consistency.title')}</h3><p className="pv3-caption">{t('progress.v3.consistency.unlock', { count: formatNumber(language, completeWeeks.length) })}</p></section>
        : <section className="card pv3-card">
            <h3>{t('progress.v3.consistency.title')}</h3>
            <div className="pv3-consistency-summary">
              <div><strong>{formatNumber(language, consistencyData.currentStreak)} {t('progress.v3.consistency.weeks')}</strong><span>{t('progress.v3.consistency.currentStreak')}</span></div>
              <div><strong>{formatNumber(language, consistencyData.longestStreak)} {t('progress.v3.consistency.weeks')}</strong><span>{t('progress.v3.consistency.longestStreak')}</span></div>
              <div><strong>{formatNumber(language, consistencyData.adherenceFourWeeks * 100, { maximumFractionDigits: 0 })}%</strong><span>{t('progress.v3.consistency.adherence4w')}</span></div>
            </div>
          </section>}
      <section className="card pv3-card">
        <h3>{t('progress.v3.consistency.title')}</h3>
        <div className="pv3-consistency-weeks">
          {consistencyData.weeks.slice(-12).map((week) => {
            const block = blocks.find((item) => {
              const startTime = dateValue(item.startDate)
              return dateValue(week.weekStart) >= startTime && dateValue(week.weekStart) < startTime + item.weeks * 7 * 86_400_000
            })
            const percent = week.adherence === null ? null : Math.round(week.adherence * 100)
            return (
              <div className="pv3-consistency-week" key={week.weekStart}>
                <div className="pv3-consistency-week-label">
                  <strong>{t('progress.v3.consistency.week', { number: block ? Math.max(1, Math.floor((dateValue(week.weekStart) - dateValue(block.startDate)) / (7 * 86_400_000)) + 1) : formatShortDate(language, week.weekStart) })}</strong>
                  {block && <small title={block.name}>{block.name}</small>}
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
          start: formatNumber(language, first?.e1rm ?? 0, { maximumFractionDigits: 1 }),
          end: formatNumber(language, last?.e1rm ?? 0, { maximumFractionDigits: 1 }),
        })
    const volumeWeeks = selectedVolume?.weeks ?? []
    const completedVolume = volumeWeeks.filter((week) => week.complete && !week.deload && week.volume !== null)
    const lastWeek = completedVolume[completedVolume.length - 1]
    const previousThree = completedVolume.slice(-4, -1)
    const volumeAverage = previousThree.length === 3
      ? previousThree.reduce((sum, week) => sum + (week.volume ?? 0), 0) / 3
      : null
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
          {selectedVolume?.bodyweightUnloaded && <p className="pv3-caption">{t('progress.v3.detail.bodyweightUnloaded')}</p>}
          {!selectedVolume?.bodyweightUnloaded && (
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
              {selectedVolume?.trendAvailable && lastWeek && volumeAverage !== null
                ? <p>{t('progress.v3.detail.volumeTakeaway', {
                    current: formatNumber(language, lastWeek.volume ?? 0, { maximumFractionDigits: 0 }),
                    average: formatNumber(language, volumeAverage, { maximumFractionDigits: 0 }),
                  })}</p>
                : <p className="pv3-caption">{t('progress.v3.detail.volumeBarsOnly')}</p>}
              <p className="pv3-caption">{t('progress.v3.detail.volumeNote')}</p>
            </>
          )}
        </section>

        <section className="card pv3-card">
          <h3>{t('progress.v3.detail.sessions')}</h3>
          <div className="pv3-history-list">
            {detailSessions.length ? detailSessions.map(({ session, previous, comparison }, rowIndex) => (
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
                {previous && <small className="pv3-history-previous">{t('progress.v3.detail.change')}: {formatShortDate(language, previous.date)}</small>}
              </article>
            )) : <p className="empty-state">{t('progress.liftDetail.empty')}</p>}
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
              <h2>{t('progress.title')}</h2>
              {activeBlock?.name.trim() && <span>{activeBlock.name}</span>}
            </div>
            <div className="pv3-tabs" role="tablist" aria-label={t('progress.title')}>
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  className={tab === item ? 'active' : ''}
                  onClick={() => setTab(item)}
                >
                  {t(`progress.v3.tab.${item}`)}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="pv3-panel">
              {content}
            </div>
          </>}
    </div>
  )
}

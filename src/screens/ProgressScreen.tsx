import React, { useEffect, useMemo, useRef, useState } from 'react'
import { localizeBlocks, useSpanishContentReady } from '../i18n/content'
import type { AuthStatus } from '../auth/AuthProvider'
import { formatNumber, formatShortDate, useT } from '../i18n'
import { localIsoDate } from '../lib/dates'
import { isDemoMode } from '../utils/demoMode'
import {
  calculateProgressInsights,
  strengthTrend,
} from '../progress'
import type { LiftInsight, ProgressEntry, ProgressRange } from '../progress'
import {
  buildChartModel,
  chartSummary,
  CHART_SIZE,
  formatPercent,
  muscleGroupLabel,
} from '../progress/viewModel'
import { workingSets } from '../progress/utils'
import { selectPlanBlocks } from '../plans/selectPlanBlocks'
import { loadDemoBlocks } from '../plans/demoBlock'
import { activeSwaps, applySwaps } from '../plans/exerciseSwaps'
import type { ExerciseSwap } from '../plans/exerciseSwaps'
import { fetchExerciseSwaps } from '../utils/profileData'
import { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import {
  fetchActiveUserPlan,
  fetchTrainingBlocks,
  getCachedActiveUserPlan,
  getCachedTrainingBlocks,
  getExerciseDisplayName,
  loadLocalExerciseSwaps,
  saveLocalExerciseSwaps,
} from '../utils/storage'
import { defaultActiveBlock } from '../utils/trainingBlocks'
import { groupSessions, type LoggedSession } from '../utils/sessions'

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

function SectionCard({
  id,
  title,
  children,
  defaultOpen = true,
}: {
  id: string
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const { t } = useT()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="card progress-section">
      <div className="section-title-row">
        <h3>{title}</h3>
        <button
          type="button"
          className="toggle-button expand-toggle"
          aria-expanded={open}
          aria-controls={`progress-${id}`}
          aria-label={t(open ? 'progress.section.collapse' : 'progress.section.expand', { title })}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? '−' : '+'}
        </button>
      </div>
      <div id={`progress-${id}`} className="progress-section-body" hidden={!open}>{children}</div>
    </section>
  )
}

function ProgressSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card progress-panel">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Sparkline({ points }: { points: LiftInsight['points'] }) {
  if (!points.length) return <span className="progress-sparkline-empty" aria-hidden="true" />
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const plotted = points.map((point, index) => ({
    ...point,
    x: 2 + (index / Math.max(points.length - 1, 1)) * 96,
    y: 24 - ((point.value - min) / span) * 20,
  }))
  const path = plotted.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  return (
    <svg className="progress-sparkline" viewBox="0 0 100 28" aria-hidden="true">
      <path d={path} />
      {plotted.map((point) => point.isBestEver && (
        <circle key={point.date} cx={point.x} cy={point.y} r="2.6" />
      ))}
    </svg>
  )
}

function MiniBars({ values }: { values: number[] }) {
  const scale = Math.max(...values, 1)
  return (
    <svg className="progress-mini-bars" viewBox="0 0 40 28" aria-hidden="true">
      {values.slice(-2).map((value, index) => {
        const height = Math.max(2, value / scale * 24)
        return <rect key={index} x={5 + index * 16} y={26 - height} width="10" height={height} rx="2" />
      })}
    </svg>
  )
}

function StrengthChart({
  model,
  title,
  summary,
}: {
  model: ReturnType<typeof buildChartModel>
  title: string
  summary: string
}) {
  const { t } = useT()
  const { left, right, top, bottom, width, height } = CHART_SIZE
  const uid = React.useId()
  return (
    <svg
      className="strength-chart"
      viewBox={`0 0 ${model.width} ${model.height}`}
      role="img"
      aria-labelledby={`${uid}-title ${uid}-desc`}
    >
      <title id={`${uid}-title`}>{title}</title>
      <desc id={`${uid}-desc`}>{summary}</desc>
      {model.bands.map((band, index) => (
        <g key={band.blockId}>
          <rect x={band.x} y={top} width={band.width} height={height - top - bottom} className={index % 2 ? 'chart-band alt' : 'chart-band'} />
          <text x={band.x + 3} y={top + 9} className="chart-label">{band.label}</text>
        </g>
      ))}
      {model.yTicks.map((tick) => (
        <g key={tick.value}>
          <line x1={left} x2={width - right} y1={tick.y} y2={tick.y} className="chart-grid" />
          <text x={left - 4} y={tick.y + 3} textAnchor="end" className="chart-label">{`${tick.value} ${t('progress.unit.kg')}`}</text>
        </g>
      ))}
      {model.xTicks.map((tick, index) => (
        <text
          key={tick.date}
          x={tick.x}
          y={height - 4}
          textAnchor={index === 0 ? 'start' : index === model.xTicks.length - 1 ? 'end' : 'middle'}
          className="chart-label"
        >
          {tick.label}
        </text>
      ))}
      <path d={model.path} className="chart-line" />
      {model.points.map((point) => (
        <circle key={point.date} cx={point.x} cy={point.y} r={point.isRecord ? 4.5 : 2.5} className={point.isRecord ? 'chart-point record' : 'chart-point'} />
      ))}
    </svg>
  )
}

function signedPercent(value: number, language: 'en' | 'es') {
  const formatted = formatNumber(language, Math.abs(value), { maximumFractionDigits: 1 })
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatted}%`
}

function datePlusDays(date: string, days: number) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export default function ProgressScreen({
  entries,
  exercises,
  initialExerciseId,
  onOpenExercise,
  onDeleteEntry,
  onRestoreEntry,
  authStatus: _authStatus,
  authUserId: _authUserId,
}: Props) {
  const { t, language } = useT()
  const demoMode = isDemoMode()
  const today = localIsoDate()
  const spanishReady = useSpanishContentReady(language)
  const [rawBlocks, setBlocks] = useState<TrainingBlock[] | null>(null)
  const [exerciseSwaps, setExerciseSwaps] = useState<ExerciseSwap[]>(() => loadLocalExerciseSwaps())
  const [range, setRange] = useState<ProgressRange>('block')
  const [selectedLiftId, setSelectedLiftId] = useState(initialExerciseId ?? '')
  const [confirmSession, setConfirmSession] = useState('')
  const [sessionUndo, setSessionUndo] = useState<WorkoutEntry[] | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState('')
  const [undoEntry, setUndoEntry] = useState<WorkoutEntry | null>(null)
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
    let cancelled = false
    const signedIn = _authStatus === 'signed-in' && !demoMode
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
  }, [_authStatus, _authUserId, demoMode])

  const activeBlock = useMemo(
    () => blocks ? defaultActiveBlock(blocks, today) : null,
    [blocks, today]
  )
  const data = useMemo(() => {
    if (!blocks) return null
    const insights = calculateProgressInsights(entries as ProgressEntry[], blocks, exercises, activeBlock, today, range)
    const sessions = groupSessions(entries)
    const i18n = { language, t }
    return { insights, sessions, i18n }
  }, [blocks, entries, exercises, activeBlock, today, range, language, t])

  const selectedLift = data?.insights.lifts.find((lift) => lift.exerciseId === selectedLiftId) ?? null
  const detail = useMemo(() => {
    if (!selectedLift || !blocks) return null
    const trend = strengthTrend(
      entries as ProgressEntry[],
      blocks,
      selectedLift.exerciseId,
      today,
      'all',
      exercises,
      { language, t }
    )
    const points = trend.points.filter((point) =>
      point.date >= (data?.insights.rangeStart ?? '')
      && point.date <= (data?.insights.rangeEnd ?? today)
    )
    const recordDates = new Set([
      ...selectedLift.points.filter((point) => point.isBestEver).map((point) => point.date),
      ...data?.insights.records
        .filter((record) => record.exerciseId === selectedLift.exerciseId)
        .map((record) => record.date) ?? [],
    ])
    const chart = buildChartModel(points, blocks, recordDates, { language, t })
    return { points, chart, summary: chartSummary(points, trend.takeaway, { language, t }) }
  }, [selectedLift, blocks, entries, today, exercises, language, t, data])

  useEffect(() => {
    if (!selectedLiftId) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedLiftId('')
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [selectedLiftId])

  const nameFor = (exerciseId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId)
    return exercise ? getExerciseDisplayName(exercise, language) : exerciseId
  }
  const deleteEntry = async (entry: WorkoutEntry) => {
    await onDeleteEntry(entry.id)
    setConfirmDeleteId('')
    setUndoEntry(entry)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => setUndoEntry(null), 5_000)
  }
  const undoDelete = async () => {
    if (!undoEntry) return
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    await onRestoreEntry(undoEntry)
    setUndoEntry(null)
  }
  const deleteSession = async (session: LoggedSession) => {
    for (const entry of session.entries) await onDeleteEntry(entry.id)
    setConfirmSession('')
    setSessionUndo(session.entries)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => setSessionUndo(null), 8_000)
  }
  const undoSessionDelete = async () => {
    if (!sessionUndo) return
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    for (const entry of sessionUndo) await onRestoreEntry(entry)
    setSessionUndo(null)
  }
  const renderDeleteAction = (entry: WorkoutEntry) => (
    <div className="progress-log-delete">
      <button
        type="button"
        className="icon-button log-delete-button"
        aria-label={t('progress.delete.logFor', { exercise: nameFor(entry.exerciseId), date: formatShortDate(language, entry.date) })}
        onClick={() => setConfirmDeleteId(entry.id)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
        </svg>
      </button>
      {confirmDeleteId === entry.id && (
        <div className="progress-delete-confirm" role="group" aria-label={t('progress.delete.confirm')}>
          <span>{t('progress.delete.confirm')}</span>
          <button type="button" className="text-button" onClick={() => void deleteEntry(entry)}>{t('progress.delete.action')}</button>
          <button type="button" className="text-button" onClick={() => setConfirmDeleteId('')}>{t('progress.delete.cancel')}</button>
        </div>
      )}
    </div>
  )

  if (!blocks || !data) {
    return <section className="card" aria-live="polite"><p className="empty-state">{t('progress.loading')}</p></section>
  }

  const { insights, sessions } = data
  const rangeOptions: Array<{ value: ProgressRange; label: string }> = [
    { value: 'block', label: t('progress.range.block') },
    { value: '4weeks', label: t('progress.range.fourWeeks') },
    { value: '12weeks', label: t('progress.range.twelveWeeks') },
  ]
  const latestRecord = [...insights.records].sort((a, b) => b.date.localeCompare(a.date))[0]
  const recentStart = datePlusDays(today, -6)
  const latestRepPr = [...insights.repPrs]
    .filter((record) => record.date >= recentStart && record.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  const latestRecordEntry = latestRecord
    ? entries.find((entry) => entry.exerciseId === latestRecord.exerciseId && entry.date.slice(0, 10) === latestRecord.date)
    : null
  const latestSet = latestRecordEntry
    ? [...workingSets(latestRecordEntry.sets)].sort((a, b) => b.weight - a.weight)[0]
    : null
  const insightCards: Array<{ key: string; text: string; lift?: LiftInsight; values?: number[] }> = []
  if (insights.recentRecordsCount) {
    const event = latestRepPr ?? (latestRecord ? {
      exerciseId: latestRecord.exerciseId,
      weight: latestSet?.weight ?? 0,
      reps: latestSet?.reps ?? 0,
    } : null)
    if (event) {
      insightCards.push({
        key: 'prs',
        text: t('progress.insight.prs', {
          count: formatNumber(language, insights.recentRecordsCount),
          lift: nameFor(event.exerciseId),
          weight: formatNumber(language, event.weight),
          reps: formatNumber(language, event.reps),
        }),
        lift: insights.lifts.find((lift) => lift.exerciseId === event.exerciseId),
        values: latestRepPr ? [latestRepPr.previousBest, latestRepPr.reps] : [event.weight],
      })
    }
  }
  if (insights.bestMover?.changePercent !== null && insights.bestMover?.changePercent !== undefined) {
    insightCards.push({
      key: 'mover',
      text: t('progress.insight.mover', {
        lift: nameFor(insights.bestMover.exerciseId),
        percent: formatNumber(language, insights.bestMover.changePercent, { maximumFractionDigits: 1 }),
      }),
      lift: insights.bestMover,
    })
  }
  const firstNoBest = insights.noNewBest[0]
  if (firstNoBest) {
    insightCards.push({
      key: 'no-best',
      text: t('progress.insight.noBest', {
        lift: nameFor(firstNoBest.exerciseId),
        count: formatNumber(language, firstNoBest.sessionsSince),
        weight: formatNumber(language, firstNoBest.bestValue, { maximumFractionDigits: 1 }),
        date: formatShortDate(language, firstNoBest.bestDate),
      }),
      lift: insights.lifts.find((lift) => lift.exerciseId === firstNoBest.exerciseId),
    })
  }
  if (insights.worstMover?.changePercent !== null && insights.worstMover?.changePercent !== undefined) {
    insightCards.push({
      key: 'worst',
      text: t('progress.insight.worst', {
        lift: nameFor(insights.worstMover.exerciseId),
        percent: formatNumber(language, Math.abs(insights.worstMover.changePercent), { maximumFractionDigits: 1 }),
      }),
      lift: insights.worstMover,
    })
  }
  const largestMuscleChange = [...insights.weeklyMuscles]
    .filter((muscle) => muscle.thisWeek > 0 || muscle.previousThreeWeekAverage > 0)
    .sort((a, b) => Math.abs(b.thisWeek - b.previousThreeWeekAverage) - Math.abs(a.thisWeek - a.previousThreeWeekAverage))[0]
  if (largestMuscleChange) {
    insightCards.push({
      key: 'muscle',
      text: t('progress.insight.muscle', {
        muscle: muscleGroupLabel(largestMuscleChange.muscleGroup, data.i18n),
        current: formatNumber(language, largestMuscleChange.thisWeek, { maximumFractionDigits: 1 }),
        average: formatNumber(language, largestMuscleChange.previousThreeWeekAverage, { maximumFractionDigits: 1 }),
      }),
      values: [largestMuscleChange.previousThreeWeekAverage, largestMuscleChange.thisWeek],
    })
  }

  const percentText = (value: number | null) => value === null ? '—' : signedPercent(value, language)
  const weeklyMuscles = [...insights.weeklyMuscles]
    .filter((muscle) => muscle.commonRange || muscle.thisWeek > 0 || muscle.previousThreeWeekAverage > 0)
    .sort((a, b) => Math.max(b.thisWeek, b.previousThreeWeekAverage) - Math.max(a.thisWeek, a.previousThreeWeekAverage))
    .slice(0, 6)
  const muscleScale = Math.max(24, ...weeklyMuscles.flatMap((muscle) => [muscle.thisWeek, muscle.previousThreeWeekAverage]))
  const volumeBarScale = Math.max(...insights.weeklyVolume.map((week) => week.perSession), 1)
  const totalRegions = insights.upperLower.total
  const upperPercent = totalRegions ? Math.round(insights.upperLower.upper / totalRegions * 100) : 0
  const lowerPercent = totalRegions ? Math.round(insights.upperLower.lower / totalRegions * 100) : 0
  const rirSetCount = insights.rirWeeks.reduce((total, week) => total + week.setCount, 0)
  const rirLoggedSetCount = insights.rirWeeks.reduce((total, week) => total + week.rirSetCount, 0)
  const meanCoverage = rirSetCount ? rirLoggedSetCount / rirSetCount : 0
  const formatTonnage = (value: number) => formatNumber(language, value, { maximumFractionDigits: 0 })
  const weekdayName = (day: number) => new Date(Date.UTC(2026, 0, 5 + day))
    .toLocaleDateString(language === 'es' ? 'es' : 'en', { weekday: 'short', timeZone: 'UTC' })

  return (
    <>
      {(undoEntry || sessionUndo) && (
        <aside className="progress-delete-toast" role="status" aria-live="polite">
          <span>{t(undoEntry ? 'progress.delete.deleted' : 'progress.sessions.deleted', {
            count: sessionUndo?.length ?? 1,
          })}</span>
          <button type="button" className="text-button" onClick={() => void (undoEntry ? undoDelete() : undoSessionDelete())}>
            {t('progress.delete.undo')}
          </button>
        </aside>
      )}

      <section className="card progress-headline" aria-label={t('progress.title')}>
        <div className="progress-heading-row">
          <h2>{t('progress.title')}</h2>
          {activeBlock && <span className="progress-block-label">{t('progress.block.label', { number: activeBlock.number })}</span>}
        </div>
        <div className="plan-mode-tabs progress-range-toggle" role="group" aria-label={t('progress.range.label')}>
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={range === option.value ? 'tab-button active' : 'tab-button'}
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="progress-hero">
          <h3>
            {insights.eligibleLifts.length
              ? t('progress.hero.lifts', {
                improving: formatNumber(language, insights.improvingCount),
                total: formatNumber(language, insights.eligibleLifts.length),
              })
              : t('progress.hero.notEnough')}
          </h3>
          <p>{t('progress.hero.average', { percent: percentText(insights.averageChangePercent) })}</p>
        </div>
        <div className="progress-stat-grid">
          <div className="progress-stat"><strong>{formatNumber(language, insights.prCount)}</strong><span>{t('progress.stat.prs')}</span></div>
          <div className="progress-stat">
            <strong>{formatNumber(language, insights.sessionsDone)}/{formatNumber(language, insights.sessionsPlanned || insights.sessionsDone)}</strong>
            <span>{t('progress.stat.sessions')}</span>
          </div>
          <div className="progress-stat"><strong>{formatNumber(language, insights.streakWeeks)}</strong><span>{t('progress.stat.streak')}</span></div>
        </div>
      </section>

      <ProgressSection title={t('progress.insights.title')}>
        {insightCards.length ? (
          <ol className="progress-insight-list">
            {insightCards.slice(0, 4).map((insight) => (
              <li key={insight.key} className="progress-insight-card">
                <span className="progress-insight-rank">{formatNumber(language, insightCards.indexOf(insight) + 1)}</span>
                <p>{insight.text}</p>
                {insight.lift && <Sparkline points={insight.lift.points} />}
                {!insight.lift && insight.values && <MiniBars values={insight.values} />}
              </li>
            ))}
          </ol>
        ) : <p className="empty-state">{t('progress.insight.empty')}</p>}
      </ProgressSection>

      <ProgressSection title={t('progress.section.strength')}>
        <h4>{t('progress.strength.mainLifts')}</h4>
        {insights.lifts.length ? (
          <ul className="progress-lift-list">
            {insights.lifts.map((lift) => {
              const latest = lift.points[lift.points.length - 1]
              const exerciseName = nameFor(lift.exerciseId)
              return (
                <li key={lift.exerciseId}>
                  <button type="button" className="progress-lift-button" aria-label={t('progress.strength.openDetail', { exercise: exerciseName })} onClick={() => setSelectedLiftId(lift.exerciseId)}>
                    <span className="progress-lift-name">{exerciseName}</span>
                    <Sparkline points={lift.points} />
                    <strong>{latest ? `${formatNumber(language, latest.value, { maximumFractionDigits: 1 })} ${t('progress.unit.kg')}` : '—'}</strong>
                    <span className={lift.trend === 'improving' ? 'progress-change positive' : 'progress-change'}>
                      {lift.trend === 'improving'
                        ? t('progress.strength.changeUp', { percent: formatNumber(language, lift.changePercent ?? 0, { maximumFractionDigits: 1 }) })
                        : lift.trend === 'declining'
                          ? t('progress.strength.changeDown', { percent: formatNumber(language, Math.abs(lift.changePercent ?? 0), { maximumFractionDigits: 1 }) })
                          : lift.trend === 'flat'
                            ? t('progress.strength.changeFlat')
                            : t('progress.strength.notEnough')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : <p className="empty-state">{t('progress.strength.noLifts')}</p>}
        {insights.mostImproved && (
          <p className="progress-data-line">
            {t('progress.insight.mover', {
              lift: nameFor(insights.mostImproved.exerciseId),
              percent: formatNumber(language, insights.mostImproved.changePercent ?? 0, { maximumFractionDigits: 1 }),
            })}
          </p>
        )}
        {insights.noNewBest.length > 0 && (
          <ul className="progress-fact-list">
            {insights.noNewBest.map((item) => (
              <li key={item.exerciseId}>
                {t('progress.insight.noBest', {
                  lift: nameFor(item.exerciseId),
                  count: formatNumber(language, item.sessionsSince),
                  weight: formatNumber(language, item.bestValue, { maximumFractionDigits: 1 }),
                  date: formatShortDate(language, item.bestDate),
                })}
              </li>
            ))}
          </ul>
        )}
        {insights.repPrs.length > 0 && (
          <div className="progress-subsection">
            <h4>{t('progress.section.personalRecords')}</h4>
            <ul className="progress-fact-list">
              {[...insights.repPrs].sort((a, b) => (b.reps - b.previousBest) - (a.reps - a.previousBest)).slice(0, 3).map((record) => (
                <li key={`${record.exerciseId}-${record.date}-${record.weight}-${record.reps}`}>
                  {nameFor(record.exerciseId)} · {formatNumber(language, record.weight)} {t('progress.unit.kg')} × {formatNumber(language, record.reps)}
                  {' '}({formatNumber(language, record.previousBest)} → {formatNumber(language, record.reps)})
                </li>
              ))}
            </ul>
          </div>
        )}
        {insights.averageTopSetLoadChange !== null && (
          <>
            <p className="progress-data-line">{t('progress.strength.topSetChange', { percent: percentText(insights.averageTopSetLoadChange) })}</p>
            <ul className="progress-fact-list">
              {insights.topSetLoads.map((item) => (
                <li key={item.exerciseId}>{t('progress.strength.topSetLiftChange', {
                  lift: nameFor(item.exerciseId),
                  current: formatNumber(language, item.current),
                  previous: formatNumber(language, item.previous),
                  percent: percentText(item.changePercent),
                })}</li>
              ))}
            </ul>
          </>
        )}
      </ProgressSection>

      <ProgressSection title={t('progress.section.volume')}>
        <div className="progress-subsection">
          <h4>{t('progress.section.weeklySets')}</h4>
          {weeklyMuscles.length ? (
            <>
              <ul className="progress-muscle-bars">
                {weeklyMuscles.map((muscle) => (
                  <li key={muscle.muscleGroup}>
                    <div className="progress-bar-heading">
                      <strong>{muscleGroupLabel(muscle.muscleGroup, data.i18n)}</strong>
                      <span>{formatNumber(language, muscle.thisWeek, { maximumFractionDigits: 1 })} / {formatNumber(language, muscle.previousThreeWeekAverage, { maximumFractionDigits: 1 })}</span>
                    </div>
                    <div className="progress-muscle-track" role="img" aria-label={t('progress.weeklySets.compare', {
                      muscle: muscleGroupLabel(muscle.muscleGroup, data.i18n),
                      current: formatNumber(language, muscle.thisWeek, { maximumFractionDigits: 1 }),
                      average: formatNumber(language, muscle.previousThreeWeekAverage, { maximumFractionDigits: 1 }),
                    })}>
                      {muscle.commonRange && <span className="progress-muscle-range" style={{ left: `${10 / muscleScale * 100}%`, width: `${10 / muscleScale * 100}%` }} />}
                      <span className="progress-muscle-average" style={{ left: `${Math.min(muscle.previousThreeWeekAverage / muscleScale, 1) * 100}%` }} />
                      <span className="progress-muscle-current" style={{ width: `${Math.min(muscle.thisWeek / muscleScale, 1) * 100}%` }} />
                    </div>
                    <small className="progress-muscle-copy">{t('progress.weeklySets.compare', {
                      muscle: muscleGroupLabel(muscle.muscleGroup, data.i18n),
                      current: formatNumber(language, muscle.thisWeek, { maximumFractionDigits: 1 }),
                      average: formatNumber(language, muscle.previousThreeWeekAverage, { maximumFractionDigits: 1 }),
                    })}</small>
                  </li>
                ))}
              </ul>
              <p className="chart-legend">{t('progress.weeklySets.commonRange', {
                min: formatNumber(language, insights.commonRange.min),
                max: formatNumber(language, insights.commonRange.max),
              })}</p>
            </>
          ) : <p className="empty-state">{t('progress.weeklySets.empty')}</p>}
        </div>
        <div className="progress-subsection">
          <h4>{t('progress.volume.perSession')}</h4>
          <ul className="progress-volume-bars">
            {insights.weeklyVolume.map((week) => (
              <li key={week.weekStart}>
                <span>{formatShortDate(language, week.weekStart)}</span>
                <span className="progress-volume-track"><span style={{ width: `${week.perSession / volumeBarScale * 100}%` }} /></span>
                <strong>{formatNumber(language, week.perSession, { maximumFractionDigits: 0 })}</strong>
              </li>
            ))}
          </ul>
          {insights.volumePerSessionChange !== null && <p className="chart-legend">{t('progress.volume.change', { percent: percentText(insights.volumePerSessionChange) })}</p>}
        </div>
        <div className="progress-subsection">
          <h4>{t('progress.volume.blockTonnage', { week: formatNumber(language, insights.activeBlockWeek) })}</h4>
          {insights.currentTonnage !== null && insights.previousTonnage !== null ? (
            <p className="progress-data-line">{t('progress.volume.tonnageCompare', {
              current: formatTonnage(insights.currentTonnage),
              previous: formatTonnage(insights.previousTonnage),
            })}</p>
          ) : <p className="chart-legend">{t('progress.volume.noComparison')}</p>}
        </div>
      </ProgressSection>

      <ProgressSection title={t('progress.section.effort')}>
        <div className="progress-subsection">
          <h4>{t('progress.balance.pushPull', {
            push: formatNumber(language, insights.pushPull.push),
            pull: formatNumber(language, insights.pushPull.pull),
          })}</h4>
          {insights.pushPull.note && (
            <p className="progress-data-line">
              {t(insights.pushPull.note === 'push-dominant' ? 'progress.balance.pushDominant' : 'progress.balance.pullDominant')}
            </p>
          )}
        </div>
        <div className="progress-subsection">
          <h4>{t('progress.balance.upperLower', { upper: formatNumber(language, upperPercent), lower: formatNumber(language, lowerPercent) })}</h4>
          <div className="progress-region-track" role="img" aria-label={t('progress.balance.upperLower', { upper: upperPercent, lower: lowerPercent })}>
            <span style={{ width: `${upperPercent}%` }} />
            <span style={{ width: `${lowerPercent}%` }} />
          </div>
        </div>
        <div className="progress-subsection">
          <h4>{t('progress.rir.average')}</h4>
          {insights.rirWeeks.some((week) => week.mean !== null) ? (
            <>
              <ul className="progress-rir-bars">
                {insights.rirWeeks.map((week) => (
                  <li key={week.week}>
                    <span>{formatNumber(language, week.week)}</span>
                    <span className="progress-rir-track">
                      <span style={{ height: `${week.mean === null ? 0 : Math.min(week.mean / 5, 1) * 100}%` }} />
                    </span>
                    <strong>{week.mean === null ? '—' : formatNumber(language, week.mean, { maximumFractionDigits: 1 })}</strong>
                  </li>
                ))}
              </ul>
              <p className="chart-legend">{t('progress.rir.coverage', { percent: formatPercent(meanCoverage, language) })}</p>
              {insights.rirChange !== null && insights.rirWeeks[0]?.mean !== null && insights.rirWeeks[insights.rirWeeks.length - 1]?.mean !== null && (
                <p className="progress-data-line">
                  {t(
                    insights.rirChange < 0 ? 'progress.rir.changeCloser' : 'progress.rir.changeFurther',
                    {
                      first: formatNumber(language, insights.rirWeeks[0].mean as number, { maximumFractionDigits: 1 }),
                      last: formatNumber(language, insights.rirWeeks[insights.rirWeeks.length - 1].mean as number, { maximumFractionDigits: 1 }),
                    }
                  )}
                </p>
              )}
            </>
          ) : <p className="empty-state">{t('progress.consistency.empty')}</p>}
        </div>
        <div className="progress-subsection">
          <h4>{t('progress.habits.sessionsPerWeek')}</h4>
          <ul className="progress-volume-bars">
            {insights.sessionsPerBlockWeek.map((week) => (
              <li key={week.week}>
                <span>{formatNumber(language, week.week)}</span>
                <span className="progress-volume-track"><span style={{ width: `${week.planned ? week.done / week.planned * 100 : 0}%` }} /></span>
                <strong>{formatNumber(language, week.done)}/{formatNumber(language, week.planned)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="progress-subsection">
          <h4>{t('progress.habits.weekdayFrequency')}</h4>
          <p className="chart-legend">{t('progress.habits.mostFrequentDays', {
            days: [...insights.weekdayCounts]
              .sort((a, b) => b.sessions - a.sessions)
              .slice(0, 2)
              .map((item) => weekdayName(item.weekday))
              .join(' · '),
          })}</p>
          <ul className="progress-weekday-bars">
            {insights.weekdayCounts.map((item) => (
              <li key={item.weekday} aria-label={`${weekdayName(item.weekday)} ${item.sessions}`}>
                <span>{weekdayName(item.weekday)}</span>
                <span className="progress-weekday-track"><span style={{ height: `${item.sessions / Math.max(...insights.weekdayCounts.map((day) => day.sessions), 1) * 100}%` }} /></span>
                <strong>{formatNumber(language, item.sessions)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </ProgressSection>

      <ProgressSection title={t('progress.consistency.grid')}>
        <div className="progress-consistency-grid" role="img" aria-label={t('progress.consistency.grid')}>
          {insights.consistencyGrid.map((day) => (
            <span key={day.date} className={day.hasSession ? 'has-session' : ''} title={formatShortDate(language, day.date)} />
          ))}
        </div>
        <p className="chart-legend">{t('progress.stat.streak')}: {formatNumber(language, insights.streakWeeks)}</p>
      </ProgressSection>

      <SectionCard id="session-log" title={t('progress.section.sessionLog')} defaultOpen={false}>
        {sessions.length ? (
          <ul className="session-list">
            {sessions.slice(0, 24).map((session: LoggedSession) => {
              const dayName = blocks.find((block) => block.id === session.blockId)?.days.find((day) => day.key === session.dayKey)?.name ?? ''
              return (
                <li key={session.key} className="session-row">
                  <div>
                    <strong>{formatShortDate(language, session.date)}{dayName ? ` · ${dayName}` : ''}</strong>
                    <small>{t('progress.sessions.count', { count: session.entries.length })}</small>
                  </div>
                  {confirmSession === session.key ? (
                    <span className="progress-delete-confirm" role="group" aria-label={t('progress.sessions.confirm', { count: session.entries.length })}>
                      <span>{t('progress.sessions.confirm', { count: session.entries.length })}</span>
                      <button type="button" className="text-button" onClick={() => void deleteSession(session)}>{t('progress.delete.action')}</button>
                      <button type="button" className="text-button" onClick={() => setConfirmSession('')}>{t('progress.delete.cancel')}</button>
                    </span>
                  ) : (
                    <button type="button" className="text-button" onClick={() => setConfirmSession(session.key)}>{t('progress.sessions.delete')}</button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : <p className="empty-state">{t('progress.sessions.empty')}</p>}
      </SectionCard>

      {selectedLift && detail && (
        <div className="progress-detail-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedLiftId('')
        }}>
          <section className="progress-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="progress-lift-detail-title">
            <div className="progress-detail-heading">
              <h2 id="progress-lift-detail-title">{t('progress.liftDetail.title', { exercise: nameFor(selectedLift.exerciseId) })}</h2>
              <button type="button" className="icon-button" aria-label={t('progress.liftDetail.close')} onClick={() => setSelectedLiftId('')}>×</button>
            </div>
            {detail.points.length ? (
              <>
                <StrengthChart
                  model={detail.chart}
                  title={t('progress.strength.chart.title', { exercise: nameFor(selectedLift.exerciseId), scope: rangeOptions.find((option) => option.value === range)?.label ?? '' })}
                  summary={detail.summary}
                />
                <p className="chart-legend">{t('progress.liftDetail.bestEver')}</p>
                <table className="set-history">
                  <caption>{t('progress.setHistory.caption', { exercise: nameFor(selectedLift.exerciseId) })}</caption>
                  <thead><tr>
                    <th scope="col">{t('progress.setHistory.date')}</th>
                    <th scope="col">{t('progress.setHistory.sets')}</th>
                    <th scope="col">{t('progress.setHistory.volume')}</th>
                    <th scope="col"><span className="visually-hidden">{t('progress.delete.actions')}</span></th>
                  </tr></thead>
                  <tbody>
                    {[...detail.points].reverse().map((point) => (
                      <tr key={point.date}>
                        <td>{formatShortDate(language, point.date)}{point.date === selectedLift.points.find((item) => item.isBestEver)?.date ? ' ★' : ''}</td>
                        <td>
                          <ul className="set-history-sets">
                            {point.sets.map((set, index) => (
                              <li key={`${set.id}-${index}`} className={index === point.bestSetIndex ? 'best' : undefined}>
                                <span>{formatNumber(language, set.weight)} {t('progress.unit.kg')} × {formatNumber(language, set.reps)}</span>
                                {set.drop && <span className="set-history-drop">→ {formatNumber(language, set.drop.weight)} {t('progress.unit.kg')} × {formatNumber(language, set.drop.reps)}</span>}
                                {index === point.bestSetIndex && <span className="set-history-best">{t('progress.setHistory.best')}</span>}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>{formatNumber(language, point.volume, { maximumFractionDigits: 1 })}</td>
                        <td>
                          {entries.filter((entry) => entry.exerciseId === selectedLift.exerciseId && entry.date.slice(0, 10) === point.date)
                            .map((entry) => <React.Fragment key={entry.id}>{renderDeleteAction(entry)}</React.Fragment>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : <p className="empty-state">{t('progress.liftDetail.empty')}</p>}
            <button type="button" className="secondary-button" onClick={() => onOpenExercise(selectedLift.exerciseId)}>
              {t('progress.strength.openExercise')}
            </button>
          </section>
        </div>
      )}
    </>
  )
}

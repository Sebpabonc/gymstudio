import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { localizeBlocks, useSpanishContentReady } from '../i18n/content'
import { explainSuggestion, mapAiGatewayError } from '../ai/gateway'
import type { AuthStatus } from '../auth/AuthProvider'
import AiConsentPrompt from '../components/AiConsentPrompt'
import { formatNumber, formatShortDate, useT } from '../i18n'
import { localIsoDate } from '../lib/dates'
import { isDemoMode } from '../utils/demoMode'
import {
  adherence,
  blockReports,
  personalRecords,
  progressSuggestions,
  suggestionSourceBlock,
  strengthTrend,
  weeklySets,
} from '../progress'
import type { DayTypeFilter, ProgressSuggestion } from '../progress'
import {
  blockAdherenceFor,
  buildChartModel,
  chartSummary,
  CHART_SIZE,
  defaultExerciseId,
  filterExerciseOptions,
  exercisesWithHistory,
  formatChange,
  formatBlockMethod,
  formatPercent,
  formatWeekLabel,
  limitSuggestions,
  muscleGroupLabel,
  muscleRows,
  muscleScale,
  muscleStatus,
  recentRecords,
  reportingWeek,
  RECORD_LABELS,
  RECORD_TOOLTIPS,
  SETS_RANGE,
  sessionDots,
  suggestionExerciseId,
  topLifts,
  visibleBlockReports,
  weeklyPRCount,
  weeklySummary,
} from '../progress/viewModel'
import { entriesWithinBlock, startOfWeek } from '../progress/utils'
import { selectPlanBlocks } from '../plans/selectPlanBlocks'
import { loadDemoBlocks } from '../plans/demoBlock'
import { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import {
  applyWeightTarget,
  fetchActiveUserPlan,
  fetchTrainingBlocks,
  getCachedActiveUserPlan,
  getCachedTrainingBlocks,
  getExerciseDisplayName,
  getAskExerciseAiConsent,
  loadWeightTargets,
  removeWeightTarget,
  setAskExerciseAiConsent,
} from '../utils/storage'
import type { AskExerciseAiConsent } from '../utils/storage'
import { baseWeightFromHistory } from '../utils/weightTargets'
import { defaultActiveBlock, trainingBlockDateStatus } from '../utils/trainingBlocks'

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

function AiSuggestionExplanation({
  exerciseId,
  suggestionText,
  demoMode,
  status,
  onSignIn,
}: {
  exerciseId: string
  suggestionText: string
  demoMode: boolean
  status: AuthStatus
  onSignIn: () => void
}) {
  const { t, language } = useT()
  const [consent, setConsent] = useState<AskExerciseAiConsent | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const [answer, setAnswer] = useState('')
  const [remainingToday, setRemainingToday] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const requestExplanation = async () => {
    if (pending || answer) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError(mapAiGatewayError('offline', language))
      return
    }
    setPending(true)
    setError('')
    try {
      const response = await explainSuggestion(exerciseId, suggestionText.slice(0, 300), language)
      setAnswer(response.answer)
      setRemainingToday(response.remainingToday)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : mapAiGatewayError('unknown', language))
    } finally {
      setPending(false)
    }
  }

  const chooseConsent = (choice: AskExerciseAiConsent) => {
    setAskExerciseAiConsent(choice)
    setConsent(choice)
    if (choice === 'enabled') {
      setShowConsent(false)
      void requestExplanation()
    } else {
      setShowConsent(false)
    }
  }

  const explain = () => {
    if (demoMode) return
    if (status !== 'signed-in') {
      onSignIn()
      return
    }
    if (answer || pending) return
    setError('')
    const savedConsent = getAskExerciseAiConsent()
    setConsent(savedConsent)
    if (savedConsent !== 'enabled') {
      setShowConsent(true)
      return
    }
    void requestExplanation()
  }

  return (
    <div className="ai-explanation">
      <button
        type="button"
        className="ai-feature-button"
        disabled={demoMode || status === 'loading' || pending || !!answer}
        onClick={demoMode || status === 'signed-out' ? onSignIn : explain}
      >
        {demoMode || status === 'signed-out' ? t('progress.ai.signInToUse') : t('progress.ai.askWhy')}
      </button>
      {showConsent && (
        <div className="ai-inline-consent">
          {consent === null ? (
            <AiConsentPrompt onChoice={chooseConsent} />
          ) : (
            <p>{t('progress.ai.disabled')}</p>
          )}
        </div>
      )}
      {pending && <p className="ai-inline-status" role="status">{t('progress.ai.thinking')}</p>}
      {error && (
        <div className="ai-inline-error" role="alert">
          <p>{error}</p>
          {error === mapAiGatewayError('sign_in_required', language) && (
            <button type="button" className="secondary-button" onClick={onSignIn}>{t('progress.ai.signIn')}</button>
          )}
        </div>
      )}
      {answer && (
        <div className="ai-inline-answer" aria-live="polite">
          <p>{answer}</p>
          {remainingToday !== null && (
            <small>
              {t(remainingToday === 1 ? 'progress.ai.remaining.one' : 'progress.ai.remaining.other', {
                count: formatNumber(language, remainingToday),
              })}
            </small>
          )}
          <small>{t('progress.ai.disclaimer')}</small>
        </div>
      )}
    </div>
  )
}

function SectionCard({ id, title, children, defaultOpen = false }: { id: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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

function StrengthChart({ model, title, summary }: { model: ReturnType<typeof buildChartModel>; title: string; summary: string }) {
  const { t } = useT()
  const { left, right, top, bottom, width, height } = CHART_SIZE
  const uid = useId()
  const titleId = `${uid}-title`
  const descId = `${uid}-desc`
  return (
    <svg className="strength-chart" viewBox={`0 0 ${model.width} ${model.height}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>{title}</title>
      <desc id={descId}>{summary}</desc>
      {model.bands.map((band, index) => (
        <g key={band.blockId}>
          <rect
            x={band.x}
            y={top}
            width={band.width}
            height={height - top - bottom}
            className={index % 2 ? 'chart-band alt' : 'chart-band'}
          />
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
        <circle
          key={point.date}
          cx={point.x}
          cy={point.y}
          r={point.isRecord ? 4.5 : 2.5}
          className={point.isRecord ? 'chart-point record' : 'chart-point'}
        />
      ))}
    </svg>
  )
}

export default function ProgressScreen({
  entries,
  exercises,
  initialExerciseId,
  onOpenExercise,
  onSignIn,
  onDeleteEntry,
  onRestoreEntry,
  authStatus,
  authUserId,
}: Props) {
  const { t, language } = useT()
  const demoMode = isDemoMode()
  const [rawBlocks, setBlocks] = useState<TrainingBlock[] | null>(null)
  const spanishReady = useSpanishContentReady(language)
  const blocks = useMemo(() => (rawBlocks ? localizeBlocks(rawBlocks, language) : null), [rawBlocks, language, spanishReady])
  const [dayType, setDayType] = useState<DayTypeFilter>('A')
  const [pickedId, setPickedId] = useState(initialExerciseId ?? '')
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const exercisePickerButtonRef = useRef<HTMLButtonElement>(null)
  const [targets, setTargets] = useState(() => loadWeightTargets())
  const [confirmDeleteId, setConfirmDeleteId] = useState('')
  const [undoEntry, setUndoEntry] = useState<WorkoutEntry | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const today = localIsoDate()

  useEffect(() => () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }, [])

  useEffect(() => {
    let cancelled = false
    const signedIn = authStatus === 'signed-in' && !demoMode
    const cachedPlan = signedIn ? getCachedActiveUserPlan() : null
    const globalCache = demoMode ? [] : getCachedTrainingBlocks() ?? []
    const cachedBlocks = selectPlanBlocks(globalCache, cachedPlan, signedIn, demoMode)
    if (cachedBlocks.length) setBlocks(cachedBlocks)
    void Promise.all([
      demoMode ? loadDemoBlocks() : fetchTrainingBlocks(),
      signedIn ? fetchActiveUserPlan().catch(() => null) : Promise.resolve(null),
    ]).then(([globalBlocks, activePlan]) => {
      if (!cancelled) setBlocks(selectPlanBlocks(globalBlocks, activePlan, signedIn, demoMode))
    }).catch(() => {
      if (!cancelled) setBlocks(cachedBlocks)
    })
    return () => {
      cancelled = true
    }
  }, [authStatus, authUserId, demoMode])

  const data = useMemo(() => {
    if (!blocks) return null
    const i18n = { t, language }
    const activeBlock = defaultActiveBlock(blocks, today)
    const gapWeek = activeBlock !== null && trainingBlockDateStatus(activeBlock, today) === 'Upcoming'
    const suggestionBlock = suggestionSourceBlock(blocks, activeBlock, today)
    const progressEntries = gapWeek && activeBlock
      ? entriesWithinBlock(entries, activeBlock)
      : entries
    const suggestions = limitSuggestions(progressSuggestions(
      entries,
      blocks,
      exercises,
      today,
      new Set(Object.keys(targets)),
      i18n,
      activeBlock
    ))
    const week = gapWeek ? startOfWeek(today) : reportingWeek(entries, today)
    const currentWeek = startOfWeek(today)
    const currentWeekAdherence = adherence(progressEntries, blocks, currentWeek)
    const adherenceReport = adherence(progressEntries, blocks, week)
    const records = personalRecords(entries, blocks)
    const prCount = weeklyPRCount(records, currentWeek)
    const reports = visibleBlockReports(blockReports(entries, blocks, exercises), entries, blocks)
    const weekly = weeklySets(entries, blocks, exercises, week, gapWeek ? activeBlock : undefined)
    const options = exercisesWithHistory(entries, exercises, language)
    const consistencyBlock = activeBlock
    return {
      week,
      currentWeek,
      currentWeekAdherence,
      prCount,
      consistencyBlock,
      gapWeek,
      activeBlock,
      suggestionBlock,
      suggestions,
      adherenceReport,
      records,
      reports,
      weekly,
      options,
    }
  }, [blocks, entries, exercises, language, t, today, targets])

  if (!blocks || !data) {
    return <section className="card" aria-live="polite"><p className="empty-state">{t('progress.loading')}</p></section>
  }

  const {
    week,
    currentWeek,
    currentWeekAdherence,
    prCount,
    consistencyBlock,
    gapWeek,
    activeBlock,
    suggestionBlock,
    suggestions,
    adherenceReport,
    records,
    reports,
    weekly,
    options,
  } = data
  const nameFor = (id: string) => {
    const exercise = exercises.find((item) => item.id === id)
    return exercise ? getExerciseDisplayName(exercise, language) : id
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
  const renderDeleteAction = (entry: WorkoutEntry) => (
    <div className="progress-log-delete">
      <button
        type="button"
        className="icon-button log-delete-button"
        aria-label={t('progress.delete.logFor', {
          exercise: nameFor(entry.exerciseId),
          date: formatShortDate(language, entry.date),
        })}
        onClick={() => setConfirmDeleteId(entry.id)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
        </svg>
      </button>
      {confirmDeleteId === entry.id && (
        <div className="progress-delete-confirm" role="group" aria-label={t('progress.delete.confirm')}>
          <span>{t('progress.delete.confirm')}</span>
          <button type="button" className="text-button" onClick={() => void deleteEntry(entry)}>
            {t('progress.delete.action')}
          </button>
          <button type="button" className="text-button" onClick={() => setConfirmDeleteId('')}>
            {t('progress.delete.cancel')}
          </button>
        </div>
      )}
    </div>
  )
  const selectedId = options.some((exercise) => exercise.id === pickedId)
    ? pickedId
    : defaultExerciseId(entries, exercises, blocks, today, language)
  const filteredOptions = filterExerciseOptions(options, exerciseSearch)
  const i18n = { t, language } as const
  const trend = selectedId ? strengthTrend(entries, blocks, selectedId, today, dayType, exercises, i18n) : null
  const recordDates = new Set(
    records.filter((record) => record.exerciseId === selectedId && record.badges.length > 0).map((record) => record.date)
  )
  const chart = trend ? buildChartModel(trend.points, blocks, recordDates, i18n) : null
  const blockAdherence = blockAdherenceFor(adherenceReport, consistencyBlock?.id)
  const dots = sessionDots(adherenceReport)
  const headlineDots = sessionDots(currentWeekAdherence)
  const rows = muscleRows(weekly)
  const scale = muscleScale(rows)
  const recent = recentRecords(records)
  const hasHistory = entries.length > 0

  const openSuggestion = (suggestion: ProgressSuggestion) => {
    const id = suggestionExerciseId(suggestion)
    if (id) onOpenExercise(id)
  }

  const applySuggestion = (suggestion: Extract<ProgressSuggestion, { type: 'add-weight' }>) => {
    setTargets(applyWeightTarget(suggestion.exerciseId, {
      dayType: suggestion.dayType,
      increaseKg: suggestion.increment,
      baseWeightKg: baseWeightFromHistory(entries, blocks, suggestion.exerciseId, suggestion.dayType),
    }))
  }
  const appliedTargets = Object.entries(targets)

  return (
    <>
      {undoEntry && (
        <aside className="progress-delete-toast" role="status" aria-live="polite">
          <span>{t('progress.delete.deleted')}</span>
          <button type="button" className="text-button" onClick={() => void undoDelete()}>
            {t('progress.delete.undo')}
          </button>
        </aside>
      )}
      <section className="card progress-headline" aria-label={t('progress.headline.label')}>
        <h2 className="progress-headline-text">
          {gapWeek && activeBlock
            ? t(activeBlock.number === 0 ? 'progress.headline.planStarts' : 'progress.headline.blockStarts', {
              number: activeBlock.number,
              date: formatShortDate(language, activeBlock.startDate),
            })
            : weeklySummary(currentWeekAdherence.week.sessionsDone, currentWeekAdherence.week.sessionsPlanned, prCount, today, i18n)}
        </h2>
        <div
          className="progress-session-days"
          role="img"
          aria-label={t('progress.headline.aria', {
            done: formatNumber(language, currentWeekAdherence.week.sessionsDone),
            planned: formatNumber(language, currentWeekAdherence.week.sessionsPlanned),
            week: formatWeekLabel(currentWeek, today, i18n).toLowerCase(),
          })}
        >
          {headlineDots.map((done, index) => (
            <span key={index} className="progress-session-day">
              <span>{t('progress.sessions.label', { number: index + 1 })}</span>
              <span className={done ? 'session-dot done' : 'session-dot'} />
            </span>
          ))}
        </div>
      </section>

      <SectionCard id="suggestions" title={t('progress.section.suggestions')}>
        {gapWeek && suggestionBlock && (
          <p className="chart-legend">
            {t('progress.suggestions.sourceBlock', {
              block: t('progress.block.label', { number: suggestionBlock.number }),
            })}
          </p>
        )}
        {suggestions.length || appliedTargets.length ? (
          <ul className="progress-suggestions">
            {appliedTargets.map(([exerciseId, target]) => (
              <li key={`applied-${exerciseId}`} className="suggestion-actions">
                <div className="suggestion-button static">
                  <span className="suggestion-tag add-weight">{t('progress.suggestions.tag.addWeight')}</span>
                  <span>
                    {t('progress.suggestions.applied', {
                      exercise: nameFor(exerciseId),
                      session: target.dayType
                        ? t('progress.suggestions.nextDay', { dayType: target.dayType })
                        : t('progress.suggestions.nextSession'),
                      kg: formatNumber(language, target.increaseKg),
                      unit: t('progress.unit.kg'),
                    })}
                  </span>
                </div>
                <button type="button" className="suggestion-action-button" onClick={() => setTargets(removeWeightTarget(exerciseId))}>
                  {t('progress.suggestions.undo')}
                </button>
              </li>
            ))}
            {suggestions.map((suggestion, index) => {
              const exerciseId = suggestionExerciseId(suggestion)
              return (
                <li key={`${suggestion.type}-${exerciseId ?? 'all'}-${index}`} className="suggestion-actions">
                  {exerciseId ? (
                    <div className="suggestion-copy">
                      <span className={`suggestion-tag ${suggestion.type}`}>
                        {suggestion.type === 'add-weight' ? t('progress.suggestions.tag.addWeight') : t('progress.suggestions.tag.plateau')}
                      </span>
                      <span>{suggestion.message}</span>
                      <p className="suggestion-why"><strong>{t('progress.suggestions.why')}</strong> {suggestion.why}</p>
                      <AiSuggestionExplanation
                        exerciseId={exerciseId}
                        suggestionText={suggestion.message}
                        demoMode={demoMode}
                        status={authStatus}
                        onSignIn={onSignIn}
                      />
                      <button type="button" className="suggestion-exercise-link" onClick={() => openSuggestion(suggestion)}>
                        {t('progress.suggestions.openExercise', { exercise: nameFor(exerciseId) })}
                      </button>
                    </div>
                  ) : (
                    <div className="suggestion-copy">
                      <span className="suggestion-tag fatigue">{t('progress.suggestions.tag.fatigue')}</span>
                      <span>{suggestion.message}</span>
                      <p className="suggestion-why"><strong>{t('progress.suggestions.why')}</strong> {suggestion.why}</p>
                    </div>
                  )}
                  {suggestion.type === 'add-weight' && (
                    <button type="button" className="suggestion-action-button" onClick={() => applySuggestion(suggestion)}>
                      {t('progress.suggestions.apply')}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="empty-state">{hasHistory ? t('progress.suggestions.empty.active') : t('progress.suggestions.empty.none')}</p>
        )}
      </SectionCard>

      <SectionCard id="consistency" title={t('progress.section.consistency')}>
        {(hasHistory || gapWeek) && (
          <p className="chart-legend">
            {t('progress.consistency.legend', {
              week: formatWeekLabel(week, today, i18n),
              block: consistencyBlock ? ` · ${t('progress.block.label', { number: consistencyBlock.number })}` : '',
            })}
          </p>
        )}
        <div
          className="session-dots"
          role="img"
          aria-label={t('progress.headline.aria', {
            done: formatNumber(language, adherenceReport.week.sessionsDone),
            planned: formatNumber(language, adherenceReport.week.sessionsPlanned),
            week: formatWeekLabel(week, today, i18n).toLowerCase(),
          })}
        >
          {dots.map((done, index) => (
            <span key={index} className={done ? 'session-dot done' : 'session-dot'} />
          ))}
        </div>
        <div className="summary-grid">
          <div className="metric-card">
            <span>{t('progress.consistency.metric.blockAdherence')}</span>
            <strong>
              {blockAdherence
                ? formatPercent(blockAdherence.sessionsDone / blockAdherence.sessionsPlanned, language)
                : '—'}
            </strong>
          </div>
          <div className="metric-card">
            <span>{t('progress.consistency.metric.repsHit')}</span>
            <strong>{formatPercent(blockAdherence?.hitRate ?? adherenceReport.week.hitRate, language)}</strong>
          </div>
        </div>
        {!hasHistory && <p className="empty-state">{t('progress.consistency.empty')}</p>}
      </SectionCard>

      <SectionCard id="strength" title={t('progress.section.strengthTrend')} defaultOpen>
        {options.length ? (
          <>
            <span className="field-label">{t('progress.strength.exercise')}</span>
            <button
              ref={exercisePickerButtonRef}
              type="button"
              className="exercise-picker-button"
              aria-expanded={exercisePickerOpen}
              aria-controls="progress-exercise-picker"
              onClick={() => {
                setExercisePickerOpen((open) => !open)
                setExerciseSearch('')
              }}
            >
              {nameFor(selectedId)} <span aria-hidden="true">{exercisePickerOpen ? '−' : '+'}</span>
            </button>
            {exercisePickerOpen && (
              <div id="progress-exercise-picker" className="exercise-picker-panel">
                <label className="field-label" htmlFor="progress-exercise-search">{t('progress.strength.search.label')}</label>
                <input
                  id="progress-exercise-search"
                  className="search-input"
                  type="search"
                  placeholder={t('progress.strength.search.placeholder')}
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                />
                <div className="search-dropdown" aria-label={t('progress.strength.search.results')}>
                  {filteredOptions.length ? filteredOptions.map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      className={exercise.id === selectedId ? 'result-item active' : 'result-item'}
                      aria-pressed={exercise.id === selectedId}
                      onClick={() => {
                        setPickedId(exercise.id)
                        setExerciseSearch('')
                        setExercisePickerOpen(false)
                        exercisePickerButtonRef.current?.focus()
                      }}
                    >
                      <span className="result-name">{getExerciseDisplayName(exercise, language)}</span>
                    </button>
                  )) : <p className="empty-state">{t('progress.strength.search.empty')}</p>}
                </div>
              </div>
            )}
            <div className="plan-mode-tabs day-toggle" role="group" aria-label={t('progress.strength.dayType')}>
              {(['A', 'B', 'all'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={dayType === value ? 'tab-button active' : 'tab-button'}
                  aria-pressed={dayType === value}
                  onClick={() => setDayType(value)}
                >
                  {value === 'all' ? t('progress.strength.dayType.all') : value}
                </button>
              ))}
            </div>
            {trend && chart && trend.points.length > 0 ? (
              <>
                <StrengthChart
                  model={chart}
                  title={t('progress.strength.chart.title', {
                    exercise: nameFor(selectedId),
                    scope: dayType === 'all' ? t('progress.strength.scope.all') : t('progress.strength.scope.dayType', { dayType }),
                  })}
                  summary={chartSummary(trend.points, trend.takeaway, i18n)}
                />
                <p className="trend-takeaway">{trend.takeaway}</p>
                <p className="chart-legend"><span className="chart-point record legend-dot" /> {t('progress.strength.chart.legend')}</p>
                <table className="set-history">
                  <caption>{t('progress.setHistory.caption', { exercise: nameFor(selectedId) })}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('progress.setHistory.date')}</th>
                      <th scope="col">{t('progress.setHistory.sets')}</th>
                      <th scope="col">{t('progress.setHistory.volume')}</th>
                      <th scope="col"><span className="visually-hidden">{t('progress.delete.actions')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...trend.points].reverse().map((point) => (
                      <tr key={point.date}>
                        <td>{formatShortDate(language, point.date)}</td>
                        <td>
                          <ul className="set-history-sets">
                            {point.sets.map((set, index) => (
                              <li key={`${set.id}-${index}`} className={index === point.bestSetIndex ? 'best' : undefined}>
                                <span>{`${formatNumber(language, set.weight)} ${t('progress.unit.kg')} × ${formatNumber(language, set.reps)}`}</span>
                                {set.drop && (
                                  <span className="set-history-drop">
                                    <span aria-hidden="true">→ </span>
                                    {`${formatNumber(language, set.drop.weight)} ${t('progress.unit.kg')} × ${formatNumber(language, set.drop.reps)}`}
                                  </span>
                                )}
                                {index === point.bestSetIndex && (
                                  <span className="set-history-best">{t('progress.setHistory.best')}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>{`${formatNumber(language, point.volume, { maximumFractionDigits: 1 })} ${t('progress.unit.kg')}`}</td>
                        <td>
                          {entries
                            .filter((entry) => entry.exerciseId === selectedId && entry.date.slice(0, 10) === point.date)
                            .map((entry) => <React.Fragment key={entry.id}>{renderDeleteAction(entry)}</React.Fragment>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="empty-state">
                {dayType === 'all' ? t('progress.strength.empty.all') : t('progress.strength.empty.dayType', { dayType })}
              </p>
            )}
          </>
        ) : (
          <p className="empty-state">{t('progress.strength.empty.none')}</p>
        )}
        {selectedId && (
          <button type="button" className="secondary-button" onClick={() => onOpenExercise(selectedId)}>
            {t('progress.strength.openExercise')}
          </button>
        )}
      </SectionCard>

      <SectionCard id="records" title={t('progress.section.personalRecords')}>
        {recent.length ? (
          <ul className="record-list">
            {recent.map((record) => (
              <li key={`${record.exerciseId}-${record.date}`}>
                <div>
                  <strong>{nameFor(record.exerciseId)}</strong>
                  <small>{formatShortDate(language, record.date)}</small>
                </div>
                <div className="chip-row">
                  {record.badges.map((badge) => (
                    <span key={badge} className="record-badge">
                      <span className="chip">{t(RECORD_LABELS[badge])}</span>
                      <details className="record-help">
                        <summary aria-label={t('progress.records.explain', { label: t(RECORD_LABELS[badge]) })} title={t(RECORD_TOOLTIPS[badge])}>ⓘ</summary>
                        <span className="record-help-text" role="tooltip">{t(RECORD_TOOLTIPS[badge])}</span>
                      </details>
                    </span>
                  ))}
                </div>
                <div className="record-delete-actions">
                  {entries
                    .filter((entry) => entry.exerciseId === record.exerciseId && entry.date.slice(0, 10) === record.date)
                    .map((entry) => <React.Fragment key={entry.id}>{renderDeleteAction(entry)}</React.Fragment>)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">{t('progress.records.empty')}</p>
        )}
      </SectionCard>

      <SectionCard id="weekly-sets" title={t('progress.section.weeklySets')}>
        {rows.length ? (
          <>
            <p className="chart-legend">{formatWeekLabel(week, today, i18n)}</p>
            <ul className="muscle-bars">
              {rows.map((row) => (
                <li key={row.muscleGroup}>
                  <div className="muscle-bar-head">
                    <span>{muscleGroupLabel(row.muscleGroup, i18n)}</span>
                    <small>
                      {t('progress.weeklySets.donePlanned', {
                        done: formatNumber(language, Number(row.done.toFixed(1))),
                        planned: formatNumber(language, Number(row.planned.toFixed(1))),
                        doneWord: t(row.done === 1 ? 'progress.weeklySets.doneWord.one' : 'progress.weeklySets.doneWord.other'),
                        plannedWord: t(row.planned === 1 ? 'progress.weeklySets.plannedWord.one' : 'progress.weeklySets.plannedWord.other'),
                        status: muscleStatus(row, i18n),
                      })}
                    </small>
                  </div>
                  <div
                    className="muscle-bar-track"
                    role="img"
                    aria-label={t('progress.weeklySets.aria', {
                      group: muscleGroupLabel(row.muscleGroup, i18n),
                      done: formatNumber(language, row.done),
                      planned: formatNumber(language, row.planned),
                      setsDoneWord: t(row.done === 1 ? 'progress.weeklySets.setsDoneWord.one' : 'progress.weeklySets.setsDoneWord.other'),
                      plannedWord: t(row.planned === 1 ? 'progress.weeklySets.plannedWord.one' : 'progress.weeklySets.plannedWord.other'),
                      min: formatNumber(language, SETS_RANGE.min),
                      max: formatNumber(language, SETS_RANGE.max),
                    })}
                  >
                    <div className="muscle-range" style={{ left: `${(SETS_RANGE.min / scale) * 100}%`, width: `${((SETS_RANGE.max - SETS_RANGE.min) / scale) * 100}%` }} />
                    <div className="muscle-planned" style={{ left: `${Math.min(row.planned / scale, 1) * 100}%` }} />
                    <div className={`muscle-done ${row.band}`} style={{ width: `${Math.min(row.done / scale, 1) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="chart-legend">{t('progress.weeklySets.legend', {
              min: formatNumber(language, SETS_RANGE.min),
              max: formatNumber(language, SETS_RANGE.max),
            })}</p>
          </>
        ) : (
          <p className="empty-state">{t('progress.weeklySets.empty')}</p>
        )}
      </SectionCard>

      <SectionCard id="block-report" title={t('progress.section.blockReport')}>
        {reports.length ? (
          <ul className="block-reports">
            {reports.map((report) => (
              <li key={report.blockId} className="block-report">
                <div className="section-title-row">
                  <strong>{t('progress.blockReport.itemTitle', {
                    block: t('progress.block.label', { number: report.blockNumber }),
                    method: formatBlockMethod(report.method, i18n),
                  })}</strong>
                  <span className="block-headline">{formatChange(report.medianChangePercent, language)}</span>
                </div>
                {topLifts(report).length ? (
                  <ul className="block-lifts">
                    {topLifts(report).map((lift) => (
                      <li key={`${lift.exerciseId}-${lift.dayType}`}>
                        <span>{t('progress.blockReport.liftLabel', { exercise: nameFor(lift.exerciseId), dayType: lift.dayType })}</span>
                        <strong>{formatChange(lift.changePercent, language)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">{t('progress.blockReport.emptyComparison')}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">{t('progress.blockReport.empty')}</p>
        )}
      </SectionCard>
    </>
  )
}

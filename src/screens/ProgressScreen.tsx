import React, { useEffect, useId, useMemo, useState } from 'react'
import { localIsoDate } from '../lib/dates'
import {
  adherence,
  blockReports,
  personalRecords,
  progressSuggestions,
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
  exercisesWithHistory,
  formatChange,
  formatPercent,
  limitSuggestions,
  muscleRows,
  muscleScale,
  muscleStatus,
  formatWeekLabel,
  recentRecords,
  reportingBlock,
  reportingWeek,
  RECORD_LABELS,
  SETS_RANGE,
  sessionDots,
  suggestionExerciseId,
  topLifts,
  visibleBlockReports,
} from '../progress/viewModel'
import { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import {
  applyWeightTarget,
  fetchTrainingBlocks,
  getExerciseDisplayName,
  loadWeightTargets,
  removeWeightTarget,
} from '../utils/storage'
import { baseWeightFromHistory } from '../utils/weightTargets'

type Props = {
  entries: WorkoutEntry[]
  exercises: Exercise[]
  initialExerciseId?: string
  onOpenExercise: (exerciseId: string) => void
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function SectionCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="card progress-section">
      <div className="section-title-row">
        <h3>{title}</h3>
        <button
          type="button"
          className="toggle-button expand-toggle"
          aria-expanded={open}
          aria-controls={`progress-${id}`}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
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
          <text x={left - 4} y={tick.y + 3} textAnchor="end" className="chart-label">{tick.value}</text>
        </g>
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

export default function ProgressScreen({ entries, exercises, initialExerciseId, onOpenExercise }: Props) {
  const [blocks, setBlocks] = useState<TrainingBlock[] | null>(null)
  const [dayType, setDayType] = useState<DayTypeFilter>('A')
  const [pickedId, setPickedId] = useState(initialExerciseId ?? '')
  const [targets, setTargets] = useState(() => loadWeightTargets())
  const today = localIsoDate()

  useEffect(() => {
    let cancelled = false
    void fetchTrainingBlocks().then((loaded) => {
      if (!cancelled) setBlocks(loaded)
    }).catch(() => {
      if (!cancelled) setBlocks([])
    })
    return () => {
      cancelled = true
    }
  }, [])

  const data = useMemo(() => {
    if (!blocks) return null
    const suggestions = limitSuggestions(progressSuggestions(entries, blocks, exercises, today, new Set(Object.keys(targets))))
    const week = reportingWeek(entries, today)
    const adherenceReport = adherence(entries, blocks, week)
    const records = personalRecords(entries, blocks)
    const reports = visibleBlockReports(blockReports(entries, blocks, exercises), entries, blocks)
    const weekly = weeklySets(entries, blocks, exercises, week)
    const options = exercisesWithHistory(entries, exercises)
    const consistencyBlock = reportingBlock(blocks, entries, today)
    return { week, consistencyBlock, suggestions, adherenceReport, records, reports, weekly, options }
  }, [blocks, entries, exercises, today, targets])

  if (!blocks || !data) {
    return <section className="card" aria-live="polite"><p className="empty-state">Loading progress…</p></section>
  }

  const { week, consistencyBlock, suggestions, adherenceReport, records, reports, weekly, options } = data
  const nameFor = (id: string) => {
    const exercise = exercises.find((item) => item.id === id)
    return exercise ? getExerciseDisplayName(exercise) : id
  }
  const selectedId = options.some((exercise) => exercise.id === pickedId)
    ? pickedId
    : defaultExerciseId(entries, exercises, blocks, today)
  const trend = selectedId ? strengthTrend(entries, blocks, selectedId, today, dayType, exercises) : null
  const recordDates = new Set(
    records.filter((record) => record.exerciseId === selectedId && record.badges.length > 0).map((record) => record.date)
  )
  const chart = trend ? buildChartModel(trend.points, blocks, recordDates) : null
    const blockAdherence = blockAdherenceFor(adherenceReport, consistencyBlock?.id)
  const dots = sessionDots(adherenceReport)
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
      <SectionCard id="suggestions" title="Suggestions">
        {suggestions.length || appliedTargets.length ? (
          <ul className="progress-suggestions">
            {appliedTargets.map(([exerciseId, target]) => (
              <li key={`applied-${exerciseId}`} className="suggestion-actions">
                <div className="suggestion-button static">
                  <span className="suggestion-tag add-weight">Add weight</span>
                  <span>
                    {nameFor(exerciseId)}: Applied ✓ · next {target.dayType ? `${target.dayType} day` : 'session'} (+{target.increaseKg} kg)
                  </span>
                </div>
                <button type="button" className="suggestion-action-button" onClick={() => setTargets(removeWeightTarget(exerciseId))}>
                  Undo
                </button>
              </li>
            ))}
            {suggestions.map((suggestion, index) => {
              const exerciseId = suggestionExerciseId(suggestion)
              return (
                <li key={`${suggestion.type}-${exerciseId ?? 'all'}-${index}`} className={suggestion.type === 'add-weight' ? 'suggestion-actions' : undefined}>
                  {exerciseId ? (
                    <button type="button" className="suggestion-button" onClick={() => openSuggestion(suggestion)}>
                      <span className={`suggestion-tag ${suggestion.type}`}>
                        {suggestion.type === 'add-weight' ? 'Add weight' : 'Plateau'}
                      </span>
                      <span>{suggestion.message}</span>
                    </button>
                  ) : (
                    <div className="suggestion-button static">
                      <span className="suggestion-tag fatigue">Fatigue</span>
                      <span>{suggestion.message}</span>
                    </div>
                  )}
                  {suggestion.type === 'add-weight' && (
                    <button type="button" className="suggestion-action-button" onClick={() => applySuggestion(suggestion)}>
                      Apply
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="empty-state">{hasHistory ? 'No actions right now — keep following the plan.' : 'Log a few sessions to see suggestions.'}</p>
        )}
      </SectionCard>

      <SectionCard id="consistency" title="Consistency">
        {hasHistory && <p className="chart-legend">{formatWeekLabel(week, today)}{consistencyBlock ? ` · Block ${consistencyBlock.number}` : ''}</p>}
        <div className="session-dots" role="img" aria-label={`${adherenceReport.week.sessionsDone} of ${adherenceReport.week.sessionsPlanned} sessions done, ${formatWeekLabel(week, today).toLowerCase()}`}>
          {dots.map((done, index) => (
            <span key={index} className={done ? 'session-dot done' : 'session-dot'} />
          ))}
        </div>
        <div className="summary-grid">
          <div className="metric-card">
            <span>Block adherence</span>
            <strong>
              {blockAdherence
                ? formatPercent(blockAdherence.sessionsDone / blockAdherence.sessionsPlanned)
                : '—'}
            </strong>
          </div>
          <div className="metric-card">
            <span>Reps hit</span>
            <strong>{formatPercent(blockAdherence?.hitRate ?? adherenceReport.week.hitRate)}</strong>
          </div>
        </div>
        {!hasHistory && <p className="empty-state">Log a few sessions to see your consistency.</p>}
      </SectionCard>

      <SectionCard id="strength" title="Strength trend">
        {options.length ? (
          <>
            <label className="field-label" htmlFor="progress-exercise">Exercise</label>
            <select
              id="progress-exercise"
              className="search-input"
              value={selectedId}
              onChange={(event) => setPickedId(event.target.value)}
            >
              {options.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{getExerciseDisplayName(exercise)}</option>
              ))}
            </select>
            <div className="plan-mode-tabs day-toggle" role="group" aria-label="Day type">
              {(['A', 'B', 'all'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={dayType === value ? 'tab-button active' : 'tab-button'}
                  aria-pressed={dayType === value}
                  onClick={() => setDayType(value)}
                >
                  {value === 'all' ? 'All' : value}
                </button>
              ))}
            </div>
            {trend && chart && trend.points.length > 0 ? (
              <>
                <StrengthChart
                  model={chart}
                  title={`Estimated 1RM per session — ${nameFor(selectedId)} (${dayType === 'all' ? 'all days' : `${dayType} days`})`}
                  summary={chartSummary(trend.points, trend.takeaway)}
                />
                <p className="trend-takeaway">{trend.takeaway}</p>
                <p className="chart-legend"><span className="chart-point record legend-dot" /> Personal record · shaded bands are training blocks</p>
              </>
            ) : (
              <p className="empty-state">
                {dayType === 'all' ? 'Log a few sessions to see your trend.' : `No ${dayType}-day sessions yet. Try another toggle or log a few sessions to see your trend.`}
              </p>
            )}
          </>
        ) : (
          <p className="empty-state">Log a few sessions to see your trend.</p>
        )}
        {selectedId && (
          <button type="button" className="secondary-button" onClick={() => onOpenExercise(selectedId)}>
            Open exercise
          </button>
        )}
      </SectionCard>

      <SectionCard id="records" title="Personal records">
        {recent.length ? (
          <ul className="record-list">
            {recent.map((record) => (
              <li key={`${record.exerciseId}-${record.date}`}>
                <div>
                  <strong>{nameFor(record.exerciseId)}</strong>
                  <small>{formatDate(record.date)}</small>
                </div>
                <div className="chip-row">
                  {record.badges.map((badge) => <span key={badge} className="chip">{RECORD_LABELS[badge]}</span>)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">Personal records appear once you have logged a few sessions of a lift.</p>
        )}
      </SectionCard>

      <SectionCard id="weekly-sets" title="Weekly sets by muscle">
        {rows.length ? (
          <>
            <p className="chart-legend">{formatWeekLabel(week, today)}</p>
            <ul className="muscle-bars">
              {rows.map((row) => (
                <li key={row.muscleGroup}>
                  <div className="muscle-bar-head">
                    <span>{row.muscleGroup}</span>
                    <small>{Number(row.done.toFixed(1))} done / {Number(row.planned.toFixed(1))} planned · {muscleStatus(row)}</small>
                  </div>
                  <div
                    className="muscle-bar-track"
                    role="img"
                    aria-label={`${row.muscleGroup}: ${row.done} sets done, ${row.planned} planned, recommended ${SETS_RANGE.min} to ${SETS_RANGE.max}`}
                  >
                    <div className="muscle-range" style={{ left: `${(SETS_RANGE.min / scale) * 100}%`, width: `${((SETS_RANGE.max - SETS_RANGE.min) / scale) * 100}%` }} />
                    <div className="muscle-planned" style={{ left: `${Math.min(row.planned / scale, 1) * 100}%` }} />
                    <div className={`muscle-done ${row.band}`} style={{ width: `${Math.min(row.done / scale, 1) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="chart-legend">Shaded band = {SETS_RANGE.min}–{SETS_RANGE.max} sets per week. Marker = planned.</p>
          </>
        ) : (
          <p className="empty-state">Log a few sessions to see your weekly sets.</p>
        )}
      </SectionCard>

      <SectionCard id="block-report" title="Block report card">
        {reports.length ? (
          <ul className="block-reports">
            {reports.map((report) => (
              <li key={report.blockId} className="block-report">
                <div className="section-title-row">
                  <strong>Block {report.blockNumber} · {report.method}</strong>
                  <span className="block-headline">{formatChange(report.medianChangePercent)}</span>
                </div>
                {topLifts(report).length ? (
                  <ul className="block-lifts">
                    {topLifts(report).map((lift) => (
                      <li key={`${lift.exerciseId}-${lift.dayType}`}>
                        <span>{nameFor(lift.exerciseId)} ({lift.dayType})</span>
                        <strong>{formatChange(lift.changePercent)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">Not enough sessions yet to compare start and end of this block.</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">Log a few sessions to see your block report.</p>
        )}
      </SectionCard>
    </>
  )
}

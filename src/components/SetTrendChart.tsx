import React, { useEffect, useRef, useState } from 'react'
import { formatNumber, formatShortDate, Language, Translate } from '../i18n'
import type { WorkoutTrendSession } from '../progress/workoutInsights'

const SET_COLORS = ['#f58a9b', '#e36d83', '#c94f69', '#a83d57', '#803047']
const PLOT_TOP = 28
const BASELINE = 94
const WEIGHT_ROW = 110
const PLOT_HEIGHT = BASELINE - PLOT_TOP
const GROUP_WIDTH = 100
const GROUP_LEFT = 38
/** The reps axis sits in its own column that never scrolls (PO 2026-11-14: scrolling hid the numbers). */
const AXIS_WIDTH = 30
const PLOT_PAD = 4

function tickStep(maximum: number) {
  return [5, 10, 15, 20, 25, 50].find((step) => Math.ceil(maximum / step) <= 4) ?? 50
}

function formatWeight(value: number, language: Language) {
  return `${formatNumber(language, value)} kg`
}

/** Rough width of an 11 px tabular-number label (digits ~6 px, separators ~3 px), to decide whether per-set loads fit. */
function labelWidth(text: string) {
  return [...text].reduce((width, char) => width + (/\d/.test(char) ? 6.6 : 3.3), 0)
}

/**
 * Scroll position (and the plot width that allows it) for the scrolling plot beside the fixed axis: it shows the
 * newest group in full and starts the visible area on a whole group, so the first column is never cut in half.
 */
export function alignedTrendScroll(groupCount: number, viewportWidth: number) {
  const contentWidth = groupCount * GROUP_WIDTH + PLOT_PAD * 2
  if (!viewportWidth || contentWidth <= viewportWidth) return { scroll: 0, width: Math.max(contentWidth, viewportWidth) }
  const visibleGroups = Math.max(1, Math.floor((viewportWidth - PLOT_PAD) / GROUP_WIDTH))
  const scroll = (groupCount - visibleGroups) * GROUP_WIDTH
  return { scroll, width: Math.max(contentWidth, scroll + viewportWidth) }
}

export default function SetTrendChart({
  sessions: rawSessions,
  language,
  t,
}: {
  sessions: WorkoutTrendSession[]
  language: Language
  t: Translate
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const allSets = rawSessions.flatMap((session) => session.sets)
  const hasLogged = allSets.some((set) => set.logged)
  const hasLoad = allSets.some((set) => set.weight > 0)
  // PO 2026-11-09 (option A): bars are reps, the plan's rep goal is shaded behind each bar and the load is written below.
  const sessions = hasLoad
    ? rawSessions.map((session) => ({ ...session, sets: session.sets.filter((set) => set.logged || set.weight > 0) }))
    : rawSessions
  // A set still to do is drawn at its goal; a logged one at what was done.
  const barReps = (set: WorkoutTrendSession['sets'][number]) => set.logged ? set.reps : set.targetReps ?? set.reps
  const values = sessions.flatMap((session) => session.sets.flatMap((set) => [barReps(set), set.targetReps ?? 0]))
  const maximum = Math.max(5, ...values)
  const step = tickStep(maximum)
  const axisMaximum = Math.ceil(maximum / step) * step
  const ticks = Array.from({ length: Math.floor(axisMaximum / step) + 1 }, (_, index) => axisMaximum - index * step)
  const [viewportWidth, setViewportWidth] = useState(0)
  const layout = alignedTrendScroll(sessions.length, viewportWidth)
  const width = layout.width
  const groupWidth = GROUP_WIDTH
  const barWidth = 10
  const maxSetCount = Math.max(1, ...sessions.map((session) => session.sets.length))
  // Room for the per-set load under each bar; never wider than the session group.
  const barStep = Math.min(barWidth + 20, (groupWidth - 10) / maxSetCount)
  const hasTargets = allSets.some((set) => set.targetReps)
  const heightOf = (reps: number) => Math.max(1, reps / axisMaximum * PLOT_HEIGHT)
  // "14/15" is wider than a bar slot; it shows only where it fits, otherwise the reps alone in the missed colour.
  const goalLabelFits = (text: string) => [...text].reduce((total, char) => total + (/\d/.test(char) ? 7.2 : 3.6), 0) <= barStep - 1

  useEffect(() => {
    const element = scrollRef.current
    if (element) setViewportWidth(element.clientWidth)
  }, [sessions.length])

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollLeft = layout.scroll
  }, [layout.scroll, width])

  if (!hasLogged && !hasLoad) {
    return (
      <section className="set-trend-chart" aria-label={t('workout.trend.title')}>
        <p className="set-trend-caption set-trend-empty">{t('workout.trend.empty')}</p>
      </section>
    )
  }

  const when = (session: WorkoutTrendSession) => {
    const date = formatShortDate(language, `${session.date}T00:00:00Z`)
    return session.dayType ? `${date} (${session.dayType})` : date
  }
  const setText = (session: WorkoutTrendSession, setIndex: number) => {
    const set = session.sets[setIndex]
    const reps = formatNumber(language, barReps(set))
    const text = hasLoad
      ? t('workout.trend.selected', { when: when(session), set: setIndex + 1, weight: formatNumber(language, set.weight), reps })
      : t('workout.trend.selectedReps', { when: when(session), set: setIndex + 1, reps })
    return set.logged && set.targetReps
      ? `${text} · ${t('workout.trend.goal', { reps: formatNumber(language, set.targetReps) })}`
      : text
  }

  const selectedBar = selected?.split(':')
  const selectedSession = selectedBar ? sessions[Number(selectedBar[0])] : undefined
  const selectedSetIndex = Number(selectedBar?.[1])
  const selectedCaption = selectedSession && selectedSession.sets[selectedSetIndex]
    ? setText(selectedSession, selectedSetIndex)
    : t(hasTargets ? 'workout.trend.fromZeroGoal' : 'workout.trend.fromZeroReps')
  const accessibleSummary = sessions.map((session) => {
    const deload = session.deload ? ` · ${t('workout.trend.deload')}` : ''
    const sets = session.sets.map((set, index) => {
      const reps = formatNumber(language, barReps(set))
      const value = hasLoad
        ? `${formatWeight(set.weight, language)} × ${reps}`
        : t('workout.trend.repsValue', { reps })
      const planned = set.logged ? '' : ` ${t('workout.trend.planned')}`
      const goal = set.logged && set.targetReps ? ` (${t('workout.trend.goal', { reps: formatNumber(language, set.targetReps) })})` : ''
      return `${t('workout.trend.set', { set: index + 1 })} ${value}${planned}${goal}`
    }).join(', ')
    return `${when(session)}${deload}: ${sets}`
  }).join('. ')

  return (
    <section className="set-trend-chart" aria-label={t('workout.trend.title')}>
      <div className="set-trend-plot">
        <svg className="set-trend-axis" width={AXIS_WIDTH} height="150" viewBox={`0 0 ${AXIS_WIDTH} 150`} aria-hidden="true">
          <text className="set-trend-axis-title" x="2" y="10">{t('workout.trend.repsAxis')}</text>
          {ticks.map((value) => (
            <text key={value} className="set-trend-axis-label" x={AXIS_WIDTH - 6} y={BASELINE - value / axisMaximum * PLOT_HEIGHT + 3} textAnchor="end">
              {formatNumber(language, value)}
            </text>
          ))}
        </svg>
      <div className="set-trend-scroll" ref={scrollRef} tabIndex={0} aria-label={t('workout.trend.scroll')}>
        <svg
          width={width}
          height="150"
          viewBox={`0 0 ${width} 150`}
          role="img"
          aria-label={`${t('workout.trend.accessible')}: ${accessibleSummary}`}
        >
          {ticks.map((value) => {
            const y = BASELINE - value / axisMaximum * PLOT_HEIGHT
            return <line key={value} className="set-trend-grid-line" x1="0" x2={width} y1={y} y2={y} />
          })}
          <g transform={`translate(${PLOT_PAD - GROUP_LEFT} 0)`}>
          {sessions.map((session, sessionIndex) => {
            const groupX = GROUP_LEFT + sessionIndex * groupWidth
            const dataWidth = Math.min(groupWidth - 10, maxSetCount * barStep)
            const startX = groupX + (groupWidth - dataWidth) / 2
            const centerX = startX + (session.sets.length - 1) * barStep / 2 + barWidth / 2
            const loads = session.sets.map((set) => set.weight)
            const uniformWeight = loads.every((weight) => weight === loads[0])
            const perSetLoads = !uniformWeight &&
              loads.every((weight) => labelWidth(formatNumber(language, weight)) <= barStep - 5)
            const loadRange = `${formatNumber(language, Math.min(...loads))}–${formatWeight(Math.max(...loads), language)}`
            return (
              <g key={`${session.date}-${sessionIndex}`}>
                {session.today && (
                  <rect className="set-trend-today-outline" x={groupX + 2} y="18" width={groupWidth - 5} height="126" rx="8" />
                )}
                {session.sets.map((set, setIndex) => {
                  const height = heightOf(barReps(set))
                  const x = startX + setIndex * barStep
                  const y = BASELINE - height
                  const goalY = set.targetReps ? BASELINE - heightOf(set.targetReps) : null
                  const missed = set.logged && set.targetReps !== undefined && set.reps < set.targetReps
                  const key = `${sessionIndex}:${setIndex}`
                  const color = SET_COLORS[Math.min(setIndex, SET_COLORS.length - 1)]
                  const label = setText(session, setIndex)
                  return (
                    <g key={key} onClick={() => setSelected(key)}>
                      {goalY !== null && set.logged && (
                        <rect className="set-trend-goal" x={x} y={goalY} width={barWidth} height={BASELINE - goalY} rx="2" />
                      )}
                      <text
                        className={missed ? 'set-trend-reps-label missed' : 'set-trend-reps-label'}
                        x={x + barWidth / 2}
                        y={Math.max(12, Math.min(y, goalY ?? y) - 5)}
                        textAnchor="middle"
                      >
                        {missed && goalLabelFits(`${set.reps}/${set.targetReps}`)
                          ? `${formatNumber(language, set.reps)}/${formatNumber(language, set.targetReps ?? 0)}`
                          : formatNumber(language, barReps(set))}
                      </text>
                      <rect
                        className={[
                          'set-trend-bar',
                          set.logged ? '' : 'ghost',
                          session.deload ? 'deload' : '',
                        ].filter(Boolean).join(' ')}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="2"
                        fill={set.logged && !session.deload ? color : 'transparent'}
                        stroke={color}
                        strokeDasharray={!set.logged || session.deload ? '3 2' : undefined}
                      >
                        <title>{label}</title>
                      </rect>
                      {perSetLoads && (
                        <text className="set-trend-weight-label per-set" x={x + barWidth / 2} y={WEIGHT_ROW} textAnchor="middle">
                          {formatNumber(language, set.weight)}
                        </text>
                      )}
                    </g>
                  )
                })}
                {hasLoad && session.sets.length > 0 && !perSetLoads && (
                  <text className="set-trend-weight-label" x={centerX} y={WEIGHT_ROW} textAnchor="middle">
                    {uniformWeight ? formatWeight(loads[0], language) : loadRange}
                  </text>
                )}
                <text className="set-trend-date" x={groupX + groupWidth / 2} y="127" textAnchor="middle">
                  {formatShortDate(language, `${session.date}T00:00:00Z`)}
                </text>
                <text className="set-trend-day" x={groupX + groupWidth / 2} y="140" textAnchor="middle">
                  {session.deload ? t('workout.trend.deload') : session.dayType ?? ''}
                </text>
              </g>
            )
          })}
          </g>
        </svg>
      </div>
      </div>
      <div className="set-trend-legend" aria-hidden="true">
        {Array.from({ length: maxSetCount }, (_, index) => (
          <span key={index}><i style={{ background: SET_COLORS[Math.min(index, SET_COLORS.length - 1)] }} />{t('workout.trend.set', { set: index + 1 })}</span>
        ))}
        {hasTargets && <span><i className="set-trend-goal-swatch" />{t('workout.trend.goalLegend')}</span>}
      </div>
      <p className="set-trend-caption" aria-live="polite">{selectedCaption}</p>
    </section>
  )
}

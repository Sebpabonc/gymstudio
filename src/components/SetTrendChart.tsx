import React, { useEffect, useRef, useState } from 'react'
import { formatNumber, formatShortDate, Language, Translate } from '../i18n'
import type { WorkoutTrendSession } from '../progress/workoutInsights'

const SET_COLORS = ['#f58a9b', '#e36d83', '#c94f69', '#a83d57', '#803047']
const PLOT_TOP = 28
const BASELINE = 94
const PLOT_HEIGHT = BASELINE - PLOT_TOP
const GROUP_WIDTH = 92
const GROUP_LEFT = 38

function tickStep(maximum: number) {
  return [5, 10, 15, 20, 25, 50].find((step) => Math.ceil(maximum / step) <= 4) ?? 50
}

function formatWeight(value: number, language: Language) {
  return `${formatNumber(language, value)} kg`
}

/**
 * Scroll position (and the chart width that allows it) that shows the newest group in full
 * and starts the visible area on a whole group, so the first column is never cut in half.
 */
export function alignedTrendScroll(groupCount: number, viewportWidth: number) {
  const contentWidth = Math.max(280, groupCount * GROUP_WIDTH + 34)
  if (!viewportWidth || contentWidth <= viewportWidth) return { scroll: 0, width: contentWidth }
  const visibleGroups = Math.max(1, Math.floor((viewportWidth - 2) / GROUP_WIDTH))
  if (visibleGroups >= groupCount) return { scroll: contentWidth - viewportWidth, width: contentWidth }
  const scroll = GROUP_LEFT + (groupCount - visibleGroups) * GROUP_WIDTH - 4
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
  // Bodyweight (or not-yet-loaded) history is charted in reps; a kg axis is only drawn when some set has load.
  const metric: 'kg' | 'reps' = allSets.some((set) => set.weight > 0) ? 'kg' : 'reps'
  const sessions = metric === 'kg'
    ? rawSessions.map((session) => ({ ...session, sets: session.sets.filter((set) => set.logged || set.weight > 0) }))
    : rawSessions
  const valueOf = (set: WorkoutTrendSession['sets'][number]) => metric === 'kg' ? set.weight : set.reps
  const values = sessions.flatMap((session) => session.sets.map(valueOf))
  const maximum = Math.max(5, ...values)
  const step = tickStep(maximum)
  const axisMaximum = Math.ceil(maximum / step) * step
  const [viewportWidth, setViewportWidth] = useState(0)
  const layout = alignedTrendScroll(sessions.length, viewportWidth)
  const width = layout.width
  const groupWidth = GROUP_WIDTH
  const barWidth = 10
  const maxSetCount = Math.max(1, ...sessions.map((session) => session.sets.length))

  useEffect(() => {
    const element = scrollRef.current
    if (element) setViewportWidth(element.clientWidth)
  }, [sessions.length])

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollLeft = layout.scroll
  }, [layout.scroll, width])

  if (!hasLogged && metric === 'reps') {
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
    return metric === 'kg'
      ? t('workout.trend.selected', {
          when: when(session),
          set: setIndex + 1,
          weight: formatNumber(language, set.weight),
          reps: formatNumber(language, set.reps),
        })
      : t('workout.trend.selectedReps', {
          when: when(session),
          set: setIndex + 1,
          reps: formatNumber(language, set.reps),
        })
  }

  const selectedBar = selected?.split(':')
  const selectedSession = selectedBar ? sessions[Number(selectedBar[0])] : undefined
  const selectedSetIndex = Number(selectedBar?.[1])
  const selectedCaption = selectedSession && selectedSession.sets[selectedSetIndex]
    ? setText(selectedSession, selectedSetIndex)
    : t(metric === 'kg' ? 'workout.trend.fromZero' : 'workout.trend.fromZeroReps')
  const accessibleSummary = sessions.map((session) => {
    const deload = session.deload ? ` · ${t('workout.trend.deload')}` : ''
    const sets = session.sets.map((set, index) => {
      const value = metric === 'kg'
        ? `${formatWeight(set.weight, language)} × ${formatNumber(language, set.reps)}`
        : t('workout.trend.repsValue', { reps: formatNumber(language, set.reps) })
      const planned = set.logged ? '' : ` ${t('workout.trend.planned')}`
      return `${t('workout.trend.set', { set: index + 1 })} ${value}${planned}`
    }).join(', ')
    return `${when(session)}${deload}: ${sets}`
  }).join('. ')

  return (
    <section className="set-trend-chart" aria-label={t('workout.trend.title')}>
      <div className="set-trend-scroll" ref={scrollRef} tabIndex={0} aria-label={t('workout.trend.scroll')}>
        <svg
          width={width}
          height="132"
          viewBox={`0 0 ${width} 132`}
          role="img"
          aria-label={`${t('workout.trend.accessible')}: ${accessibleSummary}`}
        >
          <text className="set-trend-axis-title" x="2" y="10">{metric === 'kg' ? 'kg' : t('workout.trend.repsAxis')}</text>
          {Array.from({ length: Math.floor(axisMaximum / step) + 1 }, (_, index) => {
            const value = axisMaximum - index * step
            const y = BASELINE - value / axisMaximum * PLOT_HEIGHT
            return (
              <g key={value}>
                <text className="set-trend-axis-label" x="26" y={y + 3} textAnchor="end">{formatNumber(language, value)}</text>
                <line className="set-trend-grid-line" x1="31" x2={width} y1={y} y2={y} />
              </g>
            )
          })}
          {sessions.map((session, sessionIndex) => {
            const groupX = GROUP_LEFT + sessionIndex * groupWidth
            const dataWidth = Math.min(groupWidth - 10, maxSetCount * (barWidth + 3))
            const startX = groupX + (groupWidth - dataWidth) / 2
            const uniformWeight = metric === 'kg' && session.sets.length > 0 &&
              session.sets.every((set) => set.weight === session.sets[0].weight)
            return (
              <g key={`${session.date}-${sessionIndex}`}>
                {session.today && (
                  <rect className="set-trend-today-outline" x={groupX + 2} y="18" width={groupWidth - 5} height="108" rx="8" />
                )}
                {session.sets.map((set, setIndex) => {
                  const height = Math.max(1, valueOf(set) / axisMaximum * PLOT_HEIGHT)
                  const x = startX + setIndex * (barWidth + 3)
                  const y = BASELINE - height
                  const key = `${sessionIndex}:${setIndex}`
                  const weightLabelX = uniformWeight
                    ? startX + (session.sets.length - 1) * (barWidth + 3) / 2 + barWidth / 2
                    : x + barWidth / 2
                  const weightLabelY = Math.max(14, y - 15)
                  const label = setText(session, setIndex)
                  return (
                    <g key={key} onClick={() => setSelected(key)}>
                      {metric === 'kg' && (!uniformWeight || setIndex === 0) && (
                        <text
                          className="set-trend-weight-label"
                          x={weightLabelX}
                          y={weightLabelY}
                          textAnchor={uniformWeight ? 'middle' : 'start'}
                          transform={uniformWeight ? undefined : `rotate(-45 ${weightLabelX} ${weightLabelY})`}
                        >
                          {formatNumber(language, set.weight)}
                        </text>
                      )}
                      <text className="set-trend-reps-label" x={x + barWidth / 2} y={Math.max(23, y - 5)} textAnchor="middle">
                        {formatNumber(language, set.reps)}
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
                        fill={set.logged && !session.deload ? SET_COLORS[Math.min(setIndex, SET_COLORS.length - 1)] : 'transparent'}
                        stroke={SET_COLORS[Math.min(setIndex, SET_COLORS.length - 1)]}
                        strokeDasharray={!set.logged || session.deload ? '3 2' : undefined}
                      >
                        <title>{label}</title>
                      </rect>
                    </g>
                  )
                })}
                <text className="set-trend-date" x={groupX + groupWidth / 2} y="108" textAnchor="middle">
                  {formatShortDate(language, `${session.date}T00:00:00Z`)}
                </text>
                <text className="set-trend-day" x={groupX + groupWidth / 2} y="120" textAnchor="middle">
                  {session.deload ? t('workout.trend.deload') : session.dayType ?? ''}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="set-trend-legend" aria-hidden="true">
        {Array.from({ length: maxSetCount }, (_, index) => (
          <span key={index}><i style={{ background: SET_COLORS[Math.min(index, SET_COLORS.length - 1)] }} />{t('workout.trend.set', { set: index + 1 })}</span>
        ))}
      </div>
      <p className="set-trend-caption" aria-live="polite">{selectedCaption}</p>
    </section>
  )
}

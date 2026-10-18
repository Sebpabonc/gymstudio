import React, { useEffect, useRef, useState } from 'react'
import { formatNumber, formatShortDate, Language, Translate } from '../i18n'
import type { WorkoutTrendSession } from '../progress/workoutInsights'

const SET_COLORS = ['#f58a9b', '#e36d83', '#c94f69', '#a83d57', '#803047']
const PLOT_TOP = 28
const BASELINE = 94
const PLOT_HEIGHT = BASELINE - PLOT_TOP

function tickStep(maximum: number) {
  return [5, 10, 15, 20, 25, 50].find((step) => Math.ceil(maximum / step) <= 4) ?? 50
}

function formatWeight(value: number, language: Language) {
  return `${formatNumber(language, value)} kg`
}

export default function SetTrendChart({
  sessions,
  language,
  t,
}: {
  sessions: WorkoutTrendSession[]
  language: Language
  t: Translate
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const values = sessions.flatMap((session) => session.sets.map((set) => set.weight))
  const maximum = Math.max(5, ...values)
  const step = tickStep(maximum)
  const axisMaximum = Math.ceil(maximum / step) * step
  const width = Math.max(280, sessions.length * 92 + 34)
  const groupWidth = 92
  const barWidth = 10
  const maxSetCount = Math.max(1, ...sessions.map((session) => session.sets.length))

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollLeft = element.scrollWidth
  }, [sessions.length])

  const selectedBar = selected?.split(':')
  const selectedSession = selectedBar ? sessions[Number(selectedBar[0])] : undefined
  const selectedSet = selectedSession && selectedBar ? selectedSession.sets[Number(selectedBar[1])] : undefined
  const selectedCaption = selectedSession && selectedSet
    ? t('workout.trend.selected', {
        date: formatShortDate(language, `${selectedSession.date}T00:00:00Z`),
        day: selectedSession.dayType ?? '',
        set: Number(selectedBar?.[1]) + 1,
        weight: formatNumber(language, selectedSet.weight),
        reps: formatNumber(language, selectedSet.reps),
      })
    : t('workout.trend.fromZero')
  const accessibleSummary = sessions.map((session) => {
    const date = formatShortDate(language, `${session.date}T00:00:00Z`)
    const deload = session.deload ? ` · ${t('workout.trend.deload')}` : ''
    const sets = session.sets.map((set, index) =>
      `${t('workout.trend.set', { set: index + 1 })} ${formatWeight(set.weight, language)} × ${formatNumber(language, set.reps)}${set.logged ? '' : ' target'}`
    ).join(', ')
    return `${date} ${session.dayType ?? ''}${deload}: ${sets}`
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
          <text className="set-trend-axis-title" x="2" y="10">kg</text>
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
            const groupX = 38 + sessionIndex * groupWidth
            const dataWidth = Math.min(groupWidth - 10, maxSetCount * (barWidth + 3))
            const startX = groupX + (groupWidth - dataWidth) / 2
            const uniformWeight = session.sets.length > 0 &&
              session.sets.every((set) => set.weight === session.sets[0].weight)
            return (
              <g key={`${session.date}-${sessionIndex}`}>
                {session.today && (
                  <rect className="set-trend-today-outline" x={groupX + 2} y="18" width={groupWidth - 5} height="99" rx="8" />
                )}
                {session.sets.map((set, setIndex) => {
                  const height = Math.max(1, set.weight / axisMaximum * PLOT_HEIGHT)
                  const x = startX + setIndex * (barWidth + 3)
                  const y = BASELINE - height
                  const key = `${sessionIndex}:${setIndex}`
                  const weightLabelX = uniformWeight
                    ? startX + (session.sets.length - 1) * (barWidth + 3) / 2 + barWidth / 2
                    : x + barWidth / 2
                  const weightLabelY = Math.max(14, y - 15)
                  const onSelect = () => setSelected(key)
                  return (
                    <g key={key} onClick={onSelect} onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelect()
                      }
                    }}>
                      {(!uniformWeight || setIndex === 0) && (
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
                        role="button"
                        tabIndex={0}
                        aria-label={t('workout.trend.selected', {
                          date: formatShortDate(language, `${session.date}T00:00:00Z`),
                          day: session.dayType ?? '',
                          set: setIndex + 1,
                          weight: formatNumber(language, set.weight),
                          reps: formatNumber(language, set.reps),
                        })}
                      >
                        <title>{t('workout.trend.selected', {
                          date: formatShortDate(language, `${session.date}T00:00:00Z`),
                          day: session.dayType ?? '',
                          set: setIndex + 1,
                          weight: formatNumber(language, set.weight),
                          reps: formatNumber(language, set.reps),
                        })}</title>
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
      <div className="set-trend-legend" aria-label={t('workout.trend.legend')}>
        {Array.from({ length: maxSetCount }, (_, index) => (
          <span key={index}><i style={{ background: SET_COLORS[Math.min(index, SET_COLORS.length - 1)] }} />{t('workout.trend.set', { set: index + 1 })}</span>
        ))}
      </div>
      <p className="set-trend-caption" aria-live="polite">{selectedCaption}</p>
      <p className="visually-hidden">{t('workout.trend.accessible')}: {accessibleSummary}</p>
    </section>
  )
}

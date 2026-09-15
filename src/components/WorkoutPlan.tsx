import React, { useMemo, useState } from 'react'
import { PlanExercise, WeeklyProgressEntry, workoutPhases } from '../data/workoutPlan'

type ExerciseLogInput = {
  reps: number
  weight: number
}

function parseRepValue(reps: string): number {
  if (!reps) return 0

  const match = `${reps}`.match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function buildExerciseInputMap() {
  const map: Record<string, ExerciseLogInput> = {}

  workoutPhases.forEach((phase) => {
    phase.groups.forEach((group) => {
      group.exercises.forEach((exercise) => {
        const key = `${phase.label}-${group.name}-${exercise.code}`
        const progress = buildMockProgress(exercise)
        const latest = progress[progress.length - 1]?.value ?? 0
        map[key] = {
          reps: parseRepValue(exercise.reps),
          weight: latest,
        }
      })
    })
  })

  return map
}

function buildMockProgress(exercise: PlanExercise): WeeklyProgressEntry[] {
  if (exercise.progress && exercise.progress.length) return exercise.progress

  const base = Number(exercise.sets) || 4
  const seed = exercise.name.length % 5
  const values = [
    Math.max(8, base * 6 + seed + 4),
    Math.max(10, base * 7 + seed + 6),
    Math.max(12, base * 8 + seed + 8),
    Math.max(14, base * 9 + seed + 10),
    Math.max(16, base * 10 + seed + 12),
  ]

  return values.map((value, index) => ({
    week: `W${index + 1}`,
    value,
  }))
}

function buildProgressMap() {
  const map: Record<string, WeeklyProgressEntry[]> = {}

  workoutPhases.forEach((phase) => {
    phase.groups.forEach((group) => {
      group.exercises.forEach((exercise) => {
        const key = `${phase.label}-${group.name}-${exercise.code}`
        map[key] = buildMockProgress(exercise)
      })
    })
  })

  return map
}

export default function WorkoutPlan() {
  const [selectedPhase, setSelectedPhase] = useState(workoutPhases[0].label)
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, WeeklyProgressEntry[]>>(buildProgressMap)
  const [exerciseInputs, setExerciseInputs] = useState<Record<string, ExerciseLogInput>>(buildExerciseInputMap)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const activePhase = workoutPhases.find((phase) => phase.label === selectedPhase) ?? workoutPhases[0]

  const toggleGroup = (key: string) => {
    setCollapsedGroups((cur) => ({ ...cur, [key]: !cur[key] }))
  }

  const allCollapsedForPhase = activePhase.groups.every((g) => !!collapsedGroups[`${activePhase.label}-${g.name}`])

  const setAllCollapsed = (flag: boolean) => {
    const next: Record<string, boolean> = {}
    activePhase.groups.forEach((g) => {
      next[`${activePhase.label}-${g.name}`] = flag
    })
    setCollapsedGroups((cur) => ({ ...cur, ...next }))
  }

  const updateExerciseProgress = (key: string, week: string, value: number) => {
    setWeeklyProgress((current) => {
      const next = [...(current[key] ?? [])]
      const existingIndex = next.findIndex((entry) => entry.week === week)

      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], value }
      } else {
        next.push({ week, value })
      }

      return { ...current, [key]: next }
    })
  }

  const updateExerciseInput = (key: string, field: keyof ExerciseLogInput, value: number) => {
    setExerciseInputs((current) => ({
      ...current,
      [key]: {
        reps: current[key]?.reps ?? 0,
        weight: current[key]?.weight ?? 0,
        ...current[key],
        [field]: value,
      },
    }))

    if (field === 'weight') {
      const week = (weeklyProgress[key] ?? []).at(-1)?.week ?? 'W5'
      updateExerciseProgress(key, week, value)
    }
  }

  const phaseTrend = useMemo(() => {
    const allEntries = activePhase.groups.flatMap((group) =>
      group.exercises.map((exercise) => {
        const key = `${activePhase.label}-${group.name}-${exercise.code}`
        return { key, data: weeklyProgress[key] ?? buildMockProgress(exercise) }
      })
    )

    const values = allEntries.flatMap((item) => item.data.map((entry) => entry.value))
    return Math.max(...values, 1)
  }, [activePhase, weeklyProgress])

  function getPhaseDisplayLabel(phase: { label: string; title?: string }) {
    const m = `${phase.label}`.match(/-(\d{1,2})-/)
    const monthIndex = m ? Number(m[1]) : NaN
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = !isNaN(monthIndex) && monthIndex >= 1 && monthIndex <= 12 ? months[monthIndex - 1] : null

    if (month && phase.title) return `${month} ${phase.title}`
    if (phase.title) return phase.title
    return phase.label
  }

  return (
    <div className="card plan-card">
      <h2>Training plan</h2>

      <div className="phase-tabs" aria-label="Workout phases">
        {workoutPhases.map((phase) => (
          <button
            key={phase.label}
            type="button"
            className={phase.label === selectedPhase ? 'phase-tab active' : 'phase-tab'}
            onClick={() => setSelectedPhase(phase.label)}
          >
            {getPhaseDisplayLabel(phase)}
          </button>
        ))}
      </div>

      <div className="phase-header">
        <strong>{activePhase.title}</strong>
        <button
          type="button"
          className="collapse-all-btn"
          onClick={() => setAllCollapsed(!allCollapsedForPhase)}
        >
          {allCollapsedForPhase ? 'Expand all' : 'Collapse all'}
        </button>
      </div>

      <div className="phase-groups">
        {activePhase.groups.map((group) => {
          const groupKey = `${activePhase.label}-${group.name}`
          const collapsed = !!collapsedGroups[groupKey]

          return (
            <div key={group.name} className="phase-group">
              <div className="phase-group-header">
                <h3>{group.name}</h3>
                <button
                  type="button"
                  className={`group-toggle ${collapsed ? 'collapsed' : ''}`}
                  onClick={() => toggleGroup(groupKey)}
                  aria-expanded={!collapsed}
                >
                  <span className="chev">▾</span>
                </button>
              </div>

              {collapsed ? (
                <div className="group-collapsed-summary">{group.exercises.length} exercises</div>
              ) : (
                <div className="plan-cards" aria-label={`${group.name} workout cards`}>
                  {group.exercises.map((exercise) => {
                    const key = `${activePhase.label}-${group.name}-${exercise.code}`
                    const entries = weeklyProgress[key] ?? buildMockProgress(exercise)

                    return (
                      <article key={key} className="plan-card-item">
                        <div className="plan-card-header">
                          <span className="exercise-code">{exercise.code}</span>
                          <span className="exercise-name">{exercise.name}</span>
                        </div>

                        <div className="plan-metrics">
                          <div><label>Sets</label><strong>{exercise.sets}</strong></div>
                          <div><label>Reps</label><strong>{exercise.reps}</strong></div>
                          <div><label>Rest</label><strong>{exercise.rest}</strong></div>
                          <div><label>RPE</label><strong>{exercise.rpe}</strong></div>
                        </div>

                        <div className="trend-panel">
                          <div className="trend-header">
                            <span>Weekly trend</span>
                            <strong>{entries[entries.length - 1]?.value ?? 0}</strong>
                          </div>

                          <div className="trend-chart">
                            <svg className="trend-svg" viewBox="0 0 220 96" preserveAspectRatio="none" aria-label={`${exercise.name} weekly trend`}>
                              <defs>
                                <linearGradient id={`trend-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(0,0,0,0.12)" />
                                  <stop offset="100%" stopColor="rgba(0,0,0,0.02)" />
                                </linearGradient>
                                <linearGradient id={`trend-line-${key}`} x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#222222" />
                                  <stop offset="50%" stopColor="#111111" />
                                  <stop offset="100%" stopColor="#000000" />
                                </linearGradient>
                              </defs>

                              {[20, 42, 64, 86].map((y) => (
                                <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="rgba(26, 26, 24, 0.08)" strokeWidth="1" strokeDasharray="3 4" />
                              ))}

                              {(() => {
                                const values = entries.map((entry) => entry.value)
                                const minValue = Math.min(...values, 0)
                                const maxValue = Math.max(...values, 1)
                                const spread = maxValue - minValue || 1
                                const xStep = values.length > 1 ? 190 / (values.length - 1) : 0

                                const points = entries.map((entry, index) => {
                                  const x = 15 + index * xStep
                                  const y = 82 - ((entry.value - minValue) / spread) * 52
                                  return { x, y, label: entry.week, value: entry.value }
                                })

                                function buildSmoothPath(pts: { x: number; y: number }[]) {
                                  if (!pts.length) return ''
                                  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`

                                  let d = `M ${pts[0].x} ${pts[0].y}`
                                  for (let i = 0; i < pts.length - 1; i++) {
                                    const p0 = pts[i]
                                    const p1 = pts[i + 1]
                                    const p_1 = pts[i - 1] ?? p0
                                    const p2 = pts[i + 2] ?? p1

                                    const cp1x = p0.x + (p1.x - p_1.x) / 6
                                    const cp1y = p0.y + (p1.y - p_1.y) / 6
                                    const cp2x = p1.x - (p2.x - p0.x) / 6
                                    const cp2y = p1.y - (p2.y - p0.y) / 6

                                    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${p1.y}`
                                  }

                                  return d
                                }

                                const linePath = buildSmoothPath(points)

                                return (
                                  <>
                                    <path d={linePath} fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    {points.map((point) => (
                                      <text key={`${key}-${point.label}-label`} x={point.x} y="94" textAnchor="middle" fill="rgba(26,26,24,0.6)" fontSize="8" fontWeight="700">
                                        {point.label}
                                      </text>
                                    ))}
                                  </>
                                )
                              })()}
                            </svg>
                          </div>
                        </div>

                        <div className="progress-update">
                          <label htmlFor={`${key}-value`}>Update {entries[entries.length - 1]?.week ?? 'W1'}</label>

                          <div className="progress-update-grid">
                            <div className="mini-input-block">
                              <span>Reps</span>
                              <input
                                id={`${key}-reps`}
                                type="number"
                                min="0"
                                value={exerciseInputs[key]?.reps ?? parseRepValue(exercise.reps)}
                                onChange={(event) => {
                                  const nextValue = Number(event.target.value) || 0
                                  updateExerciseInput(key, 'reps', nextValue)
                                }}
                              />
                            </div>

                            <div className="mini-input-block">
                              <span>Weight</span>
                              <input
                                id={`${key}-value`}
                                type="number"
                                min="0"
                                value={exerciseInputs[key]?.weight ?? entries[entries.length - 1]?.value ?? 0}
                                onChange={(event) => {
                                  const nextValue = Number(event.target.value) || 0
                                  updateExerciseInput(key, 'weight', nextValue)
                                }}
                              />
                            </div>
                          </div>

                          <div className="entry-summary">
                            {exerciseInputs[key]?.reps ?? parseRepValue(exercise.reps)} reps @ {exerciseInputs[key]?.weight ?? entries[entries.length - 1]?.value ?? 0} kg
                          </div>
                        </div>

                        <div className="plan-week-summary">
                          <span>Week summary</span>
                          <strong>{exercise.weekSummary}</strong>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

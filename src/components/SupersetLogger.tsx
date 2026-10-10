import React, { useEffect, useRef, useState } from 'react'
import { formatNumber, Language, Translate } from '../i18n'
import { WorkoutSet } from '../types'
import { completedSupersetRounds, createSupersetTicks, nextSupersetFocus, toggleSupersetTick } from '../utils/supersetRounds'
import { stepWorkoutValue } from '../utils/workoutSets'

type LoggerExercise = {
  code: string
  name: string
  sets: { weight: number; reps: number }[]
  targets: { weight: number; reps: number }[]
  previousSets: WorkoutSet[]
  restSeconds: number
  actions: React.ReactNode
}

export function SupersetLogger({
  exercises, loggedRounds, groupIndex, current, t, language, error, onChange, onStartRest, onSave,
}: {
  exercises: LoggerExercise[]
  loggedRounds: boolean[]
  groupIndex: number
  current: boolean
  t: Translate
  language: Language
  error?: string
  onChange: (exercise: number, round: number, field: 'weight' | 'reps', value: string) => void
  onStartRest: (seconds: number, label: string) => void
  onSave: (rounds: boolean[], times: Array<number | undefined>) => Promise<void>
}) {
  const counts = exercises.map((exercise) => exercise.sets.length)
  const [ticks, setTicks] = useState(() => createSupersetTicks(counts, loggedRounds))
  const [times, setTimes] = useState<Array<number | undefined>>([])
  const [openRounds, setOpenRounds] = useState<Record<number, boolean>>({})
  const [openActions, setOpenActions] = useState<Record<string, boolean>>({})
  const [handoff, setHandoff] = useState<{ round: number; exercise: number; code: string; endAt: number } | null>(null)
  const [now, setNow] = useState(Date.now)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const pending = useRef(false)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const completed = completedSupersetRounds(ticks)
  const firstIncomplete = completed.findIndex((done) => !done)
  const roundCount = ticks.length
  const currentRound = firstIncomplete < 0 ? roundCount - 1 : firstIncomplete
  const loggedSignature = loggedRounds.map(Number).join(',')

  useEffect(() => {
    setTicks(createSupersetTicks(counts, loggedRounds))
  }, [loggedSignature])

  useEffect(() => {
    if (!handoff) return
    const update = () => {
      const timestamp = Date.now()
      setNow(timestamp)
      if (timestamp >= handoff.endAt) setHandoff(null)
    }
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [handoff])

  const save = async (rounds: boolean[], timestamps: Array<number | undefined>) => {
    if (pending.current) return
    pending.current = true
    setSaving(true)
    setSaveFailed(false)
    try {
      await onSave(rounds, timestamps)
    } catch {
      setSaveFailed(true)
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  const change = (exercise: number, round: number, field: 'weight' | 'reps', value: string) => {
    if (ticks[round][exercise]) {
      setTicks(toggleSupersetTick(ticks, counts, { round, exercise }))
      setTimes((previous) => previous.map((time, index) => index === round ? undefined : time))
    }
    onChange(exercise, round, field, value)
  }

  const tick = (round: number, exercise: number) => {
    const next = toggleSupersetTick(ticks, counts, { round, exercise })
    const rounds = completedSupersetRounds(next)
    const checked = next[round][exercise]
    const timestamp = Date.now()
    const timestamps = [...times]
    timestamps[round] = rounds[round] ? timestamp : undefined
    setTicks(next)
    setTimes(timestamps)
    setHandoff(null)
    if (!checked) return
    const focus = nextSupersetFocus(next, counts, { round, exercise })
    if (rounds[round]) {
      setOpenRounds((previous) => ({ ...previous, [round]: false }))
      const last = exercises.filter((item) => round < item.sets.length).slice(-1)[0]
      onStartRest(last.restSeconds, exercises.map((item) => item.name).join(' + '))
    } else if (focus?.round === round) {
      setNow(timestamp)
      setHandoff({ round, exercise, code: exercises[focus.exercise].code, endAt: timestamp + exercises[exercise].restSeconds * 1000 })
    }
    if (focus) inputs.current.get(`${focus.round}:${focus.exercise}`)?.focus()
    if (rounds.every(Boolean)) void save(rounds, timestamps)
  }

  const pair = (set: { weight: number; reps: number }) =>
    `${formatNumber(language, set.weight)}×${formatNumber(language, set.reps)}`

  return (
    <section
      className={`superset-group superset-workout-card${current ? ' workout-mode-current' : ''}`}
      data-workout-group={groupIndex}
      tabIndex={-1}
      aria-busy={saving}
    >
      <header className="superset-compact-header">
        <strong>{t('workout.technique.superset')} · {exercises.map((item) => item.code).join(' + ')}</strong>
        <span>{firstIncomplete < 0 ? `✓ ${t('workout.status.done')}` : t('workout.superset.roundOf', { round: currentRound + 1, total: roundCount })}</span>
      </header>
      {exercises.map((exercise) => {
        const target = exercise.targets[Math.min(currentRound, exercise.targets.length - 1)]
        return (
          <div className="superset-compact-exercise" key={exercise.code}>
            <div>
              <strong>{exercise.code} · {exercise.name}</strong>
              <p className="workout-mode-target">{t('workout.run.todayTarget', {
                weight: formatNumber(language, target.weight), reps: formatNumber(language, target.reps),
              })}</p>
            </div>
            <details className="superset-exercise-actions" onToggle={(event) => {
              const open = event.currentTarget.open
              setOpenActions((previous) => ({ ...previous, [exercise.code]: open }))
            }}>
              <summary aria-expanded={!!openActions[exercise.code]} aria-label={`${t('workout.run.exerciseActions')} · ${exercise.code}`}>⋯</summary>
              <div className="superset-actions-panel">{exercise.actions}</div>
            </details>
          </div>
        )
      })}
      <p className="superset-compact-instructions">{t('workout.superset.instructions', {
        first: exercises[0].code, others: exercises.slice(1).map((item) => item.code).join(', '),
      })}</p>
      {ticks.map((row, round) => completed[round] && !openRounds[round] ? (
        <button
          type="button"
          className="superset-round-summary"
          key={round}
          aria-expanded={false}
          onClick={() => setOpenRounds((previous) => ({ ...previous, [round]: true }))}
        >
          R{round + 1} ✓ {exercises.map((exercise) => exercise.sets[round] ? pair(exercise.sets[round]) : '—').join(' · ')}
        </button>
      ) : (
        <div className={`superset-workout-round${round === currentRound ? ' current' : ''}${round > currentRound ? ' future' : ''}`} key={round}>
          <strong>{t('workout.round.label', { count: round + 1 })}</strong>
          {exercises.map((exercise, exerciseIndex) => {
            const set = exercise.sets[round]
            const previous = exercise.previousSets[round]
            if (!set) return <div className="superset-unavailable" key={exercise.code}>{exercise.code} · —</div>
            return (
              <div className="superset-cell" key={exercise.code}>
                <div className="superset-cell-inputs">
                  <span>{exercise.code}</span>
                  {(['weight', 'reps'] as const).map((field) => (
                    <div className="set-stepper" key={field}>
                      <button
                        type="button" className="stepper-button" disabled={saving}
                        aria-label={t(field === 'weight' ? 'workout.superset.weightDecrease' : 'workout.superset.repsDecrease', { set: round + 1, code: exercise.code })}
                        onClick={() => change(exerciseIndex, round, field, String(stepWorkoutValue(set[field], -1, field === 'weight' ? 2.5 : 1, field === 'weight' ? 0 : 1)))}
                      >−</button>
                      <input
                        type="number" inputMode={field === 'weight' ? 'decimal' : 'numeric'}
                        min={field === 'weight' ? 0 : 1} step={field === 'weight' ? 2.5 : 1}
                        value={set[field]} disabled={saving}
                        aria-label={t(field === 'weight' ? 'workout.superset.weightLabel' : 'workout.superset.repsLabel', { set: round + 1, code: exercise.code })}
                        ref={field === 'weight' ? (element) => {
                          const key = `${round}:${exerciseIndex}`
                          if (element) inputs.current.set(key, element)
                          else inputs.current.delete(key)
                        } : undefined}
                        onChange={(event) => change(exerciseIndex, round, field, event.target.value)}
                      />
                      <button
                        type="button" className="stepper-button" disabled={saving}
                        aria-label={t(field === 'weight' ? 'workout.superset.weightIncrease' : 'workout.superset.repsIncrease', { set: round + 1, code: exercise.code })}
                        onClick={() => change(exerciseIndex, round, field, String(stepWorkoutValue(set[field], 1, field === 'weight' ? 2.5 : 1, field === 'weight' ? 0 : 1)))}
                      >+</button>
                    </div>
                  ))}
                  <button
                    type="button" className={`complete-set-button${row[exerciseIndex] ? ' checked' : ''}`}
                    aria-pressed={row[exerciseIndex]} disabled={saving}
                    aria-label={t(row[exerciseIndex] ? 'workout.superset.tickUndo' : 'workout.superset.tick', { code: exercise.code, round: round + 1 })}
                    onClick={() => tick(round, exerciseIndex)}
                  >✓</button>
                </div>
                {previous ? (
                  <button
                    type="button" className="superset-last-time" disabled={saving}
                    aria-label={t('workout.superset.copyPrevious', { code: exercise.code, set: round + 1, weight: previous.weight, reps: previous.reps })}
                    onClick={() => {
                      change(exerciseIndex, round, 'weight', String(previous.weight))
                      change(exerciseIndex, round, 'reps', String(previous.reps))
                    }}
                  >{t('workout.run.lastTime')}: {pair(previous)}</button>
                ) : <small className="superset-last-time">{t('workout.run.lastTime')}: —</small>}
                {handoff?.round === round && handoff.exercise === exerciseIndex && (
                  <p className="superset-handoff" role="status" aria-live="polite">
                    {t('workout.superset.handoff', { code: handoff.code, seconds: Math.max(0, Math.ceil((handoff.endAt - now) / 1000)) })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ))}
      {(error || saveFailed) && <p role="alert" className="account-error log-error">{error || t('workout.superset.saveError')}</p>}
      {(firstIncomplete >= 0 || error || saveFailed) && (
        <button type="button" className="primary-button small-button" disabled={saving || !completed.some(Boolean)} onClick={() => void save(completed, times)}>
          {t('workout.superset.finish')}
        </button>
      )}
    </section>
  )
}

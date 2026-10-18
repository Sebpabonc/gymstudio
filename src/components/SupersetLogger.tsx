import React, { useEffect, useRef, useState } from 'react'
import { formatNumber, formatWeekdayDate, Language, Translate } from '../i18n'
import { WorkoutSet } from '../types'
import { RestTimerState } from '../utils/restTimer'
import { completedSupersetRounds, createSupersetTicks, nextSupersetFocus, toggleSupersetTick } from '../utils/supersetRounds'
import { stepWorkoutValue } from '../utils/workoutSets'
import { equipmentStep } from '../trainer/engine'
import { selectOnFocus } from '../utils/numberInput'
import { ShortCue, type SqueezeCueDetails } from './SqueezeCue'
import RestTimer from './RestTimer'

type LoggerExercise = {
  code: string
  name: string
  shortCue?: string
  cueDetails?: SqueezeCueDetails
  techniqueLabel?: string
  planNote?: string
  sets: { weight: number; reps: number }[]
  previousSets: WorkoutSet[]
  previousDate?: string
  equipment?: string
  restSeconds: number
  actions: React.ReactNode
}

export function SupersetLogger({
  exercises, loggedRounds, groupIndex, current, t, language, error, onChange, onStartRest, restBetweenSets, onSave, onRestContext, nextExerciseName, insightActive,
  restTimer, restTimerLabel, onRestTimerChange, onRestUndo,
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
  restBetweenSets: number
  onSave: (rounds: boolean[], times: Array<number | undefined>) => Promise<void>
  onRestContext?: (
    context: { set: number; next: string },
    undo: (() => void) | null
  ) => void
  nextExerciseName?: string
  insightActive?: boolean
  restTimer?: RestTimerState | null
  restTimerLabel?: string
  onRestTimerChange?: (timer: RestTimerState | null) => void
  onRestUndo?: () => void
}) {
  const counts = exercises.map((exercise) => exercise.sets.length)
  const [ticks, setTicks] = useState(() => createSupersetTicks(counts, loggedRounds))
  const [times, setTimes] = useState<Array<number | undefined>>([])
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({})
  const [handoff, setHandoff] = useState<{ round: number; exercise: number; code: string; endAt: number } | null>(null)
  const [now, setNow] = useState(Date.now)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const pending = useRef(false)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const completed = completedSupersetRounds(ticks)
  const firstIncomplete = completed.findIndex((done) => !done)
  const roundCount = ticks.length
  const currentRound = firstIncomplete
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
      const nextRound = rounds.findIndex((done) => !done)
      const nextLabel = nextRound >= 0
        ? `${t('workout.superset.roundOf', {
            round: formatNumber(language, nextRound + 1),
            total: formatNumber(language, roundCount),
          })} · ${exercises.map((item) =>
            `${item.code} ${item.sets[nextRound] ? pair(item.sets[nextRound]) : '—'}`
          ).join(' · ')}`
        : nextExerciseName ?? t('workout.run.finished')
      onRestContext?.(
        { set: round + 1, next: nextLabel },
        rounds.every(Boolean)
          ? null
          : () => {
              setTicks(toggleSupersetTick(next, counts, { round, exercise }))
              setTimes((previous) => previous.map((time, index) => index === round ? undefined : time))
              setHandoff(null)
            }
      )
      onStartRest(restBetweenSets, exercises.map((item) => item.name).join(' + '))
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
      className={`superset-group superset-workout-card${current ? ' workout-mode-current' : ''}${insightActive ? ' has-active-insight' : ''}`}
      data-workout-group={groupIndex}
      tabIndex={-1}
      aria-busy={saving}
    >
      <header className="superset-compact-header">
        <strong>{t('workout.technique.superset')} · {exercises.map((item) => item.code).join(' + ')}</strong>
        <span>{firstIncomplete < 0
          ? `✓ ${t('workout.status.done')}`
          : t('workout.superset.roundOf', {
              round: formatNumber(language, currentRound + 1),
              total: formatNumber(language, roundCount),
            })}</span>
      </header>
      <p className="superset-compact-instructions">{t('workout.superset.instructions', {
        first: exercises[0].code, others: exercises.slice(1).map((item) => item.code).join(', '),
      })}</p>
      {restTimer && onRestTimerChange ? (
        <RestTimer
          timer={restTimer}
          hidden={false}
          onChange={onRestTimerChange}
          workoutMode
          inPlace
          label={restTimerLabel}
          onUndo={onRestUndo}
        />
      ) : ticks.map((row, round) => {
        const roundLabel = t('workout.superset.roundOf', {
          round: formatNumber(language, round + 1),
          total: formatNumber(language, roundCount),
        })
        if (round !== currentRound) {
          return (
            <div className={`superset-round-summary${completed[round] ? ' completed' : ' future'}`} key={round}>
              <span>{completed[round] ? '✓ ' : ''}{roundLabel}</span>
              <span>{exercises.map((exercise) => exercise.sets[round] ? `${exercise.code} ${pair(exercise.sets[round])}` : `${exercise.code} —`).join(' · ')}</span>
            </div>
          )
        }
        return (
          <div className="superset-workout-round current" key={round}>
            <strong>{roundLabel}</strong>
            {exercises.map((exercise, exerciseIndex) => {
              const set = exercise.sets[round]
              if (!set) return null
              const previous = exercise.previousSets[round]
              const weightKey = `${round}:${exerciseIndex}`
              const step = equipmentStep(exercise.equipment)
              return (
                <div className={`superset-workout-exercise${row[exerciseIndex] ? ' completed' : ''}`} key={exercise.code}>
                  <div className="superset-exercise-heading">
                    <span className="superset-round-code">{exercise.code}</span>
                    <strong>{exercise.name}</strong>
                  </div>
                  <p className="superset-last-time">
                    {t('workout.run.lastTime')}: {previous ? `${pair(previous)}${exercise.previousDate
                      ? ` · ${formatWeekdayDate(language, `${exercise.previousDate.slice(0, 10)}T00:00:00Z`)}`
                      : ''}` : '—'}
                  </p>
                  {exercise.shortCue && (
                    <ShortCue label={t('workout.run.squeezeLabel')} cue={exercise.shortCue} details={exercise.cueDetails} id={`superset-${groupIndex}-${exercise.code}-cue`} />
                  )}
                  {(exercise.techniqueLabel || exercise.planNote) && (
                    <p className="workout-mode-plan-note">
                      {exercise.techniqueLabel && <strong>{exercise.techniqueLabel}</strong>}
                      {exercise.techniqueLabel && exercise.planNote ? ' ' : ''}
                      {exercise.planNote}
                    </p>
                  )}
                  <div className="superset-workout-fields">
                    {(['weight', 'reps'] as const).map((field) => (
                      <div className="superset-workout-input" key={field}>
                        <span>{field === 'weight' ? 'kg' : t('workout.label.repsInline')}</span>
                        <div className="set-stepper">
                          <button
                            type="button" className="stepper-button" disabled={saving}
                            aria-label={t(field === 'weight' ? 'workout.superset.weightDecrease' : 'workout.superset.repsDecrease', { set: round + 1, code: exercise.code })}
                            onClick={() => {
                              const next = stepWorkoutValue(set[field], -1, field === 'weight' ? step : 1, field === 'weight' ? 0 : 1)
                              if (field === 'weight') setWeightInputs((previousInputs) => {
                                const { [weightKey]: _removed, ...rest } = previousInputs
                                return rest
                              })
                              change(exerciseIndex, round, field, String(next))
                            }}
                          >−</button>
                          <input
                            type={field === 'weight' ? 'text' : 'number'}
                            inputMode={field === 'weight' ? 'decimal' : 'numeric'}
                            min={field === 'weight' ? 0 : 1} step={field === 'weight' ? step : 1}
                            value={field === 'weight'
                              ? weightInputs[weightKey] ?? formatNumber(language, set.weight, { useGrouping: false })
                              : set.reps}
                            disabled={saving}
                            aria-label={t(field === 'weight' ? 'workout.superset.weightLabel' : 'workout.superset.repsLabel', { set: round + 1, code: exercise.code })}
                            onFocus={selectOnFocus}
                            ref={field === 'weight' ? (element) => {
                              if (element) inputs.current.set(weightKey, element)
                              else inputs.current.delete(weightKey)
                            } : undefined}
                            onChange={(event) => {
                              const value = event.target.value
                              if (field === 'weight') {
                                setWeightInputs((previousInputs) => ({ ...previousInputs, [weightKey]: value }))
                                const numeric = Number(value.replace(',', '.'))
                                if (value.trim() && Number.isFinite(numeric)) change(exerciseIndex, round, field, String(numeric))
                              } else {
                                change(exerciseIndex, round, field, value)
                              }
                            }}
                            onBlur={field === 'weight' ? () => setWeightInputs((previousInputs) => {
                              const { [weightKey]: _removed, ...rest } = previousInputs
                              return rest
                            }) : undefined}
                          />
                          <button
                            type="button" className="stepper-button" disabled={saving}
                            aria-label={t(field === 'weight' ? 'workout.superset.weightIncrease' : 'workout.superset.repsIncrease', { set: round + 1, code: exercise.code })}
                            onClick={() => {
                              const next = stepWorkoutValue(set[field], 1, field === 'weight' ? step : 1, field === 'weight' ? 0 : 1)
                              if (field === 'weight') setWeightInputs((previousInputs) => {
                                const { [weightKey]: _removed, ...rest } = previousInputs
                                return rest
                              })
                              change(exerciseIndex, round, field, String(next))
                            }}
                          >+</button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button" className={`complete-set-button${row[exerciseIndex] ? ' checked' : ''}`}
                      aria-pressed={row[exerciseIndex]} disabled={saving}
                      aria-label={t(row[exerciseIndex] ? 'workout.superset.tickUndo' : 'workout.superset.tick', { code: exercise.code, round: round + 1 })}
                      onClick={() => tick(round, exerciseIndex)}
                    >✓</button>
                  </div>
                  {handoff?.round === round && handoff.exercise === exerciseIndex && (
                    <p className="superset-handoff" role="status" aria-live="polite">
                      {t('workout.superset.handoff', { code: handoff.code, seconds: formatNumber(language, Math.max(0, Math.ceil((handoff.endAt - now) / 1000))) })}
                    </p>
                  )}
                  {exercise.actions}
                </div>
              )
            })}
          </div>
        )
      })}
      {(error || saveFailed) && <p role="alert" className="account-error log-error">{error || t('workout.superset.saveError')}</p>}
      {((firstIncomplete >= 0 && completed.some(Boolean)) || error || saveFailed) && (
        <button type="button" className="primary-button small-button" disabled={saving || !completed.some(Boolean)} onClick={() => void save(completed, times)}>
          {t('workout.superset.finish')}
        </button>
      )}
    </section>
  )
}

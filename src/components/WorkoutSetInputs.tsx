import React, { useEffect, useRef, useState } from 'react'
import { formatNumber, type Language, type Translate } from '../i18n'
import { equipmentStep } from '../trainer/engine'
import type { Exercise } from '../types'
import { cleanNumberInput, selectOnFocus } from '../utils/numberInput'
import { stepWorkoutValue } from '../utils/workoutSets'

export type WorkoutSetInputsProps = {
  /** Zero-based set index, used for accessible labels. */
  setIndex: number
  weight: number
  /** Controlled raw text, including unfinished decimals and comma separators. */
  weightInput: string
  reps: number
  equipment?: Exercise['equipment']
  language: Language
  t: Translate
  repsLabel: string
  weightLabel?: string
  repInputLabel?: string
  /** Saved-set corrections: commit when the field is left, not on every keystroke. */
  commitOnBlur?: boolean
  onWeightInputChange: (raw: string) => void
  onValueChange: (field: 'weight' | 'reps', value: string) => void
}

/** Corrections to a saved set: holds typing locally so half-typed numbers are never saved or carried. */
function BufferedInput({ value, onCommit, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string | number
  onCommit: (raw: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const pending = useRef<string | null>(null)
  const commit = useRef(onCommit)
  commit.current = onCommit
  const flush = () => {
    const raw = pending.current
    pending.current = null
    if (raw?.trim()) commit.current(raw)
  }
  // Tapping a button doesn't blur inputs on iOS, so Close and set changes commit on unmount.
  useEffect(() => flush, [])
  return (
    <input
      {...rest}
      value={draft ?? value}
      onChange={(event) => {
        pending.current = event.target.value
        setDraft(event.target.value)
      }}
      onBlur={() => {
        flush()
        setDraft(null)
      }}
      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
    />
  )
}

export default function WorkoutSetInputs({
  setIndex,
  weight,
  weightInput,
  reps,
  equipment,
  language,
  t,
  repsLabel,
  weightLabel,
  repInputLabel,
  commitOnBlur = false,
  onWeightInputChange,
  onValueChange,
}: WorkoutSetInputsProps) {
  const stepWeight = (direction: -1 | 1) => {
    const value = stepWorkoutValue(weight, direction, equipmentStep(equipment), 0)
    onWeightInputChange(formatNumber(language, value))
    onValueChange('weight', String(value))
  }

  const commitWeight = (raw: string) => {
    onWeightInputChange(raw)
    const numeric = Number(raw.replace(',', '.'))
    onValueChange('weight', raw.trim() && Number.isFinite(numeric) ? String(numeric) : '0')
  }

  return (
    <div className="workout-mode-big-inputs">
      <div className="workout-mode-big-field">
        <span>kg</span>
        <div className="set-stepper">
          <button
            type="button"
            className="stepper-button"
            aria-label={weightLabel ? `${weightLabel} −` : t('workout.set.weightDecrease', { set: setIndex + 1 })}
            onClick={() => stepWeight(-1)}
          >−</button>
          {commitOnBlur ? (
            <BufferedInput
              type="text"
              inputMode="decimal"
              value={weightInput}
              data-log-weight
              aria-label={weightLabel ?? t('workout.set.weightLabel', { set: setIndex + 1 })}
              onFocus={selectOnFocus}
              onCommit={commitWeight}
            />
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={weightInput}
              data-log-weight
              aria-label={weightLabel ?? t('workout.set.weightLabel', { set: setIndex + 1 })}
              onFocus={selectOnFocus}
              onChange={(event) => commitWeight(event.target.value)}
            />
          )}
          <button
            type="button"
            className="stepper-button"
            aria-label={weightLabel ? `${weightLabel} +` : t('workout.set.weightIncrease', { set: setIndex + 1 })}
            onClick={() => stepWeight(1)}
          >+</button>
        </div>
      </div>
      <div className="workout-mode-big-field">
        <span>{repsLabel}</span>
        <div className="set-stepper">
          <button
            type="button"
            className="stepper-button"
            aria-label={repInputLabel ? `${repInputLabel} −` : t('workout.set.repsDecrease', { set: setIndex + 1 })}
            onClick={() => onValueChange('reps', String(stepWorkoutValue(reps, -1, 1, 0)))}
          >−</button>
          {commitOnBlur ? (
            <BufferedInput
              type="number"
              inputMode="numeric"
              min="0"
              value={reps}
              aria-label={repInputLabel ?? t('workout.set.repsLabel', { set: setIndex + 1 })}
              onFocus={selectOnFocus}
              onCommit={(raw) => onValueChange('reps', raw.replace(/^0+(?=\d)/, ''))}
            />
          ) : (
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={reps}
              aria-label={repInputLabel ?? t('workout.set.repsLabel', { set: setIndex + 1 })}
              onFocus={selectOnFocus}
              onChange={(event) => onValueChange('reps', cleanNumberInput(event))}
            />
          )}
          <button
            type="button"
            className="stepper-button"
            aria-label={repInputLabel ? `${repInputLabel} +` : t('workout.set.repsIncrease', { set: setIndex + 1 })}
            onClick={() => onValueChange('reps', String(stepWorkoutValue(reps, 1, 1, 0)))}
          >+</button>
        </div>
      </div>
    </div>
  )
}

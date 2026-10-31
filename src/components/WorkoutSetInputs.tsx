import React from 'react'
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
  onWeightInputChange: (raw: string) => void
  onValueChange: (field: 'weight' | 'reps', value: string) => void
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
  onWeightInputChange,
  onValueChange,
}: WorkoutSetInputsProps) {
  const stepWeight = (direction: -1 | 1) => {
    const value = stepWorkoutValue(weight, direction, equipmentStep(equipment), 0)
    onValueChange('weight', String(value))
    onWeightInputChange(formatNumber(language, value))
  }

  return (
    <div className="workout-mode-big-inputs">
      <div className="workout-mode-big-field">
        <span>kg</span>
        <div className="set-stepper">
          <button
            type="button"
            className="stepper-button"
            aria-label={t('workout.set.weightDecrease', { set: setIndex + 1 })}
            onClick={() => stepWeight(-1)}
          >−</button>
          <input
            type="text"
            inputMode="decimal"
            value={weightInput}
            data-log-weight
            aria-label={weightLabel ?? t('workout.set.weightLabel', { set: setIndex + 1 })}
            onFocus={selectOnFocus}
            onChange={(event) => {
              const raw = event.target.value
              onWeightInputChange(raw)
              const numeric = Number(raw.replace(',', '.'))
              onValueChange('weight', raw.trim() && Number.isFinite(numeric) ? String(numeric) : '0')
            }}
          />
          <button
            type="button"
            className="stepper-button"
            aria-label={t('workout.set.weightIncrease', { set: setIndex + 1 })}
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
            aria-label={t('workout.set.repsDecrease', { set: setIndex + 1 })}
            onClick={() => onValueChange('reps', String(stepWorkoutValue(reps, -1, 1, 0)))}
          >−</button>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={reps}
            aria-label={repInputLabel ?? t('workout.set.repsLabel', { set: setIndex + 1 })}
            onFocus={selectOnFocus}
            onChange={(event) => onValueChange('reps', cleanNumberInput(event))}
          />
          <button
            type="button"
            className="stepper-button"
            aria-label={t('workout.set.repsIncrease', { set: setIndex + 1 })}
            onClick={() => onValueChange('reps', String(stepWorkoutValue(reps, 1, 1, 0)))}
          >+</button>
        </div>
      </div>
    </div>
  )
}

import { cleanNumberInput, selectOnFocus } from '../utils/numberInput'
import React from 'react'
import { WorkoutSet } from '../types'
import { stepWorkoutValue } from '../utils/workoutSets'
import { useT } from '../i18n'

type ExerciseSetTableProps = {
  sets: WorkoutSet[]
  previousSets: WorkoutSet[]
  completedSets: boolean[]
  onUpdateSet: (index: number, field: 'reps' | 'weight', value: string) => void
  onToggleComplete: (index: number) => void
  onRemoveSet: (setId: string) => void
}

export default function ExerciseSetTable({
  sets,
  previousSets,
  completedSets,
  onUpdateSet,
  onToggleComplete,
  onRemoveSet,
}: ExerciseSetTableProps) {
  const { t } = useT()
  return (
    <div className="free-set-table">
      <div className="free-set-header" aria-hidden="true">
        <span>{t('setTable.set')}</span>
        <span>{t('setTable.previous')}</span>
        <span>{t('setTable.kg')}</span>
        <span>{t('setTable.reps')}</span>
        <span>✓</span>
        <span />
      </div>
      {sets.map((set, index) => {
        const previousSet = previousSets[index]
        const weightLabel = t('setTable.weightAria', { n: index + 1 })
        const complete = completedSets[index] ?? false
        return (
          <div className={`set-row${complete ? ' completed' : ''}`} key={set.id}>
            <span className="set-label">{index + 1}</span>
            {previousSet ? (
              <button
                type="button"
                className="previous-set-value"
                aria-label={t('setTable.copyPrevious', { n: index + 1, weight: previousSet.weight, reps: previousSet.reps })}
                onClick={() => {
                  onUpdateSet(index, 'weight', String(previousSet.weight))
                  onUpdateSet(index, 'reps', String(previousSet.reps))
                }}
              >
                {`${previousSet.weight} × ${previousSet.reps}`}
              </button>
            ) : (
              <span className="previous-set-value">—</span>
            )}
            <div className="set-stepper">
              <button
                type="button"
                className="stepper-button"
                aria-label={t('setTable.decrease', { label: weightLabel })}
                onClick={() => onUpdateSet(index, 'weight', String(stepWorkoutValue(set.weight, -1, 2.5)))}
              >
                −
              </button>
              <input
                className="free-set-input"
                type="number"
                inputMode="decimal"
                min={0}
                step="2.5"
                value={set.weight}
                aria-label={weightLabel}
                onFocus={selectOnFocus}
                onChange={(event) => onUpdateSet(index, 'weight', cleanNumberInput(event))}
              />
              <button
                type="button"
                className="stepper-button"
                aria-label={t('setTable.increase', { label: weightLabel })}
                onClick={() => onUpdateSet(index, 'weight', String(stepWorkoutValue(set.weight, 1, 2.5)))}
              >
                +
              </button>
            </div>
            <input
              className="free-set-input"
              type="number"
              inputMode="numeric"
              min={0}
              value={set.reps}
              aria-label={t('setTable.repsAria', { n: index + 1 })}
              onFocus={selectOnFocus}
              onChange={(event) => onUpdateSet(index, 'reps', cleanNumberInput(event))}
            />
            <button
              type="button"
              className="complete-set-button"
              aria-label={t(complete ? 'setTable.unmarkComplete' : 'setTable.markComplete', { n: index + 1 })}
              aria-pressed={complete}
              onClick={() => onToggleComplete(index)}
            >
              ✓
            </button>
            <button
              type="button"
              className="free-set-remove"
              aria-label={t('setTable.remove', { n: index + 1 })}
              onClick={() => onRemoveSet(set.id)}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

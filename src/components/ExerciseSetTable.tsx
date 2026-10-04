import React from 'react'
import { WorkoutSet } from '../types'
import { stepWorkoutValue } from '../utils/workoutSets'

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
  return (
    <div className="free-set-table">
      <div className="free-set-header" aria-hidden="true">
        <span>Set</span>
        <span>Previous</span>
        <span>kg</span>
        <span>Reps</span>
        <span>✓</span>
        <span />
      </div>
      {sets.map((set, index) => {
        const previousSet = previousSets[index]
        const weightLabel = `Set ${index + 1} weight in kilograms`
        const complete = completedSets[index] ?? false
        return (
          <div className={`set-row${complete ? ' completed' : ''}`} key={set.id}>
            <span className="set-label">{index + 1}</span>
            {previousSet ? (
              <button
                type="button"
                className="previous-set-value"
                aria-label={`Copy previous set ${index + 1}: ${previousSet.weight} kilograms for ${previousSet.reps} reps`}
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
                aria-label={`Decrease ${weightLabel}`}
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
                onChange={(event) => onUpdateSet(index, 'weight', event.target.value)}
              />
              <button
                type="button"
                className="stepper-button"
                aria-label={`Increase ${weightLabel}`}
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
              aria-label={`Set ${index + 1} reps`}
              onChange={(event) => onUpdateSet(index, 'reps', event.target.value)}
            />
            <button
              type="button"
              className="complete-set-button"
              aria-label={`${complete ? 'Unmark' : 'Mark'} set ${index + 1} complete`}
              aria-pressed={complete}
              onClick={() => onToggleComplete(index)}
            >
              ✓
            </button>
            <button
              type="button"
              className="free-set-remove"
              aria-label={`Remove set ${index + 1}`}
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

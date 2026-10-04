import React from 'react'
import { Exercise } from '../types'
import { getExerciseSubtitle } from '../utils/exerciseFilters'
import { getExerciseDisplayName } from '../utils/storage'

export default function ExerciseSearchSuggestions({
  exercises,
  selectedExerciseId,
  onSelect,
}: {
  exercises: Exercise[]
  selectedExerciseId?: string
  onSelect: (exerciseId: string) => void
}) {
  return (
    <div className="search-dropdown">
      {exercises.length ? (
        exercises.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            className={selectedExerciseId === exercise.id ? 'result-item active' : 'result-item'}
            onClick={() => onSelect(exercise.id)}
          >
            <span className="result-name">{getExerciseDisplayName(exercise)}</span>
            <span className="result-meta">{getExerciseSubtitle(exercise)}</span>
          </button>
        ))
      ) : (
        <p className="empty-state">No exercises found.</p>
      )}
    </div>
  )
}

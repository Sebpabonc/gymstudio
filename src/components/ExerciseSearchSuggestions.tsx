import React from 'react'
import { Exercise } from '../types'
import { getExerciseResultSubtitle } from '../utils/exerciseFilters'
import { getExerciseDisplayName } from '../utils/storage'
import { useT } from '../i18n'

const equipmentIcons: Record<string, React.ReactNode> = {
  barbell: <path d="M2 12h20M5 8v8M8 6v12M16 6v12M19 8v8" />,
  'ez-bar': <path d="M2 12h4l2-2 2 4 2-4 2 4 2-2h6M5 9v6M19 9v6" />,
  dumbbell: <path d="M7 12h10M4 9v6M7 7v10M17 7v10M20 9v6" />,
  machine: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h6" /></>,
  cable: <path d="M12 2v9M8 15a4 4 0 1 0 8 0 4 4 0 1 0-8 0M5 2h14" />,
  bodyweight: <><circle cx="12" cy="5" r="2" /><path d="M12 7v7M8 10h8M9 21l3-7 3 7" /></>,
  other: <><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></>,
}

export function EquipmentIcon({ equipment }: { equipment?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {equipmentIcons[equipment ?? 'other'] ?? equipmentIcons.other}
    </svg>
  )
}

export default function ExerciseSearchSuggestions({
  exercises,
  selectedExerciseId,
  query,
  onSelect,
}: {
  exercises: Exercise[]
  selectedExerciseId?: string
  query?: string
  onSelect: (exerciseId: string) => void
}) {
  const { t, language } = useT()
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
            <span className="result-equipment" aria-hidden="true"><EquipmentIcon equipment={exercise.equipment} /></span>
            <span className="result-text">
              <span className="result-name">{getExerciseDisplayName(exercise, language)}</span>
              <span className="result-meta">{getExerciseResultSubtitle(exercise, language)}</span>
            </span>
            <span className="result-chevron" aria-hidden="true">›</span>
          </button>
        ))
      ) : (
        <p className="empty-state">{query?.trim() ? t('exercises.noMatch', { q: query.trim() }) : t('exercises.noResults')}</p>
      )}
    </div>
  )
}

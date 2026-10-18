import React from 'react'

type Props = {
  label: string
  googleLabel: string
  swapLabel: string
  notesLabel: string
  techniqueLabel: string
  techniqueOpen: boolean
  onGoogle: () => void
  onSwap?: () => void
  onNotes: (event: React.MouseEvent<HTMLButtonElement>) => void
  onTechnique: () => void
}

/** PO 2026-10-18: Workout mode shows the exercise tools as icons next to the name instead of a "More" menu. */
export default function WorkoutExerciseActions({
  label, googleLabel, swapLabel, notesLabel, techniqueLabel, techniqueOpen, onGoogle, onSwap, onNotes, onTechnique,
}: Props) {
  return (
    <div className="workout-header-actions" role="group" aria-label={label} onClick={(event) => event.stopPropagation()}>
      <button type="button" className="workout-icon-button" title={googleLabel} aria-label={googleLabel} onClick={onGoogle}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
      {onSwap && (
        <button type="button" className="workout-icon-button" title={swapLabel} aria-label={swapLabel} onClick={onSwap}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-4-4M20 16H6l4 4" /></svg>
        </button>
      )}
      <button type="button" className="workout-icon-button" title={notesLabel} aria-label={notesLabel} onClick={onNotes}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
      </button>
      <button type="button" className="workout-icon-button" title={techniqueLabel} aria-label={techniqueLabel}
        aria-pressed={techniqueOpen} onClick={onTechnique}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>
      </button>
    </div>
  )
}

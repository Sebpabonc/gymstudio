import React from 'react'

type Props = {
  label: string
  googleLabel: string
  googleActionLabel: string
  swapLabel: string
  notesLabel: string
  techniqueLabel: string
  techniqueOpen: boolean
  onGoogle: () => void
  onSwap?: () => void
  /** Receives the tapped button so the caller can find the exercise card it belongs to. */
  onNotes: (anchor: HTMLElement) => void
  onTechnique: () => void
}

const ICONS = {
  google: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  swap: <path d="M4 8h14l-4-4M20 16H6l4 4" />,
  notes: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  technique: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
}

/** Workout mode shows the exercise tools as labelled buttons under the exercise name. */
export default function WorkoutExerciseActions({
  label, googleLabel, googleActionLabel, swapLabel, notesLabel, techniqueLabel, techniqueOpen, onGoogle, onSwap, onNotes, onTechnique,
}: Props) {
  const items: Array<{ key: keyof typeof ICONS; text: string; ariaLabel?: string; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; pressed?: boolean }> = [
    { key: 'technique', text: techniqueLabel, onClick: onTechnique, pressed: techniqueOpen },
    ...(onSwap ? [{ key: 'swap' as const, text: swapLabel, onClick: onSwap }] : []),
    { key: 'notes', text: notesLabel, onClick: (event) => onNotes(event.currentTarget) },
    { key: 'google', text: googleLabel, ariaLabel: googleActionLabel, onClick: onGoogle },
  ]
  return (
    <div className={`workout-exercise-tools${onSwap ? ' has-swap' : ''}`} role="group" aria-label={label}>
      {items.map((item) => (
        <button key={item.key} type="button" className="workout-tool" aria-label={item.ariaLabel ?? item.text} title={item.ariaLabel ?? item.text} aria-pressed={item.pressed}
          onClick={(event) => { event.stopPropagation(); item.onClick(event) }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[item.key]}</svg>
          <span>{item.text}</span>
        </button>
      ))}
    </div>
  )
}

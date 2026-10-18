import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  title: string
  label: string
  closeLabel: string
  googleLabel: string
  swapLabel: string
  notesLabel: string
  techniqueLabel: string
  techniqueOpen: boolean
  onGoogle: () => void
  onSwap?: () => void
  /** Receives the ⋯ button so the caller can find the exercise card it belongs to. */
  onNotes: (anchor: HTMLElement) => void
  onTechnique: () => void
}

const ICONS = {
  google: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  swap: <path d="M4 8h14l-4-4M20 16H6l4 4" />,
  notes: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  technique: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
}

/** PO 2026-10-18: one ⋯ button next to the exercise name opens a sheet with the exercise tools. */
export default function WorkoutExerciseActions({
  title, label, closeLabel, googleLabel, swapLabel, notesLabel, techniqueLabel, techniqueOpen,
  onGoogle, onSwap, onNotes, onTechnique,
}: Props) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', close); document.body.style.overflow = previous }
  }, [open])

  const run = (action: () => void) => () => { setOpen(false); action() }
  const rows: Array<{ key: keyof typeof ICONS; text: string; action: () => void; pressed?: boolean }> = [
    { key: 'google', text: googleLabel, action: onGoogle },
    ...(onSwap ? [{ key: 'swap' as const, text: swapLabel, action: onSwap }] : []),
    { key: 'notes', text: notesLabel, action: () => { if (anchor.current) onNotes(anchor.current) } },
    { key: 'technique', text: techniqueLabel, action: onTechnique, pressed: techniqueOpen },
  ]

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className="workout-more-button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => { event.stopPropagation(); setOpen(true) }}
      >
        ⋯
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="cue-sheet-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="cue-sheet workout-more-sheet" role="dialog" aria-modal="true" aria-label={`${label} · ${title}`}
            onClick={(event) => event.stopPropagation()}>
            <header className="cue-sheet-header">
              <h3>{title}</h3>
              <button type="button" className="cue-sheet-close" aria-label={closeLabel} onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="workout-more-list">
              {rows.map((row) => (
                <button key={row.key} type="button" className="workout-more-row" aria-pressed={row.pressed} onClick={run(row.action)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[row.key]}</svg>
                  <span>{row.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

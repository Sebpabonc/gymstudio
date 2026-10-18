import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../utils/useBodyScrollLock'

export type SqueezeCueDetails = {
  title: string
  closeLabel: string
  openLabel: string
  sections: Array<{ heading: string; lines: string[] }>
}

type SqueezeCueProps = {
  cue?: string
  cueLabel: string
  tips: string[]
  tipsLabel: string
  tipsId: string
  expanded: boolean
  onToggle: () => void
  /** PO 2026-10-18: tapping the cue opens a sheet with the exercise's insights and approved technique notes. */
  details?: SqueezeCueDetails
}

export default function SqueezeCue({
  cue,
  cueLabel,
  tips,
  tipsLabel,
  tipsId,
  expanded,
  onToggle,
  details,
}: SqueezeCueProps) {
  const visibleCue = cue?.trim()
  const hasTips = tips.length > 0
  const [sheetOpen, setSheetOpen] = useState(false)
  const sections = details ? visibleSections(details) : []

  if (!visibleCue && !hasTips) return null

  return (
    <section className="squeeze-cue-box">
      <div className="squeeze-cue-header">
        {details && sections.length > 0 ? (
          <button
            type="button"
            className="squeeze-cue-text squeeze-cue-open"
            aria-haspopup="dialog"
            aria-label={details.openLabel}
            onClick={() => setSheetOpen(true)}
          >
            {visibleCue ? (
              <>
                <strong>{cueLabel} — </strong>
                {visibleCue}
              </>
            ) : (
              <strong>{tipsLabel}</strong>
            )}
            <span className="squeeze-cue-more" aria-hidden="true"> ›</span>
          </button>
        ) : (
          <p className="squeeze-cue-text">
            {visibleCue ? (
              <>
                <strong>{cueLabel} — </strong>
                {visibleCue}
              </>
            ) : hasTips ? (
              <strong>{tipsLabel}</strong>
            ) : null}
          </p>
        )}
        <div className="squeeze-cue-actions">
          {hasTips && (
            <button
              type="button"
              className="squeeze-cue-toggle"
              aria-label={tipsLabel}
              aria-expanded={expanded}
              aria-controls={tipsId}
              onClick={onToggle}
            >
              {expanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>
      {hasTips && (
        <ul id={tipsId} className="squeeze-cue-tips" hidden={!expanded}>
          {tips.map((tip, index) => <li key={`${tipsId}-${index}`}>{tip}</li>)}
        </ul>
      )}
      {sheetOpen && details && <CueSheet details={details} sections={sections} id={tipsId} onClose={() => setSheetOpen(false)} />}
    </section>
  )
}

function visibleSections(details: SqueezeCueDetails) {
  return details.sections.filter((section) => section.lines.some((line) => line.trim()))
}

export function CueSheet({ details, sections, id, onClose, children }: {
  details: SqueezeCueDetails
  sections: SqueezeCueDetails['sections']
  id: string
  onClose: () => void
  children?: React.ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  useBodyScrollLock(true)
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    sheetRef.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const targets = sheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]')
      if (!targets?.length) return
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === sheetRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === sheetRef.current)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('keydown', close)
      previousFocus?.focus()
    }
  }, [onClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="cue-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cue-sheet"
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-sheet-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cue-sheet-header"
          onTouchStart={(event) => { touchStart.current = event.touches[0].clientY }}
          onTouchEnd={(event) => {
            if (touchStart.current !== null && event.changedTouches[0].clientY - touchStart.current > 80) onClose()
            touchStart.current = null
          }}
        >
          <h3 id={`${id}-sheet-title`}>{details.title}</h3>
          <button type="button" className="cue-sheet-close" aria-label={details.closeLabel} onClick={onClose}>×</button>
        </header>
        {sections.map((section) => (
          <section key={section.heading} className="cue-sheet-section">
            {section.heading && <h4>{section.heading}</h4>}
            {section.lines.length > 1
              ? <ul>{section.lines.filter((line) => line.trim()).map((line, index) => <li key={index}>{line}</li>)}</ul>
              : <p>{section.lines[0]}</p>}
          </section>
        ))}
        {children}
      </div>
    </div>,
    document.body
  )
}

/** PO 2026-10-18: in Workout mode the short "Squeeze" line also opens the exercise details sheet. */
export function ShortCue({ label, cue, details, id }: {
  label: string
  cue: string
  details?: SqueezeCueDetails
  id: string
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const sections = details ? visibleSections(details) : []
  if (!details || sections.length === 0) {
    return <p className="workout-short-cue"><strong>{label} · </strong>{cue}</p>
  }
  return (
    <>
      <button
        type="button"
        className="workout-short-cue workout-short-cue-open"
        aria-haspopup="dialog"
        aria-label={details.openLabel}
        onClick={() => setOpen(true)}
      >
        <strong>{label} · </strong>{cue}<span className="squeeze-cue-more" aria-hidden="true"> ›</span>
      </button>
      {open && <CueSheet details={details} sections={sections} id={id} onClose={close} />}
    </>
  )
}

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const sections = details?.sections.filter((section) => section.lines.some((line) => line.trim())) ?? []

  useEffect(() => {
    if (!sheetOpen) return undefined
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSheetOpen(false) }
    window.addEventListener('keydown', close)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', close); document.body.style.overflow = previous }
  }, [sheetOpen])

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
      {sheetOpen && details && typeof document !== 'undefined' && createPortal(
        <div className="cue-sheet-backdrop" role="presentation" onClick={() => setSheetOpen(false)}>
          <div
            className="cue-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${tipsId}-sheet-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cue-sheet-header">
              <h3 id={`${tipsId}-sheet-title`}>{details.title}</h3>
              <button type="button" className="cue-sheet-close" aria-label={details.closeLabel} onClick={() => setSheetOpen(false)}>×</button>
            </header>
            {sections.map((section) => (
              <section key={section.heading} className="cue-sheet-section">
                <h4>{section.heading}</h4>
                {section.lines.length > 1
                  ? <ul>{section.lines.filter((line) => line.trim()).map((line, index) => <li key={index}>{line}</li>)}</ul>
                  : <p>{section.lines[0]}</p>}
              </section>
            ))}
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}

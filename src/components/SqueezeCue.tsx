import React from 'react'

type SqueezeCueProps = {
  cue?: string
  cueLabel: string
  tips: string[]
  tipsLabel: string
  tipsId: string
  expanded: boolean
  onToggle: () => void
}

export default function SqueezeCue({
  cue,
  cueLabel,
  tips,
  tipsLabel,
  tipsId,
  expanded,
  onToggle,
}: SqueezeCueProps) {
  const visibleCue = cue?.trim()
  const hasTips = tips.length > 0

  if (!visibleCue && !hasTips) return null

  return (
    <section className="squeeze-cue-box">
      <div className="squeeze-cue-header">
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
    </section>
  )
}

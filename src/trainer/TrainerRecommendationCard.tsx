import React from 'react'

type Props = {
  title: string
  lastTime: string
  original: string
  recommended: string
  why: string
  confidence: string
  collectData: boolean
  sameAsOriginal: boolean
  choiceText?: string
  acceptLabel: string
  keepOriginalLabel: string
  collectDataText: string
  sameAsOriginalText: string
  onAccept: () => void
  onKeepOriginal: () => void
}

export default function TrainerRecommendationCard({
  title,
  lastTime,
  original,
  recommended,
  why,
  confidence,
  collectData,
  sameAsOriginal,
  choiceText,
  acceptLabel,
  keepOriginalLabel,
  collectDataText,
  sameAsOriginalText,
  onAccept,
  onKeepOriginal,
}: Props) {
  if (collectData || sameAsOriginal || choiceText) {
    return (
      <aside className="trainer-recommendation-card" role="status" aria-live="polite">
        <strong>{title}</strong>
        <p>{choiceText ?? (collectData ? collectDataText : sameAsOriginalText)}</p>
      </aside>
    )
  }

  return (
    <aside className="trainer-recommendation-card" aria-label={title}>
      <div className="trainer-card-heading">
        <strong>{title}</strong>
        <span className="trainer-confidence">{confidence}</span>
      </div>
      <p>{lastTime}</p>
      <p>{original}</p>
      <p className="trainer-recommended">{recommended}</p>
      <p className="trainer-why">{why}</p>
      <div className="trainer-card-actions">
        <button type="button" className="primary-button small-button" onClick={onAccept}>{acceptLabel}</button>
        <button type="button" className="secondary-button small-button" onClick={onKeepOriginal}>{keepOriginalLabel}</button>
      </div>
    </aside>
  )
}

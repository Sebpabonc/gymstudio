import React from 'react'
import type { AskExerciseAiConsent } from '../utils/storage'

export default function AiConsentPrompt({ onChoice }: { onChoice: (choice: AskExerciseAiConsent) => void }) {
  return (
    <>
      <p>
        Your question or this suggestion/session, the exercise(s) and your recent sessions of them are sent to OpenAI to answer. Nothing else.
      </p>
      <div className="ask-exercise-actions">
        <button type="button" className="primary-button" onClick={() => onChoice('enabled')}>
          Turn on AI
        </button>
        <button type="button" className="secondary-button" onClick={() => onChoice('declined')}>
          Not now
        </button>
      </div>
    </>
  )
}

import React from 'react'
import type { AskExerciseAiConsent } from '../utils/storage'
import { useT } from '../i18n'

export default function AiConsentPrompt({ onChoice }: { onChoice: (choice: AskExerciseAiConsent) => void }) {
  const { t } = useT()
  return (
    <>
      <p>{t('ai.consent.body')}</p>
      <div className="ask-exercise-actions">
        <button type="button" className="primary-button" onClick={() => onChoice('enabled')}>
          {t('ai.consent.on')}
        </button>
        <button type="button" className="secondary-button" onClick={() => onChoice('declined')}>
          {t('ai.consent.off')}
        </button>
      </div>
    </>
  )
}

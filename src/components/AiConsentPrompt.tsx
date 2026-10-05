import React from 'react'
import type { AskExerciseAiConsent } from '../utils/storage'
import { TranslationKey, useT } from '../i18n'

export default function AiConsentPrompt({
  onChoice,
  bodyKey = 'ai.consent.body',
}: {
  onChoice: (choice: AskExerciseAiConsent) => void
  bodyKey?: TranslationKey
}) {
  const { t } = useT()
  return (
    <>
      <p>{t(bodyKey)}</p>
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

import React from 'react'
import type { AskExerciseAiConsent } from '../utils/storage'
import { useT } from '../i18n'

export default function AiConsentPrompt({
  onChoice,
}: {
  onChoice: (choice: AskExerciseAiConsent) => void
}) {
  const { t } = useT()
  return (
    <div className="ai-consent-details">
      <h3 id="ai-permission-title">{t('ai.permission.title')}</h3>
      <p>{t('ai.permission.body')}</p>
      <h4>{t('ai.permission.sentTitle')}</h4>
      <ul>
        <li>{t('ai.permission.sent1')}</li>
        <li>{t('ai.permission.sent2')}</li>
        <li>{t('ai.permission.sent3')}</li>
      </ul>
      <p>{t('ai.permission.notSent')}</p>
      <p>{t('ai.permission.provider')}</p>
      <p className="ai-permission-policy">{t('ai.permission.policy')}</p>
      <div className="ai-consent-actions">
        <button type="button" className="primary-button" onClick={() => onChoice('enabled')}>
          {t('ai.permission.allow')}
        </button>
        <button type="button" className="secondary-button" onClick={() => onChoice('declined')}>
          {t('ai.permission.decline')}
        </button>
      </div>
    </div>
  )
}

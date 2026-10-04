import React, { useEffect, useRef } from 'react'
import { useT } from '../i18n'

type GuestDataPromptProps = {
  accountLabel: string
  onMove: () => void
  onKeep: () => void
}

export default function GuestDataPrompt({ accountLabel, onMove, onKeep }: GuestDataPromptProps) {
  const { t } = useT()
  const moveButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    moveButton.current?.focus()
  }, [])

  return (
    <div className="guest-data-prompt" role="dialog" aria-modal="true" aria-labelledby="guest-data-title">
      <div className="card guest-data-card">
        <h2 id="guest-data-title">{t('guest.title', { account: accountLabel })}</h2>
        <p>{t('guest.body')}</p>
        <div className="guest-data-actions">
          <button type="button" ref={moveButton} className="primary-button" onClick={onMove}>
            {t('guest.move')}
          </button>
          <button type="button" className="secondary-button" onClick={onKeep}>
            {t('guest.keep')}
          </button>
        </div>
      </div>
    </div>
  )
}

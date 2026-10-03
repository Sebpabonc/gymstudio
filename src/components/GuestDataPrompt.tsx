import React, { useEffect, useRef } from 'react'

type GuestDataPromptProps = {
  accountLabel: string
  onMove: () => void
  onKeep: () => void
}

export default function GuestDataPrompt({ accountLabel, onMove, onKeep }: GuestDataPromptProps) {
  const moveButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    moveButton.current?.focus()
  }, [])

  return (
    <div className="guest-data-prompt" role="dialog" aria-modal="true" aria-labelledby="guest-data-title">
      <div className="card guest-data-card">
        <h2 id="guest-data-title">Move the workouts on this device to {accountLabel}?</h2>
        <p>This only happens once. Otherwise they stay on this device as guest data.</p>
        <div className="guest-data-actions">
          <button type="button" ref={moveButton} className="primary-button" onClick={onMove}>
            Move workouts
          </button>
          <button type="button" className="secondary-button" onClick={onKeep}>
            Keep as guest
          </button>
        </div>
      </div>
    </div>
  )
}

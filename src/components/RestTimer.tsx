import React, { useEffect, useRef, useState } from 'react'
import {
  addRestTime,
  isRestTimerPaused,
  isRestTimerDone,
  remainingRestSeconds,
  skipRestTimer,
  RestTimerState,
  toggleRestTimerPause,
} from '../utils/restTimer'

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function RestTimer({
  timer,
  hidden,
  onChange,
}: {
  timer: RestTimerState | null
  hidden: boolean
  onChange: (timer: RestTimerState | null) => void
}) {
  const [now, setNow] = useState(Date.now())
  const lastVibratedEndAt = useRef<number | null>(null)

  useEffect(() => {
    if (!timer || isRestTimerPaused(timer)) return undefined
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [timer])

  useEffect(() => {
    if (!timer || isRestTimerPaused(timer)) return undefined
    const timeout = window.setTimeout(
      () => onChange(null),
      Math.max(0, timer.endAt + 3000 - Date.now())
    )
    return () => window.clearTimeout(timeout)
  }, [onChange, timer])

  useEffect(() => {
    if (!timer || isRestTimerPaused(timer) || !isRestTimerDone(timer, now) || lastVibratedEndAt.current === timer.endAt) return
    lastVibratedEndAt.current = timer.endAt
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }, [now, timer])

  if (!timer || hidden) return null

  const isDone = isRestTimerDone(timer, now)
  const isPaused = isRestTimerPaused(timer)

  return (
    <div className="rest-timer-pill" role="status" aria-live="polite">
      <button
        type="button"
        className="rest-timer-time"
        aria-label={isPaused ? 'Resume rest timer' : 'Pause rest timer'}
        aria-pressed={isPaused}
        onClick={() => onChange(toggleRestTimerPause(timer))}
        disabled={isDone}
      >
        {isDone ? 'Rest done' : (
          <>
            <span aria-hidden="true">⏱</span>
            {formatRemainingTime(remainingRestSeconds(timer, now))}
            {isPaused && <span className="rest-timer-paused">Paused</span>}
          </>
        )}
      </button>
      {!isDone && (
        <>
          <button
            type="button"
            className="rest-timer-action"
            onClick={() => onChange(addRestTime(timer))}
          >
            +15s
          </button>
          <button
            type="button"
            className="rest-timer-action"
            onClick={() => onChange(skipRestTimer())}
          >
            Skip
          </button>
        </>
      )}
    </div>
  )
}

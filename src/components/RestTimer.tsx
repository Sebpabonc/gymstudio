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
import { useT } from '../i18n'

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
  const { t } = useT()
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
    <div className="rest-timer-pill">
      {isDone ? (
        <span className="rest-timer-done" role="status">{t('rest.done')}</span>
      ) : (
        <button
          type="button"
          className="rest-timer-time"
          aria-label={isPaused ? t('rest.resume') : t('rest.pause')}
          aria-pressed={isPaused}
          onClick={() => onChange(toggleRestTimerPause(timer))}
        >
          <>
            <span aria-hidden="true">⏱</span>
            {formatRemainingTime(remainingRestSeconds(timer, now))}
            {isPaused && <span className="rest-timer-paused">{t('rest.paused')}</span>}
          </>
        </button>
      )}
      {!isDone && (
        <>
          <button
            type="button"
            className="rest-timer-action"
            onClick={() => onChange(addRestTime(timer))}
          >
            {t('rest.add15')}
          </button>
          <button
            type="button"
            className="rest-timer-action"
            onClick={() => onChange(skipRestTimer())}
          >
            {t('rest.skip')}
          </button>
        </>
      )}
    </div>
  )
}

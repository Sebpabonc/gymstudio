import React, { useEffect, useRef, useState } from 'react'
import {
  addRestTime,
  isRestTimerPaused,
  isRestTimerDone,
  remainingRestSeconds,
  RestTimerState,
  toggleRestTimerPause,
} from '../utils/restTimer'
import { useT } from '../i18n'
import { fireRestAlert } from '../native/restAlerts'
import './RestTimer.css'

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function RestTimer({
  timer,
  hidden,
  onChange,
  workoutMode = false,
  inPlace = false,
  label,
  nextLabel,
  children,
  onUndo,
}: {
  timer: RestTimerState | null
  hidden: boolean
  onChange: (timer: RestTimerState | null) => void
  workoutMode?: boolean
  inPlace?: boolean
  label?: string
  nextLabel?: string
  children?: React.ReactNode
  onUndo?: () => void
}) {
  const { t } = useT()
  const [now, setNow] = useState(Date.now())
  const [minimized, setMinimized] = useState(false)
  const lastVibratedEndAt = useRef<number | null>(null)
  const previousTimer = useRef<RestTimerState | null>(null)
  const popup = useRef<HTMLElement | null>(null)
  const restLabel = t('rest.title')
  const goLabel = t('rest.done')

  useEffect(() => {
    if (!timer || isRestTimerPaused(timer)) return undefined
    setNow(Date.now())
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [timer])

  useEffect(() => {
    if (hidden) return
    if (timer && !previousTimer.current) {
      setMinimized(false)
      lastVibratedEndAt.current = null
    }
    previousTimer.current = timer
  }, [timer, hidden])

  useEffect(() => {
    if (!timer || hidden || !workoutMode || !minimized) return
    document.body.classList.add('workout-rest-bar-visible')
    return () => document.body.classList.remove('workout-rest-bar-visible')
  }, [timer, hidden, workoutMode, minimized])

  useEffect(() => {
    if (!timer || hidden || !workoutMode || minimized || !popup.current) return
    const previousFocus = document.activeElement
    popup.current.focus()
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [Boolean(timer), hidden, workoutMode, minimized])

  useEffect(() => {
    if (hidden || !timer || isRestTimerPaused(timer) || !isRestTimerDone(timer, now) || lastVibratedEndAt.current === timer.endAt) return
    lastVibratedEndAt.current = timer.endAt
    fireRestAlert()
  }, [now, timer, hidden])

  if (!timer || hidden) return null

  const isDone = isRestTimerDone(timer, now)
  const isPaused = isRestTimerPaused(timer)
  const stop = () => {
    onChange(null)
  }
  const undo = () => {
    onUndo?.()
  }

  if (workoutMode) {
    if (minimized) {
      return (
        <aside className="workout-rest-bar" aria-label={restLabel}>
          <strong role="status">{isDone ? goLabel : formatRemainingTime(remainingRestSeconds(timer, now))}</strong>
          <span className="workout-rest-next">{nextLabel}</span>
          <button type="button" onClick={() => setMinimized(false)}>{t('rest.open')}</button>
          {onUndo && <button type="button" onClick={undo}>{t('rest.undo')}</button>}
        </aside>
      )
    }
    return (
      <div className="workout-rest-backdrop">
        <section className="workout-rest-popup" role="dialog" aria-modal="true" aria-label={restLabel}
          ref={popup} tabIndex={-1} onKeyDown={event => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              setMinimized(true)
            }
            if (event.key !== 'Tab') return
            const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')
            const first = controls[0]
            const last = controls[controls.length - 1]
            if (event.shiftKey && (document.activeElement === first || document.activeElement === popup.current)) {
              event.preventDefault()
              last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault()
              first?.focus()
            }
          }}>
          <header>
            <strong>{restLabel}</strong>
            <button type="button" onClick={() => setMinimized(true)}>{t('rest.hide')}</button>
          </header>
          {label && <p className="workout-rest-label">{label}</p>}
          <div className="workout-rest-countdown" role="status">
            {isDone ? goLabel : formatRemainingTime(remainingRestSeconds(timer, now))}
          </div>
          {nextLabel && <p className="workout-rest-next">{nextLabel}</p>}
          {children && <div className="workout-rest-insight">{children}</div>}
          <div className="workout-rest-actions">
            <button type="button" onClick={() => onChange(addRestTime(timer, Date.now(), 15))}>{t('rest.add15')}</button>
            {onUndo && <button type="button" onClick={undo}>{t('rest.undo')}</button>}
          </div>
          <button type="button" className="workout-rest-start" onClick={stop}>
            {t('rest.startNext')}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className={`rest-timer-pill${inPlace ? ' in-place' : ''}`}>
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
      <button
        type="button"
        className="rest-timer-action"
        onClick={() => onChange(addRestTime(timer, Date.now(), 15))}
      >
        {t('rest.add15')}
      </button>
      <button type="button" className="rest-timer-action" onClick={stop}>
        {t('rest.skip')}
      </button>
    </div>
  )
}

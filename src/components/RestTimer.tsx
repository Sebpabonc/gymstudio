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
  barTitle,
  barValue,
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
  /** Short bar text: what comes next, then its numbers. Falls back to nextLabel. */
  barTitle?: string
  barValue?: string
  children?: React.ReactNode
  onUndo?: () => void
}) {
  const { t } = useT()
  const [now, setNow] = useState(Date.now())
  // During a workout the rest stays in a bar so the set list remains visible.
  const [minimized, setMinimized] = useState(workoutMode)
  const lastVibratedEndAt = useRef<number | null>(null)
  const previousTimer = useRef<RestTimerState | null>(null)
  // Timers only store their end, so the bar's full width is the longest time seen for this rest.
  const fullMs = useRef(0)
  const fullFor = useRef<string | undefined>(undefined)
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
      setMinimized(workoutMode)
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

  useEffect(() => {
    if (hidden || !workoutMode || !timer || timer.endAt === undefined || !isRestTimerDone(timer, now)) return undefined
    const timeout = window.setTimeout(() => onChange(null), Math.max(0, timer.endAt + 3000 - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [now, timer, hidden, workoutMode, onChange])

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
      const remainingMs = isRestTimerPaused(timer) ? timer.pausedRemainingMs : Math.max(0, (timer.endAt ?? 0) - now)
      // A new "next" means a new rest, even when it replaces one still running.
      fullMs.current = !previousTimer.current || fullFor.current !== barTitle ? remainingMs : Math.max(fullMs.current, remainingMs)
      fullFor.current = barTitle
      const progress = fullMs.current > 0 ? Math.min(1, remainingMs / fullMs.current) : 0
      return (
        <aside className={`workout-rest-bar${isDone ? ' done' : ''}`} aria-label={restLabel}>
          <span className="workout-rest-bar-fill" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
          <strong role="status">{isDone ? goLabel : formatRemainingTime(remainingRestSeconds(timer, now))}</strong>
          <span className="workout-rest-next">
            <span className="workout-rest-bar-title">{barTitle ?? nextLabel}</span>
            {barValue && <b>{barValue}</b>}
          </span>
          {!isDone && <div className="workout-rest-bar-actions">
            {children
              ? <button type="button" onClick={() => setMinimized(false)}>{t('rest.open')}</button>
              : <button type="button" onClick={() => onChange(addRestTime(timer, Date.now(), 15))}>{t('rest.add15')}</button>}
            <button type="button" onClick={stop}>{t('rest.skip')}</button>
          </div>}
        </aside>
      )
    }
    return (
      <div className="workout-rest-backdrop" onClick={event => {
        if (event.target === event.currentTarget) setMinimized(true)
      }}>
        <section className={`workout-rest-popup${isDone ? ' done' : ''}`} role="dialog" aria-modal="true" aria-label={restLabel}
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

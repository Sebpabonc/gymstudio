export type RestTimerState =
  | { endAt: number; pausedRemainingMs?: never }
  | { endAt?: never; pausedRemainingMs: number }

const REST_INCREMENT_MS = 15_000

export function isRestTimerPaused(
  timer: RestTimerState
): timer is { endAt?: never; pausedRemainingMs: number } {
  return typeof timer.pausedRemainingMs === 'number'
}

export function startRestTimer(durationSeconds = 90, now = Date.now()): RestTimerState {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 90
  return { endAt: now + Math.ceil(duration * 1000) }
}

export function addRestTime(timer: RestTimerState, now = Date.now()): RestTimerState {
  if (isRestTimerPaused(timer)) {
    return { pausedRemainingMs: timer.pausedRemainingMs + REST_INCREMENT_MS }
  }
  return { endAt: Math.max(timer.endAt, now) + REST_INCREMENT_MS }
}

export function skipRestTimer(): null {
  return null
}

export function remainingRestSeconds(timer: RestTimerState, now = Date.now()): number {
  const milliseconds =
    isRestTimerPaused(timer) ? timer.pausedRemainingMs : Math.max(0, timer.endAt - now)
  return Math.ceil(milliseconds / 1000)
}

export function isRestTimerDone(timer: RestTimerState, now = Date.now()): boolean {
  return !isRestTimerPaused(timer) && timer.endAt <= now
}

export function toggleRestTimerPause(timer: RestTimerState, now = Date.now()): RestTimerState {
  if (isRestTimerPaused(timer)) {
    return { endAt: now + timer.pausedRemainingMs }
  }
  if (timer.endAt <= now) return timer
  return { pausedRemainingMs: timer.endAt - now }
}

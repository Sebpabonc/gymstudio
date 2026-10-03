import { describe, expect, it } from 'vitest'
import {
  addRestTime,
  isRestTimerDone,
  remainingRestSeconds,
  skipRestTimer,
  startRestTimer,
  toggleRestTimerPause,
} from './restTimer'

describe('rest timer', () => {
  it('starts from the duration and computes remaining time from the end timestamp', () => {
    const timer = startRestTimer(90, 1_000)

    expect(timer).toEqual({ endAt: 91_000 })
    expect(remainingRestSeconds(timer, 1_001)).toBe(90)
    expect(remainingRestSeconds(timer, 90_001)).toBe(1)
    expect(isRestTimerDone(timer, 90_999)).toBe(false)
    expect(isRestTimerDone(timer, 91_000)).toBe(true)
  })

  it('uses the default duration for an invalid or missing duration', () => {
    expect(startRestTimer(undefined, 1_000)).toEqual({ endAt: 91_000 })
    expect(startRestTimer(0, 1_000)).toEqual({ endAt: 91_000 })
  })

  it('adds fifteen seconds to running and paused timers', () => {
    const running = startRestTimer(30, 1_000)
    expect(addRestTime(running, 5_000)).toEqual({ endAt: 46_000 })

    const paused = toggleRestTimerPause(running, 5_000)
    expect(addRestTime(paused)).toEqual({ pausedRemainingMs: 41_000 })
  })

  it('pauses and resumes without counting down while paused', () => {
    const paused = toggleRestTimerPause(startRestTimer(30, 1_000), 5_000)

    expect(paused).toEqual({ pausedRemainingMs: 26_000 })
    expect(remainingRestSeconds(paused, 20_000)).toBe(26)
    expect(isRestTimerDone(paused, 40_000)).toBe(false)
    expect(toggleRestTimerPause(paused, 20_000)).toEqual({ endAt: 46_000 })
  })

  it('skips the timer', () => {
    expect(skipRestTimer()).toBeNull()
  })
})

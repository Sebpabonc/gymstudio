import { describe, expect, it } from 'vitest'
import {
  addRestTime,
  getWorkoutRestSeconds,
  isRestTimerDone,
  remainingRestSeconds,
  skipRestTimer,
  startRestTimer,
  toggleRestTimerPause,
} from './restTimer'

describe('rest timer', () => {
  it('T134: uses exercise rest_seconds ahead of the Profile duration', () => {
    expect(getWorkoutRestSeconds(120, 150)).toBe(150)
    expect(getWorkoutRestSeconds(120, 60)).toBe(60)
  })

  it('T135: falls back to Profile rest when the exercise has no rest_seconds', () => {
    expect(getWorkoutRestSeconds(90, undefined)).toBe(90)
    expect(getWorkoutRestSeconds(120, undefined)).toBe(120)
  })

  it('falls back to the default when no valid rest duration is available', () => {
    expect(getWorkoutRestSeconds(undefined, 60)).toBe(60)
    expect(getWorkoutRestSeconds(0, 60)).toBe(60)
    expect(getWorkoutRestSeconds(120, 0)).toBe(120)
    expect(getWorkoutRestSeconds(120, NaN)).toBe(120)
    expect(getWorkoutRestSeconds(NaN, Infinity)).toBe(90)
    expect(getWorkoutRestSeconds()).toBe(90)
  })
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

  it('supports the workout-mode thirty-second extension', () => {
    expect(addRestTime(startRestTimer(30, 1_000), 5_000, 30)).toEqual({ endAt: 61_000 })
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

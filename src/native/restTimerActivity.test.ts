import { describe, expect, it } from 'vitest'
import { restTimerActivityPayload, supportsRestTimerActivity } from './restTimerActivity'

describe('rest timer Live Activity bridge', () => {
  it('sends the end time while counting down', () => {
    expect(restTimerActivityPayload({ endAt: 1_000_090_000 }, 'Dumbbell Bench Press', 1_000_000_000))
      .toEqual({ endAt: 1_000_090_000, exercise: 'Dumbbell Bench Press' })
  })

  it('sends the remaining time while paused', () => {
    expect(restTimerActivityPayload({ pausedRemainingMs: 45_000 }, 'Rest', 1_000_000_000))
      .toEqual({ endAt: 1_000_045_000, pausedRemainingMs: 45_000, exercise: 'Rest' })
  })

  it('is a no-op on the web', () => {
    expect(supportsRestTimerActivity()).toBe(false)
  })
})

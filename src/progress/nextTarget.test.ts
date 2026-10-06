import { describe, expect, it } from 'vitest'
import { recommendNextTarget } from './nextTarget'

describe('recommendNextTarget', () => {
  it('adds the progression step when every set reaches its target', () => {
    expect(
      recommendNextTarget(
        [{ weight: 10, reps: 10 }, { weight: 10, reps: 11 }, { weight: 10, reps: 10 }],
        [10, 10, 10],
        'upper'
      )
    ).toMatchObject({ action: 'increase', weight: 12.5, reps: [10, 10, 10] })
  })

  it('uses a strong first set to recommend an increase when later sets only drop a little', () => {
    expect(
      recommendNextTarget(
        [{ weight: 10, reps: 13 }, { weight: 10, reps: 9 }, { weight: 10, reps: 9 }],
        [10, 10, 10],
        'lower'
      )
    ).toMatchObject({ action: 'increase', weight: 15 })
  })

  it('does not increase when later sets fall 3+ reps short, even after a strong first set', () => {
    expect(
      recommendNextTarget(
        [{ weight: 10, reps: 13 }, { weight: 10, reps: 6 }, { weight: 10, reps: 5 }],
        [10, 10, 10],
        'lower'
      )
    ).toMatchObject({ action: 'reduce' })
  })

  it('holds the weight for 12/10/8 on a 3x10 plan (PO example)', () => {
    expect(
      recommendNextTarget(
        [{ weight: 10, reps: 12 }, { weight: 10, reps: 10 }, { weight: 10, reps: 8 }],
        [10, 10, 10],
        'upper'
      )
    ).toMatchObject({ action: 'hold', weight: 10, shortSets: [3] })
  })

  it('holds weight when total reps are within two and identifies missed sets', () => {
    expect(
      recommendNextTarget(
        [{ weight: 10, reps: 12 }, { weight: 10, reps: 10 }, { weight: 10, reps: 8 }],
        [10, 10, 10],
        'upper'
      )
    ).toMatchObject({ action: 'hold', weight: 10, shortSets: [3] })
  })

  it('reduces the load when at least two sets miss by three or more reps', () => {
    expect(
      recommendNextTarget(
        [{ weight: 10, reps: 10 }, { weight: 10, reps: 7 }, { weight: 10, reps: 6 }],
        [10, 10, 10],
        'upper'
      )
    ).toMatchObject({ action: 'reduce', weight: 7.5 })
  })

  it('holds the weight when only one of three sets is logged', () => {
    expect(recommendNextTarget([{ weight: 20, reps: 8 }], [8, 8, 8], 'upper')).toMatchObject({
      action: 'hold',
      weight: 20,
      shortSets: [],
    })
  })

  it('does not reduce the weight when only two of three sets are logged', () => {
    expect(
      recommendNextTarget(
        [{ weight: 20, reps: 5 }, { weight: 20, reps: 5 }],
        [8, 8, 8],
        'upper'
      )
    ).toMatchObject({ action: 'hold', weight: 20, shortSets: [1, 2] })
  })

  it('uses the same weight and half the sets during a deload', () => {
    expect(
      recommendNextTarget(
        Array.from({ length: 5 }, () => ({ weight: 20, reps: 12 })),
        [12, 12, 12, 12, 12],
        'lower',
        true
      )
    ).toMatchObject({ action: 'deload', weight: 20, reps: [12, 12, 12], setCount: 3 })
  })

  it('uses the isolation increment and ignores invalid targets', () => {
    expect(recommendNextTarget([{ weight: 8, reps: 10 }], [10], 'isolation')).toMatchObject({
      action: 'increase',
      weight: 9,
    })
    expect(recommendNextTarget([], [10], 'upper')).toBeNull()
  })

  it('can recommend adding load for a bodyweight exercise logged at zero kilograms', () => {
    expect(recommendNextTarget([{ weight: 0, reps: 10 }], [10], 'upper')).toMatchObject({
      action: 'increase',
      weight: 2.5,
    })
  })

  it('uses the working weight (most sets), not the warm-up first set', () => {
    expect(recommendNextTarget([{ weight: 20, reps: 10 }, { weight: 22.5, reps: 10 }, { weight: 22.5, reps: 10 }], [8, 8, 8], 'upper'))
      .toMatchObject({ action: 'increase', weight: 25 })
  })
})

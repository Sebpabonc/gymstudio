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
    ).toMatchObject({ action: 'increase', weight: 12.5 })
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

  it('ignores invalid targets', () => {
    expect(recommendNextTarget([], [10], 'upper')).toBeNull()
  })

  // PT super-QA 2026-11-07: weight steps come from the equipment, never a fixed +1/+2.5/+5 kg.
  it('moves an 8 kg dumbbell isolation lift to 10 kg (2 kg dumbbell step), never 9 kg', () => {
    expect(recommendNextTarget([{ weight: 8, reps: 12 }, { weight: 8, reps: 12 }], [12, 12], 'isolation', false, 'dumbbell'))
      .toMatchObject({ action: 'increase', weight: 10, increaseKg: 2 })
  })

  it('uses the 2.5 kg step for barbell lower-body work instead of +5 kg', () => {
    expect(recommendNextTarget([{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }], [8, 8], 'lower', false, 'barbell'))
      .toMatchObject({ action: 'increase', weight: 62.5, increaseKg: 2.5 })
  })

  it('snaps an off-grid dumbbell weight back onto the 2 kg step', () => {
    // PT review: exact result for 9 kg, all sets hit.
    expect(recommendNextTarget([{ weight: 9, reps: 10 }], [10], 'upper', false, 'dumbbell'))
      .toMatchObject({ action: 'increase', weight: 10, increaseKg: 1 })
  })

  it('reduces a dumbbell lift onto the 2 kg step', () => {
    const target = recommendNextTarget(
      [{ weight: 20, reps: 10 }, { weight: 20, reps: 6 }, { weight: 20, reps: 6 }], [10, 10, 10], 'upper', false, 'dumbbell'
    )
    expect(target).toMatchObject({ action: 'reduce', weight: 18 })
  })

  it('marks band work without load so the card says "no added load"', () => {
    expect(recommendNextTarget([{ weight: 0, reps: 15 }], [15], 'upper', false, 'band')).toMatchObject({ action: 'add_reps', band: true })
  })

  // PT super-QA 2026-11-07 (F7): bodyweight never shows a kg target.
  it('gives a push-up at 0 kg an add-reps target, never a kg target', () => {
    const target = recommendNextTarget([{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 11 }], [12, 12, 12], 'upper', false, 'bodyweight')
    expect(target).toMatchObject({ action: 'add_reps', weight: 0, increaseKg: 0, topReps: 12 })
  })

  it('treats band work without added load the same way', () => {
    expect(recommendNextTarget([{ weight: 0, reps: 15 }], [15], 'upper', false, 'band')).toMatchObject({ action: 'add_reps', weight: 0 })
  })

  it('still progresses weighted bodyweight work (added load) with the 2.5 kg step', () => {
    expect(recommendNextTarget([{ weight: 10, reps: 8 }], [8], 'upper', false, 'bodyweight'))
      .toMatchObject({ action: 'increase', weight: 12.5 })
  })

  it('uses the working weight (most sets), not the warm-up first set', () => {
    expect(recommendNextTarget([{ weight: 20, reps: 10 }, { weight: 22.5, reps: 10 }, { weight: 22.5, reps: 10 }], [8, 8, 8], 'upper'))
      .toMatchObject({ action: 'increase', weight: 25 })
  })
})

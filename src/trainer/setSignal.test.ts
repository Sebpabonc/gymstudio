import { describe, expect, it } from 'vitest'
import { nextSetHint } from './setSignal'

const target = { min: 10, max: 12 }

describe('nextSetHint', () => {
  it('suggests exactly one equipment step after a strong set at the planned weight', () => {
    expect(nextSetHint({
      target,
      plannedWeight: 12,
      completedSets: [{ weight: 12, reps: 15 }],
      step: 2,
    })).toEqual({ kind: 'consider_increase', weight: 14 })
  })

  it('requires at least three reps over the target maximum', () => {
    expect(nextSetHint({
      target,
      plannedWeight: 12,
      completedSets: [{ weight: 12, reps: 14 }],
      step: 2,
    })).toBeNull()
  })

  it('uses the last completed set and requires it to be at the planned weight', () => {
    expect(nextSetHint({
      target,
      plannedWeight: 12,
      completedSets: [
        { weight: 12, reps: 16 },
        { weight: 10, reps: 15 },
      ],
      step: 2,
    })).toBeNull()
  })

  it('does not suggest an increase without a completed set or usable load step', () => {
    expect(nextSetHint({ target, plannedWeight: 12, completedSets: [], step: 2 })).toBeNull()
    expect(nextSetHint({ target, plannedWeight: 0, completedSets: [{ weight: 0, reps: 15 }], step: 2 })).toBeNull()
    expect(nextSetHint({ target, plannedWeight: 12, completedSets: [{ weight: 12, reps: 15 }], step: 0 })).toBeNull()
  })
})

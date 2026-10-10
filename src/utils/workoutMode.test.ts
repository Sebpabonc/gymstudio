import { describe, expect, it } from 'vitest'
import { nextWorkoutGroupIndex } from './workoutMode'

describe('nextWorkoutGroupIndex', () => {
  it('selects the next incomplete group after the current one', () => {
    expect(nextWorkoutGroupIndex([true, true, false, false], 1)).toBe(2)
  })

  it('skips completed groups and does not wrap to earlier groups', () => {
    expect(nextWorkoutGroupIndex([false, true, true, false], 2)).toBe(3)
    expect(nextWorkoutGroupIndex([false, true, true], 2)).toBe(-1)
  })

  it('starts at the first incomplete group when no group is active', () => {
    expect(nextWorkoutGroupIndex([true, false, false], -1)).toBe(1)
  })
})

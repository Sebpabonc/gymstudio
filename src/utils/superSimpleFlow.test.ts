import { describe, expect, it } from 'vitest'
import { buildSuperSimpleSteps, firstPendingSuperSimpleStep } from './superSimpleFlow'

describe('super-simple workout flow', () => {
  it('keeps regular exercises one set at a time', () => {
    expect(buildSuperSimpleSteps([
      { name: 'Press', sets: '2' },
      { name: 'Row', sets: '1' },
    ])).toEqual([
      { exerciseIndex: 0, setIndex: 0 },
      { exerciseIndex: 0, setIndex: 1 },
      { exerciseIndex: 1, setIndex: 0 },
    ])
  })

  it('alternates superset exercises within each round', () => {
    expect(buildSuperSimpleSteps([
      { name: 'Press', code: 'A1', technique: 'superset', sets: '2' },
      { name: 'Row', code: 'A2', technique: 'superset', sets: '1' },
      { name: 'Curl', sets: '1' },
    ])).toEqual([
      { exerciseIndex: 0, setIndex: 0 },
      { exerciseIndex: 1, setIndex: 0 },
      { exerciseIndex: 0, setIndex: 1 },
      { exerciseIndex: 2, setIndex: 0 },
    ])
  })

  it('resumes at the first set not yet saved for its exercise', () => {
    const steps = buildSuperSimpleSteps([
      { name: 'Press', code: 'A1', technique: 'superset', sets: '2' },
      { name: 'Row', code: 'A2', technique: 'superset', sets: '2' },
    ])

    expect(firstPendingSuperSimpleStep(steps, [1, 0])).toBe(1)
    expect(firstPendingSuperSimpleStep(steps, [2, 2])).toBe(-1)
  })
})

import { describe, expect, it } from 'vitest'
import { NextTarget } from '../progress/nextTarget'
import {
  buildExerciseFeedbackPayload,
  buildNextSessionPlanPayload,
  limitAiNoteToTwoSentences,
  validateNextSessionPlan,
  type CoachPlanExercise,
} from './coachLoop'

const recommendation: NextTarget = {
  action: 'increase',
  weight: 62.5,
  reps: [8, 8],
  setCount: 2,
  shortSets: [],
  increaseKg: 2.5,
  firstSetAboveTarget: false,
}

const planExercise: CoachPlanExercise = {
  code: 'A1',
  exerciseId: 'barbell-bench-press',
  name: 'Barbell Bench Press',
  sets: 2,
  reps: [8, 8],
  ruleTarget: { weight: 60, reps: [8, 8] },
  last: [{ weight: 60, reps: 8 }],
}

describe('AI coach loop payloads', () => {
  it('builds the exercise feedback payload from logged sets and the rule output', () => {
    expect(buildExerciseFeedbackPayload(
      'barbell-bench-press',
      'es',
      [{ weight: 60, reps: 9 }],
      { sets: 2, reps: [8, 8], weight: 60 },
      recommendation
    )).toEqual({
      feature: 'exercise_feedback',
      exerciseId: 'barbell-bench-press',
      language: 'es',
      logged: [{ weight: 60, reps: 9 }],
      target: { sets: 2, reps: [8, 8], weight: 60 },
      recommendation,
    })
  })

  it('builds the requested next-session plan shape', () => {
    expect(buildNextSessionPlanPayload('block-1', 'chest-a', 3, [planExercise])).toEqual({
      blockId: 'block-1',
      dayKey: 'chest-a',
      week: 3,
      exercises: [planExercise],
    })
  })

  it('preserves the other-day basis in the AI plan payload', () => {
    const exercise: CoachPlanExercise = {
      ...planExercise,
      sets: 3,
      reps: [15, 15, 15],
      ruleTarget: { weight: 7.5, reps: [15, 15, 15] },
      last: [{ weight: 10, reps: 10 }],
      basis: 'other-day',
    }
    expect(buildNextSessionPlanPayload('block-1', 'chest-back-b', 1, [exercise]).exercises[0])
      .toEqual(exercise)
  })
})

describe('next-session plan validation', () => {
  it('rejects invalid JSON', () => {
    expect(validateNextSessionPlan('{bad json', [planExercise])).toBeNull()
  })

  it('clamps out-of-range values to the rule target and ignores unknown codes', () => {
    const result = validateNextSessionPlan(JSON.stringify({
      summary: 'A steady next session.',
      exercises: [
        { code: 'A1', weight: 90, reps: [12, 8], note: 'Keep a smooth tempo.' },
        { code: 'Z9', weight: 25, reps: [8, 8], note: 'Unknown exercise.' },
      ],
    }), [planExercise])

    expect(result).toEqual({
      summary: 'A steady next session.',
      exercises: [{
        code: 'A1',
        weight: 60,
        reps: [8, 8],
        note: 'Keep a smooth tempo.',
      }],
    })
  })

  it('uses rule targets for missing AI values', () => {
    expect(validateNextSessionPlan(
      JSON.stringify({ summary: 'Follow the plan.', exercises: [] }),
      [planExercise]
    )?.exercises).toEqual([{
      code: 'A1',
      weight: 60,
      reps: [8, 8],
      note: '',
    }])
  })

  it('limits automatic feedback to two sentences', () => {
    expect(limitAiNoteToTwoSentences('Good work. Keep the same weight! Add a rep next time.'))
      .toBe('Good work. Keep the same weight!')
  })
})

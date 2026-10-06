import { describe, expect, it } from 'vitest'
import type { PlannedExercise } from '../types'
import { prescriptionForWeek } from './weekPrescription'

const exercise = (overrides: Partial<PlannedExercise> = {}): PlannedExercise => ({
  code: 'A1',
  position: 1,
  exerciseId: 'press',
  sets: 4,
  reps: ['8'],
  restSeconds: 90,
  technique: 'straight',
  ...overrides,
})

describe('prescriptionForWeek', () => {
  it('week 1 is full intensity unless it is a beginner intro', () => {
    const plan = exercise({ technique: 'drop-set', reps: ['12+12'], notes: 'Rest-pause after the last set.' })
    expect(prescriptionForWeek(plan, 1)).toEqual(plan)
  })

  it('keeps straight-set prescriptions unchanged in weeks 2-5', () => {
    for (const week of [1, 2, 3, 4, 5]) {
      const plan = exercise()
      expect(prescriptionForWeek(plan, week)).toEqual(plan)
    }
  })

  it('keeps week 1 straight sets and adds the intro note', () => {
    expect(prescriptionForWeek(exercise(), 1, { beginnerIntro: true })).toMatchObject({
      technique: 'straight',
      sets: 4,
      reps: ['8'],
      weekNote: 'Week 1: straight sets, 3-second lowering, 2-3 reps in reserve.',
    })
  })

  it('halves deload straight sets, rounding up', () => {
    expect(prescriptionForWeek(exercise({ sets: 3 }), 6)).toMatchObject({
      technique: 'straight',
      sets: 2,
      reps: ['8'],
      weekNote: 'Deload: same weights, half the sets, 3+ reps in reserve.',
    })
  })

  it('turns drop sets into straight sets without drop reps in weeks 1 and 6', () => {
    const plan = exercise({ technique: 'drop-set', reps: ['12+12', '10+10'] })

    expect(prescriptionForWeek(plan, 1, { beginnerIntro: true })).toMatchObject({
      technique: 'straight',
      reps: ['12', '10'],
    })
    expect(prescriptionForWeek(plan, 6)).toMatchObject({
      technique: 'straight',
      sets: 2,
      reps: ['12', '10'],
    })
    for (const week of [1, 2, 3, 4, 5]) {
      expect(prescriptionForWeek(plan, week)).toEqual(plan)
    }
  })

  it('removes a 4-5 rep reverse-pyramid top set in weeks 1 and 6', () => {
    const plan = exercise({ technique: 'reverse-pyramid', reps: ['5', '8', '10', '12'] })

    expect(prescriptionForWeek(plan, 1, { beginnerIntro: true })).toMatchObject({
      sets: 4,
      reps: ['8', '8', '10', '12'],
    })
    expect(prescriptionForWeek(plan, 6)).toMatchObject({
      sets: 2,
      reps: ['8', '10'],
    })
    for (const week of [1, 2, 3, 4, 5]) {
      expect(prescriptionForWeek(plan, week)).toEqual(plan)
    }
  })

  it('removes any reverse-pyramid top set during a deload', () => {
    expect(prescriptionForWeek(
      exercise({ technique: 'reverse-pyramid', reps: ['8', '10', '12', '15'] }),
      6
    )).toMatchObject({ sets: 2, reps: ['10', '12'] })
  })

  it('preserves superset structure in intro and deload weeks', () => {
    const plan = exercise({ technique: 'superset', sets: 3 })

    expect(prescriptionForWeek(plan, 1, { beginnerIntro: true })).toMatchObject({ technique: 'superset', sets: 3 })
    expect(prescriptionForWeek(plan, 6)).toMatchObject({ technique: 'superset', sets: 2 })
    for (const week of [1, 2, 3, 4, 5]) {
      expect(prescriptionForWeek(plan, week)).toEqual(plan)
    }
  })

  it.each([
    'Rest-pause after the last set.',
    'Myo-reps on the final set.',
    'Add lengthened partials.',
    'Heavy top set, then back-off sets.',
  ])('replaces technique note "%s" in week 1 and deload', (notes) => {
    const plan = exercise({ notes })

    expect(prescriptionForWeek(plan, 1, { beginnerIntro: true }).notes).toBe(
      'Week 1: straight sets, 3-second lowering, 2-3 reps in reserve.'
    )
    expect(prescriptionForWeek(plan, 6).notes).toBe(
      'Deload: same weights, half the sets, 3+ reps in reserve.'
    )
    for (const week of [1, 2, 3, 4, 5]) {
      expect(prescriptionForWeek(plan, week)).toEqual(plan)
    }
  })

  it('does not replace tempo notes', () => {
    const plan = exercise({ notes: 'Use a controlled tempo with a 3-second lowering.' })
    expect(prescriptionForWeek(plan, 1, { beginnerIntro: true }).notes).toBe(plan.notes)
  })
})

// PT-approved test cases T64–T72 from docs/fitness/approved/2026-10-19-reverse-pyramid-after-strong-b.md.
import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { recommend, type LoggedSet, type SessionEvidence } from './engine'
import { buildWorkoutSummary } from './summary'

const rng = (min: number, max = min) => ({ min, max })
const session = (
  date: string,
  weight: number,
  reps: number[],
  extra: Partial<SessionEvidence> = {}
): SessionEvidence => ({
  date,
  sets: reps.map((count) => ({ weight, reps: count })),
  ...extra,
})
const reversePyramid = {
  today: '2026-10-19',
  target: rng(8, 12),
  sets: 3,
  equipment: 'plate-loaded',
  technique: 'reverse-pyramid',
  setReps: [8, 10, 12],
}
const t64History = [
  session('2026-10-15', 35, [12, 12, 12], {
    dayKey: 'day-b', target: rng(10), technique: 'straight',
  }),
]

describe('R25 reverse-pyramid cross-day evidence', () => {
  it('T64 applies the cross-day top and back-off floors', () => {
    const result = recommend({ ...reversePyramid, history: t64History, dayKey: 'day-a' })
    expect(result).toMatchObject({ setWeights: [37.5, 35, 35], action: 'increase_weight' })
  })

  it('T65 keeps the prior result when the latest session only reached its target', () => {
    const result = recommend({
      ...reversePyramid,
      history: [session('2026-10-15', 35, [10, 10, 10], { target: rng(10), technique: 'straight' })],
    })
    expect(result).toMatchObject({ setWeights: [35, 32.5, 30], action: 'maintain' })
  })

  it('T66 caps the cross-day estimate at 12 reps and applies R12b', () => {
    const result = recommend({
      ...reversePyramid,
      history: [session('2026-10-15', 35, [15, 15, 15], { target: rng(10), technique: 'straight' })],
    })
    expect(result.setWeights).toEqual([37.5, 35, 35])
  })

  it('keeps the 28-day top-set proof floor within the R12b cap', () => {
    const result = recommend({
      ...reversePyramid,
      history: [
        session('2026-10-15', 35, [10, 10, 10], { target: rng(10), technique: 'straight' }),
        session('2026-10-12', 40, [8], { target: rng(8), technique: 'straight' }),
      ],
    })
    expect(result.setWeights?.[0]).toBe(35)
  })

  it('T67 preserves the approved reverse-pyramid result for a tagged RP session', () => {
    const result = recommend({
      ...reversePyramid,
      history: [session('2026-10-15', 30, [12, 12, 8], {
        target: rng(8, 12), technique: 'reverse-pyramid', setReps: [8, 10, 12],
      })],
    })
    expect(result).toMatchObject({ setWeights: [30, 27.5, 27.5], action: 'maintain' })
  })

  it('T68 keeps deload loads ahead of R25', () => {
    const result = recommend({ ...reversePyramid, history: t64History, deload: true })
    expect(result).toMatchObject({ action: 'deload', reason: 'deload_week', sets: 2, setWeights: [35, 35] })
  })

  it('T69 preserves the two-miss drop without restoring cross-day floors', () => {
    const history = ['2026-10-15', '2026-10-12'].map((date) => ({
      date,
      target: rng(8, 12),
      technique: 'reverse-pyramid',
      setReps: [8, 10, 12],
      sets: [
        { weight: 40, reps: 6 },
        { weight: 37.5, reps: 8 },
        { weight: 35, reps: 10 },
      ],
    }))
    const result = recommend({ ...reversePyramid, history })
    expect(result).toMatchObject({ setWeights: [37.5, 35, 32.5], action: 'decrease_weight', reason: 'below_target_twice' })
  })

  it('T70 ignores old and deload evidence for R25 back-off floors', () => {
    const baseline = recommend({
      ...reversePyramid,
      history: [session('2026-10-15', 35, [10, 10, 10], { target: rng(10), technique: 'straight' })],
    })
    const withExcludedEvidence = recommend({
      ...reversePyramid,
      history: [
        session('2026-10-15', 35, [10, 10, 10], { target: rng(10), technique: 'straight' }),
        session('2026-09-14', 40, [15, 15, 15], { target: rng(10), technique: 'straight' }),
        session('2026-10-17', 40, [15, 15, 15], { target: rng(10), technique: 'straight', deload: true }),
      ],
    })
    expect(withExcludedEvidence.setWeights).toEqual(baseline.setWeights)
  })

  it('T71 does not use the first set of a reverse-pyramid session as a back-off floor', () => {
    const history = [
      session('2026-10-15', 35, [12, 12, 12], { target: rng(10), technique: 'straight' }),
      {
        date: '2026-10-12',
        target: rng(8, 12),
        technique: 'straight',
        setReps: [8, 10, 12],
        sets: [
          { weight: 37.5, reps: 10 },
          { weight: 35, reps: 8 },
          { weight: 32.5, reps: 8 },
        ],
      },
    ]
    const result = recommend({ ...reversePyramid, history })
    expect(result.setWeights).toEqual([37.5, 35, 35])
  })

  it('applies cross-day back-off floors even when the latest session is a reverse pyramid', () => {
    const history = [
      {
        date: '2026-10-15',
        target: rng(8, 12),
        technique: 'reverse-pyramid',
        setReps: [8, 10, 12],
        sets: [
          { weight: 40, reps: 8 },
          { weight: 37.5, reps: 10 },
          { weight: 35, reps: 12 },
        ],
      },
      session('2026-10-12', 40, [12, 12, 12], { target: rng(10), technique: 'straight' }),
    ]
    const result = recommend({ ...reversePyramid, history })
    expect(result.setWeights).toEqual([42.5, 40, 40])
  })

  it('compares a direct R1.1 action with the previous top set, not back-off loads', () => {
    const result = recommend({
      ...reversePyramid,
      history: [{
        date: '2026-10-15',
        target: rng(8, 12),
        technique: 'reverse-pyramid',
        setReps: [8, 10, 12],
        sets: [
          { weight: 40, reps: 7 },
          { weight: 37.5, reps: 10 },
          { weight: 35, reps: 12 },
        ],
      }],
    })
    expect(result).toMatchObject({ weight: 40, action: 'maintain' })
  })

  it('T72 shows the R25 recommendation in the next-workout preview', () => {
    const exerciseId = 'plate-loaded-t-bar-row-chest-supported'
    const plan = (day: string, position: number, technique: 'straight' | 'reverse-pyramid', reps: string[]) => ({
      code: day,
      position,
      exerciseId,
      sets: 3,
      reps,
      restSeconds: 90,
      technique,
    })
    const block: TrainingBlock = {
      id: 'block',
      number: 6,
      name: 'Block',
      method: 'straight',
      startDate: '2026-10-05',
      weeks: 6,
      origin: 'pt',
      summary: '',
      insights: [],
      days: [
        { key: 'day-a', position: 1, name: 'Monday', exercises: [plan('A', 1, 'reverse-pyramid', ['8', '10', '12'])] },
        { key: 'day-b', position: 4, name: 'Thursday', exercises: [plan('B', 4, 'straight', ['10'])] },
      ],
    }
    const entry = (id: string, date: string): WorkoutEntry => ({
      id,
      exerciseId,
      date,
      blockId: block.id,
      dayKey: 'day-b',
      sets: [1, 2, 3].map((index) => ({ id: `${id}-${index}`, weight: 35, reps: 12 })),
      target: { sets: 3, reps: rng(10), technique: 'straight' },
    })
    const today = entry('thursday', '2026-10-15')
    const catalogue: Exercise[] = [{
      id: exerciseId, name: 'Chest-supported T-bar row', primaryMuscle: 'back', equipment: 'plate-loaded',
    }]
    const [row] = buildWorkoutSummary([today], [today], [block], catalogue, today.date)
    expect(row?.next).toMatchObject({ setWeights: [37.5, 35, 35], action: 'increase_weight' })
    expect(row?.nextDate).toBe('2026-10-19')
  })
})

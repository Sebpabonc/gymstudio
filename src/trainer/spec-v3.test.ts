// PT-approved test cases T53–T63 from docs/fitness/approved/2026-10-13-engine-same-day-evidence.md.
import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { buildEvidence } from './evidence'
import { recommend, type LoggedSet, type SessionEvidence } from './engine'
import { buildWorkoutSummary } from './summary'

const s = (weight: number, reps: number): LoggedSet => ({ weight, reps })
const rng = (min: number, max = min) => ({ min, max })
const sess = (date: string, sets: LoggedSet[], extra: Partial<SessionEvidence> = {}): SessionEvidence => ({
  date, sets, ...extra,
})
const flat = (weight: number, reps: number[]) => reps.map((count) => s(weight, count))
const today = '2026-10-15'
const inclinePyramid = {
  today,
  target: rng(10, 14),
  sets: 3,
  equipment: 'dumbbell',
  technique: 'pyramid',
  setReps: [14, 12, 10],
}

describe('R20–R24 approved progression evidence', () => {
  const inclineHistory = [
    sess('2026-10-12', flat(30, [10, 8, 8]), { dayKey: 'day-a', target: rng(6, 8), technique: 'straight' }),
    sess('2026-10-08', flat(28, [14, 12, 12]), { dayKey: 'day-b', target: rng(12, 14), technique: 'straight' }),
  ]

  it('T53 uses latest any-day evidence and achieved-load floors for each pyramid set', () => {
    const result = recommend({ ...inclinePyramid, history: inclineHistory, dayKey: 'day-b' })
    expect(result.setWeights).toEqual([28, 28, 30])
    expect(result).toMatchObject({ action: 'increase_weight', reason: 'achieved_floor', evidence: { lastDate: '2026-10-12' } })
  })

  it('T54 boosts from a successful same-day session, capped at the latest session load', () => {
    const result = recommend({
      today: '2026-10-16',
      dayKey: 'day-b',
      history: [
        sess('2026-10-13', flat(25, [10, 8, 8]), { dayKey: 'day-a', target: rng(8), technique: 'straight' }),
        sess('2026-10-09', flat(22.5, [12, 12, 12]), { dayKey: 'day-b', target: rng(12), technique: 'straight' }),
      ],
      target: rng(10), sets: 3, equipment: 'smith-machine',
    })
    expect(result).toMatchObject({ weight: 25, action: 'increase_weight', reason: 'same_day_boost' })
  })

  it('T55 keeps the latest load when at least half the working sets reach the new target', () => {
    const result = recommend({
      today, history: [sess('2026-10-12', flat(25, [10, 10, 8]), { target: rng(8), technique: 'straight' })],
      target: rng(10), sets: 3, equipment: 'smith-machine',
    })
    expect(result).toMatchObject({ weight: 25, action: 'maintain' })
  })

  it('T56 recalculates from the median when fewer than half the sets reach the target', () => {
    const result = recommend({
      today, history: [sess('2026-10-12', flat(25, [10, 8, 8]), { target: rng(8), technique: 'straight' })],
      target: rng(10), sets: 3, equipment: 'smith-machine',
    })
    expect(result).toMatchObject({ weight: 22.5, action: 'maintain' })
  })

  it('T57 keeps the approved whole-series rep-range floor for dumbbell bench', () => {
    const result = recommend({
      today, history: [sess('2026-10-12', flat(30, [12, 10, 10]), { target: rng(10), technique: 'straight' })],
      target: rng(12), sets: 3, equipment: 'dumbbell',
    })
    expect(result).toMatchObject({ weight: 28, action: 'maintain', reason: 'converted_rep_range' })
  })

  it('T57b applies the same-day boost when the same-day session reaches the target', () => {
    const result = recommend({
      today, dayKey: 'day-b',
      history: [
        sess('2026-10-12', flat(30, [12, 10, 10]), { dayKey: 'day-a', target: rng(10), technique: 'straight' }),
        sess('2026-10-08', flat(28, [12, 12, 12]), { dayKey: 'day-b', target: rng(12), technique: 'straight' }),
      ],
      target: rng(12), sets: 3, equipment: 'dumbbell',
    })
    expect(result).toMatchObject({ weight: 30, reason: 'same_day_boost' })
  })

  it('T58 fills a built pyramid so each earlier set is within one step of the next', () => {
    const result = recommend({
      ...inclinePyramid,
      history: [sess('2026-10-12', flat(30, [10, 8, 8]), { dayKey: 'day-a', target: rng(6, 8), technique: 'straight' })],
    })
    expect(result.setWeights).toEqual([26, 28, 30])
  })

  it('T59 gives deload loads priority over achieved floors', () => {
    const result = recommend({ ...inclinePyramid, history: inclineHistory, deload: true })
    expect(result).toMatchObject({ action: 'deload', reason: 'deload_week', sets: 2, setWeights: [30, 30] })
  })

  it('T60 ignores achieved-load candidates older than 28 days and deload sessions', () => {
    const baseline = recommend({ ...inclinePyramid, history: inclineHistory })
    const withStale = recommend({
      ...inclinePyramid,
      history: [
        ...inclineHistory,
        sess('2026-09-10', flat(32, [14, 14, 14]), { target: rng(14), technique: 'straight' }),
        sess('2026-10-14', flat(34, [14, 14, 14]), { target: rng(14), technique: 'straight', deload: true }),
      ],
    })
    expect(withStale.setWeights).toEqual(baseline.setWeights)
  })

  it('T61 uses the same recommendation for the next-day summary as the engine', () => {
    const block: TrainingBlock = {
      id: 'block',
      number: 1,
      name: 'Block',
      method: 'straight',
      startDate: '2026-10-12',
      weeks: 6,
      origin: 'pt',
      summary: '',
      insights: [],
      days: [
        { key: 'day-a', position: 1, name: 'Monday', exercises: [{ code: 'I', position: 1, exerciseId: 'incline', sets: 3, reps: ['8'], restSeconds: 90, technique: 'straight' }] },
        { key: 'day-b', position: 4, name: 'Thursday', exercises: [{ code: 'I', position: 1, exerciseId: 'incline', sets: 3, reps: ['14', '12', '10'], restSeconds: 90, technique: 'pyramid' }] },
      ],
    }
    const entry = (id: string, date: string, dayKey: string, reps: number[]): WorkoutEntry => ({
      id, exerciseId: 'incline', date, blockId: block.id, dayKey,
      sets: reps.map((count, index) => ({ id: `${id}-${index}`, weight: date === '2026-10-08' ? 28 : 30, reps: count })),
      target: { sets: 3, reps: date === '2026-10-08' ? rng(12, 14) : rng(6, 8) },
    })
    const monday = entry('monday', '2026-10-12', 'day-a', [10, 8, 8])
    const history = [monday, entry('thursday', '2026-10-08', 'day-b', [14, 12, 12])]
    const catalogue: Exercise[] = [{ id: 'incline', name: 'Incline DB Press', primaryMuscle: 'chest', equipment: 'dumbbell' }]
    const [row] = buildWorkoutSummary([monday], history, [block], catalogue, monday.date)
    expect(row?.next.setWeights).toEqual([28, 28, 30])
    expect(row?.next.action).toBe('increase_weight')
  })

  it('T62 exposes only the latest any-day session as primary evidence', () => {
    const block: TrainingBlock = {
      id: 'smith-block', number: 1, name: 'Block', method: 'straight', startDate: '2026-10-05', weeks: 6,
      origin: 'pt', summary: '', insights: [],
      days: ['day-a', 'day-b'].map((key, index) => ({
        key, position: index ? 4 : 1, name: key,
        exercises: [{ code: 'S', position: 1, exerciseId: 'smith', sets: 3, reps: [index ? '12' : '8'], restSeconds: 90, technique: 'straight' }],
      })),
    }
    const entry = (id: string, date: string, dayKey: string, weight: number, reps: number[]): WorkoutEntry => ({
      id, exerciseId: 'smith', date, blockId: block.id, dayKey,
      sets: reps.map((count, index) => ({ id: `${id}-${index}`, weight, reps: count })),
      target: { sets: 3, reps: rng(dayKey === 'day-a' ? 8 : 12) },
    })
    const evidence = buildEvidence([
      entry('monday', '2026-10-13', 'day-a', 25, [10, 8, 8]),
      entry('friday', '2026-10-09', 'day-b', 22.5, [12, 12, 12]),
    ], 'smith', [block], '2026-10-16', 'day-b')
    const result = recommend({
      today: '2026-10-16',
      target: rng(10), sets: 3, equipment: 'smith-machine',
      history: evidence,
    })
    expect(result.evidence).toMatchObject({ lastDate: '2026-10-13', lastWeight: 25, lastReps: [10, 8, 8] })
    expect(evidence[0]).toMatchObject({
      dayKey: 'day-a',
      date: '2026-10-13',
      sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 8 }, { weight: 25, reps: 8 }],
    })
  })

  it('T63 preserves the R19 miss-drop instead of restoring a higher achieved floor', () => {
    const result = recommend({
      today,
      history: [sess('2026-10-12', flat(12, [15, 14, 14]), { target: rng(15), technique: 'straight' })],
      target: rng(20), sets: 3, equipment: 'dumbbell',
    })
    expect(result).toMatchObject({ weight: 10, action: 'maintain' })
  })

})

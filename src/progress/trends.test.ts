import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { liftTrend, liftTrendEvidence, liftTrendIndexPoints } from './trends'
import { compareLiftSessions, latestEquivalentComparisons } from './index'
import type { ProgressEntry } from './types'
import { worthReason } from '../screens/ProgressScreen'
import { createTranslator } from '../i18n/translate'

const block: TrainingBlock = {
  id: 'b1',
  number: 1,
  name: 'Block 1',
  method: 'flat-pyramid',
  startDate: '2026-01-05',
  weeks: 12,
  origin: 'coach',
  summary: '',
  insights: [],
  days: [],
}

const bench: Exercise = {
  id: 'bench',
  name: 'Bench press',
  primaryMuscle: 'Chest',
  mechanic: 'compound',
  movementPattern: 'push horizontal',
  equipment: 'barbell',
}

const raise: Exercise = {
  id: 'raise',
  name: 'Lateral raise',
  primaryMuscle: 'Side Delts',
  mechanic: 'isolation',
  movementPattern: 'isolation',
  equipment: 'dumbbells',
}

function makeEntry(date: string, value: number, exercise = bench, options: {
  blockId?: string
  dayKey?: string
  reps?: number
  sets?: number
} = {}): ProgressEntry {
  const reps = options.reps ?? 3
  const weight = value / (1 + reps / 30)
  return {
    id: `${exercise.id}-${date}-${options.dayKey ?? 'a'}`,
    exerciseId: exercise.id,
    date,
    blockId: options.blockId ?? 'b1',
    dayKey: options.dayKey ?? 'day-a',
    sets: Array.from({ length: options.sets ?? 1 }, (_, index) => ({
      id: `${exercise.id}-${date}-${index}`,
      weight,
      reps,
    })),
  }
}

function analyze(entries: ProgressEntry[], exercise = bench, active = block) {
  return liftTrend(entries, [block], exercise, 'all', active, '2026-04-01')
}

describe('Progress v3 lift trends', () => {
  it('T109: three unchanged equivalent zero-RIR sessions do not create a stale-best flag', () => {
    const entries = ['2026-01-05', '2026-01-12', '2026-01-19'].map((date) => ({
      ...makeEntry(date, 60, bench, { reps: 10, sets: 3 }),
      sets: Array.from({ length: 3 }, (_, index) => ({ id: `${date}-${index}`, weight: 45, reps: 10, rir: 0 })),
    }))
    const trend = analyze(entries)
    expect(trend.points).toHaveLength(3)
    expect(trend.worthLookingAt).toBeNull()
    expect(worthReason(trend, trend.points, bench, [block], createTranslator('en'), 'en')).toBeNull()
    expect(trend.points.map((point) => point.e1rm)).toEqual([60, 60, 60])
    expect(trend.points.slice(1).map((point, index) =>
      compareLiftSessions(trend.points[index], point, bench).verdict
    )).toEqual(['held', 'held'])
    expect(latestEquivalentComparisons(entries, [block], [bench])).toMatchObject([{
      exerciseId: 'bench',
      session: { date: '2026-01-19' },
      previous: { date: '2026-01-12' },
      comparison: { verdict: 'held', improvedSets: 0, droppedSets: 0, heldSets: 3 },
    }])
    expect(entries.flatMap((item) => item.sets.map((set) => set.rir))).toEqual(Array(9).fill(0))
  })

  it('T109: dropped and mixed equivalent verdicts survive when RIR is absent', () => {
    const entries = [
      ['2026-01-05', [10, 10, 10]],
      ['2026-01-12', [9, 9, 9]],
      ['2026-01-19', [10, 8, 9]],
    ] as const
    const history = entries.map(([date, reps]) => ({
      ...makeEntry(date, 60, bench, { reps: 10, sets: 3 }),
      sets: reps.map((count, index) => ({ id: `${date}-${index}`, weight: 45, reps: count })),
    }))
    const trend = analyze(history)
    const comparisons = trend.points.slice(1).map((point, index) =>
      compareLiftSessions(trend.points[index], point, bench))
    expect(comparisons).toMatchObject([
      { verdict: 'dropped', droppedSets: 3, improvedSets: 0, heldSets: 0 },
      { verdict: 'mixed', droppedSets: 1, improvedSets: 1, heldSets: 1 },
    ])
    expect(latestEquivalentComparisons(history.slice(0, 2), [block], [bench])).toMatchObject([{
      comparison: { verdict: 'dropped', droppedSets: 3, improvedSets: 0, heldSets: 0 },
    }])
    expect(latestEquivalentComparisons(history, [block], [bench])).toMatchObject([{
      comparison: { verdict: 'mixed', droppedSets: 1, improvedSets: 1, heldSets: 1 },
    }])
    expect(trend.worthLookingAt).toBeNull()
    for (const language of ['en', 'es'] as const) {
      const t = createTranslator(language)
      expect(worthReason(trend, trend.points, bench, [block], t, language)).toBe(t('progress.v3.worth.dropped'))
    }
    expect(trend.points.every((point) => point.sets.every((set) => set.rir === undefined))).toBe(true)
  })

  it('computes a trailing three-session average, OLS weekly rate, and early confidence', () => {
    const trend = analyze([
      makeEntry('2026-01-05', 60),
      makeEntry('2026-01-12', 61),
      makeEntry('2026-01-19', 62),
      makeEntry('2026-01-26', 63),
    ])
    expect(trend.verdict).toBe('improving')
    expect(trend.kgPerWeek).toBe(1)
    expect(trend.percentPerWeek).toBeCloseTo(1.6, 1)
    expect(trend.confidence).toBe('early')
    expect(trend.points.map((point) => point.movingAverage)).toEqual([null, null, 61, 62])
  })

  it('withholds a verdict and rate before four sessions spanning fourteen days', () => {
    const trend = analyze([
      makeEntry('2026-01-05', 60),
      makeEntry('2026-01-12', 61),
      makeEntry('2026-01-19', 62),
    ])
    expect(trend.verdict).toBe('not-enough-data')
    expect(trend.kgPerWeek).toBeNull()
    expect(trend.percentPerWeek).toBeNull()
  })

  it('keeps the strict two-percent boundary flat while allowing a directionless rate', () => {
    const flat = analyze([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 100),
      makeEntry('2026-01-19', 98),
      makeEntry('2026-01-26', 98),
    ])
    expect(flat.verdict).toBe('held')
    expect(flat.percentPerWeek).not.toBeNull()
  })

  it('shows deloads as hollow points but excludes them from averages and verdicts', () => {
    const noDeload = analyze([
      makeEntry('2026-01-05', 60),
      makeEntry('2026-01-12', 61),
      makeEntry('2026-02-16', 62),
      makeEntry('2026-02-23', 63),
    ])
    const withDeload = analyze([
      makeEntry('2026-01-05', 60),
      makeEntry('2026-01-12', 61),
      makeEntry('2026-02-09', 20),
      makeEntry('2026-02-16', 62),
      makeEntry('2026-02-23', 63),
    ])
    expect(withDeload.points.find((point) => point.date === '2026-02-09')?.deload).toBe(true)
    expect(withDeload.verdict).toBe(noDeload.verdict)
    expect(withDeload.changePercent).toBeCloseTo(noDeload.changePercent as number)
  })

  it('marks only strict new bests after the first baseline and reports a factual stale best', () => {
    const trend = analyze([
      makeEntry('2026-01-05', 60),
      makeEntry('2026-01-12', 60),
      makeEntry('2026-01-19', 62),
      makeEntry('2026-01-26', 62),
      makeEntry('2026-02-02', 61),
      makeEntry('2026-02-09', 60),
      makeEntry('2026-02-16', 59),
      makeEntry('2026-02-23', 58),
    ])
    expect(trend.points.slice(0, 4).map((point) => point.isBest)).toEqual([false, false, true, false])
    expect(trend.worthLookingAt).toEqual({ date: '2026-01-19', sessions: 4 })
  })

  it('breaks the moving-average line after a long gap while keeping the slope data', () => {
    const trend = analyze([
      makeEntry('2026-01-05', 60),
      makeEntry('2026-01-12', 61),
      makeEntry('2026-02-02', 62),
      makeEntry('2026-02-03', 63),
    ])
    expect(trend.points[2].breakDays).toBe(21)
    expect(trend.points[2].movingAverage).toBeNull()
    expect(trend.points[3].movingAverage).toBeNull()
    expect(trend.kgPerWeek).not.toBeNull()
  })

  it('tracks high-rep work using equivalent sessions, top-load reps, and equipment steps', () => {
    const entries = [
      ...[45, 47, 51].map((repsAtTop, index) => ({
        ...makeEntry(`2026-01-${String(5 + index * 7).padStart(2, '0')}`, 8, raise, { reps: 15 }),
        sets: [{ id: `s${index}a`, weight: 8, reps: Math.floor(repsAtTop / 3) },
          { id: `s${index}b`, weight: 8, reps: Math.floor(repsAtTop / 3) },
          { id: `s${index}c`, weight: 8, reps: repsAtTop - 2 * Math.floor(repsAtTop / 3) }],
      })),
      makeEntry('2026-01-08', 8, raise, { dayKey: 'day-b', reps: 15 }),
    ]
    const trend = analyze(entries, raise)
    expect(trend.highRep).toBe(true)
    expect(trend.points.map((point) => point.repsAtTop)).toEqual([45, 47, 51])
    expect(trend.verdict).toBe('improving')
  })

  it('indexes high-rep points for charts and restarts their line when the load changes', () => {
    const entries = [45, 47, 40, 44].map((repsAtTop, index) => {
      const date = `2026-01-${String(5 + index * 7).padStart(2, '0')}`
      const reps = Math.floor(repsAtTop / 3)
      return {
        ...makeEntry(date, 8, raise, { reps: 15 }),
        sets: Array.from({ length: 3 }, (_, setIndex) => ({
          id: `${date}-${setIndex}`,
          weight: index < 2 ? 8 : 10,
          reps: setIndex === 2 ? repsAtTop - 2 * reps : reps,
        })),
      }
    })
    const trend = analyze(entries, raise)
    const points = liftTrendIndexPoints(trend, raise)

    expect(trend.highRep).toBe(true)
    expect(trend.points.every((point) => point.e1rm === null)).toBe(true)
    expect(liftTrendEvidence(trend)).toMatchObject({
      first: { repsAtTop: 45 },
      last: { repsAtTop: 44 },
    })
    expect(points[0].value).toBe(0)
    expect(points[1].value).toBeCloseTo((47 / 45 - 1) * 100)
    expect(points[2].value).toBe(0)
    expect(points[3].value).toBeCloseTo(10)
    expect(points.map((point) => point.breakBefore)).toEqual([false, false, true, false])
    expect(points[points.length - 1].latest).toBe(true)
  })

  it('does not provide verdict evidence from a single session', () => {
    const trend = analyze([makeEntry('2026-01-05', 60)])
    expect(liftTrendEvidence(trend)).toBeNull()
  })

  it('keeps exercise swaps in separate exercise-id series and marks the new lift baseline', () => {
    const swapped = { ...bench, id: 'incline-db', equipment: 'dumbbells' }
    const oldTrend = analyze([makeEntry('2026-01-05', 60), makeEntry('2026-01-12', 61)])
    const newTrend = analyze([makeEntry('2026-01-19', 62, swapped)], swapped)
    expect(oldTrend.points).toHaveLength(2)
    expect(newTrend.points).toHaveLength(1)
    expect(newTrend.verdict).toBe('not-enough-data')
  })
})

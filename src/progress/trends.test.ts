import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { liftTrend, liftTrendIndexPoints } from './trends'
import type { ProgressEntry } from './types'

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
    expect(points[0].value).toBe(0)
    expect(points[1].value).toBeCloseTo((47 / 45 - 1) * 100)
    expect(points[2].value).toBe(0)
    expect(points[3].value).toBeCloseTo(10)
    expect(points.map((point) => point.breakBefore)).toEqual([false, false, true, false])
    expect(points[points.length - 1].latest).toBe(true)
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

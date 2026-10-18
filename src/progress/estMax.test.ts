import { describe, expect, it } from 'vitest'
import type { TrainingBlock, WorkoutEntry } from '../types'
import { anyDayEstMaxComparison, roundEstMax, weeklyBestEstMax } from './estMax'
import { progressLiftSessions } from './trends'

const block: TrainingBlock = {
  id: 'block',
  number: 1,
  name: 'Block',
  method: 'flat',
  startDate: '2026-10-05',
  weeks: 6,
  origin: 'pt',
  summary: '',
  insights: [],
  days: [
    { key: 'chest-back-a', position: 1, name: 'Chest & Back A', exercises: [] },
    { key: 'chest-back-b', position: 2, name: 'Chest & Back B', exercises: [] },
    { key: 'shoulders-arms-a', position: 3, name: 'Shoulders & Arms A', exercises: [] },
    { key: 'shoulders-arms-b', position: 4, name: 'Shoulders & Arms B', exercises: [] },
  ],
}

function entry(
  date: string,
  weight: number,
  reps: number,
  dayKey: string,
  options: { rir?: number; id?: string; blockId?: string } = {}
): WorkoutEntry {
  return {
    id: options.id ?? `${date}-${dayKey}`,
    exerciseId: 'lift',
    date,
    blockId: options.blockId ?? 'block',
    dayKey,
    sets: [{ id: `${date}-${dayKey}-set`, weight, reps, rir: options.rir }],
  }
}

function compare(current: WorkoutEntry, previous: WorkoutEntry[], blocks = [block]) {
  return anyDayEstMaxComparison(current, previous, blocks)
}

describe('any-day Est. max comparison', () => {
  it('CD1: reports about the same within the three-percent band', () => {
    const result = compare(
      entry('2026-10-12', 30, 10, 'chest-back-a'),
      [entry('2026-10-08', 28, 12, 'chest-back-b')]
    )
    expect(result?.kind).toBe('comparison')
    if (result?.kind === 'comparison') {
      expect(result.previousValue).toBeCloseTo(39.2)
      expect(result.currentValue).toBe(40)
      expect(result.change).toBe('same')
    }
  })

  it('CD2: compares any day and rounds the displayed estimate to the nearest half kilogram', () => {
    const result = compare(
      entry('2026-10-13', 25, 10, 'shoulders-arms-a'),
      [entry('2026-10-09', 22.5, 12, 'shoulders-arms-b')]
    )
    expect(result?.kind).toBe('comparison')
    if (result?.kind === 'comparison') {
      expect(result.previousValue).toBeCloseTo(31.5)
      expect(result.currentValue).toBeCloseTo(33.333333333)
      expect(result.change).toBe('up')
      expect(roundEstMax(result.currentValue)).toBe(33.5)
    }
  })

  it('CD3: chooses the latest any-day session rather than the previous same-day session', () => {
    const result = compare(
      entry('2026-10-16', 25, 10, 'shoulders-arms-b'),
      [
        entry('2026-10-09', 22.5, 12, 'shoulders-arms-b'),
        entry('2026-10-13', 25, 10, 'shoulders-arms-a'),
      ]
    )
    expect(result).toMatchObject({ kind: 'comparison', previous: { date: '2026-10-13' }, change: 'same' })
  })

  it('CD4: keeps a lower cross-day estimate neutral and records the lighter-day context', () => {
    const result = compare(
      entry('2026-10-15', 28, 12, 'chest-back-b'),
      [entry('2026-10-12', 30, 12, 'chest-back-a')]
    )
    expect(result).toMatchObject({ kind: 'comparison', change: 'lower', currentDayType: 'B', previousDayType: 'A' })
  })

  it('CD5: identifies a lower estimate on the same day type', () => {
    const result = compare(
      entry('2026-10-19', 30, 10, 'chest-back-a'),
      [entry('2026-10-12', 30, 12, 'chest-back-a')]
    )
    expect(result).toMatchObject({ kind: 'comparison', change: 'lower', currentDayType: 'A', previousDayType: 'A' })
  })

  it('CD6: combines A and B sessions for the best of a complete week', () => {
    const sessions = progressLiftSessions([
      entry('2026-10-05', 26, 10, 'chest-back-a'),
      entry('2026-10-08', 28, 12, 'chest-back-b'),
      entry('2026-10-12', 30, 10, 'chest-back-a'),
      entry('2026-10-15', 30, 10, 'chest-back-b'),
    ], [block])
    const result = weeklyBestEstMax(sessions, 'lift', '2026-10-12', [block])
    expect(result.current?.value).toBe(40)
    expect(result.previous?.value).toBeCloseTo(39.2)
    expect(result.currentWeekComplete).toBe(true)
  })

  it('CD7: returns logged RIR values when they differ by at least two', () => {
    const result = compare(
      entry('2026-10-16', 25, 10, 'shoulders-arms-b', { rir: 3 }),
      [entry('2026-10-13', 25, 10, 'shoulders-arms-a', { rir: 1 })]
    )
    expect(result).toMatchObject({
      kind: 'comparison',
      previousRir: 1,
      currentRir: 3,
      effort: { before: 1, now: 3 },
    })
  })

  it('does not add an effort note for an RIR difference under two', () => {
    const result = compare(
      entry('2026-10-16', 25, 10, 'shoulders-arms-b', { rir: 2 }),
      [entry('2026-10-13', 25, 10, 'shoulders-arms-a', { rir: 1 })]
    )
    expect(result).toMatchObject({ kind: 'comparison', effort: null })
  })

  it('CD8: uses the different-rep-range message when an A/B session has no eligible set', () => {
    const result = compare(
      entry('2026-10-12', 15, 15, 'chest-back-a'),
      [entry('2026-10-08', 15, 20, 'chest-back-b')]
    )
    expect(result).toMatchObject({ kind: 'different-rep-range', previousDayType: 'B' })
  })

  it('CD9: ignores sessions older than 28 days', () => {
    expect(compare(
      entry('2026-10-12', 30, 10, 'chest-back-a'),
      [entry('2026-09-07', 28, 12, 'chest-back-b')]
    )).toBeNull()
  })

  it('CD10: compares a deload only with another deload', () => {
    expect(compare(
      entry('2026-11-09', 30, 10, 'chest-back-a'),
      [entry('2026-11-02', 28, 12, 'chest-back-b')]
    )).toBeNull()
  })

  it('CD11: keeps the percentage based on unrounded estimates', () => {
    const result = compare(
      entry('2026-10-12', 25, 10, 'chest-back-a'),
      [entry('2026-10-08', 24, 10, 'chest-back-b')]
    )
    expect(result?.kind).toBe('comparison')
    if (result?.kind === 'comparison') {
      expect(roundEstMax(result.currentValue)).toBe(33.5)
      expect(result.changePercent).toBeCloseTo(4.1666667)
    }
  })

  it('marks an incomplete week as still in progress', () => {
    const sessions = progressLiftSessions([entry('2026-10-12', 30, 10, 'chest-back-a')], [block])
    const result = weeklyBestEstMax(sessions, 'lift', '2026-10-12', [block])
    expect(result.currentWeekComplete).toBe(false)
    expect(result.current?.value).toBe(40)
  })
})

import { describe, expect, it } from 'vitest'
import { volumeTrendChange, volumeTrendPoints } from './volumeTrend'
import type { WorkoutEntry } from '../types'

const entry = (date: string, weight: number, reps: number[]) =>
  ({ id: date, date, exerciseId: 'x', sets: reps.map((r) => ({ weight, reps: r })) }) as unknown as WorkoutEntry

describe('volume trend', () => {
  it('orders oldest first and keeps the last N sessions', () => {
    const points = volumeTrendPoints([entry('2026-10-08', 10, [10]), entry('2026-10-01', 10, [8]), entry('2026-09-24', 10, [5])], 2)
    expect(points.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-08'])
    expect(points.map((p) => p.volume)).toEqual([80, 100])
  })
  it('computes % change first → last', () => {
    expect(volumeTrendChange([{ date: 'a', volume: 80 }, { date: 'b', volume: 100 }])).toBe(25)
    expect(volumeTrendChange([{ date: 'a', volume: 100 }])).toBeNull()
  })
})

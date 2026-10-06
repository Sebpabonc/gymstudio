import { describe, expect, it } from 'vitest'
import { equipmentStep, estimateCapacity, recommend, roundToStep, type SessionEvidence } from './engine'

const sets = (weight: number, ...reps: number[]) => reps.map((count) => ({ weight, reps: count }))
const range = (min: number, max = min) => ({ min, max })

describe('weights that exist', () => {
  it('uses 2 kg dumbbell steps and 2.5 kg elsewhere', () => {
    expect(equipmentStep('dumbbell')).toBe(2)
    expect(equipmentStep('barbell')).toBe(2.5)
    expect(roundToStep(28.5, 2, 'down')).toBe(28)
    expect(roundToStep(10.5, 2.5, 'up')).toBe(12.5)
  })
})

describe('recommend — same target as last time', () => {
  const base = { today: '2026-10-08', sets: 3, equipment: 'dumbbell' }

  it('target 10, actual 10 on every set → one step up', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(10, 10, 10, 10), target: range(10) }]
    expect(recommend({ ...base, history, target: range(10) })).toMatchObject({ action: 'increase_weight', weight: 12, reason: 'reached_top_of_range' })
  })

  it('target 10, actual 14 on every set → increase by capacity, capped to real weights', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(10, 14, 14, 14), target: range(10) }]
    const result = recommend({ ...base, history, target: range(10) })
    expect(result.action).toBe('increase_weight')
    expect(result.reason).toBe('exceeded_target')
    expect(result.weight).toBe(12)
    expect(result.evidence.lastReps).toEqual([14, 14, 14])
  })

  it('PO case: 26 kg × 12 on a heavy 8-rep day → 28 kg, never 28.5', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(26, 12, 12, 12), target: range(8) }]
    expect(recommend({ ...base, today: '2026-10-12', history, target: range(8) })).toMatchObject({ action: 'increase_weight', weight: 28 })
  })

  it('target 10, actual 7 on two sets once → maintain; twice in a row → reduce', () => {
    const once: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(20, 9, 7, 7), target: range(10) }]
    expect(recommend({ ...base, history: once, target: range(10) })).toMatchObject({ action: 'maintain', weight: 20, reason: 'below_target_once' })
    const twice: SessionEvidence[] = [...once, { date: '2026-10-01', sets: sets(20, 8, 7, 6), target: range(10) }]
    expect(recommend({ ...base, history: twice, target: range(10) })).toMatchObject({ action: 'decrease_weight', weight: 18, reason: 'below_target_twice' })
  })

  it('first set fine, later sets drop 3+ reps → maintain', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(8, 12, 9, 8), target: range(12) }]
    expect(recommend({ ...base, history, target: range(12) })).toMatchObject({ action: 'maintain', reason: 'drop_off_across_sets' })
  })

  it('inside the range without reaching the top → add reps, same weight', () => {
    const history: SessionEvidence[] = [
      { date: '2026-10-05', sets: sets(20, 11, 10, 10), target: range(10, 12) },
      { date: '2026-10-01', sets: sets(20, 11, 10, 10), target: range(10, 12) },
    ]
    expect(recommend({ ...base, history, target: range(10, 12) })).toMatchObject({ action: 'increase_reps', weight: 20 })
  })
})

describe('recommend — insufficient history, outliers, breaks, deload', () => {
  const base = { today: '2026-10-08', sets: 3, equipment: 'barbell' }

  it('no history → collect data with the planned weight', () => {
    expect(recommend({ ...base, history: [], target: range(10), plannedWeight: 40 })).toMatchObject({ action: 'collect_data', weight: 40, confidence: 'low' })
  })

  it('one extraordinary session is capped to a single step', () => {
    const history: SessionEvidence[] = [
      { date: '2026-10-06', sets: sets(40, 16, 15, 15), target: range(10) },
      { date: '2026-10-02', sets: sets(40, 10, 10, 9), target: range(10) },
      { date: '2026-09-29', sets: sets(40, 10, 9, 9), target: range(10) },
    ]
    const result = recommend({ ...base, history, target: range(10) })
    expect(result.weight).toBe(42.5)
    expect(result.reason).toBe('outlier_capped')
    expect(result.confidence).toBe('low')
  })

  it('three consistent sessions above the range → high confidence increase', () => {
    const history: SessionEvidence[] = [
      { date: '2026-10-06', sets: sets(40, 13, 13, 13), target: range(10) },
      { date: '2026-10-02', sets: sets(40, 13, 13, 13), target: range(10) },
      { date: '2026-09-29', sets: sets(40, 13, 12, 13), target: range(10) },
    ]
    const result = recommend({ ...base, history, target: range(10) })
    expect(result).toMatchObject({ action: 'increase_weight', confidence: 'high' })
    expect(result.weight).toBeGreaterThan(40)
    expect(result.weight! - 40).toBeLessThanOrEqual(5)
  })

  it('more than 3 weeks off → regress ~10 %', () => {
    const history: SessionEvidence[] = [{ date: '2026-09-10', sets: sets(40, 10, 10, 10), target: range(10) }]
    expect(recommend({ ...base, history, target: range(10) })).toMatchObject({ action: 'regress', weight: 35, reason: 'long_break' })
  })

  it('week 6 → deload: same load, half the sets', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-06', sets: sets(40, 10, 10, 10), target: range(10) }]
    expect(recommend({ ...base, history, target: range(10), deload: true })).toMatchObject({ action: 'deload', weight: 40, sets: 2 })
  })
})

describe('same-week adaptation and different rep ranges', () => {
  it('Monday 10 kg × 14 (target 10) → Thursday original 10 × 12 is too easy → 12 kg × 10-12', () => {
    const monday: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(10, 14, 14, 14), target: range(10) }]
    const thursday = recommend({ history: monday, today: '2026-10-08', target: range(12), sets: 3, equipment: 'dumbbell', plannedWeight: 10 })
    expect(thursday).toMatchObject({ action: 'increase_weight', weight: 12, reason: 'original_too_easy', reps: { min: 10, max: 12 } })
  })

  it('Monday 8-10 → Thursday 12-15 converts through capacity instead of copying the load', () => {
    const monday: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(30, 10, 10, 10), target: range(8, 10) }]
    const thursday = recommend({ history: monday, today: '2026-10-08', target: range(12, 15), sets: 3, equipment: 'dumbbell' })
    expect(thursday.reason).toBe('converted_rep_range')
    expect(thursday.weight).toBeLessThan(30)
    expect(thursday.weight).toBeGreaterThanOrEqual(24)
    expect(thursday.weight! % 2).toBe(0)
  })

  it('capacity uses every day the exercise appears, newest weighted most', () => {
    const capacity = estimateCapacity([
      { date: '2026-10-05', sets: sets(10, 14, 14, 14) },
      { date: '2026-10-01', sets: sets(10, 10, 10, 10) },
    ], '2026-10-08')
    expect(capacity!.oneRepMax).toBeGreaterThan(14)
    expect(capacity!.oneRepMax).toBeLessThan(14.7)
  })
})

describe('pyramids get a weight per set', () => {
  it('PO case: 26 kg × 12 on Day A → Day B pyramid 14·12·10 climbs instead of 26 across', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(26, 12, 12, 12), target: range(8) }]
    const result = recommend({
      history, today: '2026-10-08', target: range(10, 14), sets: 3, equipment: 'dumbbell',
      plannedWeight: 26, technique: 'pyramid', setReps: [14, 12, 10],
    })
    expect(result.setReps).toEqual([14, 12, 10])
    expect(result.setWeights).toEqual([24, 26, 28])
    expect(result.action).toBe('increase_weight')
    expect(result.setWeights![0]).toBeLessThan(result.setWeights![2])
    expect(result.setWeights!.every((weight) => weight % 2 === 0)).toBe(true)
    expect(result.setWeights![2]).toBeLessThanOrEqual(28)
  })

  it('straight sets keep one weight', () => {
    const history: SessionEvidence[] = [{ date: '2026-10-05', sets: sets(26, 12, 12, 12), target: range(8) }]
    expect(recommend({ history, today: '2026-10-08', target: range(8), sets: 3, equipment: 'dumbbell', technique: 'straight', setReps: [8, 8, 8] }).setWeights).toBeUndefined()
  })
})

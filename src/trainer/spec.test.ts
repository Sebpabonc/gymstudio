// PT-approved test cases T1–T29 from docs/fitness/approved/2026-10-07-progression-engine-spec.md.
import { describe, expect, it } from 'vitest'
import { recommend, type LoggedSet, type SessionEvidence } from './engine'

const TODAY = '2026-10-14'
const WEEK_AGO = '2026-10-07'
const s = (weight: number, reps: number, extra: Partial<LoggedSet> = {}): LoggedSet => ({ weight, reps, ...extra })
const rng = (min: number, max = min) => ({ min, max })
const sess = (sets: LoggedSet[], extra: Partial<SessionEvidence> = {}): SessionEvidence => ({ date: WEEK_AGO, sets, ...extra })

describe('R1 reverse pyramid / top set', () => {
  const base = { today: TODAY, target: rng(4, 6), sets: 4, equipment: 'smith-machine', technique: 'reverse-pyramid', setReps: [4, 6, 6, 6] }
  const rp = (top: number, topReps: number, date = WEEK_AGO) =>
    sess([s(top, topReps), s(90, 6), s(90, 6), s(90, 6)], { date, technique: 'reverse-pyramid', setReps: [4, 6, 6, 6] })

  it('T1 top set hit → 102.5, back-offs 90', () => {
    expect(recommend({ ...base, history: [rp(100, 4)] }).setWeights).toEqual([102.5, 90, 90, 90])
  })
  it('T2 one rep short → 100 / 90', () => {
    expect(recommend({ ...base, history: [rp(100, 3)] }).setWeights).toEqual([100, 90, 90, 90])
  })
  it('T3 two short twice → 95 / 85', () => {
    expect(recommend({ ...base, history: [rp(100, 2), rp(100, 2, '2026-10-03')] }).setWeights).toEqual([95, 85, 85, 85])
  })
  it('T4 8·10·12·15 → 62.5 / 57.5 / 55 / 47.5', () => {
    const history = [sess([s(60, 8), s(55, 10), s(50, 12), s(45, 15)], { technique: 'reverse-pyramid', setReps: [8, 10, 12, 15] })]
    expect(recommend({ history, today: TODAY, target: rng(8, 15), sets: 4, equipment: 'barbell', technique: 'reverse-pyramid', setReps: [8, 10, 12, 15] }).setWeights)
      .toEqual([62.5, 57.5, 55, 47.5])
  })
})

describe('R2 ascending pyramid', () => {
  const base = { today: TODAY, target: rng(10, 14), sets: 3, equipment: 'dumbbell', technique: 'pyramid', setReps: [14, 12, 10] }
  const pyr = (top: number, topReps: number) => sess([s(24, 14), s(26, 12), s(top, topReps)], { technique: 'pyramid', setReps: [14, 12, 10] })

  it('T5 all hit → 26 / 28 / 30', () => {
    expect(recommend({ ...base, history: [pyr(28, 10)] }).setWeights).toEqual([26, 28, 30])
  })
  it('T6 top 2 short (first time) → 24 / 26 / 28', () => {
    expect(recommend({ ...base, history: [pyr(28, 8)] }).setWeights).toEqual([24, 26, 28])
  })
  it('T7 no pyramid history, Day A 26×12 ×3 → 24 / 26 / 28', () => {
    const history = [sess([s(26, 12), s(26, 12), s(26, 12)], { target: rng(8), technique: 'straight' })]
    expect(recommend({ ...base, history }).setWeights).toEqual([24, 26, 28])
  })
  it('T8 barbell 15·12·10·8 from e1RM 50 (high confidence) → 32.5 / 35 / 37.5 / 40', () => {
    // Three consistent straight sessions at e1RM 50: 37.5 × 10 → 37.5 × (1 + 10/30) = 50.
    const history = ['2026-10-07', '2026-10-03', '2026-09-30'].map((date) =>
      sess([s(37.5, 10), s(37.5, 10), s(37.5, 10)], { date, target: rng(10), technique: 'straight' }))
    expect(recommend({ history, today: TODAY, target: rng(8, 15), sets: 4, equipment: 'barbell', technique: 'pyramid', setReps: [15, 12, 10, 8] }).setWeights)
      .toEqual([32.5, 35, 37.5, 40])
  })
})

describe('R3 drop-sets, rest-pause, myo-reps', () => {
  it('T9 mini-sets ignored → 12.5 kg belt', () => {
    const history = [sess([s(10, 10), s(10, 10), s(10, 10), s(10, 4, { tag: 'mini' }), s(10, 3, { tag: 'mini' })], { target: rng(10) })]
    expect(recommend({ history, today: TODAY, target: rng(10), sets: 3, equipment: 'bodyweight' }).weight).toBe(12.5)
  })
  it('T9b untagged extra rows beyond the planned count are ignored too', () => {
    const history = [sess([s(10, 10), s(10, 10), s(10, 10), s(10, 4), s(10, 3)], { target: rng(10) })]
    expect(recommend({ history, today: TODAY, target: rng(10), sets: 3, equipment: 'bodyweight' }).weight).toBe(12.5)
  })
  const drop = (main: number, reps: number, dropW: number, dropR: number) =>
    sess([0, 1, 2].map(() => s(main, reps, { drop: { weight: dropW, reps: dropR } })), { target: rng(12) })
  it('T10 machine 40×14 → main 45 reps 12, drop 30', () => {
    const result = recommend({ history: [drop(40, 14, 30, 12)], today: TODAY, target: rng(12), sets: 3, equipment: 'machine', technique: 'drop-set' })
    expect(result).toMatchObject({ weight: 45, reps: { min: 12, max: 12 }, dropWeight: 30 })
  })
  it('T11 machine 40×12 → main 40 (needs 14), drop 30', () => {
    const result = recommend({ history: [drop(40, 12, 30, 10)], today: TODAY, target: rng(12), sets: 3, equipment: 'machine', technique: 'drop-set' })
    expect(result).toMatchObject({ weight: 40, dropWeight: 30 })
  })
  it('T12 cable 50×12 → main 55, drop 40', () => {
    const result = recommend({ history: [drop(50, 12, 40, 12)], today: TODAY, target: rng(12), sets: 3, equipment: 'cable', technique: 'drop-set' })
    expect(result).toMatchObject({ weight: 55, dropWeight: 40 })
  })
})

describe('R4 deload', () => {
  it('T13 pyramid → 24×14, 26×12', () => {
    const history = [sess([s(24, 14), s(26, 12), s(28, 10)], { technique: 'pyramid', setReps: [14, 12, 10] })]
    const result = recommend({ history, today: TODAY, target: rng(10, 14), sets: 3, equipment: 'dumbbell', technique: 'pyramid', setReps: [14, 12, 10], deload: true })
    expect(result).toMatchObject({ sets: 2, setWeights: [24, 26], setReps: [14, 12] })
  })
  it('T14 reverse pyramid → 90×6, 90×6', () => {
    const history = [sess([s(100, 4), s(90, 6), s(90, 6), s(90, 6)], { technique: 'reverse-pyramid', setReps: [4, 6, 6, 6] })]
    const result = recommend({ history, today: TODAY, target: rng(4, 6), sets: 4, equipment: 'barbell', technique: 'reverse-pyramid', setReps: [4, 6, 6, 6], deload: true })
    expect(result).toMatchObject({ sets: 2, setWeights: [90, 90], setReps: [6, 6] })
  })
  it('T15 straight → 2 sets × 8 at 40', () => {
    const history = [sess([s(40, 10), s(40, 10), s(40, 10)], { target: rng(8, 10) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 3, equipment: 'barbell', deload: true }))
      .toMatchObject({ weight: 40, sets: 2, reps: { min: 8, max: 8 } })
  })
  it('T16 deload sessions are ignored next block → 42.5', () => {
    const history = [
      sess([s(40, 8), s(40, 8)], { target: rng(8, 10), deload: true }),
      sess([s(40, 10), s(40, 10), s(40, 10)], { date: '2026-09-30', target: rng(8, 10) }),
    ]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 3, equipment: 'barbell' }).weight).toBe(42.5)
  })
})

describe('R5 double angle', () => {
  it('T17 C2 follows C1 today; C2 sessions ignored on other days', () => {
    expect(recommend({ history: [], today: TODAY, target: rng(8), sets: 2, equipment: 'dumbbell', followLoad: 26 }))
      .toMatchObject({ weight: 26, reason: 'double_angle' })
    const history = [
      sess([s(26, 6), s(26, 6)], { follower: true, target: rng(8) }),
      sess([s(30, 10), s(30, 10), s(30, 10)], { date: '2026-10-05', target: rng(8, 10) }),
    ]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 3, equipment: 'dumbbell' }).weight).toBe(32)
  })
})

describe('R6 incomplete sessions', () => {
  it('T18 2 of 4 sets at the top → 50 (no increase)', () => {
    const history = [sess([s(50, 10), s(50, 10)], { target: rng(8, 10) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 4, equipment: 'barbell' }).weight).toBe(50)
  })
})

describe('R7 bodyweight', () => {
  it('T19 12,12,12 → increase reps at 0 kg', () => {
    const history = [sess([s(0, 12), s(0, 12), s(0, 12)], { target: rng(8, 12) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 12), sets: 3, equipment: 'bodyweight' })).toMatchObject({ action: 'increase_reps', weight: 0 })
  })
  it('T20 14,14,14 twice → add 2.5 kg', () => {
    const history = [
      sess([s(0, 14), s(0, 14), s(0, 14)], { target: rng(8, 12) }),
      sess([s(0, 14), s(0, 14), s(0, 14)], { date: '2026-10-03', target: rng(8, 12) }),
    ]
    expect(recommend({ history, today: TODAY, target: rng(8, 12), sets: 3, equipment: 'bodyweight' })).toMatchObject({ action: 'increase_weight', weight: 2.5 })
  })
  it('T21 belt 10 kg × 12 → 12.5', () => {
    const history = [sess([s(10, 12), s(10, 12), s(10, 12)], { target: rng(8, 12) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 12), sets: 3, equipment: 'bodyweight' }).weight).toBe(12.5)
  })
})

describe('R8 light loads', () => {
  it('T22 lateral raise 8×15 → 8 kg, add reps', () => {
    const history = [sess([s(8, 15), s(8, 15), s(8, 15)], { target: rng(12, 15) })]
    expect(recommend({ history, today: TODAY, target: rng(12, 15), sets: 3, equipment: 'dumbbell' })).toMatchObject({ action: 'increase_reps', weight: 8 })
  })
  it('T23 lateral raise 8×17 → 10 kg, reps 12', () => {
    const history = [sess([s(8, 17), s(8, 17), s(8, 17)], { target: rng(12, 15) })]
    expect(recommend({ history, today: TODAY, target: rng(12, 15), sets: 3, equipment: 'dumbbell' })).toMatchObject({ weight: 10, reps: { min: 12, max: 12 } })
  })
  it('T24 machine 45×12 → 45, add reps', () => {
    const history = [sess([s(45, 12), s(45, 12), s(45, 12)], { target: rng(10, 12) })]
    expect(recommend({ history, today: TODAY, target: rng(10, 12), sets: 3, equipment: 'machine' })).toMatchObject({ action: 'increase_reps', weight: 45 })
  })
  it('T25 machine 45×14 → 50, reps 10', () => {
    const history = [sess([s(45, 14), s(45, 14), s(45, 14)], { target: rng(10, 12) })]
    expect(recommend({ history, today: TODAY, target: rng(10, 12), sets: 3, equipment: 'machine' })).toMatchObject({ weight: 50, reps: { min: 10, max: 10 } })
  })
})

describe('R11 long breaks', () => {
  it('T26 pyramid 30 days off → 20 / 22 / 24', () => {
    const history = [sess([s(24, 14), s(26, 12), s(28, 10)], { date: '2026-09-14', technique: 'pyramid', setReps: [14, 12, 10] })]
    expect(recommend({ history, today: TODAY, target: rng(10, 14), sets: 3, equipment: 'dumbbell', technique: 'pyramid', setReps: [14, 12, 10] }).setWeights)
      .toEqual([20, 22, 24])
  })
  it('T27 straight 70 days off → 47.5', () => {
    const history = [sess([s(60, 10), s(60, 10), s(60, 10)], { date: '2026-08-05', target: rng(8, 10) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 3, equipment: 'barbell' }).weight).toBe(47.5)
  })
})

describe('R10 partials and baseline', () => {
  it('T28 partial row ignored → 52.5', () => {
    const history = [sess([s(50, 10), s(50, 10), s(50, 10), s(50, 6, { tag: 'partial' })], { target: rng(8, 10) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 3, equipment: 'barbell' }).weight).toBe(52.5)
  })
  it('T29 straight 40×10 ×3 → 42.5', () => {
    const history = [sess([s(40, 10), s(40, 10), s(40, 10)], { target: rng(8, 10) })]
    expect(recommend({ history, today: TODAY, target: rng(8, 10), sets: 3, equipment: 'barbell' }).weight).toBe(42.5)
  })
})

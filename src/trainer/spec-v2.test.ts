// PT-approved spec v2 test cases T30–T51 (docs/fitness/approved/2026-10-07-progression-engine-spec-v2.md),
// built from Sebas's real block-6 logs.
import { describe, expect, it } from 'vitest'
import { recommend, type LoggedSet, type SessionEvidence } from './engine'

const TODAY = '2026-10-07'
const LAST = '2026-09-30'
const s = (weight: number, reps: number): LoggedSet => ({ weight, reps })
const rng = (min: number, max = min) => ({ min, max })
const sess = (sets: LoggedSet[], extra: Partial<SessionEvidence> = {}): SessionEvidence => ({ date: LAST, sets, ...extra })
const flat = (weight: number, reps: number, count: number) => Array.from({ length: count }, () => s(weight, reps))

describe('R8 / R12 / R15 light loads on real steps', () => {
  it('T30 reverse pec deck 6.25 × 15 ×4 → 8.75 × 12, drop 5', () => {
    const r = recommend({ history: [sess(flat(6.25, 15, 4), { target: rng(12) })], today: TODAY, target: rng(12), sets: 4, equipment: 'machine', technique: 'drop-set' })
    expect(r).toMatchObject({ weight: 8.75, reps: { min: 12, max: 12 }, dropWeight: 5 })
  })
  it('T31 variant 6.25 × 13 ×4 → 6.25, reps 14–15', () => {
    const r = recommend({ history: [sess(flat(6.25, 13, 4), { target: rng(12) })], today: TODAY, target: rng(12), sets: 4, equipment: 'machine', technique: 'drop-set' })
    expect(r).toMatchObject({ weight: 6.25, action: 'increase_reps', reps: { min: 14, max: 15 } })
  })
  it('T32 high cable fly 12.5×13, 15×12, 12.5×12 → 12.5, reps 13–14', () => {
    const r = recommend({ history: [sess([s(12.5, 13), s(15, 12), s(12.5, 12)], { target: rng(12) })], today: TODAY, target: rng(12), sets: 3, equipment: 'cable' })
    expect(r).toMatchObject({ weight: 12.5, action: 'increase_reps', reps: { min: 13, max: 14 } })
  })
  it('T33 straight-arm pulldown 22.5 × 12 ×3 → 22.5, reps 13–14', () => {
    const r = recommend({ history: [sess(flat(22.5, 12, 3), { target: rng(12) })], today: TODAY, target: rng(12), sets: 3, equipment: 'cable' })
    expect(r).toMatchObject({ weight: 22.5, action: 'increase_reps', reps: { min: 13, max: 14 } })
  })
})

describe('R16 cable crunch', () => {
  const base = { today: TODAY, target: rng(10), sets: 3, equipment: 'cable', technique: 'drop-set', exerciseId: 'cable-crunch' }
  it('T34 25 × 12 ×3 → 27.5 × 10, drop 20', () => {
    expect(recommend({ ...base, history: [sess(flat(25, 12, 3), { target: rng(10) })] })).toMatchObject({ weight: 27.5, dropWeight: 20 })
  })
  it('T35 variant 25 × 11 ×3 → 25, reps 12–13', () => {
    expect(recommend({ ...base, history: [sess(flat(25, 11, 3), { target: rng(10) })] }))
      .toMatchObject({ weight: 25, action: 'increase_reps', reps: { min: 12, max: 13 } })
  })
})

describe('R12b / R13 / R14', () => {
  it('T36 jump cap: incline DB 26 × 15 (3 sessions) target 8 → 28', () => {
    const history = ['2026-09-30', '2026-09-26', '2026-09-23'].map((date) => sess(flat(26, 15, 3), { date, target: rng(8) }))
    expect(recommend({ history, today: TODAY, target: rng(8), sets: 3, equipment: 'dumbbell' }).weight).toBe(28)
  })
  it('T37 dumbbell bench 30×12,10,10 (target 10) → 12 reps: 28 (not 26)', () => {
    const r = recommend({ history: [sess([s(30, 12), s(30, 10), s(30, 10)], { target: rng(10) })], today: TODAY, target: rng(12), sets: 3, equipment: 'dumbbell' })
    expect(r.weight).toBe(28)
  })
  it('T38 lat pulldown 65×10, 60×11, 65×11 (target 10) → 12 reps: 62.5 (not 55)', () => {
    const r = recommend({ history: [sess([s(65, 10), s(60, 11), s(65, 11)], { target: rng(10) })], today: TODAY, target: rng(12), sets: 3, equipment: 'cable' })
    expect(r.weight).toBe(62.5)
  })
  it('T39 T-bar 30×12,12,8 → 10 reps: 30, maintain', () => {
    const r = recommend({ history: [sess([s(30, 12), s(30, 12), s(30, 8)], { target: rng(8, 12) })], today: TODAY, target: rng(10), sets: 3, equipment: 'plate-loaded' })
    expect(r).toMatchObject({ weight: 30, action: 'maintain' })
  })
  it('T40 rope 20×12,12,15,15 → 22.5 × 12', () => {
    const r = recommend({ history: [sess([s(20, 12), s(20, 12), s(20, 15), s(20, 15)], { target: rng(12) })], today: TODAY, target: rng(12), sets: 4, equipment: 'cable' })
    expect(r).toMatchObject({ weight: 22.5, reps: { min: 12, max: 12 } })
  })
  it('T41 variant rope 20×12,13,14,14 → 20, reps 13–14', () => {
    const r = recommend({ history: [sess([s(20, 12), s(20, 13), s(20, 14), s(20, 14)], { target: rng(12) })], today: TODAY, target: rng(12), sets: 4, equipment: 'cable' })
    expect(r).toMatchObject({ weight: 20, action: 'increase_reps', reps: { min: 13, max: 14 } })
  })
  it('T42 variant incline DB 26×12,12,9 target 8 → 28, exceeded_target', () => {
    const r = recommend({ history: [sess([s(26, 12), s(26, 12), s(26, 9)], { target: rng(8) })], today: TODAY, target: rng(8), sets: 3, equipment: 'dumbbell' })
    expect(r).toMatchObject({ weight: 28, reason: 'exceeded_target' })
  })
})

describe('R15 increase reps asks for more', () => {
  it('T43 incline curl 10 × 12 ×3 → 10, reps 13–14', () => {
    const r = recommend({ history: [sess(flat(10, 12, 3), { target: rng(12) })], today: TODAY, target: rng(12), sets: 3, equipment: 'dumbbell' })
    expect(r).toMatchObject({ weight: 10, action: 'increase_reps', reps: { min: 13, max: 14 } })
  })
  it('T44 EZ preacher 6 × 12 ×4 → 6, reps 13–14', () => {
    const r = recommend({ history: [sess(flat(6, 12, 4), { target: rng(12) })], today: TODAY, target: rng(12), sets: 4, equipment: 'ez-bar' })
    expect(r).toMatchObject({ weight: 6, action: 'increase_reps', reps: { min: 13, max: 14 } })
  })
  it('T45 cable lateral raise 5 × 15·14·15·14 → today 20: 5 kg, reps 20', () => {
    const r = recommend({ history: [sess([s(5, 15), s(5, 14), s(5, 15), s(5, 14)], { target: rng(15) })], today: TODAY, target: rng(20), sets: 4, equipment: 'cable' })
    expect(r).toMatchObject({ weight: 5, action: 'increase_reps', reps: { min: 20, max: 20 } })
  })
})

describe('R17 / R18 / R19', () => {
  it('T46 uniform "reverse pyramid" history → 30 / 27.5 / 27.5, maintain', () => {
    const history = [sess([s(30, 12), s(30, 12), s(30, 8)], { technique: 'reverse-pyramid', setReps: [8, 10, 12], target: rng(8, 12) })]
    const r = recommend({ history, today: TODAY, target: rng(8, 12), sets: 3, equipment: 'plate-loaded', technique: 'reverse-pyramid', setReps: [8, 10, 12] })
    expect(r).toMatchObject({ setWeights: [30, 27.5, 27.5], action: 'maintain' })
  })
  it('T47 Smith press 20, 22.5, 22.5 × 10 (target 8) → 22.5 ×3, consolidate', () => {
    const r = recommend({ history: [sess([s(20, 10), s(22.5, 10), s(22.5, 10)], { target: rng(8) })], today: TODAY, target: rng(8), sets: 3, equipment: 'smith-machine' })
    expect(r).toMatchObject({ weight: 22.5, action: 'maintain', reason: 'consolidate_load' })
  })
  it('T48 lat pulldown 65, 60, 65 (target 10) → 65, maintain', () => {
    const r = recommend({ history: [sess([s(65, 10), s(60, 11), s(65, 11)], { target: rng(10) })], today: TODAY, target: rng(10), sets: 3, equipment: 'cable' })
    expect(r).toMatchObject({ weight: 65, action: 'maintain' })
  })
  it('T49 control: dumbbell bench 30×12,10,10 (target 10) → 32', () => {
    const r = recommend({ history: [sess([s(30, 12), s(30, 10), s(30, 10)], { target: rng(10) })], today: TODAY, target: rng(10), sets: 3, equipment: 'dumbbell' })
    expect(r.weight).toBe(32)
  })
  it('T50 lateral raise 12×15,14,14 (target 15) → today 20: 10 kg × 20', () => {
    const r = recommend({ history: [sess([s(12, 15), s(12, 14), s(12, 14)], { target: rng(15) })], today: TODAY, target: rng(20), sets: 3, equipment: 'dumbbell' })
    expect(r).toMatchObject({ weight: 10, reps: { min: 20, max: 20 } })
  })
  it('T51 incline curl 10×12 ×3 (target 12) → today 15: 10 kg × 15', () => {
    const r = recommend({ history: [sess(flat(10, 12, 3), { target: rng(12) })], today: TODAY, target: rng(15), sets: 3, equipment: 'dumbbell' })
    expect(r).toMatchObject({ weight: 10, action: 'increase_reps', reps: { min: 15, max: 15 } })
  })
})

describe('R17b pyramid built from straight history (PT pre-merge, 2026-10-07)', () => {
  const base = { today: TODAY, target: rng(10, 14), sets: 3, equipment: 'dumbbell', technique: 'pyramid', setReps: [14, 12, 10] }
  it('T52 last 26 × 12 ×3 (target 12) → no set above 26, maintain', () => {
    const r = recommend({ ...base, history: [sess(flat(26, 12, 3), { target: rng(12) })] })
    expect(Math.max(...r.setWeights!)).toBe(26)
    expect(r.setWeights).toEqual([...r.setWeights!].sort((a, b) => a - b))
    expect(r.action).toBe('maintain')
  })
  it('T52b last 26 × 15 ×3 (target 12, too easy) → top 28', () => {
    const r = recommend({ ...base, history: [sess(flat(26, 15, 3), { target: rng(12) })] })
    expect(r.setWeights![2]).toBe(28)
  })
  it('T52c two sessions at 26 × 12 ×3 → top 28', () => {
    const history = [sess(flat(26, 12, 3), { target: rng(12) }), sess(flat(26, 12, 3), { date: '2026-09-26', target: rng(12) })]
    expect(recommend({ ...base, history }).setWeights![2]).toBe(28)
  })
})

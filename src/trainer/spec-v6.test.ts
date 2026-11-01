import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { trainerReason } from './presentation'
import { recommend, type LoggedSet, type RecommendInput, type SessionEvidence } from './engine'

const s = (weight: number, reps: number): LoggedSet => ({ weight, reps })
const rng = (min: number, max = min) => ({ min, max })
const flat = (weight: number, reps: number, count: number) => Array.from({ length: count }, () => s(weight, reps))
const session = (date: string, sets: LoggedSet[], extra: Partial<SessionEvidence> = {}): SessionEvidence => ({ date, sets, ...extra })
const BLOCK = 'block-6'
const day = (dayKey: string, target?: { min: number; max: number }) => ({ dayKey, blockId: BLOCK, ...(target ? { target } : {}) })
const base = { today: '2026-11-01', equipment: 'cable', blockId: BLOCK }
const run = (input: Partial<RecommendInput> & Pick<RecommendInput, 'history' | 'target' | 'sets'>) => recommend({ ...base, ...input })

const H_LAT = [
  session('2026-10-27', flat(7.5, 8, 4), day('arms-a', rng(13, 15))),
  session('2026-10-24', [s(6, 21), s(6, 21), s(6, 19), s(6, 19)], day('arms-b', rng(21, 22))),
  session('2026-10-16', flat(6, 20, 4), day('arms-b', rng(20))),
  session('2026-10-13', flat(6, 13, 4), day('arms-a', rng(13, 15))),
  session('2026-10-09', [s(5, 20), s(5, 20), s(5, 18), s(5, 18)], day('arms-b', rng(20))),
  session('2026-10-06', [s(5, 15), s(5, 14), s(5, 15), s(5, 14)], day('arms-a')),
]
const H_ROPE = [
  session('2026-10-27', flat(27.5, 12, 4), day('arms-a', rng(12))),
  session('2026-10-24', [s(27.5, 15), s(27.5, 15), s(27.5, 13), s(27.5, 16)], day('arms-b', rng(15))),
  session('2026-10-16', flat(26, 15, 4), day('arms-b', rng(15))),
  session('2026-10-13', [s(28, 10), s(25, 10), s(25, 10), s(25, 10)], day('arms-a', rng(10, 12))),
  session('2026-10-09', flat(20, 15, 4), day('arms-b', rng(15))),
  session('2026-10-06', [s(20, 12), s(20, 12), s(20, 15), s(20, 15)], day('arms-a')),
]
const withDrop = (set: LoggedSet, weight: number, reps = 12): LoggedSet => ({ ...set, drop: { weight, reps } })
const H_RD = [
  session('2026-10-27', flat(6, 10, 3).map((set) => withDrop(set, 2.5)), day('arms-a', rng(10, 12))),
  session('2026-10-23', flat(4, 21, 4), day('arms-b', rng(21, 22))),
  session('2026-10-16', flat(4, 20, 4), day('arms-b', rng(20))),
  session('2026-10-13', [s(4, 12), s(6, 12), s(4, 12)].map((set) => withDrop(set, 2.5)), day('arms-a', rng(12))),
  session('2026-10-09', [s(6, 18), s(4, 20), s(4, 20)], day('arms-b', rng(20))),
  session('2026-10-06', flat(6, 12, 3).map((set) => withDrop(set, 4)), day('arms-a')),
]
const lastOnly = (sets: LoggedSet[], target: { min: number; max: number }) => [session('2026-10-27', sets, { target })]

describe('R31 cable loads stay on the 2.5 kg grid', () => {
  it('T157 cable lateral raise, Arms A', () => {
    expect(run({ history: H_LAT, dayKey: 'arms-a', target: rng(15), sets: 4 })).toMatchObject({
      weight: 5, action: 'decrease_weight', reason: 'recent_miss_cap', confidence: 'low', evidence: { lastWeight: 7.5 },
    })
  })

  it('T158 cable lateral raise, Arms B', () => {
    expect(run({ history: H_LAT, dayKey: 'arms-b', target: rng(20), sets: 4 })).toMatchObject({
      weight: 5, action: 'maintain', reason: 'converted_rep_range', evidence: { sameDayWeight: 6 },
    })
  })

  it('T159 rope extension, Arms B', () => {
    expect(run({ history: H_ROPE, dayKey: 'arms-b', target: rng(15), sets: 4 })).toMatchObject({
      weight: 25, action: 'decrease_weight', reason: 'converted_rep_range', confidence: 'low',
    })
  })

  it('T160 rear delt fly, Arms A drop-set', () => {
    expect(run({ history: H_RD, dayKey: 'arms-a', technique: 'drop-set', target: rng(12), sets: 3 })).toMatchObject({
      weight: 5, dropWeight: 2.5, action: 'maintain', reason: 'light_load_add_reps',
      evidence: { lastWeight: 6, lastReps: [10, 10, 10] },
    })
  })

  it('T161 rear delt fly, Arms B', () => {
    expect(run({ history: H_RD, dayKey: 'arms-b', target: rng(20), sets: 4 })).toMatchObject({
      weight: 5, action: 'increase_weight', reason: 'converted_rep_range',
    })
  })

  it('T162 adding a step starts from the grid load', () => {
    expect(run({ history: lastOnly(flat(26, 15, 4), rng(15)), target: rng(15), sets: 4 })).toMatchObject({
      weight: 27.5, action: 'increase_weight', reason: 'reached_top_of_range',
    })
  })

  it('T163 keeping the load shows the log and recommends the grid', () => {
    expect(run({ history: lastOnly(flat(6, 10, 3), rng(12)), target: rng(12), sets: 3 })).toMatchObject({
      weight: 5, reps: rng(12), action: 'maintain', reason: 'below_target_once', evidence: { lastWeight: 6, lastReps: [10, 10, 10] },
    })
  })

  it('T164 too easy stays within one grid step', () => {
    expect(run({ history: lastOnly(flat(26, 18, 4), rng(15)), target: rng(15), sets: 4 })).toMatchObject({
      weight: 27.5, reason: 'exceeded_target',
    })
  })

  it('T165 two misses drop from the grid load', () => {
    const target = rng(15)
    expect(run({
      dayKey: 'arms-a', target, sets: 4,
      history: [session('2026-10-27', flat(26, 12, 4), day('arms-a', target)), session('2026-10-20', flat(26, 12, 4), day('arms-a', target))],
    })).toMatchObject({ weight: 22.5, action: 'decrease_weight', reason: 'below_target_twice' })
  })

  it('T166 the miss text keeps the logged load', () => {
    expect(run({ history: lastOnly(flat(6, 8, 4), rng(13, 15)), target: rng(15), sets: 4 })).toMatchObject({
      weight: 2.5, reps: rng(15), action: 'decrease_weight', reason: 'recent_miss_cap',
      evidence: { recentMiss: { weight: 6, newWeight: 2.5 } },
    })
  })

  it('T167 same-day boost adds one step to the grid load', () => {
    const history = [
      session('2026-10-27', flat(30, 10, 4), day('arms-a', rng(10))),
      session('2026-10-24', flat(26, 15, 4), day('arms-b', rng(15))),
    ]
    expect(run({ history, dayKey: 'arms-b', target: rng(15), sets: 4 })).toMatchObject({
      weight: 27.5, action: 'increase_weight', reason: 'same_day_boost',
    })
  })

  it('T168 the boost cap is read at the grid load', () => {
    const history = [
      session('2026-10-27', flat(28, 10, 4), day('arms-a', rng(10))),
      session('2026-10-24', flat(26, 15, 4), day('arms-b', rng(15))),
    ]
    expect(run({ history, dayKey: 'arms-b', target: rng(15), sets: 4 }).weight).toBe(27.5)
  })

  it('T169 drop-set', () => {
    expect(run({ history: lastOnly(flat(26, 10, 3), rng(12)), technique: 'drop-set', target: rng(12), sets: 3 })).toMatchObject({
      weight: 25, dropWeight: 17.5, action: 'maintain', reason: 'below_target_once',
    })
  })

  it('T170 pyramid', () => {
    const setReps = [15, 12, 10]
    const target = rng(10, 15)
    expect(run({
      technique: 'pyramid', setReps, target, sets: 3,
      history: [session('2026-10-27', [s(20, 15), s(23, 12), s(26, 10)], { target, technique: 'pyramid', setReps })],
    })).toMatchObject({ setWeights: [22.5, 25, 27.5], action: 'increase_weight', reason: 'reached_top_of_range' })
  })

  it('T171 reverse pyramid', () => {
    const setReps = [8, 10, 12]
    const target = rng(8, 12)
    expect(run({
      technique: 'reverse-pyramid', setReps, target, sets: 3,
      history: [session('2026-10-27', [s(26, 8), s(23, 10), s(21, 12)], { target, technique: 'reverse-pyramid', setReps })],
    })).toMatchObject({ setWeights: [27.5, 25, 22.5], action: 'increase_weight' })
  })

  it('T172 deload', () => {
    expect(run({ history: lastOnly(flat(6, 15, 4), rng(15)), deload: true, target: rng(15), sets: 4 })).toMatchObject({
      weight: 5, sets: 2, reps: rng(15), action: 'deload', reason: 'deload_week',
    })
  })

  it('T173 long break', () => {
    expect(run({ history: [session('2026-10-02', flat(28, 12, 3), { target: rng(12) })], target: rng(12), sets: 3 })).toMatchObject({
      weight: 22.5, action: 'regress', reason: 'long_break',
    })
  })

  it('T174 a log below the lowest load counts as the lowest load', () => {
    expect(run({ history: lastOnly(flat(1, 20, 3), rng(20)), target: rng(20), sets: 3 })).toMatchObject({
      weight: 2.5, action: 'increase_reps', reps: rng(21, 22), evidence: { lastWeight: 1 },
    })
  })

  it('T175 a follower load ends on the grid', () => {
    expect(run({ history: [], followLoad: 6, target: rng(12), sets: 3 })).toMatchObject({
      weight: 5, action: 'maintain', reason: 'double_angle',
    })
  })

  it('T176 a configured step defines the grid', () => {
    expect(run({ history: lastOnly(flat(6.25, 12, 3), rng(12)), step: 1.25, target: rng(12), sets: 3 })).toMatchObject({
      weight: 6.25, action: 'increase_reps', reps: rng(13, 14),
    })
  })

  it('T177 machines keep R12a', () => {
    expect(run({
      equipment: 'machine', exerciseId: 'reverse-pec-deck-fly', technique: 'drop-set', target: rng(12), sets: 4,
      history: lastOnly(flat(6.25, 15, 4), rng(12)),
    })).toMatchObject({ weight: 8.75, dropWeight: 5 })
  })

  it('T178 machines are not rounded', () => {
    expect(run({ equipment: 'machine', history: lastOnly(flat(6.25, 10, 3), rng(12)), target: rng(12), sets: 3 })).toMatchObject({
      weight: 6.25, action: 'maintain',
    })
  })

  it('T180 history stays as logged', () => {
    const history = H_RD.map((entry) => ({ ...entry, sets: entry.sets.map((set) => ({ ...set })) }))
    const before = JSON.parse(JSON.stringify(history))
    run({ history, dayKey: 'arms-a', technique: 'drop-set', target: rng(12), sets: 3 })
    expect(history).toEqual(before)
  })

  it('T180 estimated max reads the real log', () => {
    const offGrid = run({ history: lastOnly(flat(6, 10, 3), rng(12)), target: rng(12), sets: 3 })
    const machine = run({ equipment: 'machine', history: lastOnly(flat(6, 10, 3), rng(12)), target: rng(12), sets: 3 })
    expect(offGrid.evidence.estimatedOneRepMax).toBe(machine.evidence.estimatedOneRepMax)
  })

  it('T182 rope extension, Arms A, no collateral', () => {
    expect(run({ history: H_ROPE, dayKey: 'arms-a', target: rng(12), sets: 4 })).toMatchObject({
      weight: 30, action: 'increase_weight', reason: 'reached_top_of_range',
    })
  })

  it('R31d the card explains an off-grid same-day load instead of saying same weight', () => {
    const target = rng(20)
    const result = run({ history: H_LAT, dayKey: 'arms-b', target, sets: 4 })
    const text = trainerReason(createTranslator('en'), 'en', result, target)
    expect(text).toContain('You logged 6 kg. This cable moves in 2.5 kg steps, so I count it as 5 kg.')
    expect(text).not.toContain('same weight')
  })

  it('R31d the card explains an off-grid last load', () => {
    const target = rng(12)
    const result = run({ history: lastOnly(flat(6, 10, 3), target), target, sets: 3 })
    expect(trainerReason(createTranslator('en'), 'en', result, target)).toContain('so I count it as 5 kg.')
  })

  it('R31d on-grid logs add no note', () => {
    const target = rng(12)
    const result = run({ history: lastOnly(flat(5, 10, 3), target), target, sets: 3 })
    expect(result.evidence.lastGridWeight).toBeUndefined()
    expect(trainerReason(createTranslator('en'), 'en', result, target)).not.toContain('moves in 2.5 kg steps')
  })
})

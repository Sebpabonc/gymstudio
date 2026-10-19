import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { trainerReason } from './presentation'
import { recommend, type LoggedSet, type SessionEvidence } from './engine'

const s = (weight: number, reps: number): LoggedSet => ({ weight, reps })
const rng = (min: number, max = min) => ({ min, max })
const flat = (weight: number, reps: number[]) => reps.map((count) => s(weight, count))
const session = (
  date: string,
  sets: LoggedSet[],
  extra: Partial<SessionEvidence> = {}
): SessionEvidence => ({ date, sets, ...extra })
const base = {
  today: '2026-10-22',
  sets: 3,
  equipment: 'machine',
}

describe('PT-approved trainer watch items R26–R30', () => {
  it('T73 compares the action and boost wording with the same-day load', () => {
    const target = rng(12)
    const result = recommend({
      ...base,
      dayKey: 'day-b',
      target,
      step: 2.5,
      history: [
        session('2026-10-19', flat(70, [10, 10, 8]), { dayKey: 'day-a', target: rng(10) }),
        session('2026-10-15', flat(65, [12, 12, 12]), { dayKey: 'day-b', dayName: 'Legs B', target, blockId: 'block' }),
      ],
      blockId: 'block',
      equipment: 'cable',
    })
    expect(result).toMatchObject({
      weight: 67.5,
      action: 'increase_weight',
      reason: 'same_day_boost',
      evidence: { sameDayWeight: 65, sameDayReps: [12, 12, 12] },
    })
    const text = trainerReason(createTranslator('en'), 'en', result, target)
    expect(text).toContain('vs last Legs B (Thu 15 Oct: 65 kg × 12 · 12 · 12): up 2.5 kg')
    expect(text).toContain('Last Legs B you did 12 · 12 · 12 at 65 kg, so today goes up to 67.5 kg.')
  })

  it('T74 labels a same-day load increase against the matching day', () => {
    const target = rng(20)
    const result = recommend({
      ...base, dayKey: 'legs-b', target, sets: 5, step: 2.5, equipment: 'machine',
      history: [
        session('2026-10-15', flat(110, [13, 13, 13, 13, 13]), { dayKey: 'legs-a', target: rng(15) }),
        session('2026-10-10', flat(90, [20, 20, 20, 20, 20]), { dayKey: 'legs-b', target }),
      ],
    })
    expect(result).toMatchObject({ weight: 92.5, action: 'increase_weight' })
  })

  it('T75 maintains a lower converted load when there is no same-day reference', () => {
    const result = recommend({
      ...base, dayKey: 'day-b', target: rng(12), equipment: 'dumbbell', step: 2,
      history: [session('2026-10-19', flat(30, [12, 10, 10]), { dayKey: 'day-a', target: rng(10) })],
    })
    expect(result).toMatchObject({ weight: 28, action: 'maintain', reason: 'converted_rep_range' })
  })

  it('T76 keeps the rule action when the same-day load matches', () => {
    const result = recommend({
      ...base, dayKey: 'day-b', target: rng(15), step: 2.5, equipment: 'cable',
      history: [
        session('2026-10-19', flat(27.5, [12, 15, 12]), { dayKey: 'day-a', target: rng(12) }),
        session('2026-10-15', flat(27.5, [15, 15, 15]), { dayKey: 'day-b', target: rng(15) }),
      ],
    })
    expect(result).toMatchObject({ weight: 27.5, action: 'maintain' })
  })

  const pyramidHistory = (latestReps: number[], proofTop = 30): SessionEvidence[] => [
    session('2026-10-19', flat(32, latestReps), { dayKey: 'day-a', target: rng(8), technique: 'straight' }),
    session('2026-10-15', [
      s(28, 14), s(30, 12), s(proofTop, 10),
    ], { dayKey: 'day-b', target: rng(10, 14), technique: 'pyramid', setReps: [14, 12, 10] }),
  ]
  const inclinePyramid = {
    ...base, dayKey: 'day-b', target: rng(10, 14), sets: 3,
    equipment: 'dumbbell', step: 2, technique: 'pyramid', setReps: [14, 12, 10],
  }

  it('T77 caps a pyramid set at a recently missed load', () => {
    const result = recommend({ ...inclinePyramid, history: pyramidHistory([6, 6, 6]) })
    expect(result).toMatchObject({
      setWeights: [28, 30, 30], action: 'maintain', reason: 'recent_miss_cap',
      evidence: { recentMiss: { weight: 32, reps: 6, target: 8, newWeight: 30 } },
    })
    expect(trainerReason(createTranslator('en'), 'en', result, inclinePyramid.target))
      .toContain('Last time 32 kg gave 6 reps (target 8), so I kept the heaviest set at 30 kg.')
  })

  it('T78 does not cap a load missed by only one rep', () => {
    expect(recommend({ ...inclinePyramid, history: pyramidHistory([7, 7, 7]) }))
      .toMatchObject({ setWeights: [28, 30, 32], action: 'increase_weight' })
  })

  it('T79 lets proven reps at a load override the cap', () => {
    const result = recommend({ ...inclinePyramid, history: pyramidHistory([6, 6, 6], 32) })
    expect(result).toMatchObject({ setWeights: [28, 30, 32], action: 'maintain', reason: 'achieved_floor' })
  })

  it('T80 does not apply the recent-miss cap when the target is unchanged', () => {
    expect(recommend({
      ...base, dayKey: 'day-a', target: rng(8), equipment: 'dumbbell',
      history: [session('2026-10-19', flat(32, [6, 6, 6]), { dayKey: 'day-a', target: rng(8) })],
    })).toMatchObject({ weight: 32, action: 'maintain', reason: 'below_target_once' })
  })

  it('T81 labels a median shortfall of two reps as below_target_once', () => {
    expect(recommend({
      ...base, sets: 5, target: rng(15), step: 2.5,
      history: [session('2026-10-19', flat(110, [13, 13, 13, 13, 13]), { target: rng(15) })],
    })).toMatchObject({ weight: 110, action: 'maintain', reason: 'below_target_once' })
  })

  it('T82 keeps slightly_below_target when the median reaches the target', () => {
    expect(recommend({
      ...base, target: rng(10), step: 2.5,
      history: [session('2026-10-19', flat(70, [10, 10, 8]), { target: rng(10) })],
    })).toMatchObject({ weight: 70, action: 'maintain', reason: 'slightly_below_target' })
  })

  it('T83 counts two same-target misses despite an intervening pyramid session', () => {
    expect(recommend({
      ...base, dayKey: 'day-a', target: rng(8), equipment: 'dumbbell', step: 2,
      history: [
        session('2026-10-19', flat(32, [6, 6, 6]), { dayKey: 'day-a', target: rng(8) }),
        session('2026-10-15', [s(28, 14), s(30, 12), s(30, 10)], {
          dayKey: 'day-b', target: rng(10, 14), technique: 'pyramid', setReps: [14, 12, 10],
        }),
        session('2026-10-12', flat(32, [6, 6, 6]), { dayKey: 'day-a', target: rng(8) }),
      ],
    })).toMatchObject({ weight: 30, action: 'decrease_weight', reason: 'below_target_twice' })
  })

  it('T84 does not drop an improving same-target session', () => {
    expect(recommend({
      ...base, dayKey: 'day-a', target: rng(8), equipment: 'dumbbell', step: 2,
      history: [
        session('2026-10-19', flat(32, [7, 7, 6]), { dayKey: 'day-a', target: rng(8) }),
        session('2026-10-15', [s(28, 14), s(30, 12), s(30, 10)], {
          dayKey: 'day-b', target: rng(10, 14), technique: 'pyramid', setReps: [14, 12, 10],
        }),
        session('2026-10-12', flat(32, [6, 6, 6]), { dayKey: 'day-a', target: rng(8) }),
      ],
    })).toMatchObject({ weight: 32, action: 'maintain', reason: 'below_target_once' })
  })

  it('T85 does not consolidate a straight session after a real pyramid', () => {
    const target = rng(8)
    const result = recommend({
      ...base, dayKey: 'day-a', target: rng(8), equipment: 'dumbbell', step: 2,
      history: [
        session('2026-10-22', [s(28, 14), s(30, 12), s(30, 10)], {
          dayKey: 'day-b', target: rng(10, 14), technique: 'pyramid', setReps: [14, 12, 10],
        }),
        session('2026-10-19', flat(32, [6, 6, 6]), { dayKey: 'day-a', target: rng(8) }),
      ],
    })
    expect(result).toMatchObject({ weight: 32, action: 'maintain', reason: 'below_target_once' })
    expect(trainerReason(createTranslator('en'), 'en', result, target))
      .toContain('You were below the 8-rep target last time at 32 kg')
  })

  it('T86 still consolidates mixed straight-set loads', () => {
    expect(recommend({
      ...base, target: rng(8), equipment: 'smith-machine', step: 2.5,
      history: [session('2026-10-19', [s(20, 10), s(22.5, 10), s(22.5, 10)], { target: rng(8), technique: 'straight' })],
    })).toMatchObject({ weight: 22.5, action: 'maintain', reason: 'consolidate_load' })
  })

  it('T87 applies crunch reps-first progression to the same-day session', () => {
    const result = recommend({
      ...base, dayKey: 'day-b', target: rng(15), equipment: 'cable', step: 2.5, exerciseId: 'cable-crunch',
      history: [
        session('2026-10-19', [s(30, 6), s(30, 6), s(27.5, 10)], { dayKey: 'day-a', target: rng(10), technique: 'drop-set' }),
        session('2026-10-15', flat(27.5, [15, 15, 15]), { dayKey: 'day-b', target: rng(15) }),
      ],
    })
    expect(result).toMatchObject({ weight: 27.5, reps: { min: 16, max: 17 }, action: 'increase_reps' })
  })

  it('T88 allows the crunch load to increase after every set reaches target plus two', () => {
    expect(recommend({
      ...base, dayKey: 'day-b', target: rng(15), equipment: 'cable', step: 2.5, exerciseId: 'cable-crunch',
      history: [
        session('2026-10-19', flat(30, [10, 10, 10]), { dayKey: 'day-a', target: rng(10) }),
        session('2026-10-15', flat(27.5, [17, 17, 17]), { dayKey: 'day-b', target: rng(15) }),
      ],
    })).toMatchObject({ weight: 30, action: 'increase_weight' })
  })

  it('T89 labels a two-rep median shortfall on cable crunch', () => {
    expect(recommend({
      ...base, target: rng(10), equipment: 'cable', step: 2.5, exerciseId: 'cable-crunch', technique: 'drop-set',
      history: [session('2026-10-19', [s(30, 6), s(30, 6), s(27.5, 10)], { target: rng(10), technique: 'drop-set' })],
    })).toMatchObject({ weight: 30, action: 'maintain', reason: 'below_target_once', dropWeight: 22.5 })
  })

  it('T90 keeps the approved reverse pec-deck recommendation', () => {
    expect(recommend({
      ...base, target: rng(12), equipment: 'machine', step: 2.5, technique: 'drop-set',
      history: [session('2026-10-19', flat(6.25, [15, 15, 15, 15]), { target: rng(12) })],
      sets: 4,
    })).toMatchObject({ weight: 8.75, reps: rng(12), dropWeight: 5 })
  })

  it('T91 uses the configured 1.25 kg equipment step', () => {
    expect(recommend({
      ...base, target: rng(12), equipment: 'machine', step: 1.25, technique: 'drop-set',
      history: [session('2026-10-19', flat(6.25, [15, 15, 15, 15]), { target: rng(12) })],
      sets: 4,
    })).toMatchObject({ weight: 7.5, reps: rng(12), dropWeight: 5 })
  })

  it('T92 gives a machine first-session protocol without inventing a load', () => {
    const result = recommend({
      ...base, target: rng(8, 12), equipment: 'plate-loaded', technique: 'reverse-pyramid',
      setReps: [8, 10, 12], history: [],
    })
    expect(result).toMatchObject({
      action: 'collect_data', weight: null, reason: 'no_history',
      firstSessionProtocol: 'reverse-pyramid',
    })
    expect(trainerReason(createTranslator('en'), 'en', result, result.reps).split('\n')).toEqual([
      'Warm up with 2-3 light sets, adding weight each time.',
      'Pick a weight you could lift for about 3 more reps than the target; first sessions stay below your limit.',
      'Then take off about 10% for each lighter set.',
      'Log the weight and how many reps you had left on the heaviest set; next time I will progress from it.',
    ])
    expect(recommend({
      ...base, target: rng(8, 12), equipment: 'plate-loaded', technique: 'reverse-pyramid',
      setReps: [8, 10, 12], history: [], deload: true,
    })).toMatchObject({ action: 'collect_data', weight: null, firstSessionProtocol: 'reverse-pyramid' })
    const pyramid = recommend({
      ...base, target: rng(10, 14), equipment: 'cable', technique: 'pyramid',
      setReps: [14, 12, 10], history: [],
    })
    expect(trainerReason(createTranslator('en'), 'en', pyramid, pyramid.reps))
      .toContain('Start light and add about 10% each set as the reps drop.')
  })

  it('T93 resumes normal reverse-pyramid progression after the first session', () => {
    expect(recommend({
      ...base, today: '2026-10-26', target: rng(8, 12), equipment: 'plate-loaded',
      technique: 'reverse-pyramid', setReps: [8, 10, 12], history: [
        session('2026-10-22', [s(80, 8), { ...s(72.5, 10) }, s(65, 12)], {
          target: rng(8, 12), technique: 'reverse-pyramid', setReps: [8, 10, 12],
        }),
      ],
    })).toMatchObject({ weight: 82.5, action: 'increase_weight' })
  })
})

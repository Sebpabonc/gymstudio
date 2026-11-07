// PT spec docs/fitness/approved/2026-11-01-first-run-and-same-day-start.md, section 6 "First-session weights" and
// "Wording" (approved 2026-11-07). If an engine case fails, send it back to the PT; don't change the expected value.
import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { trainerReason } from './presentation'
import { recommend, type LoggedSet, type SessionEvidence } from './engine'

const s = (weight: number, reps: number): LoggedSet => ({ weight, reps })
const rng = (min: number, max = min) => ({ min, max })
const TODAY = '2026-11-20'
const ago = (days: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)
const session = (days: number, sets: LoggedSet[], extra: Partial<SessionEvidence> = {}): SessionEvidence =>
  ({ date: ago(days), sets, target: rng(8), ...extra })
const base = { today: TODAY, sets: 3, target: rng(8), history: [] as SessionEvidence[] }
const lines = (result: ReturnType<typeof recommend>, language: 'en' | 'es' = 'en') =>
  trainerReason(createTranslator(language), language, result, result.reps).split('\n')

describe('first time on an exercise (F1-F9)', () => {
  it('F1: barbell straight, no history: no number, straight protocol', () => {
    expect(recommend({ ...base, equipment: 'barbell', technique: 'straight', plannedWeight: 40 }))
      .toMatchObject({ weight: null, action: 'collect_data', reason: 'no_history', firstSessionProtocol: 'straight' })
  })

  it('F2: dumbbell superset, no history: as F1', () => {
    expect(recommend({ ...base, equipment: 'dumbbell', technique: 'superset' }))
      .toMatchObject({ weight: null, action: 'collect_data', reason: 'no_history', firstSessionProtocol: 'straight' })
  })

  it('F3: machine straight gets the straight protocol, no 10% line', () => {
    const result = recommend({ ...base, equipment: 'machine', technique: 'straight' })
    expect(result.firstSessionProtocol).toBe('straight')
    expect(lines(result).join(' ')).not.toContain('10%')
  })

  it('F4: plate-loaded reverse pyramid and cable pyramid keep their protocol, no number', () => {
    expect(recommend({ ...base, equipment: 'plate-loaded', technique: 'reverse-pyramid', target: rng(8, 12), setReps: [8, 10, 12] }))
      .toMatchObject({ weight: null, firstSessionProtocol: 'reverse-pyramid' })
    expect(recommend({ ...base, equipment: 'cable', technique: 'pyramid', target: rng(10, 14), setReps: [14, 12, 10] }))
      .toMatchObject({ weight: null, firstSessionProtocol: 'pyramid' })
  })

  it('F5: push-up, no history: no kg, the bodyweight line only', () => {
    const result = recommend({ ...base, equipment: 'bodyweight', exerciseId: 'push-up', plannedWeight: 0 })
    expect(result.firstSessionProtocol).toBe('bodyweight')
    expect(lines(result)).toEqual(['Do the reps with control, and stop with about 3 more left in you.'])
    expect(lines(result).join(' ')).not.toContain('kg')
  })

  it('F7: a first exposure in the deload week is still no number, never 0', () => {
    expect(recommend({ ...base, equipment: 'dumbbell', deload: true })).toMatchObject({ weight: null, firstSessionProtocol: 'straight' })
  })

  it('F8: a barbell history of only 0 kg counts as no history', () => {
    expect(recommend({ ...base, equipment: 'barbell', history: [session(4, [s(0, 5), s(0, 5), s(0, 5)])] }))
      .toMatchObject({ weight: null, reason: 'no_history', firstSessionProtocol: 'straight' })
  })
})

describe('from the second exposure, normal rules (F10-F17)', () => {
  it('F10: 40 × 8, 8, 8 on target 8 → 42.5', () => {
    expect(recommend({ ...base, equipment: 'barbell', history: [session(3, [s(40, 8), s(40, 8), s(40, 8)])] }))
      .toMatchObject({ weight: 42.5, reason: 'reached_top_of_range' })
  })

  it('F11: 40 × 14 on target 8 → 42.5, never 45', () => {
    expect(recommend({ ...base, equipment: 'barbell', history: [session(3, [s(40, 14), s(40, 14), s(40, 14)])] }))
      .toMatchObject({ weight: 42.5, reason: 'exceeded_target' })
  })

  it('F12: 40 × 5 on target 8 → 40', () => {
    expect(recommend({ ...base, equipment: 'barbell', history: [session(3, [s(40, 5), s(40, 5), s(40, 5)])] }))
      .toMatchObject({ weight: 40, reason: 'below_target_once' })
  })

  it('F13: twice below target → 37.5', () => {
    const miss = [s(40, 5), s(40, 5), s(40, 5)]
    expect(recommend({ ...base, equipment: 'barbell', history: [session(3, miss), session(6, miss)] }))
      .toMatchObject({ weight: 37.5, reason: 'below_target_twice' })
  })

  it('F14: 20, 25, 25 × 8 → 25', () => {
    expect(recommend({ ...base, equipment: 'barbell', history: [session(3, [s(20, 8), s(25, 8), s(25, 8)])] }))
      .toMatchObject({ weight: 25, reason: 'consolidate_load' })
  })

  it('F15: dumbbell 6 × 12 on target 12 → 6, more reps, never 8 yet', () => {
    const result = recommend({ ...base, equipment: 'dumbbell', step: 2, target: rng(12), history: [session(3, [s(6, 12), s(6, 12), s(6, 12)], { target: rng(12) })] })
    expect(result).toMatchObject({ weight: 6, action: 'increase_reps' })
    expect(result.weight).not.toBe(8)
  })

  it('F16: Upper A 40 × 8, then Upper B target 10 → 37.5', () => {
    expect(recommend({ ...base, equipment: 'barbell', target: rng(10), history: [session(3, [s(40, 8), s(40, 8), s(40, 8)], { target: rng(8) })] }))
      .toMatchObject({ weight: 37.5, reason: 'converted_rep_range' })
  })

  it('F17: 40 × 8 then 30 days off → 35', () => {
    expect(recommend({ ...base, equipment: 'barbell', history: [session(30, [s(40, 8), s(40, 8), s(40, 8)])] }))
      .toMatchObject({ weight: 35, reason: 'long_break' })
  })
})

describe('first-time wording (L1, L2)', () => {
  it('L1: machine straight card, EN and ES, in order, no 10%, no reps-left question', () => {
    const result = recommend({ ...base, equipment: 'machine', technique: 'straight' })
    expect(lines(result)).toEqual([
      "Start light and add a little weight over 1-3 easy warm-up sets. Don't log these.",
      'Choose a weight that lets you finish 8 reps with about 3 more left in you.',
      'Use that weight on every set.',
      "Too heavy or too light? Change it. That's normal today.",
      'Your next target will start from what you log.',
    ])
    expect(lines(result, 'es')).toEqual([
      'Empieza ligero y sube un poco el peso en 1 a 3 series fáciles de calentamiento. No las registres.',
      'Elige un peso con el que completes 8 reps y aún te queden unas 3 más.',
      'Usa ese peso en todas las series.',
      '¿Muy pesado o muy ligero? Cámbialo. Hoy es normal.',
      'Tu próximo objetivo partirá de lo que registres.',
    ])
    expect(lines(result).join(' ')).not.toMatch(/left on the heaviest|reps you had left/)
  })

  it('L2: dumbbell card adds the one-dumbbell line before the log line', () => {
    const text = lines(recommend({ ...base, equipment: 'dumbbell', technique: 'straight' }))
    expect(text.slice(-2)).toEqual(['Log the weight of one dumbbell.', 'Your next target will start from what you log.'])
  })
})

describe('PT pre-merge review 2026-11-07', () => {
  it('drop set: no same-weight line, the other first-time lines stay', () => {
    const result = recommend({ ...base, equipment: 'machine', technique: 'drop-set' })
    expect(result).toMatchObject({ weight: null, firstSessionProtocol: 'drop-set' })
    expect(lines(result)).toEqual([
      "Start light and add a little weight over 1-3 easy warm-up sets. Don't log these.",
      'Choose a weight that lets you finish 8 reps with about 3 more left in you.',
      "Too heavy or too light? Change it. That's normal today.",
      'Your next target will start from what you log.',
    ])
  })

  it.each(['barbell', 'ez-bar', 'hex-bar', 'dumbbell', 'kettlebell', 'cable', 'machine', 'plate-loaded', 'smith-machine'])(
    'F7: a first exposure in the deload week on %s has no number, never 0', (equipment) => {
      expect(recommend({ ...base, equipment, deload: true, plannedWeight: 30 })).toMatchObject({ weight: null, action: 'collect_data' })
    })

  it('F6: day 2 with all new exercises gets the first-time text even with day 1 logged', () => {
    // History is per exercise: day 1 logs of other exercises are not this exercise's history.
    const dayOne = [session(2, [s(40, 8), s(40, 8), s(40, 8)], { dayKey: 'full-body-a' })]
    expect(recommend({ ...base, equipment: 'dumbbell', dayKey: 'full-body-b', history: [] }).firstSessionProtocol).toBe('straight')
    expect(recommend({ ...base, equipment: 'barbell', dayKey: 'full-body-a', history: dayOne }).firstSessionProtocol).toBeUndefined()
  })

  it('L3: the Spanish first-time lines are all Spanish', () => {
    const en = lines(recommend({ ...base, equipment: 'dumbbell', technique: 'straight' }))
    const es = lines(recommend({ ...base, equipment: 'dumbbell', technique: 'straight' }), 'es')
    es.forEach((line, index) => expect(line).not.toBe(en[index]))
    expect(lines(recommend({ ...base, equipment: 'bodyweight' }), 'es')).toEqual(['Haz las reps con control y detente cuando aún te queden unas 3 más.'])
  })

  it('L4: the second session shows no first-time text', () => {
    const result = recommend({ ...base, equipment: 'barbell', history: [session(3, [s(40, 8), s(40, 8), s(40, 8)])] })
    expect(result.firstSessionProtocol).toBeUndefined()
    expect(lines(result).join(' ')).not.toContain('warm-up sets')
  })

  it('open decision 7 (PO): barbell, EZ and hex bar cards say to log the total with the bar', () => {
    for (const equipment of ['barbell', 'ez-bar', 'hex-bar']) {
      const text = lines(recommend({ ...base, equipment, technique: 'straight' }))
      expect(text.slice(-2)).toEqual(['Log the total weight, including the bar.', 'Your next target will start from what you log.'])
      expect(lines(recommend({ ...base, equipment, technique: 'straight' }), 'es')).toContain('Registra el peso total, incluida la barra.')
    }
    expect(lines(recommend({ ...base, equipment: 'machine', technique: 'straight' })).join(' ')).not.toContain('including the bar')
  })

  it('PO 2026-11-07: pyramid lines no longer repeat "start light", and are Spanish in ES', () => {
    const pyramid = recommend({ ...base, equipment: 'cable', technique: 'pyramid', target: rng(10, 14), setReps: [14, 12, 10] })
    expect(lines(pyramid)[2]).toBe('Add about 10% each set as the reps drop.')
    expect(lines(pyramid, 'es')[2]).toBe('Sube cerca de un 10% en cada serie a medida que bajan las reps.')
    const reverse = recommend({ ...base, equipment: 'plate-loaded', technique: 'reverse-pyramid', target: rng(8, 12), setReps: [8, 10, 12] })
    expect(lines(reverse, 'es')[2]).toBe('Luego quita cerca de un 10% en cada serie más ligera.')
  })
})

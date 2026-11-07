import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { recommend, type Recommendation } from './engine'
import { trainerReason, trainerReasonParts } from './presentation'

// QA 2026-11-07 (bench, Upper A): the engine moves the load up with reps 6–8 and the rows prefill 6, so "today's
// target" shows the engine's range, not the plan's 8. Wording and evidence stay as approved.
const bench: Recommendation = {
  action: 'increase_weight', weight: 85, reps: { min: 6, max: 8 }, sets: 3, reason: 'original_too_easy', confidence: 'high',
  evidence: {
    lastWeight: 82.5, lastReps: [10, 10, 10], lastTarget: { min: 10, max: 10 }, sessionsUsed: 2,
    sameDayDate: '2026-11-02', sameDayName: 'Upper A', sameDayWeight: 82.5, sameDayReps: [8, 8, 8], sameDayTarget: { min: 8, max: 8 },
  },
}

describe('trainerReasonParts', () => {
  const t = createTranslator('en')

  it('splits the comparison from the reason, and joins back to trainerReason', () => {
    const parts = trainerReasonParts(t, 'en', bench, { min: 8, max: 8 }, bench.reps)
    expect(parts.comparison).toBe('vs last Upper A (Mon 2 Nov: 82.5 kg × 8 · 8 · 8): up 2.5 kg')
    expect(parts.lines).toEqual(['Last time you did 10 · 10 · 10 reps at 82.5 kg; today’s target is 6–8. I have moved the load up.'])
    expect(trainerReason(t, 'en', bench, { min: 8, max: 8 }, bench.reps)).toBe(`${parts.comparison}\n${parts.lines[0]}`)
  })

  it('defaults today’s target to the plan target', () => {
    expect(trainerReason(t, 'en', bench, { min: 8, max: 8 })).toContain('today’s target is 8.')
  })
})

// PT super-QA pre-merge review 2026-11-07, items 2-5 (docs/fitness/approved/2026-11-07-pt-super-qa-text.md).
describe('why this weight: evidence day and unchanged loads', () => {
  const s = (weight: number, reps: number) => ({ weight, reps })
  const upperA = { date: '2026-11-02', dayKey: 'upper-a', dayName: 'Upper A', target: { min: 8, max: 8 }, sets: [s(40, 8), s(40, 8), s(40, 8)] }

  it('F16: Upper A 40 × 8 then Upper B target 10 names the evidence day and keeps "adjusted" for a lower load (EN, ES)', () => {
    const result = recommend({ history: [upperA], today: '2026-11-05', dayKey: 'upper-b', target: { min: 10, max: 10 }, sets: 3, equipment: 'barbell' })
    expect(result.weight).toBe(37.5)
    const en = trainerReasonParts(createTranslator('en'), 'en', result, { min: 10, max: 10 }).lines
    expect(en[0]).toMatch(/^Based on your last session: Upper A, /)
    expect(en[1]).toContain('I adjusted the load from 40 kg')
    const es = trainerReasonParts(createTranslator('es'), 'es', result, { min: 10, max: 10 }).lines
    expect(es[0]).toMatch(/^Según tu última sesión: Upper A, /)
    expect(es[1]).toContain('Ajusté el peso desde 40 kg')
  })

  it('no evidence-day line when the last session is today\'s plan day', () => {
    const result = recommend({ history: [upperA], today: '2026-11-05', dayKey: 'upper-a', target: { min: 8, max: 8 }, sets: 3, equipment: 'barbell' })
    expect(trainerReasonParts(createTranslator('en'), 'en', result, { min: 8, max: 8 }).lines.join(' ')).not.toContain('Based on your last session')
  })

  it('a rep-target change with the same top load says "kept", never "adjusted from" (EN, ES)', () => {
    const kept: Recommendation = {
      action: 'maintain', weight: 40, reps: { min: 10, max: 10 }, sets: 3, reason: 'converted_rep_range', confidence: 'medium',
      evidence: { lastWeight: 40, lastReps: [10, 10, 10], lastTarget: { min: 8, max: 8 }, sessionsUsed: 1 },
    }
    expect(trainerReasonParts(createTranslator('en'), 'en', kept, { min: 10, max: 10 }).lines).toEqual(["Kept 40 kg for today's 10-rep target."])
    expect(trainerReasonParts(createTranslator('es'), 'es', kept, { min: 10, max: 10 }).lines).toEqual(['Mantuve 40 kg para el objetivo de 10 repeticiones de hoy.'])
  })

  it('band work without load says "no added load" (EN, ES)', () => {
    const band = recommend({ history: [{ date: '2026-11-02', target: { min: 12, max: 12 }, sets: [s(0, 12), s(0, 12)] }], today: '2026-11-05', target: { min: 12, max: 12 }, sets: 2, equipment: 'band' })
    expect(band.reason).toBe('no_load_add_reps')
    expect(trainerReason(createTranslator('en'), 'en', band, { min: 12, max: 12 })).toBe('No added load: add reps before adding weight (12 · 12 last time).')
    expect(trainerReason(createTranslator('es'), 'es', band, { min: 12, max: 12 })).toBe('Sin carga añadida: suma repeticiones antes de agregar peso (12 · 12 la última vez).')
  })
})

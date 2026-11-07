import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import type { Recommendation } from './engine'
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

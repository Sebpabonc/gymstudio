import { describe, expect, it } from 'vitest'
import { recommend } from './engine'
import { explanationPayload, validateExplanation } from './explain'

const rec = recommend({
  history: [{ date: '2026-10-05', sets: [10, 10, 10].map(() => ({ weight: 10, reps: 14 })), target: { min: 10, max: 10 } }],
  today: '2026-10-08',
  target: { min: 12, max: 12 },
  sets: 3,
  equipment: 'dumbbell',
  plannedWeight: 10,
})
const payload = explanationPayload(rec, { weight: 10, target: { min: 12, max: 12 } })

describe('validateExplanation', () => {
  it('keeps a sentence that only uses numbers from the data', () => {
    const text = 'On Monday you did 14 reps with 10 kg when the target was 10, so today go to 12 kg for 10–12 reps.'
    expect(validateExplanation(text, payload)).toBe(text)
  })

  it('rejects a sentence with an invented number', () => {
    expect(validateExplanation('Go for 15 kg today.', payload)).toBeNull()
  })

  it('rejects empty or overly long text', () => {
    expect(validateExplanation('  ', payload)).toBeNull()
    expect(validateExplanation('x'.repeat(300), payload)).toBeNull()
  })
})

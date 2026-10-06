import { describe, expect, it } from 'vitest'
import { applyTrainerRecommendation, type TrainerDraftValues } from './draft'
import type { Recommendation } from './engine'

const original: TrainerDraftValues = {
  reps: 12,
  weight: 10,
  setWeights: [10, 10, 10],
  setWeightTouched: [true, true, true],
  setReps: [12, 12, 12],
  recommendationId: 'recommendation-1',
}

const recommendation: Recommendation = {
  action: 'increase_weight',
  weight: 12,
  reps: { min: 10, max: 12 },
  sets: 3,
  reason: 'original_too_easy',
  confidence: 'medium',
  evidence: { sessionsUsed: 1 },
}

describe('applyTrainerRecommendation', () => {
  it('fills every set with the accepted weight and lower rep target', () => {
    const result = applyTrainerRecommendation(original, recommendation, 'accepted', original)

    expect(result).toMatchObject({
      weight: 12,
      reps: 10,
      setWeights: [12, 12, 12],
      setReps: [10, 10, 10],
      trainerChoice: 'accepted',
      recommendationId: 'recommendation-1',
    })
  })

  it('restores the original plan values when keeping the original', () => {
    const edited = { ...original, weight: 14, setWeights: [14, 14, 14], setReps: [9, 9, 9] }

    expect(applyTrainerRecommendation(edited, recommendation, 'kept_original', original)).toMatchObject({
      weight: 10,
      reps: 12,
      setWeights: [10, 10, 10],
      setReps: [12, 12, 12],
      trainerChoice: 'kept_original',
    })
  })
})

import type { Recommendation } from './engine'

export type TrainerChoice = 'accepted' | 'kept_original'

export type TrainerDraftValues = {
  reps: number
  weight: number
  setWeights: number[]
  setWeightTouched: boolean[]
  setReps: number[]
  recommendationId?: string
  trainerChoice?: TrainerChoice
}

export function applyTrainerRecommendation<T extends TrainerDraftValues>(
  draft: T,
  recommendation: Recommendation,
  choice: TrainerChoice,
  original: T
): T {
  const useRecommendation = choice === 'accepted'
  const weight = useRecommendation ? recommendation.weight ?? original.weight : original.weight
  const reps = useRecommendation ? recommendation.reps.min : original.reps
  const setCount = useRecommendation ? recommendation.sets : original.setWeights.length

  return {
    ...draft,
    reps,
    weight,
    setWeights: Array.from({ length: setCount }, () => weight),
    setWeightTouched: Array.from({ length: setCount }, () => useRecommendation && weight > 0),
    setReps: Array.from({ length: setCount }, () => reps),
    trainerChoice: choice,
  }
}

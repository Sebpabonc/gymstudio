import type { Recommendation } from './engine'

export type TrainerChoice = 'accepted' | 'kept_original'

export type TrainerDraftValues = {
  reps: number
  weight: number
  setWeights: number[]
  setWeightTouched: boolean[]
  setReps: number[]
  dropSetWeights?: number[]
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

  const perSetWeights = useRecommendation && recommendation.setWeights?.length ? recommendation.setWeights : null
  const perSetReps = useRecommendation && recommendation.setReps?.length ? recommendation.setReps : null
  return {
    ...draft,
    reps,
    weight,
    setWeights: Array.from({ length: setCount }, (_, index) => perSetWeights?.[index] ?? weight),
    setWeightTouched: Array.from({ length: setCount }, () => useRecommendation && weight > 0),
    setReps: Array.from({ length: setCount }, (_, index) => perSetReps?.[index] ?? (useRecommendation ? reps : original.setReps[index] ?? reps)),
    // PT spec R3: the drop part uses the recommended drop load (75 % of the main load, rounded down).
    ...(useRecommendation && recommendation.dropWeight !== undefined
      ? { dropSetWeights: Array.from({ length: setCount }, () => recommendation.dropWeight as number) }
      : {}),
    trainerChoice: choice,
  }
}

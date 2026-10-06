import type { Recommendation, RepRange } from './engine'

// Phase 4: the LLM only rewrites the engine's decision as a PT sentence. Any number in its text that is not in
// the recommendation's own data means it invented something, so the text is discarded and the template is used.

export function explanationKey(exerciseId: string, date: string, recommendation: Recommendation, language: string) {
  const { action, weight, reason, reps } = recommendation
  return [exerciseId, date, action, weight ?? '-', reps.min, reps.max, reason, language].join('|')
}

export function explanationPayload(recommendation: Recommendation, original: { weight: number; target: RepRange }) {
  return {
    action: recommendation.action,
    reason: recommendation.reason,
    confidence: recommendation.confidence,
    recommended: { weight: recommendation.weight, reps: recommendation.reps, sets: recommendation.sets },
    original: { weight: original.weight, reps: original.target },
    lastSession: {
      date: recommendation.evidence.lastDate,
      weight: recommendation.evidence.lastWeight,
      reps: recommendation.evidence.lastReps,
      target: recommendation.evidence.lastTarget,
      daysAgo: recommendation.evidence.daysSinceLast,
    },
    estimatedOneRepMax: recommendation.evidence.estimatedOneRepMax,
    sessionsUsed: recommendation.evidence.sessionsUsed,
  }
}

function numbersIn(text: string) {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((value) => Number(value.replace(',', '.')))
}

export function validateExplanation(text: string, payload: ReturnType<typeof explanationPayload>): string | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 280) return null
  const allowed = new Set(numbersIn(JSON.stringify(payload)))
  // Small counting words ("3 sets", "2 sessions") are fine when they match sets/sessions; everything else must come from the data.
  return numbersIn(trimmed).every((value) => allowed.has(value)) ? trimmed : null
}

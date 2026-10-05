import type { NextTarget } from '../progress/nextTarget'

export type CoachPlanExercise = {
  code: string
  exerciseId: string
  name: string
  sets: number
  reps: number[]
  ruleTarget: { weight: number; reps: number[] }
  last: Array<{ weight: number; reps: number }>
}

export type NextSessionPlan = {
  summary: string
  exercises: Array<{ code: string; weight: number; reps: number[]; note: string }>
}

export function buildExerciseFeedbackPayload(
  exerciseId: string,
  language: 'en' | 'es',
  logged: Array<{ weight: number; reps: number }>,
  target: { sets: number; reps: number[]; weight?: number },
  recommendation: NextTarget
) {
  return {
    feature: 'exercise_feedback',
    exerciseId,
    language,
    logged: logged.map(({ weight, reps }) => ({ weight, reps })),
    target: { ...target, reps: [...target.reps] },
    recommendation,
  }
}

export function buildNextSessionPlanPayload(
  blockId: string,
  dayKey: string,
  week: number,
  exercises: CoachPlanExercise[]
) {
  return {
    blockId,
    dayKey,
    week,
    exercises: exercises.map((exercise) => ({
      ...exercise,
      reps: [...exercise.reps],
      ruleTarget: { ...exercise.ruleTarget, reps: [...exercise.ruleTarget.reps] },
      last: exercise.last.map((set) => ({ ...set })),
    })),
  }
}

function withinTenPercent(value: unknown, target: number) {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.abs(value - target) <= Math.abs(target) * 0.1
}

export function validateNextSessionPlan(answer: string, ruleExercises: CoachPlanExercise[]): NextSessionPlan | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(answer)
  } catch {
    return null
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('summary' in parsed) ||
    typeof parsed.summary !== 'string' ||
    !('exercises' in parsed) ||
    !Array.isArray(parsed.exercises)
  ) {
    return null
  }

  const suggestions = new Map<string, Record<string, unknown>>()
  for (const suggestion of parsed.exercises) {
    if (
      typeof suggestion === 'object' &&
      suggestion !== null &&
      'code' in suggestion &&
      typeof suggestion.code === 'string' &&
      !suggestions.has(suggestion.code)
    ) {
      suggestions.set(suggestion.code, suggestion as Record<string, unknown>)
    }
  }

  return {
    summary: parsed.summary.trim(),
    exercises: ruleExercises.map((exercise) => {
      const suggestion = suggestions.get(exercise.code)
      const proposedWeight = suggestion?.weight
      const weight = withinTenPercent(proposedWeight, exercise.ruleTarget.weight)
        ? proposedWeight as number
        : exercise.ruleTarget.weight
      const proposedReps = Array.isArray(suggestion?.reps) ? suggestion.reps : []
      const reps = exercise.ruleTarget.reps.map((ruleReps, index) =>
        withinTenPercent(proposedReps[index], ruleReps)
          ? proposedReps[index] as number
          : ruleReps
      )
      const note = typeof suggestion?.note === 'string'
        ? suggestion.note.replace(/\s+/g, ' ').trim().slice(0, 200)
        : ''
      return { code: exercise.code, weight, reps, note }
    }),
  }
}

export function limitAiNoteToTwoSentences(answer: string) {
  return (answer.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [answer])
    .slice(0, 2)
    .map((sentence) => sentence.trim())
    .join(' ')
    .trim()
}

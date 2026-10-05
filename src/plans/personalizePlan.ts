import type { Exercise, PlannedExercise, TrainingBlock } from '../types'
import type { TrainingGoal } from '../utils/profileData'

// Turns a PT base template into one user's 6-week block, following the approved rules in
// docs/fitness/approved/templates/README.md and the PO decisions of 2026-10-05:
// beginners max 4 days, home 5-6 days use the -db templates (with the conditioning/core day),
// automatic week-6 deload (handled by the progression engine), nordic curl only for advanced home users.

export type TemplateChoice = { templateId: string; days: number; cappedForBeginner: boolean }

export function selectTemplate(goal: Pick<TrainingGoal, 'daysPerWeek' | 'experience' | 'equipment'>): TemplateChoice {
  const cappedForBeginner = goal.experience === 'beginner' && goal.daysPerWeek > 4
  const days = cappedForBeginner ? 4 : goal.daysPerWeek
  const split = { 3: '3d-full-body', 4: '4d-upper-lower', 5: '5d-upper-lower-ppl', 6: '6d-ab-split' }[days]
  const kit = goal.equipment === 'full_gym' ? 'gym' : 'db'
  return { templateId: `tpl-${split}-${kit}`, days, cappedForBeginner }
}

/** Plans start on the Monday after today (today if it is Monday). */
export function nextMonday(today: Date = new Date()) {
  const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const offset = (8 - date.getUTCDay()) % 7
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

const BEGINNER_SWAPS: Record<string, string> = {
  'barbell-bench-press': 'dumbbell-bench-press',
  'romanian-deadlift': 'dumbbell-romanian-deadlift',
  'hex-bar-deadlift': 'dumbbell-romanian-deadlift',
  'dumbbell-bulgarian-split-squat': 'dumbbell-split-squat',
  'hanging-knee-raise': 'dead-bug',
  'nordic-hamstring-curl': 'dumbbell-romanian-deadlift',
}
const BASIC_GYM_SWAPS: Record<string, string> = {
  'dumbbell-row-single-arm': 'seated-cable-row',
  'dumbbell-overhead-triceps-extension': 'rope-low-cable-oh-tricep-extensions',
  'lying-leg-raise': 'cable-crunch',
}
const LEG_MUSCLES = /quad|hamstring|glute|calf|calves|adductor|leg/i

const isMainLift = (exercise: PlannedExercise) =>
  /^[AB]1$/.test(exercise.code) && exercise.technique === 'straight'

const clampSets = (sets: number) => Math.min(4, Math.max(2, sets))

function withSets(exercise: PlannedExercise, sets: number): PlannedExercise {
  const next = clampSets(sets)
  const reps = Array.from({ length: next }, (_, index) => exercise.reps[Math.min(index, exercise.reps.length - 1)])
  return { ...exercise, sets: next, reps }
}

export function personalizeTemplate(
  base: TrainingBlock,
  goal: TrainingGoal,
  catalogue: Pick<Exercise, 'id' | 'primaryMuscle'>[]
): TrainingBlock {
  const known = new Map(catalogue.map((exercise) => [exercise.id, exercise]))
  const swap = (id: string) => {
    let next = id
    if (goal.experience === 'beginner') {
      if (id === 'back-squat') next = base.days.length === 3 ? 'dumbbell-goblet-squat' : 'leg-press-quad-dominant'
      else if (id === 'push-up' && goal.equipment === 'home') next = 'push-up-incline'
      else next = BEGINNER_SWAPS[id] ?? id
    } else if (id === 'nordic-hamstring-curl' && !(goal.experience === 'advanced' && goal.equipment === 'home')) {
      next = 'dumbbell-romanian-deadlift'
    }
    if (goal.equipment === 'basic_gym') next = BASIC_GYM_SWAPS[next] ?? next
    return known.has(next) ? next : id
  }

  const days = base.days.map((day) => {
    let exercises = day.exercises.map((original) => {
      let exercise: PlannedExercise = { ...original, exerciseId: swap(original.exerciseId), reps: [...original.reps] }
      const main = isMainLift(exercise)
      // Goal
      if (goal.goal === 'strength' && main) {
        exercise = withSets(exercise, exercise.sets + 1)
        exercise = { ...exercise, reps: exercise.reps.map(() => (day.key.endsWith('-b') ? '6' : '5')), restSeconds: Math.max(exercise.restSeconds, 180) }
      }
      if ((goal.goal === 'fat_loss' || goal.goal === 'general') && !main) exercise = withSets(exercise, exercise.sets - 1)
      if (goal.goal === 'fat_loss' && !main) {
        const cut = exercise.technique === 'superset' ? 30 : 15
        exercise = { ...exercise, restSeconds: Math.max(45, exercise.restSeconds - cut) }
      }
      // Experience
      if (goal.experience === 'beginner') exercise = withSets(exercise, Math.min(exercise.sets, main ? 3 : 2))
      // Activity outside the gym
      if (goal.activityLevel === 'high' && !main && LEG_MUSCLES.test(known.get(exercise.exerciseId)?.primaryMuscle ?? '')) {
        exercise = withSets(exercise, exercise.sets - 1)
      }
      return exercise
    })
    // Session length
    if (goal.sessionMinutes === 45 && exercises.length > 4) exercises = exercises.slice(0, -1)
    if (goal.sessionMinutes >= 75) {
      let extra = goal.sessionMinutes === 90 ? 3 : 2
      exercises = exercises.map((exercise) => {
        if (extra > 0 && !isMainLift(exercise) && exercise.sets < 4) {
          extra -= 1
          return withSets(exercise, exercise.sets + 1)
        }
        return exercise
      })
    }
    return { ...day, exercises: exercises.map((exercise, index) => ({ ...exercise, position: index + 1 })) }
  })
  return { ...base, days }
}

export type AiPlanAdjustments = {
  summary?: string
  insights?: { title: string; body: string }[]
  exercises?: Array<{ dayKey: string; code: string; exerciseId?: string; sets?: number; restSeconds?: number; note?: string }>
}

/**
 * Applies the AI's personalisation on top of the rule-based plan, keeping only changes that stay inside
 * PT rules: swaps must exist in the catalogue and train the same primary muscle; sets 2-4 and at most ±1
 * from the rule plan; rest 30-300 s; notes ≤ 80 chars. Anything else is ignored, so the result is always valid.
 */
export function applyAiAdjustments(
  plan: TrainingBlock,
  adjustments: AiPlanAdjustments | null,
  catalogue: Pick<Exercise, 'id' | 'primaryMuscle'>[]
): TrainingBlock {
  if (!adjustments) return plan
  const known = new Map(catalogue.map((exercise) => [exercise.id, exercise]))
  const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null)
  const days = plan.days.map((day) => {
    const usedIds = new Set(day.exercises.map((exercise) => exercise.exerciseId))
    return {
      ...day,
      exercises: day.exercises.map((exercise) => {
        const change = adjustments.exercises?.find((item) => item?.dayKey === day.key && item.code === exercise.code)
        if (!change) return exercise
        let next = { ...exercise, reps: [...exercise.reps] }
        const candidate = change.exerciseId ? known.get(change.exerciseId) : undefined
        const current = known.get(exercise.exerciseId)
        if (candidate && current && candidate.primaryMuscle === current.primaryMuscle && !usedIds.has(candidate.id)) {
          usedIds.add(candidate.id)
          next = { ...next, exerciseId: candidate.id }
          delete next.angleDegrees
        }
        if (Number.isInteger(change.sets) && Math.abs((change.sets as number) - exercise.sets) <= 1) next = withSets(next, change.sets as number)
        if (Number.isInteger(change.restSeconds) && (change.restSeconds as number) >= 30 && (change.restSeconds as number) <= 300) {
          next.restSeconds = change.restSeconds as number
        }
        const note = text(change.note, 80)
        if (note) next.notes = note
        return next
      }),
    }
  })
  const insights = Array.isArray(adjustments.insights)
    ? adjustments.insights
        .map((insight) => ({ title: text(insight?.title, 60), body: text(insight?.body, 400) }))
        .filter((insight): insight is { title: string; body: string } => Boolean(insight.title && insight.body))
        .slice(0, 6)
    : []
  return {
    ...plan,
    summary: text(adjustments.summary, 400) ?? plan.summary,
    insights: insights.length >= 3 ? insights : plan.insights,
    days,
  }
}

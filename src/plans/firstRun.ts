import type { Language } from '../i18n/translate'
import type { Exercise } from '../types'
import type { SavedUserPlan, TrainingGoal, TrainingGoalInput } from '../utils/profileData'
import type { BuiltPlan } from './buildMyPlan'

/** The six first-run answers (PT spec 2026-11-01-first-run-and-same-day-start, section 1). All required, no defaults. */
export const firstRunQuestions = ['goal', 'experience', 'daysPerWeek', 'equipment', 'sessionMinutes', 'activityLevel'] as const
export type FirstRunAnswers = Partial<Omit<TrainingGoalInput, 'notes'>>

export function unansweredCount(answers: FirstRunAnswers) {
  return firstRunQuestions.filter((key) => answers[key] === undefined).length
}

export function completeAnswers(answers: FirstRunAnswers): TrainingGoalInput | null {
  if (unansweredCount(answers) > 0) return null
  return { ...(answers as Omit<TrainingGoalInput, 'notes'>), notes: '' }
}

export type FirstRunDeps = {
  fetchTrainingGoal: () => Promise<TrainingGoal | null>
  fetchActiveUserPlan: () => Promise<SavedUserPlan | null>
  saveTrainingGoal: (goal: TrainingGoalInput) => Promise<TrainingGoal>
  loadExercises: () => Promise<Exercise[]>
  buildMyPlan: (goal: TrainingGoal, catalogue: Exercise[], language: Language, today: Date, options: { startsOnFirstLog: boolean }) => Promise<BuiltPlan>
  publishUserPlan: (plan: SavedUserPlan) => Promise<void>
  cacheActiveUserPlan: (plan: SavedUserPlan | null) => void
}

/** Saves the answers to the new account. An account that already has a goal or a plan keeps them. */
export async function saveFirstRunGoal(goal: TrainingGoalInput, deps: FirstRunDeps): Promise<TrainingGoal | 'kept'> {
  const [savedGoal, activePlan] = await Promise.all([deps.fetchTrainingGoal(), deps.fetchActiveUserPlan()])
  if (savedGoal || activePlan) return 'kept'
  return deps.saveTrainingGoal(goal)
}

/** Builds the plan the same way Profile does (template → PT rules → AI if allowed) and makes it the active plan. */
export async function publishFirstRunPlan(goal: TrainingGoal, deps: FirstRunDeps, language: Language): Promise<BuiltPlan> {
  const catalogue = await deps.loadExercises()
  const built = await deps.buildMyPlan(goal, catalogue, language, new Date(), { startsOnFirstLog: true })
  const plan: SavedUserPlan = { templateId: built.templateId, startDate: built.startDate, block: built.block, source: built.source }
  await deps.publishUserPlan(plan)
  deps.cacheActiveUserPlan(plan)
  return built
}

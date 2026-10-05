import { requestBlockPlan } from '../ai/gateway'
import type { Language } from '../i18n/translate'
import type { Exercise, TrainingBlock } from '../types'
import type { TrainingGoal } from '../utils/profileData'
import { applyAiAdjustments, nextMonday, personalizeTemplate, selectTemplate, type AiPlanAdjustments } from './personalizePlan'
import { loadTemplate, templateToBlock } from './templates'

export type BuiltPlan = {
  templateId: string
  startDate: string
  block: TrainingBlock
  source: 'ai' | 'rules'
  cappedForBeginner: boolean
}

export function parseAiAdjustments(answer: string): AiPlanAdjustments | null {
  try {
    const parsed = JSON.parse(answer)
    return parsed && typeof parsed === 'object' ? (parsed as AiPlanAdjustments) : null
  } catch {
    return null
  }
}

/** Template → PT rules → AI personalisation (validated). Falls back to the rule plan if the AI is unavailable. */
export async function buildMyPlan(
  goal: TrainingGoal,
  catalogue: Pick<Exercise, 'id' | 'primaryMuscle'>[],
  language: Language = 'en',
  today: Date = new Date()
): Promise<BuiltPlan> {
  const choice = selectTemplate(goal)
  const startDate = nextMonday(today)
  const rulePlan = personalizeTemplate(templateToBlock(await loadTemplate(choice.templateId), startDate), goal, catalogue)
  let block = rulePlan
  let source: BuiltPlan['source'] = 'rules'
  try {
    const { answer } = await requestBlockPlan(rulePlan, language)
    const adjustments = parseAiAdjustments(answer)
    if (adjustments) {
      block = applyAiAdjustments(rulePlan, adjustments, catalogue)
      source = 'ai'
    }
  } catch {
    // AI offline, limit reached or not signed in: the PT rule plan is still a complete, valid plan.
  }
  return { templateId: choice.templateId, startDate, block, source, cappedForBeginner: choice.cappedForBeginner }
}

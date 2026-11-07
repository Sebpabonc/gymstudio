import { requestBlockPlan } from '../ai/gateway'
import type { Language } from '../i18n/translate'
import type { Exercise, TrainingBlock } from '../types'
import { localIsoDate } from '../lib/dates'
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
  today: Date = new Date(),
  options: { startsOnFirstLog?: boolean; useAi?: boolean } = {},
): Promise<BuiltPlan> {
  const choice = selectTemplate(goal)
  // First run starts on the first logged set (PT spec 2026-11-01 §2); Profile regeneration keeps next Monday (W16).
  const startDate = options.startsOnFirstLog ? localIsoDate(today) : nextMonday(today)
  const templateBlock = templateToBlock(await loadTemplate(choice.templateId), startDate)
  const rulePlan = personalizeTemplate(options.startsOnFirstLog ? { ...templateBlock, startsOnFirstLog: true } : templateBlock, goal, catalogue)
  let block = rulePlan
  let source: BuiltPlan['source'] = 'rules'
  // The new-user demo has no account, so it never asks the AI (and never opens the consent sheet).
  if (options.useAi === false) return { templateId: choice.templateId, startDate, block, source, cappedForBeginner: choice.cappedForBeginner }
  try {
    const { answer } = await requestBlockPlan(rulePlan, language)
    const adjustments = parseAiAdjustments(answer)
    if (adjustments) {
      block = { ...applyAiAdjustments(rulePlan, adjustments, catalogue), startsOnFirstLog: rulePlan.startsOnFirstLog }
      source = 'ai'
    }
  } catch {
    // AI offline, limit reached or not signed in: the PT rule plan is still a complete, valid plan.
  }
  return { templateId: choice.templateId, startDate, block, source, cappedForBeginner: choice.cappedForBeginner }
}

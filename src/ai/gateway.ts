import { getSupabaseClient } from '../lib/supabaseClient'
import { Language, translate } from '../i18n/translate'

export type AiGatewayResponse = {
  answer: string
  remainingToday: number
}

export type AskExerciseResponse = AiGatewayResponse

const errorKeys = {
  daily_limit: 'ai.error.dailyLimit',
  monthly_budget_reached: 'ai.error.monthlyBudget',
  sign_in_required: 'ai.error.signIn',
  no_session: 'ai.error.noSession',
  offline: 'ai.error.offline',
} as const

class AiGatewayError extends Error {}

export function mapAiGatewayError(code: string, language: Language = 'en'): string {
  const key = errorKeys[code as keyof typeof errorKeys] ?? 'ai.error.unavailable'
  return translate(language, key)
}

export const mapAskExerciseError = mapAiGatewayError

async function getErrorCode(error: unknown): Promise<string> {
  if (typeof error !== 'object' || error === null || !('context' in error)) return ''

  const context = error.context
  if (typeof Response === 'undefined' || !(context instanceof Response)) return ''

  try {
    const body = await context.clone().json() as { error?: unknown }
    return typeof body.error === 'string' ? body.error : ''
  } catch {
    return ''
  }
}

async function invokeAiGateway(
  body: Record<string, unknown>
): Promise<AiGatewayResponse> {
  const language: Language = body.language === 'es' ? 'es' : 'en'
  try {
    const client = await getSupabaseClient()
    if (!client) throw new AiGatewayError(mapAiGatewayError('client_unavailable', language))

    const { data, error } = await client.functions.invoke<AiGatewayResponse | { error: string }>(
      'ai-gateway',
      { body }
    )

    if (error) throw new AiGatewayError(mapAiGatewayError(await getErrorCode(error), language))
    if (data && 'error' in data) throw new AiGatewayError(mapAiGatewayError(data.error, language))
    if (!data || typeof data.answer !== 'string' || typeof data.remainingToday !== 'number') {
      throw new AiGatewayError(mapAiGatewayError('invalid_response', language))
    }

    return data
  } catch (error) {
    if (error instanceof AiGatewayError) throw error
    throw new AiGatewayError(mapAiGatewayError('unknown', language))
  }
}

export function askExercise(
  exerciseId: string,
  question: string,
  language: Language = 'en'
): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'ask_exercise', exerciseId, question, language })
}

export function askGeneral(question: string, language: Language = 'en'): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'general_chat', question, language })
}

export function explainSuggestion(
  exerciseId: string,
  suggestionText: string,
  language: Language = 'en'
): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'explain_suggestion', exerciseId, suggestion: suggestionText, language })
}

export function summariseSession(
  date: string,
  blockId?: string,
  dayKey?: string,
  language: Language = 'en'
): Promise<AiGatewayResponse> {
  return invokeAiGateway({
    feature: 'session_summary',
    date,
    language,
    ...(blockId ? { blockId } : {}),
    ...(dayKey ? { dayKey } : {}),
  })
}

export function requestExerciseFeedback(
  payload: ReturnType<typeof import('./coachLoop').buildExerciseFeedbackPayload>
): Promise<AiGatewayResponse> {
  return invokeAiGateway(payload)
}

export function requestNextSessionPlan(
  plan: ReturnType<typeof import('./coachLoop').buildNextSessionPlanPayload>,
  language: Language = 'en'
): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'next_session_plan', plan, language })
}

/** AI personalisation of a rule-based 6-week plan (JSON answer, applied with applyAiAdjustments). */
export function requestBlockPlan(plan: import('../types').TrainingBlock, language: Language = 'en'): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'block_plan', plan, language })
}

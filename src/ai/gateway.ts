import { getSupabaseClient } from '../lib/supabaseClient'

export type AiGatewayResponse = {
  answer: string
  remainingToday: number
}

export type AskExerciseResponse = AiGatewayResponse

const errorMessages: Record<string, string> = {
  daily_limit: "You've used today's 20 questions. Try again tomorrow.",
  monthly_budget_reached: 'AI is paused for this month.',
  sign_in_required: 'Sign in to ask AI.',
  no_session: 'Log a workout first.',
  offline: "You're offline.",
}

export function mapAiGatewayError(code: string): string {
  return errorMessages[code] ?? 'AI is unavailable right now. Try again.'
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
  body: Record<string, string>
): Promise<AiGatewayResponse> {
  try {
    const client = await getSupabaseClient()
    if (!client) throw new Error(mapAiGatewayError('client_unavailable'))

    const { data, error } = await client.functions.invoke<AiGatewayResponse | { error: string }>(
      'ai-gateway',
      { body }
    )

    if (error) throw new Error(mapAiGatewayError(await getErrorCode(error)))
    if (data && 'error' in data) throw new Error(mapAiGatewayError(data.error))
    if (!data || typeof data.answer !== 'string' || typeof data.remainingToday !== 'number') {
      throw new Error(mapAiGatewayError('invalid_response'))
    }

    return data
  } catch (error) {
    if (error instanceof Error && Object.values(errorMessages).includes(error.message)) throw error
    throw new Error(mapAiGatewayError('unknown'))
  }
}

export function askExercise(exerciseId: string, question: string): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'ask_exercise', exerciseId, question })
}

export function explainSuggestion(
  exerciseId: string,
  suggestionText: string
): Promise<AiGatewayResponse> {
  return invokeAiGateway({ feature: 'explain_suggestion', exerciseId, suggestionText })
}

export function summariseSession(
  date: string,
  blockId?: string,
  dayKey?: string
): Promise<AiGatewayResponse> {
  return invokeAiGateway({
    feature: 'session_summary',
    date,
    ...(blockId ? { blockId } : {}),
    ...(dayKey ? { dayKey } : {}),
  })
}

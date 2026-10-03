import { getSupabaseClient } from '../lib/supabaseClient'

export type AskExerciseResponse = {
  answer: string
  remainingToday: number
}

const errorMessages: Record<string, string> = {
  daily_limit: "You've used today's 20 questions. Try again tomorrow.",
  monthly_budget_reached: 'AI is paused for this month.',
  sign_in_required: 'Sign in to ask AI.',
}

export function mapAskExerciseError(code: string): string {
  return errorMessages[code] ?? 'AI is unavailable right now. Try again.'
}

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

export async function askExercise(exerciseId: string, question: string): Promise<AskExerciseResponse> {
  try {
    const client = await getSupabaseClient()
    if (!client) throw new Error(mapAskExerciseError('client_unavailable'))

    const { data, error } = await client.functions.invoke<AskExerciseResponse | { error: string }>(
      'ai-gateway',
      { body: { feature: 'ask_exercise', exerciseId, question } }
    )

    if (error) throw new Error(mapAskExerciseError(await getErrorCode(error)))
    if (data && 'error' in data) throw new Error(mapAskExerciseError(data.error))
    if (!data || typeof data.answer !== 'string' || typeof data.remainingToday !== 'number') {
      throw new Error(mapAskExerciseError('invalid_response'))
    }

    return data
  } catch (error) {
    if (error instanceof Error && Object.values(errorMessages).includes(error.message)) throw error
    throw new Error(mapAskExerciseError('unknown'))
  }
}

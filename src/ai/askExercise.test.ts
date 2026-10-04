import { afterEach, describe, expect, it, vi } from 'vitest'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(async () => ({ functions: { invoke } })),
}))

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('askExercise', () => {
  it('invokes the AI gateway with the exercise question and returns its answer', async () => {
    invoke.mockResolvedValue({
      data: { answer: 'Keep your wrists stacked.', remainingToday: 19 },
      error: null,
    })
    const { askExercise } = await import('./askExercise')

    await expect(askExercise('barbell-bench-press', 'Where should I feel this?')).resolves.toEqual({
      answer: 'Keep your wrists stacked.',
      remainingToday: 19,
    })
    expect(invoke).toHaveBeenCalledWith('ai-gateway', {
      body: {
        feature: 'ask_exercise',
        exerciseId: 'barbell-bench-press',
        question: 'Where should I feel this?',
        language: 'en',
      },
    })
  })

  it.each([
    ['daily_limit', "You've used today's 20 questions. Try again tomorrow."],
    ['monthly_budget_reached', 'AI is paused for this month.'],
    ['sign_in_required', 'Sign in to ask AI.'],
    ['ai_not_configured', 'AI is unavailable right now. Try again.'],
  ])('maps %s gateway errors to friendly text', async (code, message) => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: new Response(JSON.stringify({ error: code }), { status: 429 }) },
    })
    const { askExercise } = await import('./askExercise')

    await expect(askExercise('barbell-bench-press', 'How do I fix my form?')).rejects.toThrow(message)
  })
})

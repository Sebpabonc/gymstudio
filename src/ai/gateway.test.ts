import { afterEach, describe, expect, it, vi } from 'vitest'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(async () => ({ functions: { invoke } })),
}))

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('AI gateway wrappers', () => {
  it('invokes explain_suggestion with the exercise and suggestion text', async () => {
    invoke.mockResolvedValue({
      data: { answer: 'You met all prescribed reps.', remainingToday: 18 },
      error: null,
    })
    const { explainSuggestion } = await import('./gateway')

    await expect(explainSuggestion('barbell-bench-press', 'Ready to add 2.5 kg.')).resolves.toEqual({
      answer: 'You met all prescribed reps.',
      remainingToday: 18,
    })
    expect(invoke).toHaveBeenCalledWith('ai-gateway', {
      body: {
        feature: 'explain_suggestion',
        exerciseId: 'barbell-bench-press',
        suggestion: 'Ready to add 2.5 kg.',
        language: 'en',
      },
    })
  })

  it('invokes session_summary with the session scope', async () => {
    invoke.mockResolvedValue({
      data: { answer: '- Great effort today.', remainingToday: 17 },
      error: null,
    })
    const { summariseSession } = await import('./gateway')

    await expect(summariseSession('2026-10-04', 'block-1', 'chest-back-a')).resolves.toMatchObject({
      answer: '- Great effort today.',
    })
    expect(invoke).toHaveBeenCalledWith('ai-gateway', {
      body: {
        feature: 'session_summary',
        date: '2026-10-04',
        blockId: 'block-1',
        dayKey: 'chest-back-a',
        language: 'en',
      },
    })
  })

  it('invokes general_chat with the question and selected language', async () => {
    invoke.mockResolvedValue({
      data: { answer: 'Try adding a rep next session.', remainingToday: 19 },
      error: null,
    })
    const { askGeneral } = await import('./gateway')

    await expect(askGeneral('How do I progress?', 'es')).resolves.toEqual({
      answer: 'Try adding a rep next session.',
      remainingToday: 19,
    })
    expect(invoke).toHaveBeenCalledWith('ai-gateway', {
      body: { feature: 'general_chat', question: 'How do I progress?', language: 'es' },
    })
  })

  it.each([
    ['daily_limit', "You've used today's 20 questions. Try again tomorrow."],
    ['monthly_budget_reached', 'AI is paused for this month.'],
    ['sign_in_required', 'Sign in to ask AI.'],
    ['no_session', 'Log a workout first.'],
  ])('maps %s errors to friendly text', async (code, message) => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: new Response(JSON.stringify({ error: code }), { status: 429 }) },
    })
    const { explainSuggestion } = await import('./gateway')

    await expect(explainSuggestion('barbell-bench-press', 'Why?')).rejects.toThrow(message)
  })

  it('sends the selected language and localises errors', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: new Response(JSON.stringify({ error: 'sign_in_required' }), { status: 401 }) },
    })
    const { askExercise } = await import('./gateway')

    await expect(askExercise('barbell-bench-press', '¿Cómo?', 'es')).rejects.toThrow('Inicia sesión para preguntar a la IA.')
    expect(invoke).toHaveBeenCalledWith('ai-gateway', {
      body: { feature: 'ask_exercise', exerciseId: 'barbell-bench-press', question: '¿Cómo?', language: 'es' },
    })
  })
})

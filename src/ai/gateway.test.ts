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
        suggestionText: 'Ready to add 2.5 kg.',
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
      },
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
})

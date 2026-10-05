import { afterEach, describe, expect, it, vi } from 'vitest'

const { from, insert } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(async () => ({ from })),
}))

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('submitFeedback', () => {
  it('inserts feedback with app metadata using the signed-in client', async () => {
    from.mockReturnValue({ insert })
    insert.mockResolvedValue({ error: null })
    const { submitFeedback } = await import('./feedback')

    await submitFeedback({
      type: 'content',
      message: 'The exercise description needs an update.',
      appVersion: '0.1.0',
      screen: 'exercises',
      language: 'en',
    })

    expect(from).toHaveBeenCalledWith('feedback')
    expect(insert).toHaveBeenCalledWith({
      type: 'content',
      message: 'The exercise description needs an update.',
      app_version: '0.1.0',
      screen: 'exercises',
      language: 'en',
    })
  })

  it('maps insert failures to a friendly error code', async () => {
    from.mockReturnValue({ insert })
    insert.mockResolvedValue({ error: { message: 'database details' } })
    const { submitFeedback } = await import('./feedback')

    await expect(submitFeedback({
      type: 'idea',
      message: 'A suggestion.',
      appVersion: '0.1.0',
      screen: 'today',
      language: 'es',
    })).rejects.toThrow('feedback_unavailable')
  })
})

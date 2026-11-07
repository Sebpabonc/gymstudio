import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { invoke, getConsent } = vi.hoisted(() => ({ invoke: vi.fn(), getConsent: vi.fn() }))

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(async () => ({ functions: { invoke } })),
}))

vi.mock('../utils/storage', () => ({
  getAskExerciseAiConsent: getConsent,
}))

import { buildMyPlan } from './buildMyPlan'

const goal = {
  goal: 'muscle' as const,
  daysPerWeek: 3 as const,
  experience: 'beginner' as const,
  activityLevel: 'moderate' as const,
  sessionMinutes: 45 as const,
  equipment: 'full_gym' as const,
  notes: 'private goal notes',
}

beforeEach(() => {
  getConsent.mockReturnValue(null)
})

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('buildMyPlan start date', () => {
  it('W16: Profile plans start next Monday; first-run plans start today and wait for the first log', async () => {
    const today = new Date(2026, 10, 7, 12)
    const profile = await buildMyPlan(goal, [], 'en', today)
    expect(profile.startDate).toBe('2026-11-09')
    expect(profile.block.startsOnFirstLog).toBeUndefined()
    const firstRun = await buildMyPlan(goal, [], 'en', today, { startsOnFirstLog: true })
    expect(firstRun.startDate).toBe('2026-11-07')
    expect(firstRun.block.startsOnFirstLog).toBe(true)
  })
})

describe('buildMyPlan consent fallback', () => {
  it.each([null, 'declined'] as const)('uses the rule plan without a gateway request when consent is %s', async (choice) => {
    getConsent.mockReturnValue(choice)

    const result = await buildMyPlan(goal, [], 'en', new Date('2026-10-26T12:00:00Z'))

    expect(result.source).toBe('rules')
    expect(result.block.days.length).toBeGreaterThan(0)
    expect(invoke).not.toHaveBeenCalled()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { completeAnswers, publishFirstRunPlan, saveFirstRunGoal, unansweredCount, type FirstRunDeps } from './firstRun'
import type { TrainingGoalInput } from '../utils/profileData'

const goal: TrainingGoalInput = { goal: 'muscle', daysPerWeek: 3, experience: 'beginner', activityLevel: 'low', sessionMinutes: 45, equipment: 'full_gym', notes: '' }
const block = { id: 'p', number: 1, name: 'Full Body · 3 days', method: '', startDate: '2026-11-09', weeks: 6, origin: 'pt' as const, summary: '', insights: [], days: [] }

function deps(overrides: Partial<FirstRunDeps> = {}): FirstRunDeps {
  return {
    fetchTrainingGoal: vi.fn(async () => null),
    fetchActiveUserPlan: vi.fn(async () => null),
    saveTrainingGoal: vi.fn(async (input) => input),
    loadExercises: vi.fn(async () => []),
    buildMyPlan: vi.fn(async () => ({ templateId: 'tpl-3d-full-body-gym', startDate: '2026-11-09', block, source: 'rules' as const, cappedForBeginner: false })),
    publishUserPlan: vi.fn(async () => undefined),
    cacheActiveUserPlan: vi.fn(),
    ...overrides,
  }
}

describe('first run answers', () => {
  it('Q7: needs all six answers and never fills one in', () => {
    expect(unansweredCount({})).toBe(6)
    const { activityLevel: _skip, notes: _notes, ...five } = goal
    expect(unansweredCount(five)).toBe(1)
    expect(completeAnswers(five)).toBeNull()
    const { notes: _n, ...six } = goal
    expect(completeAnswers(six)).toEqual(goal)
  })
})

describe('first run plan', () => {
  it('saves the answers and publishes the rule plan as the active plan', async () => {
    const d = deps()
    const saved = await saveFirstRunGoal(goal, d)
    expect(d.saveTrainingGoal).toHaveBeenCalledWith(goal)
    expect(saved).toEqual(goal)
    const plan = await publishFirstRunPlan(goal, d, 'es')
    expect(d.buildMyPlan).toHaveBeenCalledWith(goal, [], 'es')
    const published = { templateId: 'tpl-3d-full-body-gym', startDate: '2026-11-09', block, source: 'rules' }
    expect(d.publishUserPlan).toHaveBeenCalledWith(published)
    expect(d.cacheActiveUserPlan).toHaveBeenCalledWith(published)
    expect(plan.block.name).toBe('Full Body · 3 days')
  })

  it('keeps an existing account goal or plan instead of overwriting it', async () => {
    const withGoal = deps({ fetchTrainingGoal: vi.fn(async () => ({ ...goal, goal: 'strength' as const })) })
    expect(await saveFirstRunGoal(goal, withGoal)).toBe('kept')
    expect(withGoal.saveTrainingGoal).not.toHaveBeenCalled()
    const withPlan = deps({ fetchActiveUserPlan: vi.fn(async () => ({ templateId: 't', startDate: '2026-11-02', block, source: 'rules' as const })) })
    expect(await saveFirstRunGoal(goal, withPlan)).toBe('kept')
    expect(withPlan.saveTrainingGoal).not.toHaveBeenCalled()
  })

  it('does not cache a plan that failed to publish', async () => {
    const d = deps({ publishUserPlan: vi.fn(async () => { throw new Error('offline') }) })
    await expect(publishFirstRunPlan(goal, d, 'en')).rejects.toThrow('offline')
    expect(d.cacheActiveUserPlan).not.toHaveBeenCalled()
  })
})

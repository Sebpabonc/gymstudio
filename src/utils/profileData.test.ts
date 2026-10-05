import { describe, expect, it } from 'vitest'
import { buildBodyMetricPayload, buildTrainingGoalPayload, trainingGoalOptions } from './profileData'

describe('buildBodyMetricPayload', () => {
  it('normalizes optional measurements and accepts a partial entry', () => {
    expect(buildBodyMetricPayload('2026-10-05', { weightKg: '72.4', steps: '', calories: null })).toEqual({
      date: '2026-10-05',
      weight_kg: 72.4,
      steps: null,
      calories: null,
    })
  })

  it('rejects empty entries, invalid dates, and values outside the database constraints', () => {
    expect(() => buildBodyMetricPayload('2026-10-05', { weightKg: '', steps: '', calories: '' })).toThrow('empty-metric')
    expect(() => buildBodyMetricPayload('2026-02-30', { weightKg: 72, steps: '', calories: '' })).toThrow('invalid-date')
    expect(() => buildBodyMetricPayload('2026-10-05', { weightKg: 72.25, steps: '', calories: '' })).toThrow('invalid-weight')
    expect(() => buildBodyMetricPayload('2026-10-05', { weightKg: '', steps: 100_001, calories: '' })).toThrow('invalid-steps')
    expect(() => buildBodyMetricPayload('2026-10-05', { weightKg: '', steps: '', calories: 10_001 })).toThrow('invalid-calories')
  })
})

describe('buildTrainingGoalPayload', () => {
  const goal = {
    goal: trainingGoalOptions.goal[0],
    daysPerWeek: trainingGoalOptions.daysPerWeek[3],
    experience: trainingGoalOptions.experience[1],
    activityLevel: trainingGoalOptions.activityLevel[1],
    sessionMinutes: trainingGoalOptions.sessionMinutes[1],
    equipment: trainingGoalOptions.equipment[0],
    notes: '  Build consistency  ',
  }

  it('maps valid selections to the database column names and trims notes', () => {
    expect(buildTrainingGoalPayload(goal)).toEqual({
      goal: 'muscle',
      days_per_week: 6,
      experience: 'intermediate',
      activity_level: 'moderate',
      session_minutes: 60,
      equipment: 'full_gym',
      notes: 'Build consistency',
    })
  })

  it('normalizes blank notes and rejects unsupported values or oversized notes', () => {
    expect(buildTrainingGoalPayload({ ...goal, notes: '  ' }).notes).toBeNull()
    expect(() => buildTrainingGoalPayload({ ...goal, goal: 'other' as never })).toThrow('invalid-goal')
    expect(() => buildTrainingGoalPayload({ ...goal, notes: 'x'.repeat(501) })).toThrow('notes-too-long')
  })
})

import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BuiltPlan } from '../plans/buildMyPlan'
import type { TrainingBlock } from '../types'
import type { SavedUserPlan, TrainingGoal } from '../utils/profileData'
import MyPlanSection from './MyPlanSection'

const goal: TrainingGoal = {
  goal: 'muscle',
  daysPerWeek: 3,
  experience: 'beginner',
  activityLevel: 'moderate',
  sessionMinutes: 45,
  equipment: 'full_gym',
  notes: '',
}

const block: TrainingBlock = {
  id: 'my-plan',
  number: 1,
  name: 'My six-week plan',
  method: 'straight sets',
  startDate: '2026-10-12',
  weeks: 6,
  origin: 'pt',
  summary: 'Build strength steadily.',
  insights: [{ title: 'Progress', body: 'Add weight gradually.' }],
  days: [{
    key: 'day-a',
    position: 1,
    name: 'Day A',
    exercises: [{
      code: 'A1',
      position: 1,
      exerciseId: 'barbell-bench-press',
      sets: 3,
      reps: ['8', '10'],
      restSeconds: 90,
      technique: 'straight',
    }],
  }],
}

const preview: BuiltPlan = {
  templateId: 'template',
  startDate: '2026-10-12',
  block,
  source: 'ai',
  cappedForBeginner: true,
}

const props = {
  goal,
  activePlan: null,
  preview: null,
  exercises: [{ id: 'barbell-bench-press', name: 'Barbell Bench Press', primaryMuscle: 'Chest' }],
  loading: false,
  building: false,
  publishing: false,
  confirmingRegeneration: false,
  onGenerate: () => undefined,
  onPublish: () => undefined,
  onRegenerate: () => undefined,
  onConfirmRegeneration: () => undefined,
  onCancelRegeneration: () => undefined,
}

describe('MyPlanSection', () => {
  it('asks the user to complete goals before generating a plan', () => {
    const html = renderToString(<MyPlanSection {...props} goal={null} />)
    expect(html).toContain('Complete your training goals questionnaire first')
    expect(html).not.toContain('Generate my plan')
  })

  it('shows a plan preview with schedule, exercises, AI summary, and beginner note', () => {
    const html = renderToString(<MyPlanSection {...props} preview={preview} />)
    expect(html).toContain('My six-week plan')
    expect(html).toContain('Personalised by AI')
    expect(html).toContain('Barbell Bench Press')
    expect(html).toContain('<strong>3')
    expect(html).toContain('8 / 10')
    expect(html).toContain('Build strength steadily.')
    expect(html).toContain('Add weight gradually.')
    expect(html).toContain('We set 4 days for now')
    expect(html).toContain('Publish plan')
  })

  it('shows the start date and regeneration option for an active plan', () => {
    const activePlan: SavedUserPlan = { templateId: 'template', startDate: '2026-10-12', block, source: 'rules' }
    const html = renderToString(<MyPlanSection {...props} activePlan={activePlan} />)
    expect(html).toContain('Active plan')
    expect(html).toContain('Starts')
    expect(html).toContain('Regenerate')
  })
})

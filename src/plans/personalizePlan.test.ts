import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { applyAiAdjustments, nextMonday, personalizeTemplate, selectTemplate } from './personalizePlan'
import { templateToBlock, type TemplateJson } from './templates'
import type { TrainingGoal } from '../utils/profileData'

const dir = 'docs/fitness/approved/catalogue-v2'
const catalogue = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as Array<{ id: string; primary_muscles: string[] }>)
  .map((exercise) => ({ id: exercise.id, primaryMuscle: exercise.primary_muscles[0] }))
const template = (id: string) =>
  templateToBlock(JSON.parse(readFileSync(`docs/fitness/approved/templates/${id}.json`, 'utf8')) as TemplateJson, '2026-10-12')

const base: TrainingGoal = {
  goal: 'muscle', daysPerWeek: 4, experience: 'intermediate', activityLevel: 'moderate',
  sessionMinutes: 60, equipment: 'full_gym', notes: '',
}
const allExercises = (block: ReturnType<typeof template>) => block.days.flatMap((day) => day.exercises)

describe('selectTemplate', () => {
  it('caps beginners at 4 days', () => {
    expect(selectTemplate({ ...base, experience: 'beginner', daysPerWeek: 6 })).toEqual({
      templateId: 'tpl-4d-upper-lower-gym', days: 4, cappedForBeginner: true,
    })
  })
  it('uses dumbbell templates (with the conditioning day) for home 6 days', () => {
    expect(selectTemplate({ ...base, equipment: 'home', daysPerWeek: 6 }).templateId).toBe('tpl-6d-ab-split-db')
    expect(selectTemplate({ ...base, equipment: 'basic_gym', daysPerWeek: 5 }).templateId).toBe('tpl-5d-upper-lower-ppl-db')
  })
})

describe('nextMonday', () => {
  it('returns the coming Monday, or today on a Monday', () => {
    expect(nextMonday(new Date(2026, 9, 7))).toBe('2026-10-12')
    expect(nextMonday(new Date(2026, 9, 12))).toBe('2026-10-12')
  })
})

describe('personalizeTemplate', () => {
  it('keeps the base template for the default profile', () => {
    const block = template('tpl-4d-upper-lower-gym')
    expect(personalizeTemplate(block, base, catalogue)).toEqual(block)
  })

  it('every combination stays within PT limits and uses catalogue exercises', () => {
    const ids = new Set(catalogue.map((exercise) => exercise.id))
    for (const goal of ['muscle', 'fat_loss', 'strength', 'general'] as const)
      for (const experience of ['beginner', 'intermediate', 'advanced'] as const)
        for (const equipment of ['full_gym', 'basic_gym', 'home'] as const)
          for (const sessionMinutes of [45, 60, 75, 90] as const)
            for (const daysPerWeek of [3, 4, 5, 6] as const) {
              const profile = { ...base, goal, experience, equipment, sessionMinutes, daysPerWeek, activityLevel: 'high' as const }
              const choice = selectTemplate(profile)
              const plan = personalizeTemplate(template(choice.templateId), profile, catalogue)
              expect(plan.days).toHaveLength(choice.days)
              for (const exercise of allExercises(plan)) {
                expect(ids.has(exercise.exerciseId)).toBe(true)
                expect(exercise.sets).toBeGreaterThanOrEqual(2)
                expect(exercise.sets).toBeLessThanOrEqual(4)
                expect(exercise.reps).toHaveLength(exercise.sets)
              }
            }
  })

  it('beginners get simpler lifts and at most 3 sets', () => {
    const plan = personalizeTemplate(template('tpl-4d-upper-lower-gym'), { ...base, experience: 'beginner' }, catalogue)
    const ids = allExercises(plan).map((exercise) => exercise.exerciseId)
    expect(ids).not.toContain('back-squat')
    expect(ids).not.toContain('barbell-bench-press')
    expect(Math.max(...allExercises(plan).map((exercise) => exercise.sets))).toBeLessThanOrEqual(3)
  })

  it('nordic curl is only kept for advanced home users', () => {
    const has = (profile: TrainingGoal) =>
      allExercises(personalizeTemplate(template('tpl-4d-upper-lower-db'), profile, catalogue)).some(
        (exercise) => exercise.exerciseId === 'nordic-hamstring-curl'
      )
    const original = allExercises(template('tpl-4d-upper-lower-db')).some((exercise) => exercise.exerciseId === 'nordic-hamstring-curl')
    expect(has({ ...base, equipment: 'home', experience: 'intermediate' })).toBe(false)
    expect(has({ ...base, equipment: 'home', experience: 'advanced' })).toBe(original)
  })

  it('45 minutes drops one exercise on long days', () => {
    const block = template('tpl-4d-upper-lower-gym')
    const plan = personalizeTemplate(block, { ...base, sessionMinutes: 45 }, catalogue)
    expect(allExercises(plan).length).toBeLessThan(allExercises(block).length)
  })
})

describe('applyAiAdjustments', () => {
  const plan = template('tpl-4d-upper-lower-gym')
  const day = plan.days[0]
  const target = day.exercises[day.exercises.length - 1]
  const sameMuscle = catalogue.find(
    (exercise) =>
      exercise.primaryMuscle === catalogue.find((item) => item.id === target.exerciseId)?.primaryMuscle &&
      !day.exercises.some((item) => item.exerciseId === exercise.id)
  )
  const otherMuscle = catalogue.find((exercise) => exercise.primaryMuscle !== catalogue.find((item) => item.id === target.exerciseId)?.primaryMuscle)!

  it('accepts swaps for the same muscle, ±1 set, notes and a new summary', () => {
    const result = applyAiAdjustments(plan, {
      summary: 'Built for you.',
      exercises: [{ dayKey: day.key, code: target.code, exerciseId: sameMuscle?.id, sets: target.sets + 1, note: 'Slow lowering.' }],
    }, catalogue)
    const changed = result.days[0].exercises[result.days[0].exercises.length - 1]
    if (sameMuscle) expect(changed.exerciseId).toBe(sameMuscle.id)
    expect(changed.sets).toBe(Math.min(4, target.sets + 1))
    expect(changed.reps).toHaveLength(changed.sets)
    expect(changed.notes).toBe('Slow lowering.')
    expect(result.summary).toBe('Built for you.')
  })

  it('ignores changes outside PT rules', () => {
    const result = applyAiAdjustments(plan, {
      summary: 'x'.repeat(500),
      insights: [{ title: 'Only one', body: 'Too few' }],
      exercises: [{ dayKey: day.key, code: target.code, exerciseId: otherMuscle.id, sets: 9, restSeconds: 5, note: 'y'.repeat(81) }],
    }, catalogue)
    expect(result).toEqual(plan)
    expect(applyAiAdjustments(plan, null, catalogue)).toBe(plan)
  })
})

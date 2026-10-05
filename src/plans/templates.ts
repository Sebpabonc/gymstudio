import type { TrainingBlock, TrainingTechnique } from '../types'

// PT-approved base templates (docs/fitness/approved/templates). Loaded lazily, only when a user builds a plan.
const files = import.meta.glob('../../docs/fitness/approved/templates/tpl-*.json')

export type TemplateJson = {
  id: string
  name: string
  method: string
  weeks: number
  summary: string
  insights: { title: string; body: string }[]
  days: Array<{
    key: string
    name: string
    focus?: string
    exercises: Array<{
      code: string
      exercise_id: string
      sets: number
      reps: string[]
      rest_seconds: number
      technique: TrainingTechnique
      angle_degrees?: number | null
      notes?: string
    }>
  }>
}

export function templateToBlock(template: TemplateJson, startDate: string): TrainingBlock {
  return {
    id: `user-${template.id}`,
    number: 0,
    name: template.name,
    method: template.method,
    startDate,
    weeks: template.weeks,
    origin: 'pt',
    summary: template.summary,
    insights: template.insights.map((insight) => ({ ...insight })),
    days: template.days.map((day, dayIndex) => ({
      key: day.key,
      position: dayIndex + 1,
      name: day.name,
      focus: day.focus,
      exercises: day.exercises.map((exercise, index) => ({
        code: exercise.code,
        position: index + 1,
        exerciseId: exercise.exercise_id,
        sets: exercise.sets,
        reps: [...exercise.reps],
        restSeconds: exercise.rest_seconds,
        technique: exercise.technique,
        ...(exercise.angle_degrees != null ? { angleDegrees: exercise.angle_degrees } : {}),
        ...(exercise.notes ? { notes: exercise.notes } : {}),
      })),
    })),
  }
}

export async function loadTemplate(templateId: string): Promise<TemplateJson> {
  const loader = files[`../../docs/fitness/approved/templates/${templateId}.json`]
  if (!loader) throw new Error(`unknown-template:${templateId}`)
  const module = (await loader()) as { default: TemplateJson }
  return module.default
}

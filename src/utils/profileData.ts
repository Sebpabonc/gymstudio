import { getSupabaseClient } from '../lib/supabaseClient'

export type BodyMetric = {
  date: string
  weight_kg: number | null
  steps: number | null
  calories: number | null
}

export type BodyMetricInput = {
  weightKg: string | number | null
  steps: string | number | null
  calories: string | number | null
}

export const trainingGoalOptions = {
  goal: ['muscle', 'fat_loss', 'strength', 'general'],
  daysPerWeek: [3, 4, 5, 6],
  experience: ['beginner', 'intermediate', 'advanced'],
  activityLevel: ['low', 'moderate', 'high'],
  sessionMinutes: [45, 60, 75, 90],
  equipment: ['full_gym', 'basic_gym', 'home'],
} as const

export type TrainingGoalInput = {
  goal: (typeof trainingGoalOptions.goal)[number]
  daysPerWeek: (typeof trainingGoalOptions.daysPerWeek)[number]
  experience: (typeof trainingGoalOptions.experience)[number]
  activityLevel: (typeof trainingGoalOptions.activityLevel)[number]
  sessionMinutes: (typeof trainingGoalOptions.sessionMinutes)[number]
  equipment: (typeof trainingGoalOptions.equipment)[number]
  notes: string
}

export type TrainingGoal = TrainingGoalInput
export type TrainingGoalPayload = {
  goal: TrainingGoalInput['goal']
  days_per_week: TrainingGoalInput['daysPerWeek']
  experience: TrainingGoalInput['experience']
  activity_level: TrainingGoalInput['activityLevel']
  session_minutes: TrainingGoalInput['sessionMinutes']
  equipment: TrainingGoalInput['equipment']
  notes: string | null
}

export function buildBodyMetricPayload(date: string, input: BodyMetricInput): BodyMetric {
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error('invalid-date')
  }

  const weight = parseOptionalNumber(input.weightKg)
  const steps = parseOptionalNumber(input.steps)
  const calories = parseOptionalNumber(input.calories)
  if (weight === null && steps === null && calories === null) throw new Error('empty-metric')
  if (weight !== null && (weight < 25 || weight > 350 || Math.abs(weight * 10 - Math.round(weight * 10)) > 1e-8)) {
    throw new Error('invalid-weight')
  }
  if (steps !== null && (!Number.isInteger(steps) || steps < 0 || steps > 100_000)) {
    throw new Error('invalid-steps')
  }
  if (calories !== null && (!Number.isInteger(calories) || calories < 0 || calories > 10_000)) {
    throw new Error('invalid-calories')
  }

  return { date, weight_kg: weight, steps, calories }
}

function parseOptionalNumber(value: string | number | null): number | null {
  if (value === null || (typeof value === 'string' && value.trim() === '')) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) throw new Error('invalid-number')
  return parsed
}

export function buildTrainingGoalPayload(input: TrainingGoalInput): TrainingGoalPayload {
  const valid = (key: keyof typeof trainingGoalOptions, value: unknown) =>
    (trainingGoalOptions[key] as readonly unknown[]).includes(value)
  if (
    !valid('goal', input.goal)
    || !valid('daysPerWeek', input.daysPerWeek)
    || !valid('experience', input.experience)
    || !valid('activityLevel', input.activityLevel)
    || !valid('sessionMinutes', input.sessionMinutes)
    || !valid('equipment', input.equipment)
  ) {
    throw new Error('invalid-goal')
  }

  const notes = input.notes.trim()
  if (notes.length > 500) throw new Error('notes-too-long')
  return {
    goal: input.goal,
    days_per_week: input.daysPerWeek,
    experience: input.experience,
    activity_level: input.activityLevel,
    session_minutes: input.sessionMinutes,
    equipment: input.equipment,
    notes: notes || null,
  }
}

function throwIfUnavailable() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('offline')
}

async function getClient() {
  throwIfUnavailable()
  const client = await getSupabaseClient()
  if (!client) throw new Error('offline')
  return client
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchBodyMetrics(since: string, through: string): Promise<BodyMetric[]> {
  const client = await getClient()
  const { data, error } = await client
    .from('body_metrics')
    .select('date, weight_kg, steps, calories')
    .gte('date', since)
    .lte('date', through)
    .order('date', { ascending: false })
  throwIfError(error)
  return (data ?? []) as BodyMetric[]
}

export async function fetchBodyMetric(date: string): Promise<BodyMetric | null> {
  const client = await getClient()
  const { data, error } = await client
    .from('body_metrics')
    .select('date, weight_kg, steps, calories')
    .eq('date', date)
    .maybeSingle()
  throwIfError(error)
  return data as BodyMetric | null
}

export async function saveBodyMetric(date: string, input: BodyMetricInput): Promise<BodyMetric> {
  const payload = buildBodyMetricPayload(date, input)
  const client = await getClient()
  const { data, error } = await client
    .from('body_metrics')
    .upsert(payload, { onConflict: 'user_id,date', defaultToNull: false })
    .select('date, weight_kg, steps, calories')
    .single()
  throwIfError(error)
  return data as BodyMetric
}

export async function fetchTrainingGoal(): Promise<TrainingGoal | null> {
  const client = await getClient()
  const { data, error } = await client
    .from('training_goals')
    .select('goal, days_per_week, experience, activity_level, session_minutes, equipment, notes')
    .maybeSingle()
  throwIfError(error)
  if (!data) return null
  return {
    goal: data.goal,
    daysPerWeek: data.days_per_week,
    experience: data.experience,
    activityLevel: data.activity_level,
    sessionMinutes: data.session_minutes,
    equipment: data.equipment,
    notes: data.notes ?? '',
  } as TrainingGoal
}

export async function saveTrainingGoal(input: TrainingGoalInput): Promise<TrainingGoal> {
  const payload = buildTrainingGoalPayload(input)
  const client = await getClient()
  const { data, error } = await client
    .from('training_goals')
    .upsert(payload, { onConflict: 'user_id', defaultToNull: false })
    .select('goal, days_per_week, experience, activity_level, session_minutes, equipment, notes')
    .single()
  throwIfError(error)
  if (!data) throw new Error('profile-goal-missing')
  return {
    goal: data.goal,
    daysPerWeek: data.days_per_week,
    experience: data.experience,
    activityLevel: data.activity_level,
    sessionMinutes: data.session_minutes,
    equipment: data.equipment,
    notes: data.notes ?? '',
  } as TrainingGoal
}

export type SavedUserPlan = {
  templateId: string
  startDate: string
  block: import('../types').TrainingBlock
  source: 'ai' | 'rules'
}

/** The signed-in user's active personal plan, or null (then the app keeps the global blocks). */
export async function fetchActiveUserPlan(): Promise<SavedUserPlan | null> {
  const client = await getClient()
  const { data, error } = await client
    .from('user_plans')
    .select('template_id, start_date, block, source')
    .eq('active', true)
    .maybeSingle()
  throwIfError(error)
  return data
    ? { templateId: data.template_id, startDate: data.start_date, block: data.block, source: data.source }
    : null
}

/** Publishes a new personal plan: the previous active plan is kept as history (active = false). */
export async function publishUserPlan(plan: SavedUserPlan): Promise<void> {
  const client = await getClient()
  const { error: archiveError } = await client.from('user_plans').update({ active: false }).eq('active', true)
  throwIfError(archiveError)
  const { error } = await client.from('user_plans').insert({
    template_id: plan.templateId,
    start_date: plan.startDate,
    block: plan.block,
    source: plan.source,
  })
  throwIfError(error)
}

/** Permanent swaps ("always use X instead of Y") of the signed-in user. */
export async function fetchExerciseSwaps(): Promise<Array<{ fromExerciseId: string; toExerciseId: string }>> {
  const client = await getClient()
  const { data, error } = await client.from('exercise_swaps').select('from_exercise_id, to_exercise_id')
  throwIfError(error)
  return (data ?? []).map((row) => ({ fromExerciseId: row.from_exercise_id, toExerciseId: row.to_exercise_id }))
}

export async function saveExerciseSwap(fromExerciseId: string, toExerciseId: string): Promise<void> {
  const client = await getClient()
  const { error } = await client
    .from('exercise_swaps')
    .upsert({ from_exercise_id: fromExerciseId, to_exercise_id: toExerciseId }, { onConflict: 'user_id,from_exercise_id' })
  throwIfError(error)
}

export async function removeExerciseSwap(fromExerciseId: string): Promise<void> {
  const client = await getClient()
  const { error } = await client.from('exercise_swaps').delete().eq('from_exercise_id', fromExerciseId)
  throwIfError(error)
}

export type TrainerRecommendationRow = {
  id: string
  exerciseId: string
  date: string
  blockId?: string
  dayKey?: string
  original: { weight?: number | null; reps: { min: number; max: number }; sets: number }
  recommended: { weight?: number | null; reps: { min: number; max: number }; sets: number }
  action: string
  reason: string
  confidence: 'low' | 'medium' | 'high'
  evidence: Record<string, unknown>
  status: 'shown' | 'accepted' | 'kept_original' | 'ignored'
  resultEntryId?: string
}

/** Stores (or updates) a recommendation the AI Trainer showed and what the user did with it. */
export async function saveTrainerRecommendation(row: TrainerRecommendationRow): Promise<void> {
  const client = await getClient()
  const { error } = await client.from('trainer_recommendations').upsert({
    id: row.id,
    exercise_id: row.exerciseId,
    date: row.date,
    block_id: row.blockId ?? null,
    day_key: row.dayKey ?? null,
    original: row.original,
    recommended: row.recommended,
    action: row.action,
    reason: row.reason,
    confidence: row.confidence,
    evidence: row.evidence,
    status: row.status,
    result_entry_id: row.resultEntryId ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  throwIfError(error)
}

/** Recommendations with a logged result, for per-user calibration (continuous-learning spec 1). */
export async function fetchCalibrationRecommendations(): Promise<TrainerRecommendationRow[]> {
  const client = await getClient()
  const since = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await client
    .from('trainer_recommendations')
    .select('id, exercise_id, date, block_id, day_key, original, recommended, action, reason, confidence, evidence, status, result_entry_id')
    .in('status', ['accepted', 'kept_original'])
    .not('result_entry_id', 'is', null)
    .gte('date', since)
    .order('date', { ascending: false })
    .limit(1000)
  throwIfError(error)
  return (data ?? []).map((row) => ({
    id: row.id,
    exerciseId: row.exercise_id,
    date: row.date,
    blockId: row.block_id ?? undefined,
    dayKey: row.day_key ?? undefined,
    original: row.original,
    recommended: row.recommended,
    action: row.action,
    reason: row.reason,
    confidence: row.confidence,
    evidence: row.evidence ?? {},
    status: row.status,
    resultEntryId: row.result_entry_id ?? undefined,
  }))
}

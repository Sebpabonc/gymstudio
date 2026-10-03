import { Exercise, PlannedExercise, TrainingBlock, TrainingDay, WorkoutEntry } from '../types'
import { loadExerciseLibrary } from '../data/exerciseLibrary'
import { getSupabaseClient } from '../lib/supabaseClient'
import { isDemoMode } from './demoMode'

const EXERCISES_KEY = 'gym-studio.exercises'
const HISTORY_KEY = 'gym-studio.history'
const CATALOGUE_KEY = 'gym-studio.catalogue'
const TRAINING_BLOCKS_KEY = 'gym-studio.training-blocks'
const ACTIVE_BLOCK_KEY = 'gym-studio.active-block-id'

export function storageKey(key: string) {
  return isDemoMode() ? key.replace(/^gym-studio\./, 'gym-studio.demo.') : key
}

export function getSessionStorageValue(key: string) {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(storageKey(key))
  } catch {
    return null
  }
}

export function setSessionStorageValue(key: string, value: string) {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey(key), value)
  } catch {
    // Session storage is optional when browser storage is unavailable.
  }
}

type TrainingExerciseRow = {
  code: string
  position?: number
  exercise_id?: string
  exerciseId?: string
  sets: number
  reps: string[]
  rest_seconds?: number
  restSeconds?: number
  technique: PlannedExercise['technique']
  angle_degrees?: number | null
  angleDegrees?: number
  notes?: string | null
}

type TrainingDayRow = {
  key: string
  position?: number
  name: string
  focus?: string | null
  exercises?: TrainingExerciseRow[]
  training_block_exercises?: TrainingExerciseRow[]
}

type TrainingBlockRow = {
  id: string
  number: number
  name: string
  method: string
  start_date?: string
  startDate?: string
  weeks: number
  origin: TrainingBlock['origin']
  summary: string
  insights?: TrainingBlock['insights'] | null
  days?: TrainingDayRow[]
  training_block_days?: TrainingDayRow[]
}

type CatalogueRow = {
  id: string
  name_en: string
  primary_muscle: string
  body_region: string | null
  primary_muscles: string[] | null
  secondary_muscles: string[]
  equipment: string | null
  posture_tips: string[] | null
  aliases: string[]
}

type CatalogueExercise = Pick<
  Exercise,
  | 'id'
  | 'name'
  | 'primaryMuscle'
  | 'secondaryMuscle'
  | 'bodyRegion'
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'equipment'
  | 'postureTips'
>

type CatalogueCache = {
  fetchedAt: string
  exercises: CatalogueExercise[]
  aliases: Record<string, string>
}

type BundledCatalogue = Awaited<ReturnType<typeof loadExerciseLibrary>>

// Keep legacy exercise IDs mapped to their canonical library IDs.
const legacyExerciseIdAliases: Record<string, string> = {
  'bb-bench-press': 'barbell-bench-press',
}

let bundledCataloguePromise: Promise<BundledCatalogue> | undefined

function getBundledCatalogue() {
  bundledCataloguePromise ??= loadExerciseLibrary()
  return bundledCataloguePromise
}

export function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getExerciseDisplayName(value: string | Exercise) {
  return typeof value === 'string' ? value : value.name
}

export function mapTrainingBlockRows(rows: unknown[]): TrainingBlock[] {
  return (rows as TrainingBlockRow[])
    .map((row) => {
      const days = (row.days ?? row.training_block_days ?? []).map((day, dayIndex): TrainingDay => ({
        key: day.key,
        position: day.position ?? dayIndex + 1,
        name: day.name,
        focus: day.focus ?? undefined,
        exercises: (day.exercises ?? day.training_block_exercises ?? [])
          .map((exercise, exerciseIndex): PlannedExercise => ({
            code: exercise.code,
            position: exercise.position ?? exerciseIndex + 1,
            exerciseId: exercise.exercise_id ?? exercise.exerciseId ?? '',
            sets: exercise.sets,
            reps: exercise.reps,
            restSeconds: exercise.rest_seconds ?? exercise.restSeconds ?? 0,
            technique: exercise.technique,
            angleDegrees: exercise.angle_degrees ?? exercise.angleDegrees ?? undefined,
            notes: exercise.notes ?? undefined,
          }))
          .sort((a, b) => a.position - b.position),
      })).sort((a, b) => a.position - b.position)

      return {
        id: row.id,
        number: row.number,
        name: row.name,
        method: row.method,
        startDate: row.start_date ?? row.startDate ?? '',
        weeks: row.weeks,
        origin: row.origin,
        summary: row.summary,
        insights: row.insights ?? [],
        days,
      }
    })
    .sort((a, b) => a.number - b.number)
}

function loadTrainingBlockCache(): TrainingBlock[] | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(TRAINING_BLOCKS_KEY)) ?? 'null')
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (parsed.some((block) => typeof block?.id !== 'string' || !Array.isArray(block?.days))) return null
    return parsed.map((block) => ({
      ...block,
      insights: Array.isArray(block.insights) ? block.insights : [],
    })) as TrainingBlock[]
  } catch {
    return null
  }
}

function saveTrainingBlockCache(blocks: TrainingBlock[]) {
  try {
    localStorage.setItem(storageKey(TRAINING_BLOCKS_KEY), JSON.stringify(blocks))
  } catch {
    return
  }
}

export async function fetchTrainingBlocks(): Promise<TrainingBlock[]> {
  const cachedBlocks = loadTrainingBlockCache()

  try {
    const supabaseClient = await getSupabaseClient()
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('training_blocks')
        .select(
          'id, number, name, method, start_date, weeks, origin, summary, insights, days:training_block_days(key, position, name, focus, exercises:training_block_exercises(code, position, exercise_id, sets, reps, rest_seconds, technique, angle_degrees, notes))'
        )
        .eq('is_active', true)
        .order('number')

      if (!error && data) {
        const blocks = mapTrainingBlockRows(data)
        if (blocks.length > 0) {
          saveTrainingBlockCache(blocks)
          return blocks
        }
      }
    }
  } catch {
    // Use the most recent cached or bundled data when the remote catalogue is unavailable.
  }

  if (cachedBlocks) return cachedBlocks

  try {
    const { default: bundledRows } = await import('../../docs/fitness/approved/training-blocks/blocks.json')
    const blocks = mapTrainingBlockRows(bundledRows)
    saveTrainingBlockCache(blocks)
    return blocks
  } catch {
    return []
  }
}

export function getActiveBlockId() {
  return localStorage.getItem(storageKey(ACTIVE_BLOCK_KEY))
}

export function setActiveBlockId(blockId: string) {
  localStorage.setItem(storageKey(ACTIVE_BLOCK_KEY), blockId)
}

function mergeExercises(base: Exercise[], saved: Partial<Exercise>[]): Exercise[] {
  const normalized = new Map<string, Exercise>()

  for (const exercise of [...base, ...saved]) {
    if (!exercise || !exercise.name) continue

    const key = normalizeExerciseName(exercise.name)
    const current = normalized.get(key)

    normalized.set(key, {
      id: exercise.id || current?.id || key,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle || current?.primaryMuscle || 'Other',
      secondaryMuscle: exercise.secondaryMuscle ?? current?.secondaryMuscle,
      bodyRegion: exercise.bodyRegion ?? current?.bodyRegion,
      primaryMuscles: exercise.primaryMuscles ?? current?.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles ?? current?.secondaryMuscles,
      equipment: exercise.equipment ?? current?.equipment,
      postureTips: exercise.postureTips ?? current?.postureTips,
      notes: exercise.notes ?? current?.notes,
      tips: exercise.tips?.length ? exercise.tips : current?.tips ?? [],
    })
  }

  return Array.from(normalized.values())
}

function loadCatalogueCache(): CatalogueCache | null {
  const raw = localStorage.getItem(storageKey(CATALOGUE_KEY))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as CatalogueCache
    if (!Array.isArray(parsed.exercises) || parsed.exercises.length === 0) return null
    return {
      fetchedAt: parsed.fetchedAt,
      exercises: parsed.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscle: exercise.secondaryMuscle,
        bodyRegion: exercise.bodyRegion,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        postureTips: exercise.postureTips,
      })),
      aliases: parsed.aliases ?? {},
    }
  } catch {
    return null
  }
}

async function fetchCatalogueData(): Promise<{ exercises: Exercise[]; aliases: Record<string, string> } | null> {
  try {
    const supabaseClient = await getSupabaseClient()
    if (!supabaseClient) return null

    const { data, error } = await supabaseClient
      .from('exercises')
      .select(
        'id, name_en, body_region, primary_muscle, primary_muscles, secondary_muscles, equipment, posture_tips, aliases'
      )
      .eq('is_active', true)
      .order('name_en')

    if (error || !data) return null

    const rows = data as CatalogueRow[]
    const aliases: Record<string, string> = {}
    const exercises = rows.map((row) => {
      for (const alias of row.aliases ?? []) aliases[alias] = row.id
      return {
        id: row.id,
        name: row.name_en,
        primaryMuscle: row.primary_muscles?.[0] ?? row.primary_muscle,
        secondaryMuscle: row.secondary_muscles?.[0],
        bodyRegion: row.body_region ?? undefined,
        primaryMuscles: row.primary_muscles ?? undefined,
        secondaryMuscles: row.secondary_muscles ?? undefined,
        equipment: row.equipment ?? undefined,
        postureTips: row.posture_tips ?? undefined,
      }
    })

    return { exercises, aliases }
  } catch {
    return null
  }
}

export async function fetchRemoteCatalogue(): Promise<Exercise[] | null> {
  const catalogue = await fetchCatalogueData()
  return catalogue?.exercises ?? null
}

export async function refreshCatalogue(): Promise<Exercise[] | null> {
  const catalogue = await fetchCatalogueData()
  if (!catalogue) return null

  try {
    localStorage.setItem(
      storageKey(CATALOGUE_KEY),
      JSON.stringify({
        fetchedAt: new Date().toISOString(),
        exercises: catalogue.exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          secondaryMuscle: exercise.secondaryMuscle,
          bodyRegion: exercise.bodyRegion,
          primaryMuscles: exercise.primaryMuscles,
          secondaryMuscles: exercise.secondaryMuscles,
          equipment: exercise.equipment,
          postureTips: exercise.postureTips,
        })),
        aliases: catalogue.aliases,
      })
    )
  } catch {
    return catalogue.exercises
  }

  return catalogue.exercises
}

export async function loadExercises(useBundledFallback = true): Promise<Exercise[]> {
  const raw = localStorage.getItem(storageKey(EXERCISES_KEY))
  const catalogue = loadCatalogueCache()
  if (!catalogue && !useBundledFallback) return []

  const bundled = catalogue ? undefined : await getBundledCatalogue()
  const baseExercises = catalogue?.exercises ?? bundled?.exerciseLibrary ?? []
  let savedExercises: Partial<Exercise>[] = []
  try {
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Exercise>[]
      if (Array.isArray(parsed)) {
        const baseIds = new Set(baseExercises.map((exercise) => exercise.id))
        const baseNames = new Set(baseExercises.map((exercise) => normalizeExerciseName(exercise.name)))
        savedExercises = parsed.filter(
          (exercise) =>
            (!exercise?.id || !Object.prototype.hasOwnProperty.call(legacyExerciseIdAliases, exercise.id)) &&
            (!catalogue ||
              (!baseIds.has(exercise?.id ?? '') &&
                !baseNames.has(normalizeExerciseName(exercise?.name ?? ''))))
        )
      }
    }
  } catch {
    savedExercises = []
  }

  const merged = mergeExercises(baseExercises, savedExercises)
  saveExercises(merged, baseExercises)
  return merged
}

export function saveExercises(exercises: Exercise[], baseExercises: Exercise[] = []) {
  const catalogueExercises = loadCatalogueCache()?.exercises ?? []
  const catalogueIds = new Set([
    ...baseExercises.map((exercise) => exercise.id),
    ...catalogueExercises.map((exercise) => exercise.id),
  ])
  const catalogueNames = new Set([
    ...baseExercises.map((exercise) => normalizeExerciseName(exercise.name)),
    ...catalogueExercises.map((exercise) => normalizeExerciseName(exercise.name)),
  ])
  const customExercises = exercises.filter(
    (exercise) => !catalogueIds.has(exercise.id) && !catalogueNames.has(normalizeExerciseName(exercise.name))
  )
  localStorage.setItem(storageKey(EXERCISES_KEY), JSON.stringify(customExercises))
}

export async function upsertExerciseRecord(exercise: Partial<Exercise> & { name: string }): Promise<Exercise> {
  const library = await loadExercises()
  const key = normalizeExerciseName(exercise.name)
  const existing = library.find((item) => normalizeExerciseName(item.name) === key)
  const generatedId = library.some((item) => item.id === key) ? `${key}-custom` : key

  const nextExercise: Exercise = {
    id: existing?.id ?? exercise.id ?? generatedId,
    name: exercise.name.trim(),
    primaryMuscle: exercise.primaryMuscle || existing?.primaryMuscle || 'Other',
    secondaryMuscle: exercise.secondaryMuscle ?? existing?.secondaryMuscle,
    notes: exercise.notes ?? existing?.notes,
    tips: exercise.tips?.length ? exercise.tips : existing?.tips ?? [],
  }

  const merged = existing
    ? library.map((item) => (normalizeExerciseName(item.name) === key ? nextExercise : item))
    : [...library, nextExercise]

  const baseExercises = loadCatalogueCache()?.exercises ?? (await getBundledCatalogue()).exerciseLibrary
  saveExercises(merged, baseExercises)
  return nextExercise
}

export async function loadWorkoutHistory(): Promise<WorkoutEntry[]> {
  const raw = localStorage.getItem(storageKey(HISTORY_KEY))
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as WorkoutEntry[]
    if (!Array.isArray(parsed)) return []

    let changed = false
    const catalogue = loadCatalogueCache()
    const bundledAliases = catalogue ? {} : (await getBundledCatalogue()).aliases
    const aliasMap = {
      ...legacyExerciseIdAliases,
      ...bundledAliases,
      ...(catalogue?.aliases ?? {}),
    }
    const migrated = parsed.map((entry) => {
      const canonicalId = aliasMap[entry.exerciseId]
      if (!canonicalId || canonicalId === entry.exerciseId) return entry

      changed = true
      return { ...entry, exerciseId: canonicalId }
    })

    if (changed) saveWorkoutHistory(migrated)
    return migrated
  } catch {
    return []
  }
}

export function saveWorkoutHistory(history: WorkoutEntry[]) {
  localStorage.setItem(storageKey(HISTORY_KEY), JSON.stringify(history))
}

export async function addWorkoutEntry(entry: WorkoutEntry) {
  const nextHistory = [...(await loadWorkoutHistory()), entry].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  saveWorkoutHistory(nextHistory)
  return nextHistory
}

import { Exercise, WorkoutEntry } from '../types'
import { loadExerciseLibrary } from '../data/exerciseLibrary'
import { getSupabaseClient } from '../lib/supabaseClient'

const EXERCISES_KEY = 'gym-studio.exercises'
const HISTORY_KEY = 'gym-studio.history'
const CATALOGUE_KEY = 'gym-studio.catalogue'

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
  const raw = localStorage.getItem(CATALOGUE_KEY)
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
      CATALOGUE_KEY,
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
  const raw = localStorage.getItem(EXERCISES_KEY)
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
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(customExercises))
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
  const raw = localStorage.getItem(HISTORY_KEY)
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
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export async function addWorkoutEntry(entry: WorkoutEntry) {
  const nextHistory = [...(await loadWorkoutHistory()), entry].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  saveWorkoutHistory(nextHistory)
  return nextHistory
}

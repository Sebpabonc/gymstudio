import { Exercise, WorkoutEntry } from '../types'
import { exerciseLibrary } from '../data/exerciseLibrary'
import { getSupabaseClient } from '../lib/supabaseClient'

const EXERCISES_KEY = 'gym-studio.exercises'
const HISTORY_KEY = 'gym-studio.history'
const CATALOGUE_KEY = 'gym-studio.catalogue'

type CatalogueRow = {
  id: string
  name_en: string
  name_es: string | null
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
  | 'nameEs'
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

// Keep legacy exercise IDs mapped to their canonical library IDs.
const legacyExerciseIdAliases: Record<string, string> = {
  'bb-bench-press': 'barbell-bench-press',
}

export function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const exerciseDisplayTranslations: Record<string, { es: string; en: string }> = {
  'barbell-bench-press': { es: 'Prensa de banca con barra', en: 'Barbell Bench Press' },
  'incline-dumbbell-press': { es: 'Prensa inclinada con mancuernas', en: 'Incline Dumbbell Press' },
  'lat-pulldown': { es: 'Dominada al pecho', en: 'Lat Pulldown' },
  'seated-cable-row': { es: 'Remo sentado en polea', en: 'Seated Cable Row' },
  'back-squat': { es: 'Sentadilla trasera', en: 'Back Squat' },
  'romanian-deadlift': { es: 'Peso muerto rumano', en: 'Romanian Deadlift' },
  'dumbbell-shoulder-press': { es: 'Prensa de hombros con mancuernas', en: 'Dumbbell Shoulder Press' },
  'leg-curl': { es: 'Curl de piernas', en: 'Leg Curl' },
  'bb-bent-over-reverse-grip-rows': { es: 'Remo invertido inclinado con barra', en: 'BB Bent Over Reverse Grip Rows' },
  'bb-press': { es: 'Prensa con barra', en: 'BB Press' },
  'bb-rdl': { es: 'Peso muerto rumano con barra', en: 'BB RDL' },
  'dumbbell-press-neutral-grip-45': { es: 'Prensa con mancuernas (agarre neutro, 45°)', en: 'Dumbbell Press (Neutral Grip, 45°)' },
  'dumbbell-press-neutral-grip-30': { es: 'Prensa con mancuernas (agarre neutro, 30°)', en: 'Dumbbell Press (Neutral Grip, 30°)' },
  'cable-fly-high': { es: 'Apertura en polea alta', en: 'Cable Fly (High)' },
  'cable-row-wide-grip': { es: 'Remo en polea con agarre amplio', en: 'Cable Row (Wide Grip)' },
  'lat-pulldown-neutral-grip': { es: 'Dominada al pecho (agarre neutro)', en: 'Lat Pulldown (Neutral Grip)' },
  'shoulder-press-machine-wide-grip': { es: 'Prensa de hombros en máquina (agarre amplio)', en: 'Shoulder Press Machine (Wide Grip)' },
  'dumbbell-overhead-press-neutral-grip': { es: 'Prensa militar con mancuernas (agarre neutro)', en: 'Dumbbell Overhead Press (Neutral Grip)' },
  'lat-machine-reverse-grip': { es: 'Máquina de espalda (agarre inverso)', en: 'Lat Machine (Reverse Grip)' },
  'decline-press-close-grip': { es: 'Prensa declinada (agarre cerrado)', en: 'Decline Press (Close Grip)' },
  'leg-press-quad-dominant-45': { es: 'Prensa de piernas (cuádriceps, 45°)', en: 'Leg Press (Quad Dominant, 45°)' },
  'walking-lunge-dumbbell-long-step': { es: 'Zancada caminando con mancuernas', en: 'Walking Lunge (Dumbbell, Long Step)' },
  'romanian-deadlift-barbell': { es: 'Peso muerto rumano con barra', en: 'Romanian Deadlift (Barbell)' },
  'calf-raise-leg-press-neutral': { es: 'Elevación de pantorrillas en prensa', en: 'Calf Raise (Leg Press, Neutral)' },
  'dumbbell-pullover': { es: 'Dominada con mancuernas', en: 'Dumbbell Pullover' },
}

export function getExerciseDisplayName(value: string | Exercise, language: 'es' | 'en' = 'en') {
  if (typeof value !== 'string' && language === 'es' && value.nameEs) return value.nameEs

  const name = typeof value === 'string' ? value : value.name
  const key = normalizeExerciseName(name)
  const translated = exerciseDisplayTranslations[key]

  if (!translated) return name

  return language === 'es' ? translated.es : translated.en
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
      nameEs: exercise.nameEs ?? current?.nameEs,
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
    if (!Array.isArray(parsed.exercises)) return null
    return {
      fetchedAt: parsed.fetchedAt,
      exercises: parsed.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        nameEs: exercise.nameEs,
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
        'id, name_en, name_es, body_region, primary_muscle, primary_muscles, secondary_muscles, equipment, posture_tips, aliases'
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
        nameEs: row.name_es ?? undefined,
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
          nameEs: exercise.nameEs,
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

export function loadExercises(): Exercise[] {
  const raw = localStorage.getItem(EXERCISES_KEY)
  const catalogue = loadCatalogueCache()
  let savedExercises: Partial<Exercise>[] = []
  try {
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Exercise>[]
      if (Array.isArray(parsed)) {
        const bundledIds = new Set(exerciseLibrary.map((exercise) => exercise.id))
        const bundledNames = new Set(exerciseLibrary.map((exercise) => normalizeExerciseName(exercise.name)))
        savedExercises = parsed.filter(
          (exercise) =>
            (!exercise?.id || !Object.prototype.hasOwnProperty.call(legacyExerciseIdAliases, exercise.id)) &&
            (!catalogue ||
              (!bundledIds.has(exercise?.id ?? '') &&
                !bundledNames.has(normalizeExerciseName(exercise?.name ?? ''))))
        )
      }
    }
  } catch {
    savedExercises = []
  }

  const bundledExercisesById = new Map(exerciseLibrary.map((exercise) => [exercise.id, exercise]))
  const catalogueExercises = catalogue?.exercises.map((exercise) => {
    const bundled = bundledExercisesById.get(exercise.id)
    return { ...exercise, notes: bundled?.notes, tips: bundled?.tips }
  })
  const merged = mergeExercises(catalogueExercises ?? exerciseLibrary, savedExercises)
  saveExercises(merged)
  return merged
}

export function saveExercises(exercises: Exercise[]) {
  const catalogueExercises = loadCatalogueCache()?.exercises ?? []
  const catalogueIds = new Set([
    ...exerciseLibrary.map((exercise) => exercise.id),
    ...catalogueExercises.map((exercise) => exercise.id),
  ])
  const catalogueNames = new Set([
    ...exerciseLibrary.map((exercise) => normalizeExerciseName(exercise.name)),
    ...catalogueExercises.map((exercise) => normalizeExerciseName(exercise.name)),
  ])
  const customExercises = exercises.filter(
    (exercise) => !catalogueIds.has(exercise.id) && !catalogueNames.has(normalizeExerciseName(exercise.name))
  )
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(customExercises))
}

export function upsertExerciseRecord(exercise: Partial<Exercise> & { name: string }): Exercise {
  const library = loadExercises()
  const key = normalizeExerciseName(exercise.name)
  const existing = library.find((item) => normalizeExerciseName(item.name) === key)

  const nextExercise: Exercise = {
    id: existing?.id ?? exercise.id ?? key,
    name: exercise.name.trim(),
    primaryMuscle: exercise.primaryMuscle || existing?.primaryMuscle || 'Other',
    secondaryMuscle: exercise.secondaryMuscle ?? existing?.secondaryMuscle,
    notes: exercise.notes ?? existing?.notes,
    tips: exercise.tips?.length ? exercise.tips : existing?.tips ?? [],
  }

  const merged = existing
    ? library.map((item) => (normalizeExerciseName(item.name) === key ? nextExercise : item))
    : [...library, nextExercise]

  saveExercises(merged)
  return nextExercise
}

export function loadWorkoutHistory(): WorkoutEntry[] {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as WorkoutEntry[]
    if (!Array.isArray(parsed)) return []

    let changed = false
    const aliasMap = { ...legacyExerciseIdAliases, ...(loadCatalogueCache()?.aliases ?? {}) }
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

export function addWorkoutEntry(entry: WorkoutEntry) {
  const nextHistory = [...loadWorkoutHistory(), entry].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  saveWorkoutHistory(nextHistory)
  return nextHistory
}

import { Exercise, WorkoutEntry } from '../types'
import { exerciseLibrary } from '../data/exerciseLibrary'

const EXERCISES_KEY = 'gym-studio.exercises'
const HISTORY_KEY = 'gym-studio.history'

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
  const name = typeof value === 'string' ? value : value.name
  const key = normalizeExerciseName(name)
  const translated = exerciseDisplayTranslations[key]

  if (!translated) return name

  return language === 'es' ? translated.es : translated.en
}

function mergeExercises(saved: Partial<Exercise>[]): Exercise[] {
  const normalized = new Map<string, Exercise>()

  for (const exercise of [...exerciseLibrary, ...saved]) {
    if (!exercise || !exercise.name) continue

    const key = normalizeExerciseName(exercise.name)
    const current = normalized.get(key)

    normalized.set(key, {
      id: exercise.id || current?.id || key,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle || current?.primaryMuscle || 'Other',
      secondaryMuscle: exercise.secondaryMuscle ?? current?.secondaryMuscle,
      notes: exercise.notes ?? current?.notes,
      tips: exercise.tips?.length ? exercise.tips : current?.tips ?? [],
    })
  }

  return Array.from(normalized.values())
}

export function loadExercises(): Exercise[] {
  const raw = localStorage.getItem(EXERCISES_KEY)

  if (!raw) {
    saveExercises(exerciseLibrary)
    return [...exerciseLibrary]
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Exercise>[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveExercises(exerciseLibrary)
      return [...exerciseLibrary]
    }

    const savedExercises = parsed.filter(
      (exercise) =>
        !exercise?.id || !Object.prototype.hasOwnProperty.call(legacyExerciseIdAliases, exercise.id)
    )
    const merged = mergeExercises(savedExercises)
    saveExercises(merged)
    return merged
  } catch {
    saveExercises(exerciseLibrary)
    return [...exerciseLibrary]
  }
}

export function saveExercises(exercises: Exercise[]) {
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises))
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
    const migrated = parsed.map((entry) => {
      if (!Object.prototype.hasOwnProperty.call(legacyExerciseIdAliases, entry.exerciseId)) return entry

      changed = true
      return { ...entry, exerciseId: legacyExerciseIdAliases[entry.exerciseId] }
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

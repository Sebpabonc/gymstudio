import { Exercise, WorkoutEntry } from '../types'
import { exerciseLibrary } from '../data/exerciseLibrary'

const EXERCISES_KEY = 'gym-studio.exercises'
const HISTORY_KEY = 'gym-studio.history'

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

    const merged = mergeExercises(parsed)
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

export function loadWorkoutHistory(): WorkoutEntry[] {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as WorkoutEntry[]
    return Array.isArray(parsed) ? parsed : []
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

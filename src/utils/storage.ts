import { Exercise, Session } from '../types'
import { getMuscleGroupForExercise, workoutExerciseNames } from '../data/workoutPlan'

const EXERCISES_KEY = 'wt_exercises'
const SESSIONS_KEY = 'wt_sessions'

function buildDefaultExercises(): Exercise[] {
  return workoutExerciseNames.map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name,
    muscleGroup: getMuscleGroupForExercise(name),
  }))
}

export function loadExercises(): Exercise[] {
  const raw = localStorage.getItem(EXERCISES_KEY)
  if (!raw) {
    const defaults = buildDefaultExercises()
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaults))
    return defaults
  }

  try {
    const parsed = JSON.parse(raw) as Exercise[]
    const merged = [...buildDefaultExercises(), ...parsed].filter(
      (exercise, index, arr) =>
        arr.findIndex((item) => item.name.toLowerCase() === exercise.name.toLowerCase()) === index
    )

    localStorage.setItem(EXERCISES_KEY, JSON.stringify(merged))
    return merged
  } catch {
    const defaultExercises = buildDefaultExercises()
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises))
    return defaultExercises
  }
}

export function saveExercises(exs: Exercise[]) {
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exs))
}

export function loadSessions(): Session[] {
  const raw = localStorage.getItem(SESSIONS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exerciseLibrary } from '../data/exerciseLibrary'
import { WorkoutEntry } from '../types'
import {
  addWorkoutEntry,
  getExerciseDisplayName,
  loadExercises,
  loadWorkoutHistory,
  normalizeExerciseName,
  upsertExerciseRecord,
} from './storage'

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  }
}

const entry = (id: string, date: string): WorkoutEntry => ({
  id,
  exerciseId: 'bb-bench-press',
  date,
  sets: [{ id: `${id}-1`, reps: 8, weight: 60 }],
})

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
})

describe('normalizeExerciseName', () => {
  it('turns names into lowercase dash-separated keys', () => {
    expect(normalizeExerciseName('  Dumbbell Press (Neutral Grip, 45°) ')).toBe('dumbbell-press-neutral-grip-45')
  })
})

describe('getExerciseDisplayName', () => {
  it('returns the translated name for a known exercise', () => {
    expect(getExerciseDisplayName('Lat Pulldown', 'en')).toBe('Lat Pulldown')
    expect(getExerciseDisplayName('Romanian Deadlift', 'es')).toBe('Peso muerto rumano')
  })

  it('falls back to the original name when there is no translation', () => {
    expect(getExerciseDisplayName('Some New Exercise', 'es')).toBe('Some New Exercise')
  })
})

describe('loadExercises', () => {
  it('seeds the built-in library on first launch', () => {
    const exercises = loadExercises()
    expect(exercises).toHaveLength(exerciseLibrary.length)
    expect(localStorage.getItem('gym-studio.exercises')).not.toBeNull()
  })

  it('recovers from corrupted saved data', () => {
    localStorage.setItem('gym-studio.exercises', '{not json')
    expect(loadExercises()).toHaveLength(exerciseLibrary.length)
  })

  it('replaces saved legacy exercises with the canonical library entry', () => {
    localStorage.setItem(
      'gym-studio.exercises',
      JSON.stringify([{ id: 'bb-bench-press', name: 'BB Bench Press', primaryMuscle: 'Chest' }])
    )

    const exercises = loadExercises()
    const benchPresses = exercises.filter((exercise) => normalizeExerciseName(exercise.name) === 'barbell-bench-press')

    expect(benchPresses).toHaveLength(1)
    expect(benchPresses[0].id).toBe('barbell-bench-press')
    expect(JSON.parse(localStorage.getItem('gym-studio.exercises')!).some(
      (exercise: { id: string }) => exercise.id === 'bb-bench-press'
    )).toBe(false)
  })

  it('loads saved legacy exercises idempotently', () => {
    localStorage.setItem(
      'gym-studio.exercises',
      JSON.stringify([{ id: 'bb-bench-press', name: 'BB Bench Press', primaryMuscle: 'Chest' }])
    )

    const firstLoad = loadExercises()
    const firstStoredValue = localStorage.getItem('gym-studio.exercises')
    const secondLoad = loadExercises()

    expect(secondLoad).toEqual(firstLoad)
    expect(localStorage.getItem('gym-studio.exercises')).toBe(firstStoredValue)
  })

  it('keeps user-added exercises alongside the library', () => {
    localStorage.setItem('gym-studio.exercises', JSON.stringify([{ name: 'My Custom Move', primaryMuscle: 'Core' }]))
    const names = loadExercises().map((e) => e.name)
    expect(names).toContain('My Custom Move')
    const uniqueLibraryNames = new Set(exerciseLibrary.map((e) => normalizeExerciseName(e.name)))
    expect(names.length).toBe(uniqueLibraryNames.size + 1)
  })
})

describe('upsertExerciseRecord', () => {
  it('adds a new exercise with a stable id derived from its name', () => {
    const created = upsertExerciseRecord({ name: 'Cable Crunch', primaryMuscle: 'Core' })
    expect(created.id).toBe('cable-crunch')
    expect(loadExercises().some((e) => e.id === 'cable-crunch')).toBe(true)
  })

  it('updates an existing exercise matched by name instead of duplicating it', () => {
    upsertExerciseRecord({ name: 'Cable Crunch', primaryMuscle: 'Core' })
    upsertExerciseRecord({ name: 'cable crunch', primaryMuscle: 'Core', notes: 'Slow negative' })
    const matches = loadExercises().filter((e) => normalizeExerciseName(e.name) === 'cable-crunch')
    expect(matches).toHaveLength(1)
    expect(matches[0].notes).toBe('Slow negative')
  })
})

describe('workout history', () => {
  it('is empty when nothing has been saved', () => {
    expect(loadWorkoutHistory()).toEqual([])
  })

  it('ignores corrupted history instead of crashing', () => {
    localStorage.setItem('gym-studio.history', 'oops')
    expect(loadWorkoutHistory()).toEqual([])
  })

  it('migrates legacy exercise ids in saved history', () => {
    const legacyEntry = entry('legacy', '2026-09-01')
    localStorage.setItem('gym-studio.history', JSON.stringify([legacyEntry]))

    const migrated = loadWorkoutHistory()

    expect(migrated[0].exerciseId).toBe('barbell-bench-press')
    expect(JSON.parse(localStorage.getItem('gym-studio.history')!)).toEqual(migrated)
    expect(loadWorkoutHistory()).toEqual(migrated)
  })

  it('stores entries newest first', () => {
    addWorkoutEntry(entry('a', '2026-09-01'))
    addWorkoutEntry(entry('b', '2026-09-15'))
    addWorkoutEntry(entry('c', '2026-09-08'))
    expect(loadWorkoutHistory().map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('exercise library data', () => {
  it('has unique ids, because workout history references exercises by id', () => {
    const ids = exerciseLibrary.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique names, because saved exercises are merged by name', () => {
    const names = exerciseLibrary.map((e) => normalizeExerciseName(e.name))
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every exercise a name and a primary muscle', () => {
    for (const exercise of exerciseLibrary) {
      expect(exercise.name.trim()).not.toBe('')
      expect(exercise.primaryMuscle.trim()).not.toBe('')
    }
  })
})

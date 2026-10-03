import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exerciseLibrary } from '../data/exerciseLibrary'
import { WorkoutEntry } from '../types'
import { refreshCatalogue, fetchRemoteCatalogue } from './storage'
import {
  addWorkoutEntry,
  getExerciseDisplayName,
  loadExercises,
  loadWorkoutHistory,
  normalizeExerciseName,
  upsertExerciseRecord,
} from './storage'

const supabaseMock = vi.hoisted(() => {
  const response: { data: unknown[] | null; error: unknown | null } = { data: null, error: null }
  const order = vi.fn(async () => response)
  const eq = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  const client = { from }
  return { response, order, eq, select, from, client, clientState: { current: client as typeof client | null } }
})

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(async () => supabaseMock.clientState.current),
}))

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
  supabaseMock.response.data = null
  supabaseMock.response.error = null
  supabaseMock.clientState.current = supabaseMock.client
  supabaseMock.order.mockClear()
  supabaseMock.eq.mockClear()
  supabaseMock.select.mockClear()
  supabaseMock.from.mockClear()
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

  it('uses the Spanish catalogue name when available', () => {
    expect(
      getExerciseDisplayName(
        { id: 'catalogue-exercise', name: 'New Exercise', nameEs: 'Ejercicio nuevo', primaryMuscle: 'Core' },
        'es'
      )
    ).toBe('Ejercicio nuevo')
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

  it('uses the cached catalogue and keeps saved custom exercises', () => {
    const catalogueExercise = {
      id: 'lat-pulldown',
      name: 'Lat Pulldown (Wide Grip)',
      primaryMuscle: 'Lats',
    }
    localStorage.setItem(
      'gym-studio.catalogue',
      JSON.stringify({ fetchedAt: '2026-10-03T00:00:00Z', exercises: [catalogueExercise], aliases: {} })
    )
    localStorage.setItem(
      'gym-studio.exercises',
      JSON.stringify([...exerciseLibrary, { id: 'my-custom-move', name: 'My Custom Move', primaryMuscle: 'Core' }])
    )

    const exercises = loadExercises()
    expect(exercises).toEqual([
      expect.objectContaining(catalogueExercise),
      expect.objectContaining({ id: 'my-custom-move', name: 'My Custom Move' }),
    ])
    expect(exercises.some((exercise) => exercise.name === 'Lat Pulldown')).toBe(false)
  })

  it('ignores cached tips and notes and restores bundled content by exercise id', () => {
    const bundled = exerciseLibrary.find((exercise) => exercise.id === 'romanian-deadlift')!
    localStorage.setItem(
      'gym-studio.catalogue',
      JSON.stringify({
        fetchedAt: '2026-10-03T00:00:00Z',
        exercises: [{
          id: bundled.id,
          name: 'Romanian Deadlift (Barbell)',
          primaryMuscle: 'Hamstrings',
          notes: 'Stale cached notes',
          tips: ['Stale cached tip'],
        }],
        aliases: {},
      })
    )

    const exercise = loadExercises().find((item) => item.id === bundled.id)

    expect(exercise?.notes).toBe(bundled.notes)
    expect(exercise?.tips).toEqual(bundled.tips)
  })
})

describe('remote catalogue', () => {
  const rows = [
    {
      id: 'romanian-deadlift',
      name_en: 'Romanian Deadlift (Barbell)',
      name_es: 'Peso muerto rumano con barra',
      primary_muscle: 'Hamstrings',
      secondary_muscles: ['Glutes', 'Lower Back'],
      aliases: ['bb-rdl'],
    },
    {
      id: 'lat-pulldown',
      name_en: 'Lat Pulldown (Wide Grip)',
      name_es: null,
      primary_muscle: 'Lats',
      secondary_muscles: ['Upper Back', 'Biceps'],
      aliases: [],
    },
  ]

  it('maps active database fields without bundled tips or notes', async () => {
    supabaseMock.response.data = rows

    const catalogue = await fetchRemoteCatalogue()
    const deadlift = catalogue?.find((exercise) => exercise.id === 'romanian-deadlift')

    expect(supabaseMock.from).toHaveBeenCalledWith('exercises')
    expect(supabaseMock.select).toHaveBeenCalledWith('id, name_en, name_es, primary_muscle, secondary_muscles, aliases')
    expect(supabaseMock.eq).toHaveBeenCalledWith('is_active', true)
    expect(supabaseMock.order).toHaveBeenCalledWith('name_en')
    expect(deadlift).toMatchObject({
      name: 'Romanian Deadlift (Barbell)',
      nameEs: 'Peso muerto rumano con barra',
      primaryMuscle: 'Hamstrings',
      secondaryMuscle: 'Glutes',
    })
    expect(deadlift?.notes).toBeUndefined()
    expect(deadlift?.tips).toBeUndefined()
  })

  it('returns null when Supabase returns an error', async () => {
    supabaseMock.response.error = new Error('offline')
    expect(await fetchRemoteCatalogue()).toBeNull()
  })

  it('returns null when the Supabase client is unavailable', async () => {
    supabaseMock.clientState.current = null
    expect(await fetchRemoteCatalogue()).toBeNull()
  })

  it('caches the catalogue and its aliases for offline history migration', async () => {
    supabaseMock.response.data = rows

    await refreshCatalogue()

    const cache = JSON.parse(localStorage.getItem('gym-studio.catalogue')!)
    const deadlift = loadExercises().find((exercise) => exercise.id === 'romanian-deadlift')
    const bundledDeadlift = exerciseLibrary.find((exercise) => exercise.id === 'romanian-deadlift')

    expect(cache.exercises).toHaveLength(2)
    expect(cache.exercises[0]).not.toHaveProperty('tips')
    expect(cache.exercises[0]).not.toHaveProperty('notes')
    expect(cache.aliases).toEqual({ 'bb-rdl': 'romanian-deadlift' })
    expect(localStorage.getItem('gym-studio.catalogue')!.length).toBeLessThan(50_000)
    expect(deadlift?.tips).toEqual(bundledDeadlift?.tips)
    expect(deadlift?.nameEs).toBe('Peso muerto rumano con barra')
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

  it('migrates catalogue aliases idempotently', () => {
    const aliasedEntries = [
      { ...entry('catalogue-alias', '2026-09-02'), exerciseId: 'bb-rdl' },
      { ...entry('catalogue-alias-2', '2026-09-03'), exerciseId: 'hack-squats' },
    ]
    localStorage.setItem(
      'gym-studio.catalogue',
      JSON.stringify({
        fetchedAt: '2026-10-03T00:00:00Z',
        exercises: [],
        aliases: { 'bb-rdl': 'romanian-deadlift', 'hack-squats': 'hack-squat-machine' },
      })
    )
    localStorage.setItem('gym-studio.history', JSON.stringify(aliasedEntries))

    const migrated = loadWorkoutHistory()

    expect(migrated[0].exerciseId).toBe('romanian-deadlift')
    expect(migrated[1].exerciseId).toBe('hack-squat-machine')
    expect(loadWorkoutHistory()).toEqual(migrated)
    expect(JSON.parse(localStorage.getItem('gym-studio.history')!)).toEqual(migrated)
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

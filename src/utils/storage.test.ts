import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadExerciseLibrary } from '../data/exerciseLibrary'
import { Exercise, WorkoutEntry } from '../types'
import { refreshCatalogue, fetchRemoteCatalogue } from './storage'
import {
  addWorkoutEntry,
  fetchTrainingBlocks,
  dismissWelcome,
  getExerciseDisplayName,
  getAskExerciseAiConsent,
  getSessionStorageValue,
  hasDismissedWelcome,
  loadExercises,
  loadRestTimerState,
  loadWorkoutHistory,
  mapTrainingBlockRows,
  normalizeExerciseName,
  storageKey,
  setActiveBlockId,
  setAskExerciseAiConsent,
  setSessionStorageValue,
  saveRestTimerState,
  getActiveBlockId,
  upsertExerciseRecord,
  setStorageNamespace,
  hasGuestWorkoutData,
  isGuestDataClaimed,
  moveGuestDataToAccount,
  getLanguage,
  recordHelpAiAppOpen,
  setLanguage,
  loadAiSessionPlan,
  saveAiSessionPlan,
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

let exerciseLibrary: Exercise[]

beforeAll(async () => {
  exerciseLibrary = (await loadExerciseLibrary()).exerciseLibrary
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
  vi.stubGlobal('sessionStorage', createMemoryStorage())
  supabaseMock.response.data = null
  supabaseMock.response.error = null
  supabaseMock.clientState.current = supabaseMock.client
  supabaseMock.order.mockClear()
  supabaseMock.eq.mockClear()
  supabaseMock.select.mockClear()
  supabaseMock.from.mockClear()
})

describe('language preference', () => {
  afterEach(() => setStorageNamespace(null))

  it('is null until chosen, then persists and ignores invalid values', () => {
    expect(getLanguage()).toBeNull()
    setLanguage('es')
    expect(getLanguage()).toBe('es')
    localStorage.setItem('gym-studio.language', 'fr')
    expect(getLanguage()).toBeNull()
  })

  it('is shared across accounts on the device', () => {
    setLanguage('es')
    setStorageNamespace('user-1')
    expect(storageKey('gym-studio.language')).toBe('gym-studio.language')
    expect(getLanguage()).toBe('es')
  })

  it('is shared with demo mode', () => {
    setLanguage('es')
    sessionStorage.setItem('gym-studio.demo-mode', '1')
    try {
      expect(storageKey('gym-studio.language')).toBe('gym-studio.language')
      expect(getLanguage()).toBe('es')
    } finally {
      sessionStorage.removeItem('gym-studio.demo-mode')
    }
  })
})

describe('AI session plan storage', () => {
  it('stores plans in the active account namespace by block and day', () => {
    const plan = { summary: 'Steady progress.', exercises: [{ code: 'A1', weight: 60, reps: [8], note: 'Stay controlled.' }] }
    try {
      setStorageNamespace('user-1')
      saveAiSessionPlan('block/1', 'chest/a', plan)
      expect(loadAiSessionPlan('block/1', 'chest/a')).toEqual(plan)

      setStorageNamespace('user-2')
      expect(loadAiSessionPlan('block/1', 'chest/a')).toBeNull()
    } finally {
      setStorageNamespace(null)
    }
  })

  it('ignores malformed stored plans', () => {
    localStorage.setItem('gym-studio.ai-session-plan.block.day', '{bad json')
    expect(loadAiSessionPlan('block', 'day')).toBeNull()
  })
})

describe('help button open count', () => {
  it('counts app opens in the device-level key once per page load', () => {
    localStorage.setItem('gym-studio.help-ai-app-opens', '2')

    expect(recordHelpAiAppOpen()).toBe(3)
    expect(localStorage.getItem('gym-studio.help-ai-app-opens')).toBe('3')
    expect(recordHelpAiAppOpen()).toBe(3)
  })
})

describe('bundled catalogue Spanish names', () => {
  it('maps name_es onto nameEs', () => {
    expect(exerciseLibrary.every((exercise) => exercise.nameEs)).toBe(true)
  })
})

describe('normalizeExerciseName', () => {
  it('turns names into lowercase dash-separated keys', () => {
    expect(normalizeExerciseName('  Dumbbell Press (Neutral Grip, 45°) ')).toBe('dumbbell-press-neutral-grip-45')
  })
})

describe('getExerciseDisplayName', () => {
  it('returns the localized exercise name when available', () => {
    expect(getExerciseDisplayName('Lat Pulldown')).toBe('Lat Pulldown')
    expect(getExerciseDisplayName('Romanian Deadlift')).toBe('Romanian Deadlift')
    expect(
      getExerciseDisplayName(
        { id: 'catalogue-exercise', name: 'Barbell Row', primaryMuscle: 'Back' }
      )
    ).toBe('Barbell Row')
    expect(
      getExerciseDisplayName(
        { id: 'catalogue-exercise', name: 'Barbell Row', nameEs: 'Remo con barra', primaryMuscle: 'Back' },
        'es'
      )
    ).toBe('Remo con barra')
  })

  it('uses the name field when no translation is available', () => {
    expect(
      getExerciseDisplayName(
        { id: 'catalogue-exercise', name: 'New Exercise', primaryMuscle: 'Core' }
      )
    ).toBe('New Exercise')
  })
})

describe('loadExercises', () => {
  it('seeds the built-in library on first launch', async () => {
    const exercises = await loadExercises()
    expect(exercises).toHaveLength(exerciseLibrary.length)
    expect(localStorage.getItem('gym-studio.exercises')).not.toBeNull()
  })

  it('loads the complete bundled catalogue when there is no cache or Supabase client', async () => {
    supabaseMock.clientState.current = null

    const exercises = await loadExercises()

    expect(exercises).toHaveLength(227)
    expect(exercises.find((exercise) => exercise.id === 'barbell-bench-press')?.postureTips).toHaveLength(5)
    expect(exercises.find((exercise) => exercise.id === 'barbell-bench-press')?.squeezeCue).toContain(
      'Squeeze your chest'
    )
  })

  it('recovers from corrupted saved data', async () => {
    localStorage.setItem('gym-studio.exercises', '{not json')
    expect(await loadExercises()).toHaveLength(exerciseLibrary.length)
  })

  it('replaces saved legacy exercises with the canonical library entry', async () => {
    localStorage.setItem(
      'gym-studio.exercises',
      JSON.stringify([{ id: 'bb-bench-press', name: 'BB Bench Press', primaryMuscle: 'Chest' }])
    )

    const exercises = await loadExercises()
    const benchPresses = exercises.filter((exercise) => normalizeExerciseName(exercise.name) === 'barbell-bench-press')

    expect(benchPresses).toHaveLength(1)
    expect(benchPresses[0].id).toBe('barbell-bench-press')
    expect(JSON.parse(localStorage.getItem('gym-studio.exercises')!).some(
      (exercise: { id: string }) => exercise.id === 'bb-bench-press'
    )).toBe(false)
  })

  it('loads saved legacy exercises idempotently', async () => {
    localStorage.setItem(
      'gym-studio.exercises',
      JSON.stringify([{ id: 'bb-bench-press', name: 'BB Bench Press', primaryMuscle: 'Chest' }])
    )

    const firstLoad = await loadExercises()
    const firstStoredValue = localStorage.getItem('gym-studio.exercises')
    const secondLoad = await loadExercises()

    expect(secondLoad).toEqual(firstLoad)
    expect(localStorage.getItem('gym-studio.exercises')).toBe(firstStoredValue)
  })

  it('keeps user-added exercises alongside the library', async () => {
    localStorage.setItem('gym-studio.exercises', JSON.stringify([{ name: 'My Custom Move', primaryMuscle: 'Core' }]))
    const names = (await loadExercises()).map((e) => e.name)
    expect(names).toContain('My Custom Move')
    const uniqueLibraryNames = new Set(exerciseLibrary.map((e) => normalizeExerciseName(e.name)))
    expect(names.length).toBe(uniqueLibraryNames.size + 1)
  })

  it('uses the cached catalogue and keeps saved custom exercises', async () => {
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
      JSON.stringify([{ id: 'my-custom-move', name: 'My Custom Move', primaryMuscle: 'Core' }])
    )

    const exercises = await loadExercises()
    expect(exercises).toEqual([
      expect.objectContaining(catalogueExercise),
      expect.objectContaining({ id: 'my-custom-move', name: 'My Custom Move' }),
    ])
    expect(exercises.some((exercise) => exercise.name === 'Lat Pulldown')).toBe(false)
  })

  it('uses cached posture tips', async () => {
    const bundled = exerciseLibrary.find((exercise) => exercise.id === 'romanian-deadlift')!
    const cachedTips = ['Cached one', 'Cached two', 'Cached three', 'Cached four', 'Cached five']
    localStorage.setItem(
      'gym-studio.catalogue',
      JSON.stringify({
        fetchedAt: '2026-10-03T00:00:00Z',
        exercises: [{
          id: bundled.id,
          name: 'Romanian Deadlift (Barbell)',
          primaryMuscle: 'Hamstrings',
          postureTips: cachedTips,
        }],
        aliases: {},
      })
    )

    const exercise = (await loadExercises()).find((item) => item.id === bundled.id)

    expect(exercise?.postureTips).toEqual(cachedTips)
  })

  it('preserves cached squeeze cues and leaves missing cues undefined', async () => {
    localStorage.setItem(
      'gym-studio.catalogue',
      JSON.stringify({
        fetchedAt: '2026-10-03T00:00:00Z',
        exercises: [
          { id: 'romanian-deadlift', name: 'Romanian Deadlift (Barbell)', primaryMuscle: 'Hamstrings', squeezeCue: 'Cached cue' },
          { id: 'lat-pulldown', name: 'Lat Pulldown (Wide Grip)', primaryMuscle: 'Lats' },
        ],
        aliases: {},
      })
    )

    const exercises = await loadExercises()

    expect(exercises.find((exercise) => exercise.id === 'romanian-deadlift')?.squeezeCue).toBe('Cached cue')
    expect(exercises.find((exercise) => exercise.id === 'lat-pulldown')?.squeezeCue).toBeUndefined()
  })
})

describe('remote catalogue', () => {
  const rows = [
    {
      id: 'romanian-deadlift',
      name_en: 'Romanian Deadlift (Barbell)',
      name_es: 'Peso muerto rumano (barra)',
      body_region: 'Legs',
      primary_muscle: 'Hamstrings',
      primary_muscles: ['Hamstrings', 'Glutes'],
      secondary_muscles: ['Glutes', 'Lower Back'],
      equipment: 'barbell',
      mechanic: 'compound',
      posture_tips: [
        'Tip one',
        'Tip two',
        'Tip three',
        'Tip four',
        'Tip five',
      ],
      squeeze_cue: 'Squeeze the target muscle at lockout.',
      aliases: ['bb-rdl'],
    },
    {
      id: 'lat-pulldown',
      name_en: 'Lat Pulldown (Wide Grip)',
      name_es: null,
      body_region: 'Back',
      primary_muscle: 'Lats',
      primary_muscles: ['Lats'],
      secondary_muscles: ['Upper Back', 'Biceps'],
      equipment: 'cable',
      mechanic: 'compound',
      posture_tips: ['Tip one', 'Tip two', 'Tip three', 'Tip four', 'Tip five'],
      squeeze_cue: null,
      aliases: [],
    },
  ]

  it('maps active database fields without bundled tips or notes', async () => {
    supabaseMock.response.data = rows

    const catalogue = await fetchRemoteCatalogue()
    const deadlift = catalogue?.find((exercise) => exercise.id === 'romanian-deadlift')

    expect(supabaseMock.from).toHaveBeenCalledWith('exercises')
    expect(supabaseMock.select).toHaveBeenCalledWith(
      'id, name_en, name_es, body_region, primary_muscle, primary_muscles, secondary_muscles, equipment, mechanic, posture_tips, squeeze_cue, aliases'
    )
    expect(supabaseMock.eq).toHaveBeenCalledWith('is_active', true)
    expect(supabaseMock.order).toHaveBeenCalledWith('name_en')
    expect(deadlift).toMatchObject({
      name: 'Romanian Deadlift (Barbell)',
      nameEs: 'Peso muerto rumano (barra)',
      primaryMuscle: 'Hamstrings',
      secondaryMuscle: 'Glutes',
      bodyRegion: 'Legs',
      primaryMuscles: ['Hamstrings', 'Glutes'],
      secondaryMuscles: ['Glutes', 'Lower Back'],
      equipment: 'barbell',
      mechanic: 'compound',
      postureTips: ['Tip one', 'Tip two', 'Tip three', 'Tip four', 'Tip five'],
      squeezeCue: 'Squeeze the target muscle at lockout.',
    })
    expect(catalogue?.find((exercise) => exercise.id === 'lat-pulldown')?.squeezeCue).toBeUndefined()
    expect(catalogue?.find((exercise) => exercise.id === 'lat-pulldown')?.nameEs).toBeUndefined()
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
    const deadlift = (await loadExercises()).find((exercise) => exercise.id === 'romanian-deadlift')
    expect(cache.exercises).toHaveLength(2)
    expect(cache.exercises[0]).not.toHaveProperty('tips')
    expect(cache.exercises[0]).not.toHaveProperty('notes')
    expect(cache.aliases).toEqual({ 'bb-rdl': 'romanian-deadlift' })
    expect(new TextEncoder().encode(localStorage.getItem('gym-studio.catalogue')!).byteLength).toBeLessThan(200_000)
    expect(deadlift?.bodyRegion).toBe('Legs')
    expect(deadlift?.primaryMuscles).toEqual(['Hamstrings', 'Glutes'])
    expect(deadlift?.secondaryMuscles).toEqual(['Glutes', 'Lower Back'])
    expect(deadlift?.equipment).toBe('barbell')
    expect(deadlift?.mechanic).toBe('compound')
    expect(deadlift?.postureTips).toEqual(['Tip one', 'Tip two', 'Tip three', 'Tip four', 'Tip five'])
    expect(deadlift?.postureTips).toEqual(['Tip one', 'Tip two', 'Tip three', 'Tip four', 'Tip five'])
    expect(deadlift?.squeezeCue).toBe('Squeeze the target muscle at lockout.')
  })
})

describe('training blocks', () => {
  const trainingBlockRows = [
    {
      id: 'block-2',
      number: 2,
      name: 'Second block',
      method: 'reverse-pyramid',
      start_date: '2026-03-30',
      weeks: 6,
      origin: 'coach',
      summary: 'Second summary',
      insights: [
        { title: 'Goal', body: 'Build muscle.' },
        { title: 'How it works', body: 'Use flat sets.' },
      ],
      days: [
        {
          key: 'arms-a',
          position: 2,
          name: 'Arms A',
          focus: 'Arms',
          exercises: [{
            code: 'B1',
            position: 2,
            exercise_id: 'triceps-extension',
            sets: 2,
            reps: ['12+12', '12+12'],
            rest_seconds: 90,
            technique: 'drop-set',
            angle_degrees: null,
            notes: null,
          }],
        },
        {
          key: 'chest-back-a',
          position: 1,
          name: 'Chest-Back A',
          focus: 'Chest and back',
          exercises: [{
            code: 'A1',
            position: 1,
            exercise_id: 'barbell-bench-press',
            sets: 2,
            reps: ['8', '10'],
            rest_seconds: 120,
            technique: 'reverse-pyramid',
            angle_degrees: 30,
            notes: 'Bench at 30 degrees.',
          }],
        },
      ],
    },
    {
      id: 'block-1',
      number: 1,
      name: 'First block',
      method: 'straight',
      start_date: '2026-02-16',
      weeks: 6,
      origin: 'pt',
      summary: 'First summary',
      days: [],
    },
  ]

  it('maps and orders blocks, days, and exercises from Supabase rows', () => {
    const blocks = mapTrainingBlockRows(trainingBlockRows)

    expect(blocks.map((block) => block.number)).toEqual([1, 2])
    expect(blocks[0].insights).toEqual([])
    expect(blocks[1].insights).toEqual([
      { title: 'Goal', body: 'Build muscle.' },
      { title: 'How it works', body: 'Use flat sets.' },
    ])
    expect(blocks[1].startDate).toBe('2026-03-30')
    expect(blocks[1].origin).toBe('coach')
    expect(blocks[1].days.map((day) => day.key)).toEqual(['chest-back-a', 'arms-a'])
    expect(blocks[1].days[0].exercises[0]).toMatchObject({
      code: 'A1',
      exerciseId: 'barbell-bench-press',
      reps: ['8', '10'],
      restSeconds: 120,
      technique: 'reverse-pyramid',
      angleDegrees: 30,
    })
    expect(blocks[1].days[1].exercises[0].reps).toEqual(['12+12', '12+12'])
  })

  it('fetches and caches active blocks with nested ordered data', async () => {
    supabaseMock.response.data = trainingBlockRows

    const blocks = await fetchTrainingBlocks()

    expect(supabaseMock.from).toHaveBeenCalledWith('training_blocks')
    expect(supabaseMock.select).toHaveBeenCalledWith(
      'id, number, name, method, start_date, weeks, origin, summary, insights, days:training_block_days(key, position, name, focus, exercises:training_block_exercises(code, position, exercise_id, sets, reps, rest_seconds, technique, angle_degrees, notes))'
    )
    expect(supabaseMock.eq).toHaveBeenCalledWith('is_active', true)
    expect(supabaseMock.order).toHaveBeenCalledWith('number')
    expect(blocks.map((block) => block.number)).toEqual([1, 2])
    expect(JSON.parse(localStorage.getItem('gym-studio.training-blocks')!)).toEqual(blocks)
  })

  it('uses cached blocks offline and the bundled blocks when no cache exists', async () => {
    supabaseMock.response.data = trainingBlockRows
    await fetchTrainingBlocks()
    supabaseMock.clientState.current = null

    expect(await fetchTrainingBlocks()).toHaveLength(2)

    localStorage.removeItem('gym-studio.training-blocks')
    const bundledBlocks = await fetchTrainingBlocks()
    expect(bundledBlocks).toHaveLength(9)
    expect(bundledBlocks[5]).toMatchObject({
      id: 'block-2026-10-05-hypertrophy-flat-pyramid-ii',
      name: 'Size · Straight Sets, Stretch Focus',
      startDate: '2026-10-05',
    })
    expect(bundledBlocks[5].insights.map(({ title }) => title)).toEqual([
      'Goal',
      'How it works',
      'A days vs B days',
      'How to progress',
      'What to expect',
      'Key tips',
    ])
  })

  it('persists the selected block id', () => {
    setActiveBlockId('block-6')
    expect(getActiveBlockId()).toBe('block-6')

    setActiveBlockId(null)
    expect(getActiveBlockId()).toBeNull()
  })

  it('isolates a pinned block selection in demo mode', () => {
    setActiveBlockId('real-block')
    sessionStorage.setItem('gym-studio.demo-mode', '1')

    expect(getActiveBlockId()).toBeNull()
    setActiveBlockId('demo-block')
    expect(localStorage.getItem('gym-studio.demo.active-block-id')).toBe('demo-block')
    expect(localStorage.getItem('gym-studio.active-block-id')).toBe('real-block')
  })
})

describe('demo storage namespace', () => {
  it('isolates the welcome dismissal from demo mode', () => {
    dismissWelcome()
    expect(hasDismissedWelcome()).toBe(true)

    setStorageNamespace('user-1')
    expect(hasDismissedWelcome()).toBe(true)
    setStorageNamespace(null)

    sessionStorage.setItem('gym-studio.demo-mode', '1')
    expect(hasDismissedWelcome()).toBe(false)
    dismissWelcome()
    expect(localStorage.getItem('gym-studio.demo.welcome-dismissed')).toBe('true')
    expect(localStorage.getItem('gym-studio.welcome-dismissed')).toBe('true')
  })

  it('isolates session values in demo mode', () => {
    setSessionStorageValue('gym-studio.block-card-expanded', 'true')
    sessionStorage.setItem('gym-studio.demo-mode', '1')

    expect(getSessionStorageValue('gym-studio.block-card-expanded')).toBeNull()
    setSessionStorageValue('gym-studio.block-card-expanded', 'false')
    expect(sessionStorage.getItem('gym-studio.demo.block-card-expanded')).toBe('false')
    expect(sessionStorage.getItem('gym-studio.block-card-expanded')).toBe('true')

    sessionStorage.removeItem('gym-studio.demo-mode')
    expect(getSessionStorageValue('gym-studio.block-card-expanded')).toBe('true')
  })

  it('isolates demo history from the saved real history', async () => {
    const realHistory = [{
      id: 'real-entry',
      exerciseId: 'barbell-bench-press',
      date: '2026-09-01',
      sets: [{ id: 'real-set', reps: 8, weight: 60 }],
    }]
    localStorage.setItem('gym-studio.history', JSON.stringify(realHistory))
    sessionStorage.setItem('gym-studio.demo-mode', '1')

    expect(storageKey('gym-studio.history')).toBe('gym-studio.demo.history')
    await addWorkoutEntry(entry('demo-entry', '2026-09-02'))
    expect(localStorage.getItem('gym-studio.history')).toBe(JSON.stringify(realHistory))
    expect(JSON.parse(localStorage.getItem('gym-studio.demo.history')!)).toHaveLength(1)

    sessionStorage.removeItem('gym-studio.demo-mode')
    expect(await loadWorkoutHistory()).toEqual(realHistory)
  })

  it('isolates the persisted rest timer in demo mode', () => {
    const timer = { endAt: 1_800_000_000_000 }
    saveRestTimerState(timer)
    sessionStorage.setItem('gym-studio.demo-mode', '1')

    expect(loadRestTimerState()).toBeNull()
    saveRestTimerState({ pausedRemainingMs: 15_000 })
    expect(localStorage.getItem('gym-studio.demo.rest-timer')).toBe(
      JSON.stringify({ pausedRemainingMs: 15_000 })
    )
    expect(loadRestTimerState()).toEqual({ pausedRemainingMs: 15_000 })

    sessionStorage.removeItem('gym-studio.demo-mode')
    expect(loadRestTimerState()).toEqual(timer)
    saveRestTimerState(null)
    expect(loadRestTimerState()).toBeNull()
  })
})

describe('per-account storage namespaces', () => {
  afterEach(() => setStorageNamespace(null))

  it('stores Ask AI consent separately for each account', () => {
    expect(getAskExerciseAiConsent()).toBeNull()

    setStorageNamespace('user-a')
    setAskExerciseAiConsent('enabled')
    expect(getAskExerciseAiConsent()).toBe('enabled')

    setStorageNamespace('user-b')
    expect(getAskExerciseAiConsent()).toBeNull()
    setAskExerciseAiConsent('declined')
    expect(getAskExerciseAiConsent()).toBe('declined')

    setStorageNamespace('user-a')
    expect(getAskExerciseAiConsent()).toBe('enabled')
  })

  it('keeps each account and the guest history separate', async () => {
    await addWorkoutEntry(entry('guest-entry', '2026-09-01'))
    setStorageNamespace('user-a')
    expect(await loadWorkoutHistory()).toEqual([])
    await addWorkoutEntry(entry('a-entry', '2026-09-02'))
    setStorageNamespace('user-b')
    expect(await loadWorkoutHistory()).toEqual([])
    setStorageNamespace('user-a')
    expect((await loadWorkoutHistory()).map((e) => e.id)).toEqual(['a-entry'])
    setStorageNamespace(null)
    expect((await loadWorkoutHistory()).map((e) => e.id)).toEqual(['guest-entry'])
  })

  it('moves guest workouts to the first account only once', async () => {
    await addWorkoutEntry(entry('guest-entry', '2026-09-01'))
    expect(hasGuestWorkoutData()).toBe(true)
    setStorageNamespace('user-a')
    moveGuestDataToAccount('user-a')
    expect((await loadWorkoutHistory()).map((e) => e.id)).toEqual(['guest-entry'])
    expect(isGuestDataClaimed()).toBe(true)
    setStorageNamespace(null)
    expect(hasGuestWorkoutData()).toBe(false)
  })
})

describe('upsertExerciseRecord', () => {
  it('avoids catalogue id collisions when deriving a custom exercise id', async () => {
    const created = await upsertExerciseRecord({ name: 'Cable Crunch', primaryMuscle: 'Core' })
    expect(created.id).toBe('cable-crunch-custom')
    expect((await loadExercises()).some((e) => e.id === 'cable-crunch-custom')).toBe(true)
  })

  it('updates an existing exercise matched by name instead of duplicating it', async () => {
    await upsertExerciseRecord({ name: 'Cable Crunch', primaryMuscle: 'Core' })
    await upsertExerciseRecord({ name: 'cable crunch', primaryMuscle: 'Core', notes: 'Slow negative' })
    const matches = (await loadExercises()).filter((e) => normalizeExerciseName(e.name) === 'cable-crunch')
    expect(matches).toHaveLength(1)
    expect(matches[0].notes).toBe('Slow negative')
  })
})

describe('workout history', () => {
  it('is empty when nothing has been saved', async () => {
    expect(await loadWorkoutHistory()).toEqual([])
  })

  it('ignores corrupted history instead of crashing', async () => {
    localStorage.setItem('gym-studio.history', 'oops')
    expect(await loadWorkoutHistory()).toEqual([])
  })

  it('migrates legacy exercise ids in saved history', async () => {
    const legacyEntry = entry('legacy', '2026-09-01')
    localStorage.setItem('gym-studio.history', JSON.stringify([legacyEntry]))

    const migrated = await loadWorkoutHistory()

    expect(migrated[0].exerciseId).toBe('barbell-bench-press')
    expect(JSON.parse(localStorage.getItem('gym-studio.history')!)).toEqual(migrated)
    expect(await loadWorkoutHistory()).toEqual(migrated)
  })

  it('migrates catalogue aliases idempotently', async () => {
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

    const migrated = await loadWorkoutHistory()

    expect(migrated[0].exerciseId).toBe('romanian-deadlift')
    expect(migrated[1].exerciseId).toBe('hack-squat-machine')
    expect(await loadWorkoutHistory()).toEqual(migrated)
    expect(JSON.parse(localStorage.getItem('gym-studio.history')!)).toEqual(migrated)
  })

  it('migrates bundled catalogue aliases while offline', async () => {
    const aliasedEntry = { ...entry('bundled-alias', '2026-09-04'), exerciseId: 'bb-rdl' }
    localStorage.setItem('gym-studio.history', JSON.stringify([aliasedEntry]))

    expect((await loadWorkoutHistory())[0].exerciseId).toBe('romanian-deadlift')
  })

  it('stores entries newest first', async () => {
    await addWorkoutEntry(entry('a', '2026-09-01'))
    await addWorkoutEntry(entry('b', '2026-09-15'))
    await addWorkoutEntry(entry('c', '2026-09-08'))
    expect((await loadWorkoutHistory()).map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('preserves block, day, and drop-set fields in saved history', async () => {
    const plannedEntry: WorkoutEntry = {
      ...entry('planned-drop', '2026-09-15'),
      exerciseId: 'barbell-bench-press',
      blockId: 'block-2',
      dayKey: 'chest-back-a',
      sets: [{ id: 'planned-drop-1', reps: 12, weight: 30, drop: { reps: 12, weight: 22 } }],
    }

    await addWorkoutEntry(plannedEntry)

    expect(await loadWorkoutHistory()).toEqual([plannedEntry])
  })
})

describe('exercise library data', () => {
  it('bundles all 227 approved exercises with five English posture tips each', () => {
    expect(exerciseLibrary).toHaveLength(227)
    expect(exerciseLibrary.find((exercise) => exercise.id === 'barbell-bench-press')).toMatchObject({
      name: 'Barbell Bench Press',
      bodyRegion: 'Chest',
      postureTips: expect.arrayContaining([expect.any(String)]),
    })
    expect(exerciseLibrary.find((exercise) => exercise.id === 'barbell-bench-press')?.postureTips).toHaveLength(5)
    for (const exercise of exerciseLibrary) {
      expect(exercise.postureTips).toHaveLength(5)
      expect(exercise.postureTips?.some((tip) => /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00bf\u00a1]/i.test(tip))).toBe(false)
    }
  })

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

describe('catalogue merge keeps Spanish names', () => {
  it('keeps nameEs from the bundled catalogue when an old cache entry has none', async () => {
    const { mergeExercisesForTest } = await import('./storage')
    const merged = mergeExercisesForTest(
      [{ id: 'barbell-bench-press', name: 'Barbell Bench Press', nameEs: 'Press de banca con barra', primaryMuscle: 'Chest', tips: [] }],
      [{ id: 'barbell-bench-press', name: 'Barbell Bench Press', primaryMuscle: 'Chest' }]
    )
    expect(merged[0].nameEs).toBe('Press de banca con barra')
  })
})

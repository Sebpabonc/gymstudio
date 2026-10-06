import type { ExerciseSwap } from '../plans/exerciseSwaps'
import { Exercise, PlannedExercise, TrainingBlock, TrainingDay, WorkoutEntry } from '../types'
import { loadExerciseLibrary } from '../data/exerciseLibrary'
import { getSupabaseClient } from '../lib/supabaseClient'
import { isDemoMode } from './demoMode'
import { RestTimerState } from './restTimer'
import { fetchActiveUserPlan as fetchRemoteActiveUserPlan } from './profileData'
import type { SavedUserPlan } from './profileData'

const EXERCISES_KEY = 'gym-studio.exercises'
const HISTORY_KEY = 'gym-studio.history'
const CATALOGUE_KEY = 'gym-studio.catalogue'
const TRAINING_BLOCKS_KEY = 'gym-studio.training-blocks'
const ACTIVE_USER_PLAN_KEY = 'gym-studio.active-user-plan'
const ACTIVE_BLOCK_KEY = 'gym-studio.active-block-id'
const SYNC_METADATA_KEY = 'gym-studio.sync-metadata'
const ASK_EXERCISE_AI_CONSENT_KEY = 'gym-studio.ai-consent.ask-exercise'
const WELCOME_DISMISSED_KEY = 'gym-studio.welcome-dismissed'
const LAYOUT_MODE_KEY = 'gym-studio.layout-mode'
const LANGUAGE_KEY = 'gym-studio.language'
const REST_TIMER_KEY = 'gym-studio.rest-timer'
const EXERCISE_SWAPS_KEY = 'gym-studio.exercise-swaps'
const HELP_AI_APP_OPENS_KEY = 'gym-studio.help-ai-app-opens'
let helpAiAppOpensThisLoad: number | null = null

export type SyncWorkoutEntry = WorkoutEntry & {
  updatedAt: string
  dirty: boolean
  deletedAt?: string
}

type SyncMetadata = {
  entries: Record<string, { updatedAt: string; dirty: boolean; deletedAt?: string }>
  lastPulledAt: Record<string, string>
}

function loadSyncMetadata(): SyncMetadata {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(SYNC_METADATA_KEY)) ?? 'null')
    return {
      entries: parsed?.entries ?? {},
      lastPulledAt: parsed?.lastPulledAt ?? {},
    }
  } catch {
    return { entries: {}, lastPulledAt: {} }
  }
}

function saveSyncMetadata(metadata: SyncMetadata) {
  localStorage.setItem(storageKey(SYNC_METADATA_KEY), JSON.stringify(metadata))
}

function signalWorkoutHistorySaved() {
  if (!isDemoMode() && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('gym-studio:history-saved'))
  }
}

const GUEST_CLAIMED_KEY = 'gym-studio.guest-claimed'
const CUSTOM_PLAN_STORAGE_KEY = 'gym-studio.custom-plan'
const SHARED_KEYS = new Set([CATALOGUE_KEY, TRAINING_BLOCKS_KEY, GUEST_CLAIMED_KEY, WELCOME_DISMISSED_KEY, LAYOUT_MODE_KEY, LANGUAGE_KEY])

let storageNamespace: string | null = null

// Signed-in accounts get their own local namespace; signed-out use is the "guest" namespace
// (the original, un-prefixed keys). Catalogue caches and device-level state are shared.
export function setStorageNamespace(userId: string | null) {
  storageNamespace = userId
}

export function storageKey(key: string) {
  if (key === LANGUAGE_KEY) return key
  if (isDemoMode()) return key.replace(/^gym-studio\./, 'gym-studio.demo.')
  if (storageNamespace && !SHARED_KEYS.has(key)) {
    return key.replace(/^gym-studio\./, `gym-studio.user.${storageNamespace}.`)
  }
  return key
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

export function hasGuestWorkoutData() {
  if (isDemoMode()) return false
  const history = readJson<unknown>(HISTORY_KEY, [])
  return Array.isArray(history) && history.length > 0
}

export function isGuestDataClaimed() {
  return localStorage.getItem(GUEST_CLAIMED_KEY) !== null
}

export function markGuestDataClaimed(userId: string) {
  localStorage.setItem(GUEST_CLAIMED_KEY, userId)
}

// Moves the guest workouts and personal settings into the account's namespace (the active one).
export function moveGuestDataToAccount(userId: string) {
  const guestHistory = readJson<WorkoutEntry[]>(HISTORY_KEY, [])
  const guestMetadata = readJson<Partial<SyncMetadata>>(SYNC_METADATA_KEY, {})
  const accountHistory = readJson<WorkoutEntry[]>(storageKey(HISTORY_KEY), [])
  const accountIds = new Set(accountHistory.map((entry) => entry.id))
  const moved = guestHistory.filter((entry) => !accountIds.has(entry.id))
  const merged = [...accountHistory, ...moved].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const metadata = loadSyncMetadata()
  const now = new Date().toISOString()
  for (const entry of moved) {
    metadata.entries[entry.id] = { updatedAt: guestMetadata.entries?.[entry.id]?.updatedAt ?? now, dirty: true }
  }
  localStorage.setItem(storageKey(HISTORY_KEY), JSON.stringify(merged))
  saveSyncMetadata(metadata)

  const guestExercises = readJson<Exercise[]>(EXERCISES_KEY, [])
  const accountExercises = readJson<Exercise[]>(storageKey(EXERCISES_KEY), [])
  if (guestExercises.length) {
    const ids = new Set(accountExercises.map((exercise) => exercise.id))
    localStorage.setItem(
      storageKey(EXERCISES_KEY),
      JSON.stringify([...accountExercises, ...guestExercises.filter((exercise) => !ids.has(exercise.id))])
    )
  }

  for (const key of [CUSTOM_PLAN_STORAGE_KEY, ACTIVE_BLOCK_KEY]) {
    const value = localStorage.getItem(key)
    if (value !== null && localStorage.getItem(storageKey(key)) === null) {
      localStorage.setItem(storageKey(key), value)
    }
  }

  for (const key of [HISTORY_KEY, SYNC_METADATA_KEY, EXERCISES_KEY, CUSTOM_PLAN_STORAGE_KEY, ACTIVE_BLOCK_KEY]) {
    localStorage.removeItem(key)
  }
  markGuestDataClaimed(userId)
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

export function loadRestTimerState(): RestTimerState | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(REST_TIMER_KEY)) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return null
    if (
      'endAt' in parsed &&
      typeof parsed.endAt === 'number' &&
      Number.isFinite(parsed.endAt)
    ) {
      return { endAt: parsed.endAt }
    }
    if (
      'pausedRemainingMs' in parsed &&
      typeof parsed.pausedRemainingMs === 'number' &&
      Number.isFinite(parsed.pausedRemainingMs) &&
      parsed.pausedRemainingMs >= 0
    ) {
      return { pausedRemainingMs: parsed.pausedRemainingMs }
    }
    return null
  } catch {
    return null
  }
}

export function saveRestTimerState(timer: RestTimerState | null) {
  try {
    if (timer) {
      localStorage.setItem(storageKey(REST_TIMER_KEY), JSON.stringify(timer))
    } else {
      localStorage.removeItem(storageKey(REST_TIMER_KEY))
    }
  } catch {
    // The timer still works when browser storage is unavailable.
  }
}

export type AskExerciseAiConsent = 'enabled' | 'declined'

export function getAskExerciseAiConsent(): AskExerciseAiConsent | null {
  try {
    const choice = localStorage.getItem(storageKey(ASK_EXERCISE_AI_CONSENT_KEY))
    return choice === 'enabled' || choice === 'declined' ? choice : null
  } catch {
    return null
  }
}

export function setAskExerciseAiConsent(choice: AskExerciseAiConsent) {
  try {
    localStorage.setItem(storageKey(ASK_EXERCISE_AI_CONSENT_KEY), choice)
  } catch {
    // Consent cannot be remembered when browser storage is unavailable.
  }
}

/** Exercise swaps on this device: today-only swaps plus a cache of the account's permanent swaps. */
export function loadLocalExerciseSwaps(): ExerciseSwap[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(EXERCISE_SWAPS_KEY)) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((swap): swap is ExerciseSwap =>
          typeof swap?.fromExerciseId === 'string' &&
          typeof swap?.toExerciseId === 'string' &&
          (swap.scope === 'always' || (swap.scope === 'today' && typeof swap.date === 'string')))
      : []
  } catch {
    return []
  }
}

export function saveLocalExerciseSwaps(swaps: ExerciseSwap[], today: string) {
  // Old today-only swaps are dropped; only today's and permanent ones are kept.
  const kept = swaps.filter((swap) => swap.scope === 'always' || swap.date === today)
  try {
    localStorage.setItem(storageKey(EXERCISE_SWAPS_KEY), JSON.stringify(kept))
  } catch {
    // The swap still applies for this session.
  }
  return kept
}

export function recordHelpAiAppOpen() {
  if (helpAiAppOpensThisLoad !== null) return helpAiAppOpensThisLoad

  try {
    const storedCount = Number(localStorage.getItem(HELP_AI_APP_OPENS_KEY) ?? 0)
    helpAiAppOpensThisLoad = Number.isSafeInteger(storedCount) && storedCount >= 0 ? storedCount + 1 : 1
    localStorage.setItem(HELP_AI_APP_OPENS_KEY, String(helpAiAppOpensThisLoad))
    return helpAiAppOpensThisLoad
  } catch {
    helpAiAppOpensThisLoad = 0
    return helpAiAppOpensThisLoad
  }
}

export type LayoutMode = 'boxes' | 'sheet'

/** Device-level UI preference: classic boxes or the sheet layout (PO 2026-10-05). */
export function getLayoutMode(): LayoutMode {
  try {
    return localStorage.getItem(storageKey(LAYOUT_MODE_KEY)) === 'sheet' ? 'sheet' : 'boxes'
  } catch {
    return 'boxes'
  }
}

export function setLayoutMode(mode: LayoutMode) {
  try {
    localStorage.setItem(storageKey(LAYOUT_MODE_KEY), mode)
  } catch {
    // The choice just isn't remembered when storage is unavailable.
  }
}

/** Device-level language preference; null until the user picks one. */
export function getLanguage(): 'en' | 'es' | null {
  try {
    const value = localStorage.getItem(storageKey(LANGUAGE_KEY))
    return value === 'en' || value === 'es' ? value : null
  } catch {
    return null
  }
}

export function setLanguage(language: 'en' | 'es') {
  try {
    localStorage.setItem(storageKey(LANGUAGE_KEY), language)
  } catch {
    // The choice just isn't remembered when storage is unavailable.
  }
}

export function hasDismissedWelcome() {
  return localStorage.getItem(storageKey(WELCOME_DISMISSED_KEY)) === 'true'
}

export function dismissWelcome() {
  localStorage.setItem(storageKey(WELCOME_DISMISSED_KEY), 'true')
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
  name_es?: string | null
  primary_muscle: string
  body_region: string | null
  primary_muscles: string[] | null
  secondary_muscles: string[]
  equipment: string | null
  mechanic: 'compound' | 'isolation' | null
  movement_pattern?: string | null
  posture_tips: string[] | null
  squeeze_cue: string | null
  aliases: string[]
}

type CatalogueExercise = Pick<
  Exercise,
  | 'id'
  | 'name'
  | 'nameEs'
  | 'primaryMuscle'
  | 'secondaryMuscle'
  | 'bodyRegion'
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'equipment'
  | 'mechanic'
  | 'postureTips'
  | 'squeezeCue'
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

export function getExerciseDisplayName(value: string | Exercise, language: 'en' | 'es' = 'en') {
  if (typeof value === 'string') return value
  return language === 'es' && value.nameEs?.trim() ? value.nameEs : value.name
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

function clearTrainingBlockCache() {
  try {
    localStorage.removeItem(storageKey(TRAINING_BLOCKS_KEY))
  } catch {
    return
  }
}

/** Blocks saved on this device from the last successful fetch (null if none) — for instant first render. */
export function getCachedTrainingBlocks(): TrainingBlock[] | null {
  return loadTrainingBlockCache()
}

export function getCachedActiveUserPlan(): SavedUserPlan | null {
  if (isDemoMode()) return null
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(ACTIVE_USER_PLAN_KEY)) ?? 'null')
    if (
      !parsed
      || typeof parsed !== 'object'
      || typeof parsed.templateId !== 'string'
      || typeof parsed.startDate !== 'string'
      || (parsed.source !== 'ai' && parsed.source !== 'rules')
      || !parsed.block
      || typeof parsed.block !== 'object'
      || !Array.isArray(parsed.block.days)
    ) return null
    return parsed as SavedUserPlan
  } catch {
    return null
  }
}

export function cacheActiveUserPlan(plan: SavedUserPlan | null) {
  if (isDemoMode()) return
  try {
    const key = storageKey(ACTIVE_USER_PLAN_KEY)
    if (plan) localStorage.setItem(key, JSON.stringify(plan))
    else localStorage.removeItem(key)
  } catch {
    return
  }
}

/** Uses the account-scoped cache immediately when the signed-in user's plan is offline. */
export async function fetchActiveUserPlan(): Promise<SavedUserPlan | null> {
  if (isDemoMode()) return null
  const cached = getCachedActiveUserPlan()
  try {
    const plan = await fetchRemoteActiveUserPlan()
    cacheActiveUserPlan(plan)
    return plan
  } catch (error) {
    if (cached) return cached
    throw error
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
        // The server answered with no visible blocks: never fall back to another user's cached or bundled blocks.
        clearTrainingBlockCache()
        return []
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

export function setActiveBlockId(blockId: string | null) {
  const key = storageKey(ACTIVE_BLOCK_KEY)
  if (blockId) {
    localStorage.setItem(key, blockId)
  } else {
    localStorage.removeItem(key)
  }
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
      mechanic: exercise.mechanic ?? current?.mechanic,
      postureTips: exercise.postureTips ?? current?.postureTips,
      squeezeCue: exercise.squeezeCue ?? current?.squeezeCue,
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
        nameEs: exercise.nameEs,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscle: exercise.secondaryMuscle,
        bodyRegion: exercise.bodyRegion,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        mechanic: exercise.mechanic,
        postureTips: exercise.postureTips,
        squeezeCue: exercise.squeezeCue,
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
        'id, name_en, name_es, body_region, primary_muscle, primary_muscles, secondary_muscles, equipment, mechanic, movement_pattern, posture_tips, squeeze_cue, aliases'
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
        mechanic: row.mechanic ?? undefined,
        movementPattern: row.movement_pattern ?? undefined,
        postureTips: row.posture_tips ?? undefined,
        squeezeCue: row.squeeze_cue ?? undefined,
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
          nameEs: exercise.nameEs,
          primaryMuscle: exercise.primaryMuscle,
          secondaryMuscle: exercise.secondaryMuscle,
          bodyRegion: exercise.bodyRegion,
          primaryMuscles: exercise.primaryMuscles,
          secondaryMuscles: exercise.secondaryMuscles,
          equipment: exercise.equipment,
          mechanic: exercise.mechanic,
          postureTips: exercise.postureTips,
          squeezeCue: exercise.squeezeCue,
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

async function loadWorkoutHistoryEntries(): Promise<WorkoutEntry[]> {
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

export async function loadWorkoutHistory(): Promise<WorkoutEntry[]> {
  const history = await loadWorkoutHistoryEntries()
  const deletedIds = new Set(
    Object.entries(loadSyncMetadata().entries)
      .filter(([, sync]) => sync.deletedAt)
      .map(([id]) => id)
  )
  return history.filter((entry) => !deletedIds.has(entry.id))
}

export function saveWorkoutHistory(history: WorkoutEntry[]) {
  const raw = localStorage.getItem(storageKey(HISTORY_KEY))
  let previous: WorkoutEntry[] = []
  try {
    const parsed = JSON.parse(raw ?? '[]')
    if (Array.isArray(parsed)) previous = parsed
  } catch {
    previous = []
  }

  const metadata = loadSyncMetadata()
  const historyIds = new Set(history.map((entry) => entry.id))
  const allHistory = [
    ...history,
    ...previous.filter((entry) => metadata.entries[entry.id]?.deletedAt && !historyIds.has(entry.id)),
  ]
  const previousById = new Map(previous.map((entry) => [entry.id, JSON.stringify(entry)]))
  const nextEntries: SyncMetadata['entries'] = {}
  const now = new Date().toISOString()

  for (const entry of allHistory) {
    const sync = metadata.entries[entry.id]
    const unchanged = previousById.get(entry.id) === JSON.stringify(entry)
    nextEntries[entry.id] = unchanged && sync
      ? sync
      : { updatedAt: now, dirty: true, ...(sync?.deletedAt ? { deletedAt: sync.deletedAt } : {}) }
  }

  localStorage.setItem(storageKey(HISTORY_KEY), JSON.stringify(allHistory))
  saveSyncMetadata({ ...metadata, entries: nextEntries })
  signalWorkoutHistorySaved()
}

export async function loadWorkoutHistoryForSync(): Promise<SyncWorkoutEntry[]> {
  const history = await loadWorkoutHistoryEntries()
  const metadata = loadSyncMetadata()
  let changed = false
  const entries = history.map((entry) => {
    let sync = metadata.entries[entry.id]
    if (!sync || typeof sync.updatedAt !== 'string' || typeof sync.dirty !== 'boolean') {
      sync = { updatedAt: new Date().toISOString(), dirty: true }
      metadata.entries[entry.id] = sync
      changed = true
    }
    return { ...entry, ...sync }
  })
  if (changed) saveSyncMetadata(metadata)
  return entries
}

export async function deleteWorkoutEntry(entryId: string): Promise<WorkoutEntry[]> {
  const history = await loadWorkoutHistoryEntries()
  if (!history.some((entry) => entry.id === entryId)) return loadWorkoutHistory()

  const metadata = loadSyncMetadata()
  const now = new Date().toISOString()
  metadata.entries[entryId] = { updatedAt: now, dirty: true, deletedAt: now }
  saveSyncMetadata(metadata)
  signalWorkoutHistorySaved()
  return history.filter((entry) => entry.id !== entryId && !metadata.entries[entry.id]?.deletedAt)
}

export function restoreWorkoutEntry(entry: WorkoutEntry) {
  const raw = localStorage.getItem(storageKey(HISTORY_KEY))
  let history: WorkoutEntry[] = []
  try {
    const parsed = JSON.parse(raw ?? '[]')
    if (Array.isArray(parsed)) history = parsed
  } catch {
    history = []
  }

  const nextHistory = [
    entry,
    ...history.filter((item) => item.id !== entry.id),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const metadata = loadSyncMetadata()
  metadata.entries[entry.id] = { updatedAt: new Date().toISOString(), dirty: true }
  localStorage.setItem(storageKey(HISTORY_KEY), JSON.stringify(nextHistory))
  saveSyncMetadata(metadata)
  signalWorkoutHistorySaved()
  return nextHistory.filter((item) => !metadata.entries[item.id]?.deletedAt)
}

export function saveMergedWorkoutHistory(history: SyncWorkoutEntry[]) {
  const metadata = loadSyncMetadata()
  const entries: SyncMetadata['entries'] = {}
  for (const entry of history) {
    entries[entry.id] = {
      updatedAt: entry.updatedAt,
      dirty: entry.dirty,
      ...(entry.deletedAt ? { deletedAt: entry.deletedAt } : {}),
    }
  }
  localStorage.setItem(
    storageKey(HISTORY_KEY),
    JSON.stringify(history.map(({ updatedAt: _updatedAt, dirty: _dirty, deletedAt: _deletedAt, ...entry }) => entry))
  )
  saveSyncMetadata({ ...metadata, entries })
}

export function markWorkoutEntriesSynced(
  entries: Array<{ id: string; expectedUpdatedAt: string; updatedAt?: string }>
) {
  const metadata = loadSyncMetadata()
  let changed = false
  for (const entry of entries) {
    const current = metadata.entries[entry.id]
    if (!current || current.updatedAt !== entry.expectedUpdatedAt) continue
    metadata.entries[entry.id] = {
      ...current,
      updatedAt: entry.updatedAt ?? current.updatedAt,
      dirty: false,
    }
    changed = true
  }
  if (changed) saveSyncMetadata(metadata)
}

export async function markAllWorkoutEntriesDirty() {
  const entries = await loadWorkoutHistoryForSync()
  const metadata = loadSyncMetadata()
  for (const entry of entries) {
    metadata.entries[entry.id] = { ...metadata.entries[entry.id], dirty: true }
  }
  saveSyncMetadata(metadata)
}

export function getWorkoutHistoryLastPulledAt(userId: string) {
  return loadSyncMetadata().lastPulledAt[userId] ?? null
}

export function setWorkoutHistoryLastPulledAt(userId: string, updatedAt: string) {
  const metadata = loadSyncMetadata()
  metadata.lastPulledAt[userId] = updatedAt
  saveSyncMetadata(metadata)
}

export async function addWorkoutEntry(entry: WorkoutEntry) {
  const nextHistory = [...(await loadWorkoutHistory()), entry].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  saveWorkoutHistory(nextHistory)
  return nextHistory
}

export const mergeExercisesForTest = mergeExercises

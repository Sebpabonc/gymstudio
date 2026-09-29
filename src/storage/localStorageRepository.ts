import { ExerciseLog, ID, ISODate, SaveLogInput, SetEntry } from '../domain/types'
import { createId } from '../lib/id'
import { WorkoutRepository } from './repository'

const STORAGE_KEY = 'gym-studio.data'
const SCHEMA_VERSION = 1

/** Key used by the pre-v1 prototype. Read once for migration, never written. */
const LEGACY_HISTORY_KEY = 'gym-studio.history'

interface StoredData {
  schemaVersion: typeof SCHEMA_VERSION
  logs: ExerciseLog[]
}

const byDateDesc = (a: ExerciseLog, b: ExerciseLog) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt.localeCompare(a.updatedAt)

function isSet(value: unknown): value is SetEntry {
  const v = value as SetEntry
  return !!v && Number.isFinite(v.weight) && Number.isFinite(v.reps)
}

function sanitizeLog(value: unknown): ExerciseLog | null {
  const v = value as ExerciseLog
  if (!v || typeof v.exerciseId !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date ?? '')) return null
  const sets = Array.isArray(v.sets) ? v.sets.filter(isSet).map((s) => ({ weight: s.weight, reps: s.reps })) : []
  if (sets.length === 0) return null
  const now = new Date().toISOString()
  return {
    id: typeof v.id === 'string' ? v.id : createId(),
    exerciseId: v.exerciseId,
    date: v.date,
    sets,
    notes: typeof v.notes === 'string' && v.notes.trim() ? v.notes : undefined,
    programId: v.programId ?? null,
    createdAt: v.createdAt ?? now,
    updatedAt: v.updatedAt ?? v.createdAt ?? now,
  }
}

/** Converts the old prototype's history (one entry per save) into v1 logs (one per exercise per day). */
function migrateLegacy(storage: Storage): ExerciseLog[] {
  const raw = storage.getItem(LEGACY_HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const merged = new Map<string, ExerciseLog>()
    for (const entry of parsed) {
      const log = sanitizeLog({ ...entry, createdAt: `${entry?.date}T12:00:00.000Z` })
      if (!log) continue
      const key = `${log.exerciseId}|${log.date}`
      const existing = merged.get(key)
      if (existing) {
        existing.sets.push(...log.sets)
        if (log.notes) existing.notes = [existing.notes, log.notes].filter(Boolean).join('\n')
      } else {
        merged.set(key, log)
      }
    }
    return Array.from(merged.values())
  } catch {
    return []
  }
}

export function createLocalStorageRepository(storage: Storage = window.localStorage): WorkoutRepository {
  let logs: ExerciseLog[] = load()
  let version = 0
  const listeners = new Set<() => void>()

  function load(): ExerciseLog[] {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) {
        const migrated = migrateLegacy(storage)
        if (migrated.length) persist(migrated)
        return migrated.sort(byDateDesc)
      }
      const parsed = JSON.parse(raw) as Partial<StoredData>
      // Future schema upgrades go here: if (parsed.schemaVersion === 1) { ... }
      const list = Array.isArray(parsed.logs) ? parsed.logs : []
      return list.map(sanitizeLog).filter((l): l is ExerciseLog => l !== null).sort(byDateDesc)
    } catch (error) {
      console.error('[storage] Could not read saved data', error)
      return []
    }
  }

  function persist(next: ExerciseLog[]) {
    const data: StoredData = { schemaVersion: SCHEMA_VERSION, logs: next }
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function emit() {
    version += 1
    listeners.forEach((listener) => listener())
  }

  return {
    getLogsForExercise(exerciseId) {
      return logs.filter((log) => log.exerciseId === exerciseId)
    },

    getLog(exerciseId, date) {
      return logs.find((log) => log.exerciseId === exerciseId && log.date === date)
    },

    saveLog(input: SaveLogInput) {
      const now = new Date().toISOString()
      const existing = logs.find((l) => l.exerciseId === input.exerciseId && l.date === input.date)
      const log: ExerciseLog = {
        id: existing?.id ?? createId(),
        exerciseId: input.exerciseId,
        date: input.date,
        sets: input.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        notes: input.notes?.trim() || undefined,
        programId: existing?.programId ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      const next = [log, ...logs.filter((l) => l !== existing)].sort(byDateDesc)
      persist(next) // throws on quota / private-mode errors; state stays unchanged
      logs = next
      emit()
      return log
    },

    getLastLoggedDates() {
      const result = new Map<ID, ISODate>()
      for (const log of logs) {
        if (!result.has(log.exerciseId)) result.set(log.exerciseId, log.date)
      }
      return result
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    getVersion() {
      return version
    },
  }
}

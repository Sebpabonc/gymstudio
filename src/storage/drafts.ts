import { ID, ISODate } from '../domain/types'

/**
 * Unsaved input for today's session, kept so a phone lock or accidental
 * reload in the middle of a workout does not lose what was typed.
 */

export interface DraftSetRow {
  id: string
  /** Raw text as typed, so "62," or "" are allowed while editing. */
  weight: string
  reps: string
}

export interface Draft {
  sets: DraftSetRow[]
  notes: string
}

const DRAFTS_KEY = 'gym-studio.drafts'

type DraftMap = Record<string, Draft & { date: ISODate }>

const keyOf = (exerciseId: ID, date: ISODate) => `${exerciseId}|${date}`

function readAll(): DraftMap {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    return raw ? (JSON.parse(raw) as DraftMap) : {}
  } catch {
    return {}
  }
}

function writeAll(map: DraftMap) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(map))
  } catch {
    // Drafts are best-effort.
  }
}

export function loadDraft(exerciseId: ID, date: ISODate): Draft | undefined {
  const draft = readAll()[keyOf(exerciseId, date)]
  return draft ? { sets: draft.sets, notes: draft.notes } : undefined
}

export function saveDraft(exerciseId: ID, date: ISODate, draft: Draft) {
  const map = readAll()
  // Drop drafts from previous days.
  for (const key of Object.keys(map)) {
    if (map[key].date !== date) delete map[key]
  }
  map[keyOf(exerciseId, date)] = { ...draft, date }
  writeAll(map)
}

export function clearDraft(exerciseId: ID, date: ISODate) {
  const map = readAll()
  delete map[keyOf(exerciseId, date)]
  writeAll(map)
}

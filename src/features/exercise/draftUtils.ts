import { ExerciseLog, SetEntry } from '../../domain/types'
import { parseDecimal } from '../../lib/format'
import { createId } from '../../lib/id'
import { Draft, DraftSetRow } from '../../storage/drafts'

export const emptyRow = (): DraftSetRow => ({ id: createId(), weight: '', reps: '' })

export const rowFromSet = (set: SetEntry): DraftSetRow => ({
  id: createId(),
  weight: String(set.weight).replace('.', ','),
  reps: String(set.reps),
})

export const emptyDraft = (): Draft => ({ sets: [emptyRow()], notes: '' })

export const draftFromLog = (log: ExerciseLog): Draft => ({
  sets: log.sets.map(rowFromSet),
  notes: log.notes ?? '',
})

export const isRowEmpty = (row: DraftSetRow) => row.weight.trim() === '' && row.reps.trim() === ''

export const isDraftEmpty = (draft: Draft) => draft.sets.every(isRowEmpty) && draft.notes.trim() === ''

export type ValidationResult = { ok: true; sets: SetEntry[] } | { ok: false; error: string }

/** Turns typed rows into sets. Fully empty rows are ignored. */
export function validateRows(rows: DraftSetRow[]): ValidationResult {
  const sets: SetEntry[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (isRowEmpty(row)) continue
    const label = `Serie ${i + 1}`

    const weight = parseDecimal(row.weight)
    if (!Number.isFinite(weight) || weight < 0 || weight > 1000) {
      return { ok: false, error: `${label}: indica el peso en kg (0 si es peso corporal).` }
    }

    const reps = parseDecimal(row.reps)
    if (!Number.isInteger(reps) || reps <= 0 || reps > 1000) {
      return { ok: false, error: `${label}: indica las repeticiones.` }
    }

    sets.push({ weight: Math.round(weight * 100) / 100, reps })
  }

  if (sets.length === 0) return { ok: false, error: 'Añade al menos una serie con peso y repeticiones.' }
  return { ok: true, sets }
}

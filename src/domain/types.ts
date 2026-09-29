/**
 * Core domain model for Gym Studio.
 *
 * Keep this file free of UI and storage concerns so it can be reused by a
 * future backend, programs feature, or native wrapper.
 */

export type ID = string

/** Calendar date in the user's local timezone, formatted `YYYY-MM-DD`. */
export type ISODate = string

/** Timestamp in ISO 8601 (UTC), e.g. `2026-09-29T08:15:00.000Z`. */
export type ISOTimestamp = string

export type MuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Hombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Cuádriceps'
  | 'Isquiotibiales'
  | 'Glúteos'
  | 'Pantorrillas'
  | 'Core'
  | 'Antebrazos'

export interface Exercise {
  /** Stable, unique, URL-safe identifier. Never change it once logs exist. */
  id: ID
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscle?: MuscleGroup
  notes?: string
  /** Extra search terms (e.g. English names or gym slang). */
  aliases?: string[]
}

/** One performed set. Weight is always stored in kilograms. */
export interface SetEntry {
  weight: number
  reps: number
}

/**
 * Everything done for one exercise on one day.
 * There is at most one log per (exerciseId, date); saving again updates it.
 */
export interface ExerciseLog {
  id: ID
  exerciseId: ID
  date: ISODate
  sets: SetEntry[]
  notes?: string
  /** Reserved for the upcoming programs feature. */
  programId?: ID | null
  createdAt: ISOTimestamp
  updatedAt: ISOTimestamp
}

export interface SaveLogInput {
  exerciseId: ID
  date: ISODate
  sets: SetEntry[]
  notes?: string
}

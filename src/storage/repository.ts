import { ExerciseLog, ID, ISODate, SaveLogInput } from '../domain/types'

/**
 * The only way the UI reads or writes workout history.
 *
 * Today it is backed by localStorage. Later it can be swapped for IndexedDB,
 * a backend API or native storage without touching the screens.
 */
export interface WorkoutRepository {
  /** All logs for an exercise, newest first. */
  getLogsForExercise(exerciseId: ID): ExerciseLog[]
  getLog(exerciseId: ID, date: ISODate): ExerciseLog | undefined
  /** Creates or replaces the log for (exerciseId, date). Throws if it cannot persist. */
  saveLog(input: SaveLogInput): ExerciseLog
  /** Most recent logged date per exercise. */
  getLastLoggedDates(): Map<ID, ISODate>

  /** Change notifications for React (see useRepository). */
  subscribe(listener: () => void): () => void
  getVersion(): number
}

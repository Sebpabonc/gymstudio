export type Exercise = {
  id: string
  name: string
  muscleGroup?: string
}

export type SetEntry = {
  reps: number
  weight: number
}

export type ExerciseEntry = {
  exerciseId: string
  sets: SetEntry[]
}

export type Session = {
  id: string
  date: string // ISO date
  exercises: ExerciseEntry[]
}

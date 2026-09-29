export type Exercise = {
  id: string
  name: string
  primaryMuscle: string
  secondaryMuscle?: string
  notes?: string
  tips?: string[]
}

export type WorkoutSet = {
  id: string
  reps: number
  weight: number
}

export type WorkoutEntry = {
  id: string
  exerciseId: string
  date: string
  sets: WorkoutSet[]
  notes?: string
}

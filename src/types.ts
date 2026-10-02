export type ExerciseTip = {
  text: string
  image?: string
  imageUrl?: string
}

export type Exercise = {
  id: string
  name: string
  primaryMuscle: string
  secondaryMuscle?: string
  notes?: string
  overallStatement?: string
  tips?: Array<string | ExerciseTip>
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

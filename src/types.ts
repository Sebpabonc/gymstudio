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
  bodyRegion?: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  equipment?: string
  postureTips?: string[]
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

export type TrainingTechnique = 'straight' | 'superset' | 'drop-set' | 'pyramid' | 'reverse-pyramid'

export type PlannedExercise = {
  code: string
  position: number
  exerciseId: string
  sets: number
  reps: string[]
  restSeconds: number
  technique: TrainingTechnique
  angleDegrees?: number
  notes?: string
}

export type TrainingDay = {
  key: string
  position: number
  name: string
  focus?: string
  exercises: PlannedExercise[]
}

export type TrainingBlock = {
  id: string
  number: number
  name: string
  method: string
  startDate: string
  weeks: number
  origin: 'coach' | 'pt'
  summary: string
  days: TrainingDay[]
}

export type ExerciseTip = {
  text: string
  image?: string
  imageUrl?: string
}

export type Exercise = {
  id: string
  name: string
  nameEs?: string
  primaryMuscle: string
  mechanic?: 'compound' | 'isolation'
  secondaryMuscle?: string
  bodyRegion?: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  equipment?: string
  movementPattern?: string
  postureTips?: string[]
  squeezeCue?: string
  notes?: string
  overallStatement?: string
  tips?: Array<string | ExerciseTip>
}

export type WorkoutSet = {
  id: string
  reps: number
  weight: number
  drop?: { reps: number; weight: number }
  /** PT spec R3/R10: `mini` (rest-pause / myo-reps mini-set) and `partial` sets never count for progression. */
  tag?: 'main' | 'mini' | 'partial'
  /** Reps in reserve reported for this set (optional, AI Trainer phase 6). */
  rir?: number
  /** When the set was ticked (epoch ms), for set-by-set coaching. */
  at?: number
}

/** What the plan/trainer asked for when an exercise was logged (AI Trainer phase 2). */
export type EntryTarget = {
  sets: number
  reps: { min: number; max: number }
  weight?: number
  technique?: string
  recommendationId?: string
}

export type WorkoutEntry = {
  id: string
  exerciseId: string
  date: string
  sets: WorkoutSet[]
  blockId?: string
  dayKey?: string
  notes?: string
  target?: EntryTarget
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
  /** Set when the user swapped this exercise in; the plan's original exercise id. */
  swappedFrom?: string
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
  insights: { title: string; body: string }[]
  days: TrainingDay[]
}

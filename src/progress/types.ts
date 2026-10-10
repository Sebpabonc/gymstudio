import { Exercise, TrainingBlock, WorkoutEntry } from '../types'

export type DayType = 'A' | 'B'
export type DayTypeFilter = DayType | 'all'

export type ProgressSet = {
  id: string
  reps: number
  weight: number
  drop?: { reps: number; weight: number }
  rir?: number
}

export type ProgressEntry = Omit<WorkoutEntry, 'sets'> & {
  blockId?: string
  dayKey?: string
  sets: ProgressSet[]
}

export type ProgressInputs = {
  entries: ProgressEntry[]
  blocks: TrainingBlock[]
  exercises: Exercise[]
  today: string
}

export type StrengthTrendPoint = {
  date: string
  e1rm: number
  sets: ProgressSet[]
  bestSetIndex: number
  volume: number
  dayType: DayType | null
  blockId: string | null
}

export type StrengthTrend = {
  exerciseId: string
  points: StrengthTrendPoint[]
  isTrendAvailable: boolean
  takeaway: string
}

export type PersonalRecordType = 'weight' | 'reps' | 'e1rm'

export type PersonalRecordSession = {
  exerciseId: string
  date: string
  badges: PersonalRecordType[]
  likelyTypoSetIds: string[]
}

export type ProgressSuggestion =
  | {
      type: 'add-weight'
      exerciseId: string
      dayType: DayType
      message: string
      why: string
    }
  | {
      type: 'plateau'
      exerciseId: string
      dayType: DayType
      message: string
      why: string
    }
  | {
      type: 'fatigue'
      week: number
      message: string
      why: string
    }

export type BlockLiftReport = {
  exerciseId: string
  dayType: DayType
  startValue: number
  endValue: number
  changePercent: number
  metric: 'e1rm' | 'reps'
}

export type BlockReport = {
  blockId: string
  blockNumber: number
  method: string
  lifts: BlockLiftReport[]
  medianChangePercent: number | null
  liftCount: number
  improvedLiftCount: number
}

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders (side and rear)'
  | 'Front delts'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Other'

export type WeeklyMuscleSets = {
  weekStart: string
  groups: Array<{
    muscleGroup: MuscleGroup
    done: number
    planned: number
    band: 'low' | 'light' | 'in-range' | 'high'
    flagged: boolean
  }>
}

export type AdherenceRate = {
  hitSets: number
  plannedSets: number
  hitRate: number | null
}

export type WeeklyAdherence = AdherenceRate & {
  weekStart: string
  sessionsDone: number
  sessionsPlanned: number
}

export type BlockAdherence = AdherenceRate & {
  blockId: string
  blockNumber: number
  sessionsDone: number
  sessionsPlanned: number
}

export type AdherenceReport = {
  week: WeeklyAdherence
  blocks: BlockAdherence[]
}

export type ProgressOptions = {
  today: string
}

export type ProgressV3Range = '4w' | '8w' | 'block' | 'all'
export type LiftVerdict = 'improving' | 'held' | 'lower' | 'not-enough-data'

export type ProgressLiftSession = {
  exerciseId: string
  date: string
  blockId: string | null
  dayKey: string | null
  sets: ProgressSet[]
  deload: boolean
  target?: WorkoutEntry['target']
}

export type LiftTrendPoint = ProgressLiftSession & {
  e1rm: number | null
  topLoad: number | null
  repsAtTop: number
  movingAverage: number | null
  isBest: boolean
  breakDays: number | null
}

export type LiftTrend = {
  exerciseId: string
  highRep: boolean
  points: LiftTrendPoint[]
  verdict: LiftVerdict
  changePercent: number | null
  kgPerWeek: number | null
  percentPerWeek: number | null
  confidence: 'early' | 'based-on' | 'solid' | null
  worthLookingAt: { date: string; sessions: number } | null
}

export type SessionComparison = {
  verdict: 'improved' | 'held' | 'dropped' | 'mixed' | 'traded' | 'target-changed' | 'baseline'
  improvedSets: number
  heldSets: number
  droppedSets: number
  tradedSets: number
  workingSetCount: number
  previousWorkingSetCount: number
  messages: string[]
}

export type ProgressV3Tab = 'overview' | 'trends' | 'muscles' | 'consistency'

export type ProgressExercise = Exercise

export type ProgressBlock = TrainingBlock

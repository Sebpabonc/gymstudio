// First-session starting loads: PT spec docs/fitness/approved/2026-11-07-first-session-starting-weights.md
// (PO decision 2026-11-07: always a general suggested start). A fixed table by equipment, exercise class and experience,
// light on purpose. Goal, activity, session length and days never change it. Every value is in kg; per hand for dumbbells
// and kettlebells; total with the bar for barbell, EZ, hex and Smith; plates added for plate-loaded; stack number otherwise.

export type Experience = 'beginner' | 'intermediate' | 'advanced'

export type StartingExercise = {
  id?: string
  name?: string
  equipment?: string
  movementPattern?: string
  mechanic?: 'compound' | 'isolation'
  bodyRegion?: string
  primaryMuscles?: string[]
  laterality?: 'bilateral' | 'unilateral'
}

type ExerciseClass = 'small' | 'carry' | 'core' | 'iso_lower' | 'iso_upper' | 'squat' | 'hinge' | 'lunge' | 'push_h' | 'push_v' | 'pull'
type Row = [number, number, number]

const LEVEL: Record<Experience, 0 | 1 | 2> = { beginner: 0, intermediate: 1, advanced: 2 }

const BARBELL: Record<ExerciseClass, Row> = {
  squat: [20, 40, 60], hinge: [20, 40, 60], lunge: [20, 20, 30], push_h: [20, 30, 40], push_v: [20, 25, 30], pull: [20, 30, 40],
  iso_upper: [20, 20, 25], iso_lower: [20, 20, 25], small: [20, 20, 25], core: [20, 20, 25], carry: [20, 20, 25],
}
const DUMBBELL: Record<ExerciseClass, Row> = {
  squat: [8, 12, 16], hinge: [6, 10, 14], lunge: [4, 8, 12], push_h: [6, 10, 14], push_v: [4, 8, 10], pull: [8, 12, 16],
  iso_upper: [4, 6, 8], iso_lower: [4, 8, 10], small: [2, 4, 6], core: [4, 8, 10], carry: [8, 12, 16],
}
const CABLE: Record<ExerciseClass, Row> = {
  squat: [10, 15, 20], hinge: [10, 20, 25], lunge: [5, 10, 15], push_h: [10, 15, 20], push_v: [5, 10, 15], pull: [20, 30, 40],
  iso_upper: [5, 10, 12.5], iso_lower: [2.5, 5, 7.5], small: [2.5, 5, 7.5], core: [10, 15, 20], carry: [10, 15, 20],
}
const MACHINE: Record<ExerciseClass, Row> = {
  squat: [30, 50, 70], hinge: [20, 30, 40], lunge: [10, 20, 30], push_h: [15, 25, 35], push_v: [10, 15, 25], pull: [20, 30, 40],
  iso_upper: [10, 15, 20], iso_lower: [15, 25, 35], small: [5, 7.5, 10], core: [10, 20, 25], carry: [10, 20, 25],
}
const PLATE_LOADED: Record<ExerciseClass, Row> = {
  squat: [20, 40, 60], hinge: [20, 40, 60], lunge: [10, 20, 30], push_h: [10, 20, 30], push_v: [10, 15, 20], pull: [10, 20, 30],
  iso_lower: [20, 30, 40], iso_upper: [5, 10, 15], small: [5, 10, 15], core: [5, 10, 15], carry: [5, 10, 15],
}
const EZ_UPPER: Row = [10, 15, 20]
const EZ_LOWER: Row = [10, 20, 30]
const HEX: Row = [30, 40, 60]
const GOOD_MORNING: Row = [20, 20, 30]

const MINIMUM: Record<string, number> = {
  barbell: 20, 'smith-machine': 20, 'hex-bar': 20, 'ez-bar': 10, dumbbell: 2, kettlebell: 4, cable: 2.5, machine: 5, 'plate-loaded': 5,
}
const stepFor = (equipment: string) => (equipment === 'dumbbell' || equipment === 'kettlebell' ? 2 : 2.5)
const down = (value: number, step: number) => Number((Math.floor(value / step + 1e-9) * step).toFixed(2))

/** 2.2: the first matching class, from the catalogue fields. */
export function exerciseClass(exercise: StartingExercise): ExerciseClass | null {
  // Spec 2.5: missing catalogue fields exclude the exercise before any class is chosen (PT review).
  const pattern = exercise.movementPattern
  if (!pattern || !exercise.mechanic) return null
  const muscles = exercise.primaryMuscles ?? []
  if (muscles.length > 0 && muscles.every((muscle) => muscle === 'Side Delts' || muscle === 'Rear Delts')) return 'small'
  if (pattern === 'carry') return 'carry'
  if (pattern === 'core') return 'core'
  if (exercise.mechanic === 'isolation') return exercise.bodyRegion === 'Legs' || exercise.bodyRegion === 'Glutes' ? 'iso_lower' : 'iso_upper'
  if (pattern === 'squat') return 'squat'
  if (pattern === 'hinge') return 'hinge'
  if (pattern === 'lunge') return 'lunge'
  if (pattern === 'push horizontal') return 'push_h'
  if (pattern === 'push vertical') return 'push_v'
  if (pattern === 'pull horizontal' || pattern === 'pull vertical') return 'pull'
  return null
}

/** 2.5: assisted machines (more weight is easier) and exercises without catalogue data keep the "find your weight" text. */
export function startingLoadExcluded(exercise: StartingExercise | undefined) {
  if (!exercise?.equipment || !(exercise.equipment in MINIMUM)) return true
  if (exercise.equipment === 'machine' && /assisted/i.test(`${exercise.name ?? ''} ${exercise.id ?? ''}`)) return true
  return exerciseClass(exercise) === null
}

/** 2.3 + 2.4: the straight-set starting load for one set of `reps`, or null when excluded. */
export function startingLoad(exercise: StartingExercise | undefined, experience: Experience | undefined, reps: number): number | null {
  if (!exercise || startingLoadExcluded(exercise)) return null
  const equipment = exercise.equipment!
  let kind = exerciseClass(exercise)!
  const level = LEVEL[experience ?? 'beginner']
  const unilateral = exercise.laterality === 'unilateral'
  if ((equipment === 'dumbbell' || equipment === 'kettlebell') && unilateral && (kind === 'squat' || kind === 'hinge')) kind = 'lunge'
  let value: number
  if (exercise.id === 'barbell-good-morning') value = GOOD_MORNING[level]
  else if (equipment === 'barbell' || equipment === 'smith-machine') value = BARBELL[kind][level]
  else if (equipment === 'ez-bar') value = (['squat', 'hinge', 'lunge', 'iso_lower'].includes(kind) ? EZ_LOWER : EZ_UPPER)[level]
  else if (equipment === 'hex-bar') value = HEX[level]
  else if (equipment === 'dumbbell' || equipment === 'kettlebell') value = DUMBBELL[kind][level]
  else if (equipment === 'cable') value = CABLE[kind][level]
  else if (equipment === 'machine') value = MACHINE[kind][level]
  else value = PLATE_LOADED[kind][level]
  const step = stepFor(equipment)
  if (unilateral && ['cable', 'machine', 'plate-loaded'].includes(equipment) && kind !== 'small' && kind !== 'lunge') value = down(value / 2, step)
  if (reps >= 13) value -= step
  return down(Math.max(MINIMUM[equipment], value), step)
}

/** 4: per-set loads. Pyramids: the heaviest (fewest-rep) set gets the table value; each set away from it is one
 * max(step, 10%) lighter, never below the minimum. Drop sets: the drop is 75% rounded down, never below the minimum. */
export function startingSetLoads(exercise: StartingExercise | undefined, experience: Experience | undefined, setReps: number[], technique?: string) {
  const heaviestReps = Math.min(...setReps)
  const top = startingLoad(exercise, experience, heaviestReps)
  if (top === null) return null
  const equipment = exercise!.equipment!
  const step = stepFor(equipment)
  const minimum = MINIMUM[equipment]
  const lighter = (next: number) => Math.max(minimum, down(next - Math.max(step, down(next * 0.1, step)), step))
  let setWeights: number[] | undefined
  if ((technique === 'pyramid' || technique === 'reverse-pyramid') && setReps.length > 1 && new Set(setReps).size > 1) {
    const heaviest = setReps.indexOf(heaviestReps)
    setWeights = setReps.map(() => top)
    for (let index = heaviest - 1; index >= 0; index -= 1) setWeights[index] = lighter(setWeights[index + 1])
    for (let index = heaviest + 1; index < setReps.length; index += 1) setWeights[index] = lighter(setWeights[index - 1])
  }
  const dropWeight = technique === 'drop-set' ? Math.max(minimum, down(top * 0.75, step)) : undefined
  return { weight: top, ...(setWeights ? { setWeights } : {}), ...(dropWeight !== undefined ? { dropWeight } : {}) }
}

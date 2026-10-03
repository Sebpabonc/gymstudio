import armsCore from '../../docs/fitness/approved/catalogue-v2/arms-core.json'
import back from '../../docs/fitness/approved/catalogue-v2/back.json'
import chestShoulders from '../../docs/fitness/approved/catalogue-v2/chest-shoulders.json'
import legsGlutes from '../../docs/fitness/approved/catalogue-v2/legs-glutes.json'
import { localIsoDate } from '../lib/dates'
import { TrainingBlock, WorkoutEntry } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000
const catalogue = [...armsCore, ...back, ...chestShoulders, ...legsGlutes]
const equipmentByExerciseId = new Map(catalogue.map((exercise) => [
  exercise.id,
  { equipment: exercise.equipment, name: exercise.name_en },
]))

type DemoHistoryOptions = {
  blocks: TrainingBlock[]
  endDate?: string
  months?: number
  seed?: number | string
}

function dateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function formatDate(value: number) {
  const date = new Date(value)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function subtractMonths(value: string, months: number) {
  const date = new Date(dateValue(value))
  const day = date.getUTCDate()
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1))
  const lastDay = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate()
  return formatDate(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), Math.min(day, lastDay)))
}

function randomValue(seed: number | string, salt: string) {
  const input = `${seed}:${salt}`
  let state = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    state = Math.imul(state ^ input.charCodeAt(index), 16777619)
  }
  state ^= state << 13
  state ^= state >>> 17
  state ^= state << 5
  return (state >>> 0) / 0x1_0000_0000
}

function isCompound(exerciseId: string) {
  const exercise = equipmentByExerciseId.get(exerciseId)
  return /press|squat|deadlift|row|pulldown|pull-up|chin-up|lunge|thrust|leg press/i.test(
    `${exerciseId} ${exercise?.name ?? ''}`
  )
}

function startingLoad(exerciseId: string, seed: number | string) {
  const exercise = equipmentByExerciseId.get(exerciseId)
  const equipment = exercise?.equipment?.toLowerCase() ?? ''
  if (equipment === 'bodyweight') return 0

  const compound = isCompound(exerciseId)
  let range: [number, number]
  if (equipment === 'dumbbell') range = compound ? [14, 26] : [8, 20]
  else if (equipment === 'barbell' || equipment === 'hex-bar') range = compound ? [40, 80] : [15, 40]
  else if (equipment === 'ez-bar') range = compound ? [20, 45] : [10, 30]
  else if (equipment === 'cable' || equipment === 'machine' || equipment === 'plate-loaded' || equipment === 'smith-machine') {
    range = compound ? [30, 75] : [10, 40]
  } else if (equipment === 'kettlebell') range = compound ? [16, 32] : [8, 20]
  else if (equipment === 'band') range = [5, 20]
  else range = [10, 30]

  return range[0] + randomValue(seed, `starting-load:${exerciseId}`) * (range[1] - range[0])
}

function incrementFor(exerciseId: string) {
  const equipment = equipmentByExerciseId.get(exerciseId)?.equipment?.toLowerCase()
  if (equipment === 'dumbbell') return 1
  if (equipment === 'barbell' || equipment === 'hex-bar') return 2.5
  return 0.5
}

function roundLoad(weight: number, increment: number) {
  return Number((Math.round(weight / increment) * increment).toFixed(2))
}

function progressionWeek(week: number, plateauStart: number | undefined) {
  if (plateauStart === undefined || week < plateauStart) return week
  return week < plateauStart + 2 ? plateauStart : week - 1
}

function repsForSet(reps: string[], index: number) {
  const prescribed = reps[index] ?? reps[reps.length - 1] ?? '8'
  const parsed = Number.parseInt(prescribed, 10)
  return Number.isFinite(parsed) ? parsed : 8
}

function blockForDate(blocks: TrainingBlock[], value: number) {
  return blocks.find((block) => {
    const start = dateValue(block.startDate)
    return value >= start && value < start + block.weeks * 7 * DAY_MS
  })
}

export function generateDemoHistory({
  blocks,
  endDate = localIsoDate(),
  months = 6,
  seed = 1,
}: DemoHistoryOptions): WorkoutEntry[] {
  const endValue = dateValue(endDate)
  const startValue = dateValue(subtractMonths(endDate, months))
  const sortedBlocks = [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.number - b.number)
  const blockAtEnd = sortedBlocks.filter((block) => {
    const start = dateValue(block.startDate)
    const end = start + block.weeks * 7 * DAY_MS
    return end > startValue && start <= endValue
  })
  const plateauBlock = blockAtEnd.length
    ? blockAtEnd[Math.floor(randomValue(seed, 'plateau-block') * blockAtEnd.length)]
    : undefined
  const plateauStart = plateauBlock ? 2 + Math.floor(randomValue(seed, 'plateau-week') * 2) : undefined
  const history: WorkoutEntry[] = []

  for (let value = startValue; value <= endValue; value += DAY_MS) {
    const weekday = new Date(value).getUTCDay()
    if (weekday === 0 || randomValue(seed, `skip:${formatDate(value)}`) < 0.08) continue

    const block = blockForDate(sortedBlocks, value)
    if (!block) continue

    const day = [...block.days].sort((a, b) => a.position - b.position)[weekday - 1]
    if (!day) continue

    const week = Math.floor((value - dateValue(block.startDate)) / (7 * DAY_MS))
    const effectiveWeek = progressionWeek(week, block.id === plateauBlock?.id ? plateauStart : undefined)

    day.exercises.forEach((exercise, exerciseIndex) => {
      const increment = incrementFor(exercise.exerciseId)
      const baseWeight = startingLoad(exercise.exerciseId, seed)
      let weeklyGrowth = 0
      for (let growthWeek = 1; growthWeek <= effectiveWeek; growthWeek += 1) {
        weeklyGrowth += 0.0175 + randomValue(seed, `growth:${exercise.exerciseId}:${growthWeek}`) * 0.01
      }
      const deload = week === 0 ? 0.92 : 1
      const sessionKey = `${formatDate(value)}:${block.id}:${day.key}:${exercise.code}`
      const sets = Array.from({ length: exercise.sets }, (_, setIndex) => {
        const reps = repsForSet(exercise.reps, setIndex)
        const pyramidMultiplier =
          exercise.technique === 'reverse-pyramid'
            ? 1 - setIndex * 0.07
            : exercise.technique === 'pyramid'
              ? 1 + setIndex * 0.07
              : 1
        const missedReps =
          setIndex === exercise.sets - 1 && randomValue(seed, `miss:${sessionKey}`) < 0.07
            ? 1 + Math.floor(randomValue(seed, `miss-count:${sessionKey}`) * 2)
            : 0
        return {
          id: `${sessionKey}:${setIndex + 1}`,
          reps: Math.max(1, reps - missedReps),
          weight: roundLoad(baseWeight * (1 + weeklyGrowth) * deload * pyramidMultiplier, increment),
        }
      })

      history.push({
        id: `demo:${sessionKey}:${exerciseIndex}`,
        exerciseId: exercise.exerciseId,
        date: formatDate(value),
        sets,
      })
    })
  }

  return history
}

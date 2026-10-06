// "Never" checks (PO 2026-10-07, after the 0 kg / 28.5 kg / missing-data bugs): every planned exercise in the
// approved blocks × many plausible histories must never produce an absurd recommendation. A new engine rule that
// breaks any of these cannot ship.
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { equipmentStep, recommend, type LoggedSet, type SessionEvidence } from './engine'
import { parseRepPrescription } from '../utils/workoutSets'

type PlanRow = { exercise_id: string; sets: number; reps: string[]; technique: string; notes?: string }
type Block = { number: number; days: Array<{ key: string; exercises: PlanRow[] }> }

const catalogueDir = 'docs/fitness/approved/catalogue-v2'
const equipmentOf = new Map(
  readdirSync(catalogueDir)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => JSON.parse(readFileSync(`${catalogueDir}/${file}`, 'utf8')) as Array<{ id: string; equipment: string }>)
    .map((exercise) => [exercise.id, exercise.equipment])
)
const blocks = (JSON.parse(readFileSync('docs/fitness/approved/training-blocks/blocks.json', 'utf8')) as Block[]).filter((block) => block.number >= 6)
const slots = blocks.flatMap((block) => block.days.flatMap((day) => day.exercises.map((row) => ({ block: block.number, day: day.key, row }))))

const TODAY = '2026-10-14'
const daysAgo = (days: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)

/** Loads that exist for each equipment, light and heavy. */
function loadsFor(equipment: string): number[] {
  const step = equipmentStep(equipment)
  if (equipment === 'bodyweight') return [0, 5, 10]
  return [1, 2, 4, 10, 30].map((multiple) => Number((step * multiple).toFixed(2)))
}

const repPatterns = (target: number, count: number): number[][] => {
  const flat = (reps: number) => Array.from({ length: count }, () => reps)
  return [
    flat(target), flat(target + 4), flat(Math.max(1, target - 4)), flat(target + 1),
    Array.from({ length: count }, (_, i) => Math.max(1, target + 2 - i * 2)), // fading
    flat(target).slice(0, Math.max(1, count - 1)), // incomplete
  ]
}

function histories(load: number, setReps: number[], target: { min: number; max: number }, technique: string, unit: number): SessionEvidence[][] {
  const out: SessionEvidence[][] = []
  for (const reps of repPatterns(setReps[0], setReps.length)) {
    const sets: LoggedSet[] = reps.map((count, index) => ({ weight: load, reps: count, ...(index === 99 ? {} : {}) }))
    out.push([{ date: daysAgo(7), sets, target, technique, setReps }])
    out.push([
      { date: daysAgo(3), sets, target: { min: target.min + 2, max: target.max + 2 } }, // other day, other range
      { date: daysAgo(10), sets, target, technique, setReps },
    ])
    out.push([{ date: daysAgo(40), sets, target, technique, setReps }]) // long break
  }
  // Different loads per set (e.g. 20 / 22.5 / 22.5).
  if (load > 0) {
    const step = unit
    out.push([{ date: daysAgo(4), target, technique, setReps, sets: setReps.map((reps, i) => ({ weight: i === 0 ? Math.max(step, load - step) : load, reps })) }])
  }
  return out
}

const multipleOf = (value: number, step: number) => Math.abs(value / step - Math.round(value / step)) < 1e-6

describe('trainer invariants across every planned exercise in blocks 6–9', () => {
  let checked = 0
  for (const { block, day, row } of slots) {
    const equipment = equipmentOf.get(row.exercise_id) ?? 'machine'
    const setReps = row.reps.map((rep) => parseRepPrescription(rep)[0]).filter((rep) => rep > 0)
    if (!setReps.length) continue
    const target = { min: Math.min(...setReps), max: Math.max(...setReps) }

    it(`block ${block} ${day} ${row.exercise_id} (${equipment}, ${row.technique})`, () => {
      for (const load of loadsFor(equipment)) {
        for (const history of histories(load, setReps, target, row.technique, equipment === 'bodyweight' ? 2.5 : equipmentStep(equipment))) {
          for (const deload of [false, true]) {
            const result = recommend({
              history, today: TODAY, target, sets: row.sets, equipment,
              technique: row.technique, setReps, deload,
            })
            checked += 1
            const context = JSON.stringify({ load, history: history.map((h) => h.sets.map((s) => `${s.weight}x${s.reps}`)), deload })
            const step = equipmentStep(equipment)
            const loads = result.setWeights ?? (result.weight === null ? [] : [result.weight])
            const lastMax = Math.max(0, ...history.flatMap((session) => session.sets.map((set) => set.weight)))
            for (const weight of loads) {
              // Never 0 kg (or negative) for an exercise that was done with load.
              if (lastMax > 0) expect(weight, `0 kg ${context}`).toBeGreaterThan(0)
              // Never a weight that does not exist (bodyweight added load moves in 2.5 kg).
              const unit = equipment === 'bodyweight' ? 2.5 : step
              if (weight > 0) expect(multipleOf(weight, unit), `${weight} not a ${unit} kg step ${context}`).toBe(true)
              // Never a jump above the PT guardrail: max(1 step, min(+10 %, 2 steps)) over the heaviest last load.
              if (lastMax > 0) {
                const cap = lastMax + Math.max(unit, Math.min(lastMax * 0.1, 2 * unit)) + 1e-6
                expect(weight, `jump above guardrail ${context}`).toBeLessThanOrEqual(cap)
              }
            }
            // Per-set arrays always match.
            if (result.setWeights) expect(result.setWeights.length, context).toBe(result.setReps?.length)
            // Never "no history" when there is history in the last 6 weeks.
            const recent = history.some((session) => session.date >= daysAgo(42))
            if (recent && !deload) expect(result.reason === 'no_history' && result.action === 'collect_data' && history.length > 1, context).toBe(false)
          }
        }
      }
    })
  }

  it('ran a meaningful number of scenarios', () => {
    expect(slots.length).toBeGreaterThan(100)
  })
  void checked
})

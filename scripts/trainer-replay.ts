// Prevention plan step 2 (PO 2026-10-07): replay a user's real history (exported read-only to a local JSON file,
// never committed) through the current engine and print what the AI Trainer would recommend for every planned
// exercise of the current block. Run before shipping engine changes:
//   npx vite-node scripts/trainer-replay.ts <entries.json> [today]
import { readFileSync, readdirSync } from 'node:fs'
import { recommend } from '../src/trainer/engine'
import { buildEvidence } from '../src/trainer/evidence'
import { parseRepPrescription } from '../src/utils/workoutSets'
import type { TrainingBlock, WorkoutEntry } from '../src/types'

const [file, todayArg] = process.argv.slice(2)
const today = todayArg ?? new Date().toISOString().slice(0, 10)
const entries = JSON.parse(readFileSync(file, 'utf8')) as WorkoutEntry[]
type RawBlock = { id: string; number: number; name: string; start_date: string; weeks: number; days: Array<{ key: string; name: string; exercises: Array<{ code: string; exercise_id: string; sets: number; reps: string[]; rest_seconds: number; technique: string; angle_degrees?: number; notes?: string }> }> }
const raw = JSON.parse(readFileSync('docs/fitness/approved/training-blocks/blocks.json', 'utf8')) as RawBlock[]
const blocks: TrainingBlock[] = raw.map((b) => ({
  id: b.id, number: b.number, name: b.name, method: '', startDate: b.start_date, weeks: b.weeks, origin: 'pt', summary: '', insights: [],
  days: b.days.map((d, i) => ({ key: d.key, position: i + 1, name: d.name, exercises: d.exercises.map((e, j) => ({
    code: e.code, position: j + 1, exerciseId: e.exercise_id, sets: e.sets, reps: e.reps, restSeconds: e.rest_seconds,
    technique: e.technique as never, ...(e.angle_degrees != null ? { angleDegrees: e.angle_degrees } : {}), ...(e.notes ? { notes: e.notes } : {}),
  })) })),
}))
const equipment = new Map(readdirSync('docs/fitness/approved/catalogue-v2').filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(`docs/fitness/approved/catalogue-v2/${f}`, 'utf8')) as Array<{ id: string; equipment: string }>)
  .map((e) => [e.id, e.equipment]))
const block = [...blocks].filter((b) => b.startDate <= today).sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
const week = Math.floor((Date.parse(today) - Date.parse(block.startDate)) / (7 * 86_400_000)) + 1
const problems: string[] = []
console.log(`Block ${block.number} · week ${week} · today ${today}`)
for (const day of block.days) {
  console.log(`\n${day.key}`)
  for (const ex of day.exercises) {
    const setReps = ex.reps.map((r) => parseRepPrescription(r)[0]).filter((r) => r > 0)
    const target = { min: Math.min(...setReps), max: Math.max(...setReps) }
    const evidence = buildEvidence(entries, ex.exerciseId, blocks, today, day.key)
    const rec = recommend({ history: evidence, today, target, sets: ex.sets, equipment: equipment.get(ex.exerciseId), technique: ex.technique, setReps, deload: week === 6, exerciseId: ex.exerciseId })
    const last = evidence[0] ? evidence[0].sets.map((s) => `${s.weight}×${s.reps}`).join(' ') : '—'
    const loads = rec.setWeights ? rec.setWeights.join('/') : String(rec.weight ?? '—')
    if (evidence.length && (rec.weight === 0 || rec.setWeights?.some((w) => w <= 0))) problems.push(`${day.key} ${ex.code} 0 kg`)
    if (evidence.some((e) => e.date >= new Date(Date.parse(today) - 42 * 864e5).toISOString().slice(0, 10)) && rec.reason === 'no_history') problems.push(`${day.key} ${ex.code} says no data`)
    console.log(`  ${ex.code.padEnd(3)} ${ex.exerciseId.padEnd(42)} last ${last.padEnd(28)} → ${loads} kg × ${rec.reps.min}-${rec.reps.max} (${rec.action}, ${rec.reason}, ${rec.confidence})`)
  }
}
console.log(problems.length ? `\nPROBLEMS:\n- ${problems.join('\n- ')}` : '\nNo invariant problems.')

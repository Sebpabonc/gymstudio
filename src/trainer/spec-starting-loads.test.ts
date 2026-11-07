// PT spec docs/fitness/approved/2026-11-07-first-session-starting-weights.md, section 6 (S1-S45, L1-L4).
// Expected values are the PT's; if a case fails, send it back to the PT instead of changing the number.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { recommend, type RecommendInput } from './engine'
import { trainerReasonParts } from './presentation'
import type { Experience, StartingExercise } from './startingLoads'

type Row = { id: string; name_en: string; equipment: string; movement_pattern?: string; mechanic?: 'compound' | 'isolation'; body_region?: string; primary_muscles?: string[]; laterality?: 'bilateral' | 'unilateral' }
const dir = 'docs/fitness/approved/catalogue-v2'
const catalogue = new Map(readdirSync(dir).filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as Row[]).map((row) => [row.id, row]))
const meta = (id: string): StartingExercise => {
  const row = catalogue.get(id)
  if (!row) throw new Error(`missing ${id}`)
  return { id, name: row.name_en, equipment: row.equipment, movementPattern: row.movement_pattern, mechanic: row.mechanic,
    bodyRegion: row.body_region, primaryMuscles: row.primary_muscles, laterality: row.laterality }
}
const rng = (min: number, max = min) => ({ min, max })
function first(id: string, experience: Experience | undefined, reps: number | number[], extra: Partial<RecommendInput> = {}) {
  const exercise = meta(id)
  const setReps = Array.isArray(reps) ? reps : undefined
  const flat = Array.isArray(reps) ? Math.min(...reps) : reps
  return recommend({
    history: [], today: '2026-11-20', target: setReps ? rng(Math.min(...setReps), Math.max(...setReps)) : rng(flat),
    sets: setReps?.length ?? 3, equipment: exercise.equipment, exerciseId: id, setReps,
    starting: { exercise, experience }, ...extra,
  })
}
const en = createTranslator('en')
const es = createTranslator('es')

describe('starting loads (S1-S38)', () => {
  it.each([
    ['S1', 'back-squat', 'beginner', 8, 20],
    ['S2', 'dumbbell-bench-press', 'beginner', 10, 6],
    ['S3', 'leg-extensions-toes-dorsiflexed-neutral', 'beginner', 12, 15],
    ['S4', 'leg-extensions-toes-dorsiflexed-neutral', 'beginner', 15, 12.5],
    ['S5', 'cable-lateral-raise', 'beginner', 15, 2.5],
    ['S6', 'barbell-bench-press', 'intermediate', 8, 30],
    ['S7', 'barbell-deadlift', 'advanced', 5, 60],
    ['S8 B', 'dumbbell-romanian-deadlift', 'beginner', 10, 6],
    ['S8 I', 'dumbbell-romanian-deadlift', 'intermediate', 10, 10],
    ['S8 A', 'dumbbell-romanian-deadlift', 'advanced', 10, 14],
    ['S16 B', 'dumbbell-goblet-squat', 'beginner', 10, 8],
    ['S16 A', 'dumbbell-goblet-squat', 'advanced', 10, 16],
    ['S17', 'dumbbell-bulgarian-split-squat', 'intermediate', 10, 8],
    ['S18', 'standing-db-lateral-raises', 'beginner', 15, 2],
    ['S19 B', 'kettlebell-swing', 'beginner', 15, 4],
    ['S19 I', 'kettlebell-swing', 'intermediate', 12, 10],
    ['S20', 'kettlebell-turkish-get-up', 'beginner', 5, 4],
    ['S21 12', 'ez-bar-curl', 'beginner', 12, 10],
    ['S21 15', 'ez-bar-curl', 'beginner', 15, 10],
    ['S22', 'hex-bar-deadlift', 'advanced', 8, 60],
    ['S23', 'leg-press-quad-dominant', 'intermediate', 10, 40],
    ['S24', 'smith-machine-squat', 'beginner', 8, 20],
    ['S25', 'single-arm-lat-pulldown', 'beginner', 10, 10],
    ['S26', 'machine-leg-extension-single-leg', 'beginner', 12, 7.5],
    ['S27 B', 'cable-face-pull', 'beginner', 15, 2.5],
    ['S27 I', 'cable-face-pull', 'intermediate', 15, 2.5],
    ['S28', 'cable-crunch', 'beginner', 12, 10],
    ['S29', 'seated-leg-curl-toes-dorsiflexed-neutral', 'beginner', 12, 15],
    ['S30', 'standing-calf-raises-toes-neutral', 'beginner', 15, 12.5],
    ['S31', 'barbell-good-morning', 'intermediate', 10, 20],
    ['S32', 'barbell-overhead-press', 'advanced', 8, 30],
    ['S33', 'barbell-bent-over-row', 'beginner', 10, 20],
    ['S34', 'dumbbell-farmers-carry', 'beginner', 10, 8],
    ['S38', 'dumbbell-bench-press', undefined, 10, 6],
  ] as const)('%s: %s (%s, %i reps) → %s kg', (_case, id, experience, reps, expected) => {
    expect(first(id, experience, reps)).toMatchObject({ action: 'collect_data', reason: 'no_history', weight: expected, firstSessionSuggested: true })
  })

  it('S9/S36: push-up and band-assisted pull-up stay reps-only', () => {
    expect(first('push-up', 'advanced', 10).firstSessionSuggested).toBeUndefined()
    expect(first('band-assisted-pull-up', 'beginner', 8).firstSessionSuggested).toBeUndefined()
  })

  it('S10/S11: pyramids fill every set, up to the table value on the heaviest set', () => {
    expect(first('wide-grip-chest-press', 'intermediate', [15, 12, 10, 8], { technique: 'pyramid' }))
      .toMatchObject({ weight: 25, setWeights: [17.5, 20, 22.5, 25] })
    expect(first('plate-loaded-chest-press-wide-grip', 'beginner', [15, 12, 10, 8], { technique: 'pyramid' }))
      .toMatchObject({ weight: 10, setWeights: [5, 5, 7.5, 10] })
  })

  it('S12: reverse pyramids start heaviest', () => {
    expect(first('incline-barbell-bench-press', 'intermediate', [8, 10, 12, 15], { technique: 'reverse-pyramid' }).setWeights).toEqual([30, 27.5, 25, 22.5])
    expect(first('incline-barbell-bench-press', 'beginner', [8, 10, 12, 15], { technique: 'reverse-pyramid' }).setWeights).toEqual([20, 20, 20, 20])
  })

  it('S13: drop sets suggest the main load and about 75% for the drop', () => {
    expect(first('wide-grip-chest-press', 'beginner', 12, { technique: 'drop-set' })).toMatchObject({ weight: 15, dropWeight: 10 })
    expect(first('wide-grip-chest-press', 'intermediate', 12, { technique: 'drop-set' })).toMatchObject({ weight: 25, dropWeight: 17.5 })
  })

  it('S14: a deload-week first exposure gets the table value, half the sets, bottom reps, never null or 0', () => {
    expect(first('lat-pulldown', 'intermediate', 10, { deload: true })).toMatchObject({ weight: 30, sets: 2, reps: { min: 10, max: 10 }, reason: 'deload_week' })
  })

  it('S15: superset partners get their own numbers', () => {
    expect(first('dumbbell-shoulder-press', 'beginner', 10, { technique: 'superset' }).weight).toBe(4)
    expect(first('lat-pulldown', 'beginner', 10, { technique: 'superset' }).weight).toBe(20)
  })

  it('S35: assisted machines keep the empty field and the find-your-weight text', () => {
    for (const id of ['machine-assisted-pull-up', 'machine-dip-assisted']) {
      const result = first(id, 'beginner', 8)
      expect(result.weight).toBeNull()
      expect(trainerReasonParts(en, 'en', result, result.reps).lines.join(' ')).not.toContain('Suggested start')
    }
  })

  it('S37: goal, activity and session length never change the number', () => {
    // The engine never receives them; the plan's experience is the only answer it reads.
    expect(first('barbell-bench-press', 'intermediate', 8).weight).toBe(30)
  })
})

describe('after the first session (S39, S40, S43)', () => {
  it('S39/S40: the suggestion is never history; the next session follows what was logged', () => {
    const base = { today: '2026-11-27', target: rng(8), sets: 3, equipment: 'barbell', starting: { exercise: meta('back-squat'), experience: 'beginner' as const } }
    const logged = (weight: number) => [{ date: '2026-11-20', target: rng(8), sets: [8, 8, 8].map((reps) => ({ weight, reps })) }]
    // S39, with the PT's R8 amendment (no light-load rule on barbell, smith or hex bar).
    expect(recommend({ ...base, history: logged(20) })).toMatchObject({ weight: 22.5, reason: 'reached_top_of_range' })
    expect(recommend({ ...base, history: logged(60) })).toMatchObject({ weight: 62.5 })
    expect(recommend({ ...base, history: logged(60) }).firstSessionSuggested).toBeUndefined()
  })

  it('R8 amendment keeps the light-load rule on dumbbells', () => {
    const history = [{ date: '2026-11-20', target: rng(12), sets: [12, 12, 12].map((reps) => ({ weight: 8, reps })) }]
    expect(recommend({ today: '2026-11-27', target: rng(12), sets: 3, equipment: 'dumbbell', step: 2, history })).toMatchObject({ reason: 'light_load_add_reps' })
  })

  it('missing catalogue fields exclude the exercise, even for side or rear delts', () => {
    expect(first('cable-lateral-raise', 'beginner', 12, { starting: { exercise: { id: 'x', equipment: 'cable', primaryMuscles: ['Side Delts'] }, experience: 'beginner' } }).weight).toBeNull()
  })

  it('S43: a 0 kg-only history still counts as a first exposure', () => {
    expect(first('back-squat', 'beginner', 8, { history: [{ date: '2026-11-13', target: rng(8), sets: [{ weight: 0, reps: 8 }] }] }).weight).toBe(20)
  })
})

describe('first-time card text (L1-L4)', () => {
  it('L1: dumbbell straight, EN and ES, in order (short card, PT 2026-11-07)', () => {
    const result = first('dumbbell-bench-press', 'beginner', 10, { technique: 'straight' })
    expect(trainerReasonParts(en, 'en', result, rng(10)).lines).toEqual([
      'Suggested start: 6 kg per dumbbell.',
      "Warm up with 1-3 lighter sets first. Don't log them.",
      'Aim for 10 reps with about 3 to spare. Change the weight if needed.',
    ])
    expect(trainerReasonParts(es, 'es', result, rng(10)).lines).toEqual([
      'Peso sugerido para empezar: 6 kg por mancuerna.',
      'Calienta primero con 1 a 3 series más ligeras. No las registres.',
      'Haz 10 reps y que te queden unas 3 de sobra. Cambia el peso si hace falta.',
    ])
  })

  it('L1 bar: barbell says the total with the bar', () => {
    const result = first('back-squat', 'beginner', 8)
    expect(trainerReasonParts(en, 'en', result, rng(8)).lines[0]).toBe('Suggested start: 20 kg total, including the bar.')
    expect(trainerReasonParts(es, 'es', result, rng(8)).lines[0]).toBe('Peso sugerido para empezar: 20 kg en total, con la barra incluida.')
  })

  it('L2/L3: pyramid and drop-set cards', () => {
    const pyramid = first('wide-grip-chest-press', 'intermediate', [15, 12, 10, 8], { technique: 'pyramid' })
    expect(trainerReasonParts(en, 'en', pyramid, rng(8, 15)).lines[0]).toBe('Suggested weights are filled in for each set, up to 25 kg.')
    expect(trainerReasonParts(en, 'en', pyramid, rng(8, 15)).lines.slice(1)).toEqual([
      "Warm up with 1-3 lighter sets first. Don't log them.",
      expect.stringMatching(/^Aim for .+ reps with about 3 to spare\. Change the weight if needed\.$/),
    ])
    const drop = first('wide-grip-chest-press', 'beginner', 12, { technique: 'drop-set' })
    expect(trainerReasonParts(en, 'en', drop, rng(12)).lines[0]).toBe('Suggested start: 15 kg, then about 10 kg for the drop.')
    expect(trainerReasonParts(es, 'es', drop, rng(12)).lines[0]).toBe('Peso sugerido para empezar: 15 kg y luego unos 10 kg para la bajada.')
  })

  it('L5: no suggested-start card has more than 3 lines, in either language', () => {
    const cards = [
      first('dumbbell-bench-press', 'beginner', 10, { technique: 'straight' }),
      first('back-squat', 'beginner', 8),
      first('wide-grip-chest-press', 'intermediate', [15, 12, 10, 8], { technique: 'pyramid' }),
      first('wide-grip-chest-press', 'beginner', 12, { technique: 'drop-set' }),
      first('kettlebell-swing', 'intermediate', 12),
    ]
    for (const card of cards) {
      expect(trainerReasonParts(en, 'en', card, rng(8, 15)).lines.length).toBeLessThanOrEqual(3)
      expect(trainerReasonParts(es, 'es', card, rng(8, 15)).lines.length).toBeLessThanOrEqual(3)
    }
  })

  it('kettlebell card says per kettlebell', () => {
    const result = first('kettlebell-swing', 'intermediate', 12)
    expect(trainerReasonParts(en, 'en', result, rng(12)).lines[0]).toBe('Suggested start: 10 kg per kettlebell.')
  })
})

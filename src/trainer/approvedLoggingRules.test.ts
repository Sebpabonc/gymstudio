import { describe, expect, it } from 'vitest'
import { recommend, type SessionEvidence } from './engine'
import { prefillLoggedReps } from '../utils/effortlessLogging'

const today = '2026-10-19'
const pyramid: SessionEvidence = {
  date: '2026-10-12', technique: 'pyramid', target: { min: 8, max: 12 }, setReps: [12, 10, 8],
  sets: [{ weight: 40, reps: 12 }, { weight: 45, reps: 10 }, { weight: 50, reps: 8 }],
}

describe('PT approved logging rules: unchanged evidence and engine', () => {
  const pyramidResult = (history: SessionEvidence[]) => recommend({
    history, today, sets: 3, equipment: 'barbell', target: { min: 8, max: 12 },
    technique: 'pyramid', setReps: [12, 10, 8],
  })

  it('T101/T102/T103: old zero RIR holds once, a newer unanswered session replaces it', () => {
    const old = { ...pyramid, sets: pyramid.sets.map((set, index) => index === 2 ? { ...set, rir: 0 } : set) }
    expect(pyramidResult([pyramid])).toMatchObject({ weight: 52.5, reason: 'reached_top_of_range' })
    expect(pyramidResult([old])).toMatchObject({ weight: 50, reason: 'slightly_below_target' })
    expect(pyramidResult([{ ...pyramid, date: '2026-10-16' }, old])).toMatchObject({ weight: 52.5, reason: 'reached_top_of_range' })
    expect(old.sets[2].rir).toBe(0)
  })

  it('T104: a reverse pyramid increases its top without RIR', () => {
    const target = { min: 6, max: 10 }
    const result = recommend({
      today, sets: 3, equipment: 'barbell', target, technique: 'reverse-pyramid', setReps: [6, 8, 10],
      history: [{ date: '2026-10-12', target, technique: 'reverse-pyramid', setReps: [6, 8, 10],
        sets: [{ weight: 50, reps: 6 }, { weight: 45, reps: 8 }, { weight: 40, reps: 10 }] }],
    })
    expect(result.weight).toBe(52.5)
  })

  it.each([
    ['T112', '6-8', 37.5, 37.5, [7, 7, 7], 37.5],
    ['T113', '6-8', 40, 37.5, [8, 8, 8], 40],
    ['T115', '8', 40, 37.5, [8, 8, 8], 42.5],
    ['T116', '8', 37.5, 37.5, [8, 7, 6], 37.5],
    ['T117', '8', 37.5, 37.5, [6, 6, 6], 35],
  ])('%s: careless Done produces the approved next load', (_, prescription, load, previousLoad, reps, expected) => {
    const numbers = prescription.match(/\d+/g)!.map(Number)
    const target = { min: Math.min(...numbers), max: Math.max(...numbers) }
    const previous: SessionEvidence = {
      date: '2026-10-05', target, sets: reps.map((count) => ({ weight: previousLoad, reps: count })),
    }
    const logged: SessionEvidence = {
      date: '2026-10-12', target,
      sets: previous.sets.map((set) => ({ weight: load,
        reps: prefillLoggedReps({ target: prescription, weight: load, previous: set }) })),
    }
    const result = recommend({ history: [logged, previous], today, target, sets: 3, equipment: 'barbell' })
    expect(result.weight).toBe(expected)
    if (prescription === '8' && reps[0] === 6) expect(result.reason).toBe('below_target_twice')
  })

  it('T118: cable reps above the exact target stay at the light load', () => {
    const target = { min: 12, max: 12 }
    const result = recommend({
      today, sets: 3, equipment: 'cable', target,
      history: [{ date: '2026-10-12', target, sets: [13, 13, 13].map((reps) => ({ weight: 10, reps })) }],
    })
    expect(result).toMatchObject({ weight: 10, reason: 'light_load_add_reps' })
  })

  it.each([
    ['T141', { min: 8, max: 8 }, [8, 8]],
    ['T142', { min: 6, max: 8 }, [8, 8]],
    ['T143', { min: 8, max: 8 }, [6, 6]],
  ])('%s: partial main sets can never increase load', (_, target, reps) => {
    const result = recommend({
      today, target, sets: 3, equipment: 'barbell',
      history: [{ date: '2026-10-12', target, sets: reps.map((count) => ({ weight: 40, reps: count })) }],
    })
    expect(result.weight).toBe(40)
    expect(result.action).not.toBe('increase_weight')
    if (reps[0] === 8) expect(result.reason).toBe('incomplete_session')
  })

  it('T152/T155: drop reps and untagged extra rows do not become missed main reps', () => {
    const target = { min: 12, max: 12 }
    const result = recommend({
      today, target, sets: 3, equipment: 'machine', technique: 'drop-set',
      history: [{ date: '2026-10-12', target, technique: 'drop-set',
        sets: [...[12, 12, 12].map((reps) => ({ weight: 40, reps, drop: { weight: 30, reps: 10 } })),
          { weight: 30, reps: 4 }] }],
    })
    expect(result.weight).toBe(42.5)
    expect(result.reason).toBe('reached_top_of_range')
  })
})

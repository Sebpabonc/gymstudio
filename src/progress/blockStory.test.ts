import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import type { ProgressEntry, ProgressLiftSession } from './types'
import { blockStory, liftStory, storyTakeaways, weekdayRhythm, type LiftContext } from './blockStory'

// Cases follow the PT spec docs/fitness/approved/2026-11-15-progress-story-insights.md (ids in test names).

const session = (date: string, sets: Array<[number, number]>, extra: Partial<ProgressLiftSession> = {}): ProgressLiftSession => ({
  exerciseId: 'lift', date, blockId: 'b6', dayKey: 'chest-back-a', deload: false,
  sets: sets.map(([weight, reps], index) => ({ id: String(index), weight, reps })) as never,
  ...extra,
})

const dates = (from: string, count: number, everyDays: number) =>
  Array.from({ length: count }, (_, index) => new Date(Date.parse(`${from}T00:00:00Z`) + index * everyDays * 86_400_000).toISOString().slice(0, 10))

const context = (overrides: Partial<LiftContext> = {}): LiftContext => ({
  referenceDate: '2026-11-15',
  recentFrom: '2026-10-26',
  lastTrainingDay: '2026-11-08',
  trainingDates: dates('2026-10-05', 30, 1),
  planned: true,
  step: 2.5,
  ...overrides,
})

describe('liftStory: best set (§1)', () => {
  it('B1: 32 × 8 beats 26 × 12 on estimated strength', () => {
    const story = liftStory([session('2026-10-05', [[26, 12]]), session('2026-10-12', [[32, 8]])], context())
    expect(story?.best).toMatchObject({ weight: 32, reps: 8 })
    expect(story?.start).toMatchObject({ weight: 26, reps: 12 })
  })

  it('B2: under 0.5 kg of estimated strength is not a new best', () => {
    const story = liftStory([session('2026-10-05', [[32, 8]]), session('2026-10-12', [[34, 6]])], context())
    expect(story?.best).toMatchObject({ weight: 32, reps: 8 })
    expect(story?.newBests).toBe(0)
  })

  it('B3: 42.5 × 7 beats 40 × 8', () => {
    const story = liftStory([session('2026-10-05', [[40, 8]]), session('2026-10-12', [[42.5, 7]])], context())
    expect(story?.best).toMatchObject({ weight: 42.5, reps: 7 })
  })

  it('B4/B5: high-rep lifts need 80% of the reps at the heavier load', () => {
    const base = [session('2026-10-05', [[12, 15]]), session('2026-10-12', [[12, 15]])]
    expect(liftStory([...base, session('2026-10-19', [[14, 10]])], context({ step: 2 }))?.best).toMatchObject({ weight: 12, reps: 15 })
    expect(liftStory([...base, session('2026-10-19', [[14, 13]])], context({ step: 2 }))?.best).toMatchObject({ weight: 14, reps: 13 })
  })

  it('B7: a deload session is ignored', () => {
    const story = liftStory([session('2026-10-05', [[40, 8]]), session('2026-11-10', [[45, 8]], { deload: true })], context())
    expect(story?.best).toMatchObject({ weight: 40 })
  })
})

describe('liftStory: groups and lines (§2, §3)', () => {
  it('G1: not logged for 21+ days before the last training day, with other days after → Not logged lately', () => {
    const story = liftStory([session('2026-10-07', [[80, 8]]), session('2026-10-18', [[90, 8]])], context())
    expect(story).toMatchObject({ group: 'not-logged', line: { code: 'S1', date: '2026-10-18' } })
  })

  it('G3: only 2 training days after it → not "Not logged lately"', () => {
    const story = liftStory([session('2026-10-07', [[80, 8]]), session('2026-10-18', [[90, 8]])], context({ trainingDates: ['2026-10-25', '2026-11-08'] }))
    expect(story?.group).not.toBe('not-logged')
  })

  it('G4: new best in weeks 4–5 → New best recently, S2', () => {
    const story = liftStory([session('2026-10-05', [[92.5, 8]]), session('2026-11-02', [[105, 10]])], context())
    expect(story).toMatchObject({ group: 'recent', line: { code: 'S2', set: { weight: 105, reps: 10 } } })
  })

  it('G6/L6: best 19 Oct, 5 sessions after with ties → Holding, S5', () => {
    const story = liftStory([
      session('2026-10-05', [[26, 12]]), session('2026-10-19', [[32, 8]]), session('2026-10-22', [[32, 8]]),
      session('2026-10-26', [[32, 8]]), session('2026-10-29', [[30, 10]]), session('2026-11-02', [[32, 8]]), session('2026-11-05', [[30, 9]]),
    ], context())
    expect(story).toMatchObject({ group: 'holding', line: { code: 'S5', sessions: 5 } })
  })

  it('L3: every later session lighter, within 3% → S4 with "about the same"', () => {
    const story = liftStory([
      session('2026-10-05', [[35, 8]]), session('2026-10-19', [[40, 8]]), session('2026-10-22', [[37.5, 10]]),
      session('2026-10-26', [[37.5, 10]]), session('2026-10-29', [[37.5, 9]]), session('2026-11-02', [[37.5, 10]]),
    ], context())
    expect(story).toMatchObject({ group: 'holding', line: { code: 'S4', aboutSame: true, latest: { weight: 37.5, reps: 10 } } })
  })

  it('G7: best then only 3 sessions → Other lifts, S7', () => {
    const story = liftStory([
      session('2026-10-05', [[35, 8]]), session('2026-10-19', [[40, 8]]), session('2026-10-22', [[37.5, 8]]),
      session('2026-10-26', [[37.5, 8]]), session('2026-11-08', [[37.5, 8]]),
    ], context())
    expect(story).toMatchObject({ group: 'other', line: { code: 'S7' } })
  })

  it('L5: high-rep lift, heaviest load once, then the same lighter load → S3', () => {
    const story = liftStory([
      session('2026-10-06', [[12, 15]]), session('2026-10-20', [[14, 15]]),
      session('2026-11-03', [[12, 15]]), session('2026-11-06', [[12, 15]], { dayKey: 'arms-b' }), session('2026-11-08', [[12, 15]]),
    ], context({ step: 2 }))
    expect(story?.line).toMatchObject({ code: 'S3', heavy: 14, load: 12, sessions: 3 })
  })

  it('G8: one session → Too early to tell, S6', () => {
    expect(liftStory([session('2026-11-08', [[30, 10]])], context())).toMatchObject({ group: 'early', line: { code: 'S6' } })
  })
})

const plan = (exerciseId: string) => ({ code: 'A1', position: 1, exerciseId, sets: 3, reps: ['10'], restSeconds: 90, technique: 'straight' }) as never
const block: TrainingBlock = {
  id: 'b6', number: 6, name: 'Block 6', method: '', startDate: '2026-10-05', weeks: 6, origin: 'pt', summary: '', insights: [],
  days: [
    { key: 'chest-back-a', position: 1, name: 'Chest-Back A', exercises: [plan('row')] },
    { key: 'lower-body-a', position: 2, name: 'Lower Body A', exercises: [plan('squat')] },
    { key: 'chest-back-b', position: 3, name: 'Chest-Back B', exercises: [plan('row')] },
    { key: 'lower-body-b', position: 4, name: 'Lower Body B', exercises: [plan('squat')] },
  ],
}
const exercises: Exercise[] = [
  { id: 'row', name: 'Row', primaryMuscle: 'Upper Back', movementPattern: 'pull horizontal' },
  { id: 'squat', name: 'Squat', primaryMuscle: 'Quads', movementPattern: 'squat' },
]
const entry = (date: string, exerciseId: string, dayKey: string, weight: number, sets = 3): ProgressEntry => ({
  id: `${exerciseId}-${date}`, exerciseId, date, blockId: 'b6', dayKey,
  sets: Array.from({ length: sets }, (_, index) => ({ id: String(index), weight, reps: 10 })),
}) as ProgressEntry

describe('blockStory: a finished block', () => {
  // Chest-Back A on Mondays and B on Thursdays all 6 weeks; legs only weeks 1–2 (Wed, Sat).
  const mondays = dates('2026-10-05', 6, 7)
  const thursdays = dates('2026-10-08', 6, 7)
  const entries = [
    ...mondays.map((date, index) => entry(date, 'row', 'chest-back-a', 30 + index * 2.5, index === 5 ? 2 : 6)),
    ...thursdays.map((date, index) => entry(date, 'row', 'chest-back-b', 30 + index * 2.5, index === 5 ? 2 : 6)),
    entry('2026-10-07', 'squat', 'lower-body-a', 80, 6),
    entry('2026-10-10', 'squat', 'lower-body-b', 70, 6),
    entry('2026-10-14', 'squat', 'lower-body-a', 85, 6),
    entry('2026-10-13', 'squat', 'lower-body-b', 75, 6),
  ]
  const story = blockStory(entries, [block], block, exercises, '2026-11-16')

  it('counts logged against planned days per week', () => {
    expect(story).toMatchObject({ finished: true, week: null, referenceDate: '2026-11-15', sessionsLogged: 16, sessionsPlanned: 24 })
    expect(story.weeks.map((week) => week.days)).toEqual([
      [true, true, true, true], [true, true, true, true],
      [true, false, true, false], [true, false, true, false], [true, false, true, false], [true, false, true, false],
    ])
  })

  it('T2a: groups A and B days and reports the lowest group', () => {
    const takeaways = storyTakeaways(story, true)
    expect(takeaways[0]).toMatchObject({ kind: 'bests' })
    expect(takeaways[1]).toMatchObject({ kind: 'day-group', group: { name: 'Lower Body', logged: 4, planned: 12 }, noneAfter: '2026-10-14' })
  })

  it('T3a: weekly sets in weeks 1–2 vs 3–5, rounded to 5, deload left out', () => {
    const sets = storyTakeaways(story, true).find((item) => item.kind === 'sets')
    expect(sets).toMatchObject({ kind: 'sets', early: 25, late: 10, earlyWeeks: [1, 2], lateWeeks: [3, 4, 5] })
  })

  it('M3: muscles in plan order, weeks 1–2 vs weeks 3–5', () => {
    expect(story.muscles).toEqual([
      { group: 'Back', early: 12, late: 12 },
      { group: 'Quads', early: 12, late: 0 },
    ])
  })

  it('C1: weekday rhythm over complete weeks', () => {
    expect(weekdayRhythm(story)).toEqual({ kind: 'every', days: [1, 4], weeks: 6, count: 6 })
  })

  it('C4: first day type not logged 2+ weeks in a row', () => {
    expect(story.firstUnlogged).toMatchObject({ day: { key: 'lower-body-a' }, week: 3 })
  })

  it('groups lifts at the block end', () => {
    expect(story.lifts.find((lift) => lift.exerciseId === 'row')?.group).toBe('recent')
    expect(story.lifts.find((lift) => lift.exerciseId === 'squat')?.group).toBe('not-logged')
  })

  it('splits push/pull and upper/lower over non-deload weeks', () => {
    expect(story).toMatchObject({ pushSets: 0, pullSets: 60, upperSets: 60, lowerSets: 24 })
  })
})

describe('blockStory: a block in progress', () => {
  const entries = [
    entry('2026-10-05', 'row', 'chest-back-a', 30), entry('2026-10-07', 'squat', 'lower-body-a', 80),
    entry('2026-10-12', 'row', 'chest-back-a', 32.5),
  ]
  const story = blockStory(entries, [block], block, exercises, '2026-10-13')

  it('counts the open week only for days already logged', () => {
    expect(story).toMatchObject({ finished: false, week: 2, sessionsLogged: 3, sessionsPlanned: 5 })
    expect(story.dayTypes.map((day) => [day.key, day.logged, day.planned])).toEqual([
      ['chest-back-a', 2, 2], ['lower-body-a', 1, 1], ['chest-back-b', 0, 1], ['lower-body-b', 0, 1],
    ])
  })
})

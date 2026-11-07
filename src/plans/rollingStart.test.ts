import { describe, expect, it } from 'vitest'
import { localIsoDate } from '../lib/dates'
import type { TrainingBlock, WorkoutEntry } from '../types'
import { blockWeek, nextUnloggedDay, todayTrainingDay } from '../utils/trainingBlocks'
import { weekBounds } from '../utils/completedExercises'
import { pinFirstLog, plannedDayDates, restRecommendation, weekAnchor, withFloatingStart } from './rollingStart'

// PT spec 2026-11-01-first-run-and-same-day-start, section 6 "Start date and rest" (W1-W16).
const KEYS: Record<number, string[]> = {
  3: ['full-body-a', 'full-body-b', 'full-body-c'],
  4: ['upper-a', 'lower-a', 'upper-b', 'lower-b'],
  5: ['upper', 'lower', 'push', 'pull', 'legs'],
  6: ['chest-back-a', 'arms-a', 'lower-body-a', 'chest-back-b', 'arms-b', 'lower-body-b'],
}

function plan(days: 3 | 4 | 5 | 6, built = '2026-11-02'): TrainingBlock {
  return {
    id: 'personal', number: 1, name: 'Personal', method: '', startDate: built, weeks: 6, origin: 'pt', summary: '', insights: [],
    startsOnFirstLog: true,
    days: KEYS[days].map((key, index) => ({
      key, name: key, position: index + 1,
      exercises: [{ code: 'A1', position: 1, exerciseId: `${key}-x`, sets: 3, reps: ['8'], restSeconds: 90, technique: 'straight' }],
    })) as TrainingBlock['days'],
  }
}

let id = 0
const log = (dayKey: string, date: string): WorkoutEntry =>
  ({ id: `e${id++}`, exerciseId: `${dayKey}-x`, date, blockId: 'personal', dayKey, sets: [{ id: 's', weight: 20, reps: 8 }] })

/** The block as the app sees it: floating before the first log, pinned after. */
function seen(block: TrainingBlock, history: WorkoutEntry[], today: string) {
  return pinFirstLog(block, history) ?? withFloatingStart(block, today)
}

describe('same-day start (W1-W16)', () => {
  it('W1: first log Mon 2 Nov starts week 1 that day, week 6 on 7 Dec', () => {
    const block = seen(plan(3), [log('full-body-a', '2026-11-02')], '2026-11-02')
    expect(block.startDate).toBe('2026-11-02')
    expect(blockWeek(block, '2026-12-06')).toBe(5)
    expect(blockWeek(block, '2026-12-07')).toBe(6)
  })

  it('W2: first log Thu 5 Nov, 4 days: Upper A, 7-day weeks from Thursday, deload 10 to 16 Dec', () => {
    expect(nextUnloggedDay(seen(plan(4), [], '2026-11-05'), [], '2026-11-05')?.key).toBe('upper-a')
    const block = seen(plan(4), [log('upper-a', '2026-11-05')], '2026-11-05')
    expect(weekBounds('2026-11-08', weekAnchor(block))).toEqual({ start: '2026-11-05', end: '2026-11-11' })
    expect(blockWeek(block, '2026-12-09')).toBe(5)
    expect(blockWeek(block, '2026-12-10')).toBe(6)
    expect(blockWeek(block, '2026-12-16')).toBe(6)
    expect(blockWeek(block, '2026-12-17')).toBeNull()
  })

  it('W3: first log Sat, 3 days: rest on Sunday, Full Body B on Monday', () => {
    const history = [log('full-body-a', '2026-11-07')]
    const block = seen(plan(3), history, '2026-11-08')
    expect(restRecommendation(block, history, '2026-11-08')).toMatchObject({ nextDay: { key: 'full-body-b' }, date: '2026-11-09' })
    expect(restRecommendation(block, history, '2026-11-09')).toBeNull()
    expect(nextUnloggedDay(block, history, '2026-11-09')?.key).toBe('full-body-b')
  })

  it('W4: first log Sun, 3 days: Monday rest still in week 1, Tuesday B, week 2 from 15 Nov', () => {
    const history = [log('full-body-a', '2026-11-08')]
    const block = seen(plan(3), history, '2026-11-09')
    expect(restRecommendation(block, history, '2026-11-09')?.nextDay.key).toBe('full-body-b')
    expect(blockWeek(block, '2026-11-09')).toBe(1)
    expect(restRecommendation(block, history, '2026-11-10')).toBeNull()
    expect(blockWeek(block, '2026-11-14')).toBe(1)
    expect(blockWeek(block, '2026-11-15')).toBe(2)
  })

  it('W5: first log Sun, 4 days: Lower A Monday, rest Tuesday, Upper B Wednesday', () => {
    const history = [log('upper-a', '2026-11-08')]
    const block = seen(plan(4), history, '2026-11-09')
    expect(restRecommendation(block, history, '2026-11-09')).toBeNull()
    expect(nextUnloggedDay(block, history, '2026-11-09')?.key).toBe('lower-a')
    history.push(log('lower-a', '2026-11-09'))
    expect(restRecommendation(block, history, '2026-11-10')).toMatchObject({ nextDay: { key: 'upper-b' }, date: '2026-11-11' })
    expect(restRecommendation(block, history, '2026-11-11')).toBeNull()
  })

  it('W6: first log Sat, 6 days: arms-a on Sunday with no rest', () => {
    const history = [log('chest-back-a', '2026-11-07')]
    const block = seen(plan(6), history, '2026-11-08')
    expect(restRecommendation(block, history, '2026-11-08')).toBeNull()
    expect(nextUnloggedDay(block, history, '2026-11-08')?.key).toBe('arms-a')
  })

  it('W7: 5 days, Lower logged the day before: rest, then Push', () => {
    const history = [log('upper', '2026-11-02'), log('lower', '2026-11-03')]
    const block = seen(plan(5), history, '2026-11-04')
    expect(restRecommendation(block, history, '2026-11-04')).toMatchObject({ nextDay: { key: 'push' }, date: '2026-11-05' })
  })

  it('W8: training anyway inside the gap is allowed and moves the next date along', () => {
    const before = [log('full-body-a', '2026-11-07')]
    const advised = seen(plan(3), before, '2026-11-08')
    expect(restRecommendation(advised, before, '2026-11-08')?.nextDay.key).toBe('full-body-b')
    expect(nextUnloggedDay(advised, before, '2026-11-08')?.key).toBe('full-body-b')
    const history = [...before, log('full-body-b', '2026-11-08')]
    const block = seen(plan(3), history, '2026-11-09')
    expect(restRecommendation(block, history, '2026-11-08')).toBeNull()
    expect(restRecommendation(block, history, '2026-11-09')).toMatchObject({ nextDay: { key: 'full-body-c' }, date: '2026-11-10' })
  })

  it('W9 and W15: the start is the local date of the first log, not the build date', () => {
    const block = seen(plan(3, '2026-11-07'), [log('full-body-a', '2026-11-08')], '2026-11-08')
    expect(block.startDate).toBe('2026-11-08')
    expect(block.firstLoggedOn).toBe('2026-11-08')
  })

  it('W10: built Monday, first log Thursday starts week 1 on Thursday', () => {
    const built = plan(4, '2026-11-02')
    expect(seen(built, [], '2026-11-05').startDate).toBe('2026-11-05')
    expect(seen(built, [log('upper-a', '2026-11-05')], '2026-11-05').startDate).toBe('2026-11-05')
  })

  it('W11: 50 days with nothing logged is still Day 1, week 1, no deload', () => {
    const block = seen(plan(3, '2026-11-02'), [], '2026-12-22')
    expect(blockWeek(block, '2026-12-22')).toBe(1)
    expect(nextUnloggedDay(block, [], '2026-12-22')?.key).toBe('full-body-a')
  })

  it('W12: Day 1 logged today stays on Day 1 when the app reopens', () => {
    const history = [log('full-body-a', '2026-11-07')]
    const block = seen(plan(3), history, '2026-11-07')
    expect(todayTrainingDay(block, history, '2026-11-07')?.key).toBe('full-body-a')
    expect(restRecommendation(block, history, '2026-11-07')).toBeNull()
  })

  it('W13: a partly logged day is repeated after the same-day gap', () => {
    const history = [log('upper-a', '2026-11-05')]
    const block = { ...seen(plan(4), history, '2026-11-06') }
    block.days = block.days.map((day) => day.key === 'upper-a'
      ? { ...day, exercises: [...day.exercises, { ...day.exercises[0], code: 'B1', exerciseId: 'upper-a-y' }] }
      : day)
    expect(restRecommendation(block, history, '2026-11-06')).toMatchObject({ nextDay: { key: 'upper-a' }, date: '2026-11-07' })
    expect(restRecommendation(block, history, '2026-11-07')).toBeNull()
  })

  it('W14: unfinished days drop at the week rollover, with rest after a late session', () => {
    const history = [log('full-body-a', '2026-11-07'), log('full-body-b', '2026-11-13')]
    const block = seen(plan(3), history, '2026-11-14')
    expect(blockWeek(block, '2026-11-14')).toBe(2)
    expect(restRecommendation(block, history, '2026-11-14')).toMatchObject({ nextDay: { key: 'full-body-a' }, date: '2026-11-15' })
  })

  it('after a dropped day the next session is not the direct successor: 2 days, except 6-day plans', () => {
    // 4 days: Upper B in week 1, Lower B dropped at the rollover, next is Upper A.
    const four = [log('upper-a', '2026-11-02'), log('lower-a', '2026-11-03'), log('upper-b', '2026-11-08')]
    const block4 = seen(plan(4), four, '2026-11-09')
    expect(restRecommendation(block4, four, '2026-11-09')).toMatchObject({ nextDay: { key: 'upper-a' }, date: '2026-11-10' })
    // 6 days: any next day stays 1.
    const six = [log('chest-back-a', '2026-11-02'), log('lower-body-a', '2026-11-08')]
    expect(restRecommendation(seen(plan(6), six, '2026-11-09'), six, '2026-11-09')).toBeNull()
  })

  it('two plan days on one date: the largest gap wins', () => {
    // 5 days: Push partly logged and Pull on the same date; next is Push again, so 2 days.
    const block = { ...plan(5) }
    block.days = block.days.map((day) => day.key === 'push'
      ? { ...day, exercises: [...day.exercises, { ...day.exercises[0], code: 'B1', exerciseId: 'push-y' }] }
      : day)
    const history = [log('upper', '2026-11-02'), log('lower', '2026-11-03'), log('push', '2026-11-05'), log('pull', '2026-11-05')]
    const pinned = seen(block, history, '2026-11-06')
    expect(restRecommendation(pinned, history, '2026-11-06')).toMatchObject({ nextDay: { key: 'push' }, date: '2026-11-07' })
  })

  it('W15: a log at 23:30 local is dated that local day, whatever the UTC date', () => {
    // localIsoDate reads local fields, so the date never jumps to UTC's next day (e.g. 04:30Z in UTC-5).
    const lateSaturday = new Date(2026, 10, 7, 23, 30)
    expect(localIsoDate(lateSaturday)).toBe('2026-11-07')
    const block = seen(plan(3), [log('full-body-a', localIsoDate(lateSaturday))], '2026-11-07')
    expect(block.startDate).toBe('2026-11-07')
  })

  it('W16: only first-run plans move; every other block keeps its start and Monday weeks', () => {
    const regular = { ...plan(4, '2026-11-09'), startsOnFirstLog: undefined }
    expect(withFloatingStart(regular, '2026-11-05')).toBe(regular)
    expect(pinFirstLog(regular, [log('upper-a', '2026-11-05')])).toBeNull()
    expect(weekAnchor(regular)).toBeUndefined()
    expect(weekBounds('2026-11-08')).toEqual({ start: '2026-11-02', end: '2026-11-08' })
    expect(restRecommendation(regular, [log('upper-a', '2026-11-09'), log('lower-a', '2026-11-10')], '2026-11-11')).toBeNull()
  })

  it('labels unlogged days by the PT rhythm and moves them along after a late session', () => {
    const history = [log('full-body-a', '2026-11-07')]
    const block = seen(plan(3), history, '2026-11-07')
    expect(Object.fromEntries(plannedDayDates(block, history, '2026-11-07', '2026-11-07')))
      .toEqual({ 'full-body-a': '2026-11-07', 'full-body-b': '2026-11-09', 'full-body-c': '2026-11-11' })
    const late = [...history, log('full-body-b', '2026-11-11')]
    expect(plannedDayDates(block, late, '2026-11-07', '2026-11-11').get('full-body-c')).toBe('2026-11-13')
  })
})

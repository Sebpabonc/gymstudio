import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WorkoutPlan from './WorkoutPlan'
import WorkoutSetInputs from './WorkoutSetInputs'
import RestTimer from './RestTimer'
import WorkoutExerciseActions from './WorkoutExerciseActions'
import type { RestTimerState } from '../utils/restTimer'
import { createTranslator } from '../i18n/translate'
import { loadWorkoutHistory, saveWorkoutHistory } from '../utils/storage'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { recommend } from '../trainer/engine'
import { buildEvidence } from '../trainer/evidence'

const harness = vi.hoisted(() => ({
  active: false,
  cursor: 0,
  slots: [] as any[],
  effects: [] as (() => void | (() => void))[],
  cleanups: [] as (() => void)[],
  language: 'en' as 'en' | 'es',
  block: null as TrainingBlock | null,
  catalogue: [] as Exercise[],
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useState: (initial: any) => {
      if (!harness.active) return actual.useState(initial)
      const index = harness.cursor++
      if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? initial() : initial
      return [harness.slots[index], (next: any) => {
        harness.slots[index] = typeof next === 'function' ? next(harness.slots[index]) : next
      }]
    },
    useRef: (initial: any) => {
      if (!harness.active) return actual.useRef(initial)
      const index = harness.cursor++
      return harness.slots[index] ??= { current: initial }
    },
    useMemo: (factory: () => any, deps: any[]) => harness.active ? factory() : actual.useMemo(factory, deps),
    useCallback: (callback: any, deps: any[]) => harness.active ? callback : actual.useCallback(callback, deps),
    useEffect: (effect: () => void | (() => void), deps?: any[]) => {
      if (!harness.active) return actual.useEffect(effect, deps)
      const index = harness.cursor++
      const previous = harness.slots[index]
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous[i]))) harness.effects.push(effect)
      harness.slots[index] = deps
    },
  }
})
vi.mock('../i18n', async () => ({
  ...await vi.importActual<typeof import('../i18n')>('../i18n'),
  useT: () => ({
    language: harness.language,
    locale: harness.language === 'es' ? 'es-ES' : 'en-GB',
    t: createTranslator(harness.language),
  }),
}))
vi.mock('../utils/useBodyScrollLock', () => ({ useBodyScrollLock: () => undefined }))
vi.mock('../i18n/content', async () => ({
  ...await vi.importActual<typeof import('../i18n/content')>('../i18n/content'),
  useSpanishContentReady: () => true,
}))
vi.mock('../utils/storage', async () => ({
  ...await vi.importActual<typeof import('../utils/storage')>('../utils/storage'),
  loadExercises: async () => harness.catalogue,
  getCachedTrainingBlocks: () => [harness.block],
  fetchTrainingBlocks: async () => [harness.block],
}))
vi.mock('../native/restAlerts', () => ({ prepareRestAlerts: vi.fn(), fireRestAlert: vi.fn() }))

let tree: React.ReactElement
const startRest = vi.fn()
const changeRest = vi.fn()
const modeChanged = vi.fn()
const props = { onSignIn: vi.fn(), onStartRest: startRest, onRestTimerChange: changeRest, onWorkoutModeChange: modeChanged,
  restTimer: null as RestTimerState | null }

function render() {
  harness.cursor = 0
  harness.active = true
  try { tree = WorkoutPlan(props) } finally { harness.active = false }
  return tree
}

async function settle() {
  for (let i = 0; i < 25; i++) {
    render()
    for (const effect of harness.effects.splice(0)) {
      const cleanup = effect()
      if (cleanup) harness.cleanups.push(cleanup)
    }
    await Promise.resolve()
  }
}

function elements(predicate: (node: React.ReactElement) => boolean, root: React.ReactNode = tree) {
  const found: React.ReactElement[] = []
  const visit = (node: React.ReactNode) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!React.isValidElement(node)) return
    if (predicate(node)) found.push(node)
    visit(node.props.children)
  }
  visit(root)
  return found
}

function button(text: string) {
  const found = elements(node => node.type === 'button' && (node.props.children === text || node.props['aria-label'] === text))[0]
  expect(found, text).toBeDefined()
  return found
}

async function click(text: string) {
  vi.advanceTimersByTime(600)
  await button(text).props.onClick()
  await settle()
}

function inputs(drop = false) {
  const found = elements(node => node.type === WorkoutSetInputs)
  return found[drop ? 1 : 0]
}

async function enter(weight: number, reps = 8) {
  inputs().props.onValueChange('weight', String(weight))
  render()
  inputs().props.onValueChange('reps', String(reps))
  render()
}

function doneLabel() {
  return elements(node => node.type === 'button' && node.props.className === 'primary-button effortless-done')[0].props.children
}

async function start() {
  await click(createTranslator(harness.language)('workout.run.start'))
}

function historyEntry(id: string, date: string, sets = 3): WorkoutEntry {
  return {
    id: `${id}-${date}`, exerciseId: id, date, blockId: 'block', dayKey: 'chest-back-a',
    sets: Array.from({ length: sets }, (_, index) => ({ id: `${id}-${index}`, weight: 40, reps: 8 })),
  }
}

async function reload() {
  harness.cleanups.splice(0).forEach(cleanup => cleanup())
  harness.slots = []
  harness.effects = []
  render()
  await settle()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-19T12:00:00Z'))
  vi.clearAllMocks()
  harness.slots = []
  harness.effects = []
  harness.cleanups = []
  harness.language = 'en'
  props.restTimer = null
  harness.catalogue = ['press', 'row', 'curl', 'drop'].map(id => ({
    id, name: id, primaryMuscle: 'Chest', equipment: id === 'drop' ? 'machine' : 'barbell',
  }))
  harness.block = {
    id: 'block', number: 1, name: 'Test block', method: 'flat', startDate: '2026-10-05',
    weeks: 6, origin: 'pt', summary: '', insights: [],
    days: [{
      key: 'chest-back-a', name: 'Test day', position: 1,
      exercises: [
        { code: 'A1', position: 1, exerciseId: 'press', sets: 3, reps: ['8'], restSeconds: 120, technique: 'straight' },
        { code: 'C1', position: 2, exerciseId: 'row', sets: 3, reps: ['8'], restSeconds: 10, technique: 'superset' },
        { code: 'C2', position: 3, exerciseId: 'curl', sets: 3, reps: ['8'], restSeconds: 90, technique: 'superset' },
        { code: 'D1', position: 4, exerciseId: 'drop', sets: 3, reps: ['12+12'], restSeconds: 150, technique: 'drop-set' },
      ],
    }],
  }
  const data = new Map<string, string>([
    ['gym-studio.catalogue', JSON.stringify({ exercises: harness.catalogue, aliases: {} })],
  ])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  })
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('window', {
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: (callback: () => void) => callback(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(), scrollTo: vi.fn(),
  })
  vi.stubGlobal('document', { querySelector: () => null, addEventListener: vi.fn(), removeEventListener: vi.fn() })
})

afterEach(() => {
  harness.cleanups.forEach(cleanup => cleanup())
  harness.active = false
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('approved workout logging integration', () => {
  it('M4: Swap opens a cancellable sheet alongside the workout card', async () => {
    render()
    await settle()
    await start()
    const actions = elements(node => node.type === WorkoutExerciseActions)[0]
    actions.props.onSwap()
    await settle()
    expect(elements(node => node.props.className === 'exercise-swap-backdrop')).toHaveLength(1)
    expect(renderToStaticMarkup(tree)).toContain('Suggested alternatives')
    elements(node => node.props.className === 'exercise-swap-backdrop')[0].props.onClick()
    await settle()
    expect(elements(node => node.props.className === 'exercise-swap-backdrop')).toHaveLength(0)
  })

  it('m3: Continue retains a running rest instead of clearing the saved countdown', async () => {
    render()
    await settle()
    await start()
    await enter(40)
    await click(doneLabel())
    props.restTimer = { endAt: Date.now() + 120_000 }
    await settle()
    await click('‹ Today')
    changeRest.mockClear()
    await click('▶ Continue · 1 set logged')
    expect(changeRest).not.toHaveBeenCalledWith(null)
    expect(elements(node => node.type === RestTimer)[0].props.timer).toEqual(props.restTimer)
    await reload()
    await click('▶ Continue · 1 set logged')
    expect(elements(node => node.type === RestTimer)[0].props.nextLabel).toContain('press')
  })

  it('M3: rest dismissal advances after an exercise without confirming another set', async () => {
    render()
    await settle()
    await start()
    await enter(40)
    for (let i = 0; i < 3; i++) await click(doneLabel())
    props.restTimer = { endAt: Date.now() }
    await settle()
    const before = await loadWorkoutHistory()
    elements(node => node.type === RestTimer)[0].props.onChange(null)
    await settle()
    expect(renderToStaticMarkup(tree)).toContain('row</h2>')
    expect(await loadWorkoutHistory()).toEqual(before)
  })

  it('m1: decrementing a minimum logged weight cannot overwrite a rejected correction', async () => {
    render()
    await settle()
    await start()
    await enter(2.5, 8)
    await click(doneLabel())
    await click('Fix a logged set')
    const decrease = elements(node => node.type === 'button', WorkoutSetInputs(inputs().props))[0]
    decrease.props.onClick()
    await settle()
    expect(inputs().props.weightInput).toBe('2.5')
    expect((await loadWorkoutHistory())[0].sets[0].weight).toBe(2.5)
  })

  it.each([0, 120, 599])('B1: ignores a second superset Done %s ms after the first confirmation', async delay => {
    render()
    await settle()
    await start()
    await click('2 · row')
    await enter(40)
    await click(doneLabel())
    await enter(40)
    vi.advanceTimersByTime(delay)
    await button(doneLabel()).props.onClick()
    await settle()
    expect((await loadWorkoutHistory()).map(entry => entry.exerciseId)).toEqual(['row'])
    expect(startRest).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    await button(doneLabel()).props.onClick()
    await settle()
    expect((await loadWorkoutHistory()).map(entry => entry.exerciseId).sort()).toEqual(['curl', 'row'])
  })

  it('B1: blocks Done immediately after a manually selected card', async () => {
    render()
    await settle()
    await start()
    await click('2 · row')
    await enter(40)
    await button(doneLabel()).props.onClick()
    await settle()
    expect(await loadWorkoutHistory()).toEqual([])
    vi.advanceTimersByTime(600)
    await button(doneLabel()).props.onClick()
    await settle()
    expect((await loadWorkoutHistory()).map(entry => entry.exerciseId)).toEqual(['row'])
  })

  it('m1: invalid logged corrections never replace saved values or poison the next set', async () => {
    render()
    await settle()
    await start()
    await enter(40, 8)
    await click(doneLabel())
    await click('Fix a logged set')
    inputs().props.onWeightInputChange('')
    inputs().props.onValueChange('weight', '0')
    await settle()
    expect(inputs().props.weight).toBe(40)
    expect(inputs().props.weightInput).toBe('40')
    inputs().props.onValueChange('reps', '0')
    await settle()
    expect(inputs().props.reps).toBe(8)
    expect((await loadWorkoutHistory())[0].sets[0]).toMatchObject({ weight: 40, reps: 8 })
    await click('Close')
    expect(inputs().props.weight).toBe(40)
    expect(doneLabel()).not.toBe('Enter weight')
  })

  it('m2: fractional main or drop reps cannot be confirmed', async () => {
    render()
    await settle()
    await start()
    await enter(40, 7.5)
    await click(doneLabel())
    expect(await loadWorkoutHistory()).toEqual([])
    await click('4 · drop')
    await enter(40, 12)
    inputs(true).props.onValueChange('reps', '7.5')
    render()
    await click(doneLabel())
    expect(await loadWorkoutHistory()).toEqual([])
  })

  it('M2: starting and exiting preserves Today collapsed/expanded cards', async () => {
    render()
    await settle()
    const expand = elements(node => node.type === 'button' && node.props['aria-expanded'] === false &&
      String(node.props['aria-label']).includes('press'))[0]
    expect(expand).toBeDefined()
    expand.props.onClick({ stopPropagation: vi.fn() })
    await settle()
    const before = elements(node => node.type === 'button' && typeof node.props['aria-expanded'] === 'boolean')
      .map(node => [node.props['aria-label'], node.props['aria-expanded']])
    await start()
    await click('2 · row')
    await click('‹ Today')
    expect(elements(node => node.type === 'button' && typeof node.props['aria-expanded'] === 'boolean')
      .map(node => [node.props['aria-label'], node.props['aria-expanded']])).toEqual(before)
  })

  it('T111/T156: has no RIR prompt or bulk save with no sets ticked, including supersets', async () => {
    render()
    await settle()
    await start()
    let html = renderToStaticMarkup(tree)
    expect(html).not.toContain('Reps left in the tank')
    expect(html).not.toContain(createTranslator('en')('workout.action.logExercise'))
    expect(html).not.toContain('Everything you logged is saved.')
    expect(await loadWorkoutHistory()).toEqual([])
    for (let i = 0; i < 3; i++) {
      await enter(40)
      await click(doneLabel())
    }
    expect(renderToStaticMarkup(tree)).not.toContain('Reps left in the tank')
    await click('2 · row')
    for (let i = 0; i < 3; i++) {
      await enter(40)
      await click(doneLabel())
      if (i < 2) await click('2 · row')
    }
    expect(renderToStaticMarkup(tree)).not.toContain('Reps left in the tank')
    await click('3 · curl')
    html = renderToStaticMarkup(tree)
    expect(html).not.toContain('Reps left in the tank')
    expect(html).not.toContain(createTranslator('en')('workout.action.logExercise'))
  })

  it('T136/T149: C1 switches without rest, C2 rests 90 s, and a second unpaired C1 uses full pair rest', async () => {
    render()
    await settle()
    await start()
    await click('2 · row')
    await enter(40)
    await click(doneLabel())
    expect(startRest).not.toHaveBeenCalled()
    expect(elements(node => node.type === RestTimer)).toHaveLength(0)
    expect(renderToStaticMarkup(tree)).toContain('Now curl · 10 s')
    expect((await loadWorkoutHistory()).map(entry => entry.exerciseId)).toEqual(['row'])
    await click('2 · row')
    await enter(40)
    await click(doneLabel())
    expect(startRest).toHaveBeenLastCalledWith(90, expect.stringContaining('row'))
    expect(renderToStaticMarkup(tree)).not.toContain('Now curl')
    await click('3 · curl')
    await enter(40)
    await click(doneLabel())
    expect(startRest).toHaveBeenLastCalledWith(90, expect.stringContaining('row'))
    expect((await loadWorkoutHistory()).find(entry => entry.exerciseId === 'curl')?.sets).toHaveLength(1)
  })

  it('T145: Undo of C1’s only set removes its entry without creating empty evidence', async () => {
    render()
    await settle()
    await start()
    await click('2 · row')
    await enter(40)
    await click(doneLabel())
    await click('Undo')
    expect(await loadWorkoutHistory()).toEqual([])
  })

  it('T140: a complete C1 is normal evidence but never changes C2’s recommendation or creates a miss', async () => {
    saveWorkoutHistory([historyEntry('row', '2026-10-12'), historyEntry('curl', '2026-10-12')])
    render()
    await settle()
    await click('▶ Start workout')
    await click('3 · curl')
    const previous = { weight: inputs().props.weight, reps: inputs().props.reps }
    await click('2 · row')
    for (let i = 0; i < 3; i++) {
      await enter(40)
      await click(doneLabel())
      if (i < 2) await click('2 · row')
    }
    expect((await loadWorkoutHistory()).find(entry => entry.exerciseId === 'row' && entry.date === '2026-10-19')?.sets).toHaveLength(3)
    await click('3 · curl')
    expect({ weight: inputs().props.weight, reps: inputs().props.reps }).toEqual(previous)
    expect((await loadWorkoutHistory()).filter(entry => entry.exerciseId === 'curl')).toEqual([historyEntry('curl', '2026-10-12')])
  })

  it('T133: carries machine mains 40 → 45 and 30 kg drops, preserving a hand-edited drop', async () => {
    render()
    await settle()
    await start()
    await click('4 · drop')
    await enter(40, 12)
    inputs(true).props.onValueChange('weight', '32.5')
    render()
    await enter(45, 12)
    expect(inputs(true).props.weight).toBe(32.5)
    await click(doneLabel())
    expect(inputs().props.weight).toBe(45)
    expect(inputs(true).props.weight).toBe(30)
    await click(doneLabel())
    expect(inputs().props.weight).toBe(45)
    expect(inputs(true).props.weight).toBe(30)
    const logged = (await loadWorkoutHistory()).find(entry => entry.exerciseId === 'drop')!
    expect(logged.sets.map(set => set.weight)).toEqual([45, 45])
    expect(logged.sets.map(set => set.drop?.weight)).toEqual([32.5, 30])
  })

  it.each(['en', 'es'] as const)('preserves unfinished decimal drop text and saves the exact drop in %s', async language => {
    harness.language = language
    render()
    await settle()
    await start()
    await click('4 · drop')
    await enter(40, 12)
    const raw = language === 'es' ? '12,' : '12.'
    inputs(true).props.onWeightInputChange(raw)
    inputs(true).props.onValueChange('weight', '12')
    render()
    expect(inputs(true).props.weightInput).toBe(raw)
    const full = language === 'es' ? '12,5' : '12.5'
    inputs(true).props.onWeightInputChange(full)
    inputs(true).props.onValueChange('weight', '12.5')
    render()
    await click(doneLabel())
    expect((await loadWorkoutHistory())[0].sets[0].drop?.weight).toBe(12.5)
  })

  it('T127: changing set 2 does not change saved set 1 and carries to set 3', async () => {
    render()
    await settle()
    await start()
    await enter(85)
    await click(doneLabel())
    await enter(87.5)
    await click(doneLabel())
    expect(inputs().props.weight).toBe(87.5)
    expect((await loadWorkoutHistory())[0].sets.map(set => set.weight)).toEqual([85, 87.5])
  })

  it.each([
    ['T112', '6-8', 'barbell', 37.5, [7, 7, 7], { min: 8, max: 9 }, 37.5, [7, 7, 7], 37.5, undefined],
    ['T113', '6-8', 'barbell', 37.5, [8, 8, 8], { min: 6, max: 8 }, 40, [6, 6, 6], 40, undefined],
    ['T115', '8', 'barbell', 37.5, [8, 8, 8], undefined, 40, [8, 8, 8], 42.5, undefined],
    ['T116', '8', 'barbell', 37.5, [8, 7, 6], undefined, 37.5, [8, 7, 6], 37.5, undefined],
    ['T117', '8', 'barbell', 37.5, [6, 6, 6], undefined, 37.5, [6, 6, 6], 35, 'below_target_twice'],
    ['T118', '12', 'cable', 10, [13, 13, 13], { min: 14, max: 15 }, 10, [13, 13, 13], 10, 'light_load_add_reps'],
  ])('%s: untouched Done saves the approved reps and next load through real evidence', async (
    _, prescription, equipment, lastLoad, lastReps, storedRange, load, savedReps, nextLoad, nextReason,
  ) => {
    harness.catalogue[0].equipment = equipment
    harness.block!.days[0].exercises[0].reps = [prescription]
    saveWorkoutHistory([{
      id: 'last', exerciseId: 'press', date: '2026-10-12', blockId: 'block', dayKey: 'chest-back-a',
      ...(storedRange ? { target: { sets: 3, reps: storedRange } } : {}),
      sets: lastReps.map((count, index) => ({ id: `last-${index}`, weight: lastLoad, reps: count })),
    }])
    render()
    await settle()
    await start()
    if (_ === 'T115') expect(renderToStaticMarkup(tree)).toContain(createTranslator('en')('workout.run.newWeightCheck'))
    for (const _set of lastReps) await click(doneLabel())
    const history = await loadWorkoutHistory()
    const saved = history.find((item) => item.date.startsWith('2026-10-19'))!
    expect(saved.sets.map((set) => [set.weight, set.reps])).toEqual(savedReps.map((count) => [load, count]))
    const numbers = prescription.match(/\d+/g)!.map(Number)
    const next = recommend({
      history: buildEvidence(history, 'press', [harness.block!], '2026-10-26', 'chest-back-a'),
      today: '2026-10-26', dayKey: 'chest-back-a', blockId: 'block', sets: 3, equipment,
      target: { min: Math.min(...numbers), max: Math.max(...numbers) },
    })
    expect(next.weight).toBe(nextLoad)
    if (nextReason) expect(next.reason).toBe(nextReason)
  })

  it('caps future same-load reps immediately after a saved correction and after reload', async () => {
    render()
    await settle()
    await start()
    await enter(40)
    await click(doneLabel())
    await click('Fix a logged set')
    inputs().props.onValueChange('reps', '6')
    await settle()
    expect((await loadWorkoutHistory())[0].sets[0].reps).toBe(6)
    await click('Close')
    expect(inputs().props.reps).toBe(6)
    await reload()
    await click('▶ Continue · 1 set logged')
    expect(inputs().props.reps).toBe(6)
  })

  it('resumes a Completed summary with earlier weekdays and no final timer (T137)', async () => {
    saveWorkoutHistory([
      historyEntry('press', '2026-10-19'), historyEntry('row', '2026-10-19'),
      historyEntry('curl', '2026-10-19'), historyEntry('drop', '2026-10-20', 2),
    ])
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
    render()
    await settle()
    await click('▶ Continue · 3 of 4')
    await enter(40, 12)
    startRest.mockClear()
    await click(doneLabel())
    expect(startRest).not.toHaveBeenCalled()
    expect(changeRest).toHaveBeenLastCalledWith(null)
    const html = renderToStaticMarkup(tree)
    expect(html).toContain('workout-completed')
    expect(html).toContain('<strong>12/12</strong>')
    expect(html).toContain('<strong>4/4</strong>')
    expect(html).not.toContain('Finished early')
    await click('Undo')
    expect((await loadWorkoutHistory()).find(entry => entry.exerciseId === 'drop')?.sets).toHaveLength(2)
  })

  it('T137: rests after the last set of a non-final exercise using its prescription', async () => {
    render()
    await settle()
    await start()
    await enter(40)
    await click(doneLabel())
    await click(doneLabel())
    await click(doneLabel())
    expect(startRest).toHaveBeenLastCalledWith(120, expect.stringContaining('row'))
  })

  it.each([1, 6])('T154: no last-set myo-reps hint in week %s', async week => {
    harness.block!.days[0].exercises[0].sets = 1
    harness.block!.days[0].exercises[0].notes = 'Last set: myo-reps, 3 mini-sets of 5'
    vi.setSystemTime(new Date(week === 1 ? '2026-10-05T12:00:00Z' : '2026-11-09T12:00:00Z'))
    render()
    await settle()
    await start()
    expect(elements(node => node.type === 'p' && node.props.children === createTranslator('en')('workout.run.extraThenDone'))).toHaveLength(0)
  })

  it('T153 control: the last-set extra hint still appears during a normal week', async () => {
    harness.block!.days[0].exercises[0].sets = 1
    harness.block!.days[0].exercises[0].notes = 'Last set: myo-reps, 3 mini-sets of 5'
    render()
    await settle()
    await start()
    expect(elements(node => node.type === 'p' && node.props.children === createTranslator('en')('workout.run.extraThenDone'))).toHaveLength(1)
  })

  it.each(['en', 'es'] as const)('shows partial set counts and a one-time exit toast in %s', async language => {
    harness.language = language
    const t = createTranslator(language)
    render()
    await settle()
    await start()
    await enter(40)
    await click(doneLabel())
    await click(t('workout.run.exit'))
    expect(renderToStaticMarkup(tree)).toContain(t('workout.run.savedExit'))
    button(t('workout.run.resumeSets.one', { count: 1 }))
    vi.advanceTimersByTime(3000)
    render()
    expect(renderToStaticMarkup(tree)).not.toContain(t('workout.run.savedExit'))
    await click(t('workout.run.resumeSets.one', { count: 1 }))
    await click(doneLabel())
    await click(t('workout.run.exit'))
    button(t('workout.run.resumeSets.other', { count: 2 }))
    await click(t('workout.run.resumeSets.other', { count: 2 }))
    await click(doneLabel())
    await click(t('workout.run.exit'))
    button(t('workout.run.resumeCount', { done: 1, total: 4 }))
  })
})

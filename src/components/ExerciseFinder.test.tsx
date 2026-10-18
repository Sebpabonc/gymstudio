import React from 'react'
import { renderToStaticMarkup as renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExerciseFinder, { ExerciseDetails, recentExercises, todayPlanExercises } from './ExerciseFinder'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import * as i18n from '../i18n'
import * as storage from '../utils/storage'
import { createTranslator } from '../i18n/translate'

vi.mock('react-dom', () => ({ createPortal: (children: React.ReactNode) => children }))

const exercises: Exercise[] = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', nameEs: 'Press de banca con barra', primaryMuscle: 'Chest', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Front Delts'], bodyRegion: 'Chest', equipment: 'barbell', squeezeCue: 'Long catalogue cue' },
  { id: 'row', name: 'Row', primaryMuscle: 'Lats', bodyRegion: 'Back', equipment: 'cable' },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', primaryMuscle: 'Chest', equipment: 'dumbbell' },
]
const entry = (id: string, exerciseId: string, date: string): WorkoutEntry => ({
  id, exerciseId, date, sets: [{ id: `${id}-set`, weight: 60, reps: 8 }],
})
const block: TrainingBlock = {
  id: 'block', number: 1, name: 'Block', method: 'flat', startDate: '2026-10-05',
  weeks: 6, origin: 'pt', summary: '', insights: [],
  days: [{ key: 'a', position: 1, name: 'Day A', exercises: [{
    code: 'A1', position: 1, exerciseId: 'barbell-bench-press', sets: 3,
    reps: ['8'], restSeconds: 90, technique: 'straight',
  }] }],
}

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Find exercises', () => {
  it('starts on search, plan and recent, without selecting an exercise or opening a logger', () => {
    const html = renderToString(<ExerciseFinder exercises={exercises} history={[]} authStatus="signed-out"
      onHistoryChange={vi.fn()} onProgress={vi.fn()} />)
    expect(html).toContain('Search 3 exercises…')
    expect(html).toContain('In today&#x27;s plan')
    expect(html).toContain('Recent')
    expect(html).toContain('autoComplete="off"')
    expect(html).toContain('enterKeyHint="search"')
    expect(html).not.toContain('role="dialog"')
    expect(html).not.toContain('workout-mode-big-inputs')
    expect(html).not.toContain('Full Body')
    expect(html).not.toContain('Barbell Bench Press')
  })

  it('uses distinct most-recent catalogue exercises, ignores missing ids, and caps at five', () => {
    const catalogue = Array.from({ length: 7 }, (_, index) => ({ ...exercises[0], id: `${index}` }))
    const history = [
      entry('old', '0', '2026-10-01'), entry('missing', 'missing', '2026-10-18'),
      ...catalogue.map((exercise, index) => entry(`${index}`, exercise.id, `2026-10-${10 + index}`)),
      entry('repeat', '6', '2026-10-18'),
    ]
    expect(recentExercises(catalogue, history).map((exercise) => exercise.id)).toEqual(['6', '5', '4', '3', '2'])
    expect(history[0].id).toBe('old')
  })

  it('resolves the active plan day and keeps original swap targets for today only', () => {
    const swaps = [{ fromExerciseId: 'barbell-bench-press', toExerciseId: 'dumbbell-bench-press', scope: 'today' as const, date: '2026-10-18' }]
    expect(todayPlanExercises([block], [], exercises, swaps, '2026-10-18')).toEqual([
      { exercise: exercises[2], fromExerciseId: exercises[0].id },
    ])
    expect(todayPlanExercises([block], [], exercises, swaps, '2026-10-19')[0].exercise).toBe(exercises[0])
    expect(todayPlanExercises([], [], exercises, [], '2026-10-18')).toEqual([])
  })

  it('honors the pinned block rather than choosing a different current block', () => {
    const pinned = { ...block, id: 'pinned', days: [{ ...block.days[0], exercises: [{ ...block.days[0].exercises[0], exerciseId: 'row' }] }] }
    expect(todayPlanExercises([block, pinned], [], exercises, [], '2026-10-18', 'pinned')[0].exercise.id).toBe('row')
  })

  it('opens a plain-title sheet with primary/secondary actions, not an inline logger or external heading', () => {
    vi.stubGlobal('document', { body: {} })
    const html = renderToString(<ExerciseFinder exercises={exercises} history={[]} authStatus="signed-out"
      initialExerciseId={exercises[0].id} onHistoryChange={vi.fn()} onProgress={vi.fn()} />)
    expect(html).toContain('role="dialog" aria-modal="true"')
    expect(html).toContain('<h3 id="find-exercise-sheet-title">Barbell Bench Press</h3>')
    expect(html).toContain('Log it')
    expect(html).toContain('Add to today')
    expect(html).toContain('Swap into plan')
    expect(html).toContain('⋯ More')
    expect(html).not.toContain('workout-mode-big-inputs')
    expect(html).not.toContain('google.com')
    expect(html).not.toContain('Full technique tips')
    expect(html).not.toContain('<textarea')
  })

  it('does not offer a duplicate replacement when the selected exercise is already planned today', () => {
    vi.stubGlobal('document', { body: {} })
    vi.spyOn(storage, 'getCachedTrainingBlocks').mockReturnValue([{
      ...block, days: [{ ...block.days[0], exercises: [
        block.days[0].exercises[0],
        { ...block.days[0].exercises[0], exerciseId: 'row', position: 2 },
      ] }],
    }])
    const html = renderToString(<ExerciseFinder exercises={exercises} history={[]} authStatus="signed-out"
      initialExerciseId={exercises[0].id} onHistoryChange={vi.fn()} onProgress={vi.fn()} />)
    expect(html).toContain('class="secondary-button" disabled="">Swap into plan</button>')
  })
})

describe('exercise sheet details', () => {
  it('uses the approved short cue and one muscle line, and best set of the last session', () => {
    const previous = entry('last', exercises[0].id, '2026-10-12')
    previous.sets.push({ id: 'best', weight: 82.5, reps: 10 }, { id: 'lighter', weight: 80, reps: 12 })
    const html = renderToString(<ExerciseDetails exercise={exercises[0]} previous={previous} />)
    expect(html).toContain('Chest · also Triceps, Front Delts · Barbell')
    expect(html).toContain('Bend the bar, squeeze chest')
    expect(html).not.toContain('Long catalogue cue')
    expect(html).toContain('82.5 × 10 kg')
    expect(html).toContain('12 Oct')
    expect(html).not.toContain('Primary muscles')
    expect(html).not.toContain('Secondary muscles')
  })

  it('falls back to the catalogue cue and never invents a cue or log history', () => {
    const html = renderToString(<ExerciseDetails exercise={{ ...exercises[1], squeezeCue: 'Approved catalogue cue' }} />)
    expect(html).toContain('Approved catalogue cue')
    expect(html).toContain('Not logged yet')
    expect(renderToString(<ExerciseDetails exercise={exercises[1]} />)).not.toContain('workout-short-cue')
  })

  it('shows approved Spanish cues and translated muscle/equipment metadata', () => {
    vi.spyOn(i18n, 'useT').mockReturnValue({
      t: createTranslator('es'), language: 'es', locale: 'es-MX', setLanguage: vi.fn(),
    })
    const html = renderToString(<ExerciseDetails exercise={exercises[0]} />)
    expect(html).toContain('Pecho · también Tríceps, Deltoide frontal · Barra')
    expect(html).toContain('Dobla la barra en U, aprieta el pecho')
    expect(html).toContain('Última vez')
    expect(html).toContain('Aún sin registrar')
  })
})

import React from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkoutPlan, { ExerciseSwapSheet, filterCustomPlanExercises, formatEstMaxInsightLine, confirmedWorkoutSet, loggingTargetRange, preserveConfirmedWorkoutSet, savedWorkoutEntryScope, effectiveWorkoutTarget, matchedWorkoutSessionEntries, correctLoggedWorkoutReps } from './WorkoutPlan'
import { createTranslator } from '../i18n/translate'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { anyDayEstMaxComparison } from '../progress/estMax'
import { findWeekCompletion, upsertScopedEntry } from '../utils/completedExercises'
import { captureUndoSnapshots, undoLoggedEntries } from '../utils/loggingFeedback'
import { workoutCompletionCounts } from '../progress/workoutInsights'

describe('resumed weekly workout summaries', () => {
  it('includes Monday entries when finishing Tuesday, using the exact completion matches', () => {
    const entry: WorkoutEntry = {
      id: 'monday-press', date: '2026-10-26', blockId: 'block', dayKey: 'upper-a', exerciseId: 'press',
      sets: Array.from({ length: 3 }, (_, index) => ({ id: `press-${index}`, weight: 40, reps: 8 })),
    }
    const partner = { ...entry, id: 'tuesday-row', exerciseId: 'row', date: '2026-10-27' }
    const oldWeek = { ...entry, id: 'old', date: '2026-10-19' }
    const otherDay = { ...entry, id: 'other-day', dayKey: 'upper-b' }
    const history = [oldWeek, entry, otherDay, partner]
    const scope = { date: '2026-10-27', blockId: 'block', dayKey: 'upper-a' }
    const matched = ['press', 'row', 'missing'].map((id) => findWeekCompletion(history.filter((item) => item.exerciseId === id), scope))
    const entries = matchedWorkoutSessionEntries(matched)
    expect(entries).toEqual([entry, partner])
    expect(workoutCompletionCounts(entries, 2, 6, 2)).toMatchObject({ complete: true, sets: 6, exercises: 2 })
    expect(matchedWorkoutSessionEntries([entry, entry, undefined])).toEqual([entry])
  })
})

describe('logged reps correction carries downward immediately', () => {
  it('caps future untouched same-load sets from eight to six without needing reload', () => {
    expect(correctLoggedWorkoutReps([8, 8, 8], [40, 40, 40], [true, false, false], [true, false, false], 0, 6, true)).toEqual([6, 6, 6])
  })
  it('preserves already logged, explicitly edited, and different-load sets', () => {
    expect(correctLoggedWorkoutReps([8, 8, 8, 8], [40, 40, 40, 45], [true, true, false, false], [true, false, true, false], 0, 6, true)).toEqual([6, 8, 8, 8])
  })
  it('never increases future reps when correcting upward', () => {
    expect(correctLoggedWorkoutReps([6, 6, 6], [40, 40, 40], [true, false, false], [true, false, false], 0, 8, true)).toEqual([8, 6, 6])
  })
  it('does not poison future sets while the correction input is temporarily zero', () => {
    expect(correctLoggedWorkoutReps([8, 8, 8], [40, 40, 40], [true, false, false], [true, false, false], 0, 0, true)).toEqual([0, 8, 8])
  })
  it('does not carry ineligible prescriptions or edits to not-yet-logged sets', () => {
    expect(correctLoggedWorkoutReps([8, 8, 8], [40, 40, 40], [true, false, false], [true, false, false], 0, 6, false)).toEqual([6, 8, 8])
    expect(correctLoggedWorkoutReps([8, 8, 8], [40, 40, 40], [false, false, false], [true, false, false], 0, 6, true)).toEqual([6, 8, 8])
  })
})

describe('same-prescription logging comparisons', () => {
  it('uses the accepted recommended range for stored evidence and comparisons, not the raw plan target', () => {
    expect(effectiveWorkoutTarget('accepted', { min: 8, max: 8 }, { min: 6, max: 8 })).toEqual({ min: 6, max: 8 })
    expect(effectiveWorkoutTarget('kept_original', { min: 8, max: 8 }, { min: 6, max: 8 })).toEqual({ min: 8, max: 8 })
    expect(effectiveWorkoutTarget(undefined, { min: 8, max: 8 }, { min: 6, max: 8 })).toEqual({ min: 8, max: 8 })
  })
  it('keeps the whole main range and excludes the drop part', () => {
    expect(loggingTargetRange(['8-10'])).toEqual({ min: 8, max: 10 })
    expect(loggingTargetRange(['8-10+12'])).toEqual({ min: 8, max: 10 })
    expect(loggingTargetRange(['10', '8', '6'])).toEqual({ min: 6, max: 10 })
    expect(loggingTargetRange(['12+12', '12+12'])).toEqual({ min: 12, max: 12 })
  })
})

describe('immediate logged-set persistence', () => {
  it('preserves old set identity, RIR, main tag and timestamp, but replaces values and removes a zero-rep drop', () => {
    const previous = { id: 'old-set', weight: 40, reps: 10, rir: 2, tag: 'main' as const, at: 42, drop: { weight: 30, reps: 8 } }
    const confirmed = confirmedWorkoutSet(42.5, 7, 'barbell', { weight: 30, reps: 0 })!
    expect(preserveConfirmedWorkoutSet(previous, confirmed)).toEqual({
      id: 'old-set', weight: 42.5, reps: 7, rir: 2, tag: 'main', at: 42,
    })
    expect(previous.drop).toEqual({ weight: 30, reps: 8 })
    expect(preserveConfirmedWorkoutSet(undefined, confirmed)).not.toHaveProperty('rir')
  })

  it('updates a previous weekday entry in place and captures Undo in that original date scope', () => {
    const previous: WorkoutEntry = {
      id: 'tuesday-entry', date: '2026-10-27', blockId: 'block', dayKey: 'day-a', exerciseId: 'press', notes: 'Keep my notes',
      sets: [{ id: 'old-set', weight: 40, reps: 8, rir: 1 }],
    }
    const independent: WorkoutEntry = { ...previous, id: 'partner-entry', exerciseId: 'row' }
    const edited = { ...previous, sets: [preserveConfirmedWorkoutSet(previous.sets[0], confirmedWorkoutSet(42.5, 6, 'barbell')!)] }
    const scope = savedWorkoutEntryScope(edited)
    expect(scope.date).toBe('2026-10-27')
    const result = upsertScopedEntry([previous, independent], edited, scope)
    expect(result.history).toHaveLength(2)
    expect(result.entry).toMatchObject({ id: previous.id, date: previous.date, notes: previous.notes })
    expect(result.entry.sets[0]).toMatchObject({ id: 'old-set', weight: 42.5, reps: 6, rir: 1 })
    const snapshots = captureUndoSnapshots([previous, independent], [result.entry], scope)
    const restored = undoLoggedEntries(result.history, snapshots)
    expect(restored.find((entry) => entry.id === previous.id)).toEqual(previous)
    expect(restored.find((entry) => entry.id === independent.id)).toEqual(independent)
  })
})

function findButton(element: React.ReactNode, label: string): React.ReactElement | undefined {
  let match: React.ReactElement | undefined
  const visit = (node: React.ReactNode) => {
    if (match) return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!React.isValidElement(node)) return
    if (node.type === 'button' && node.props.children === label) {
      match = node
      return
    }
    visit(node.props.children)
  }
  visit(element)
  return match
}

describe('custom-plan catalogue search', () => {
  const exercises: Exercise[] = [
    { id: 'press', name: 'Dumbbell Bench Press', nameEs: 'Press de banca', primaryMuscle: 'Chest', equipment: 'dumbbell' },
    { id: 'row', name: 'Cable Row', nameEs: 'Remo en polea', primaryMuscle: 'Lats', secondaryMuscles: ['Biceps'], equipment: 'cable' },
    { id: 'rdl', name: 'Barbell Romanian Deadlift', primaryMuscle: 'Hamstrings', equipment: 'barbell' },
    { id: 'pulldown', name: 'Cable Lat Pulldown', primaryMuscle: 'Lats', equipment: 'cable' },
  ]
  const displayName = (exercise: Exercise) => exercise.name
  const search = (query: string, muscle: Parameters<typeof filterCustomPlanExercises>[2] = 'All') =>
    filterCustomPlanExercises(exercises, query, muscle, new Map(), displayName, 'en').map((exercise) => exercise.id)

  it('uses shared abbreviations, reordered words, punctuation, equipment and bilingual muscle matching', () => {
    expect(search('press db')).toEqual(['press'])
    expect(search('RDL')).toEqual(['rdl'])
    expect(search('lat-pull down')).toEqual(['pulldown'])
    expect(search('bíceps cable')).toEqual(['row'])
    expect(search('remo polea')).toEqual(['row'])
    expect(search('hamstrings')).toEqual(['rdl'])
    expect(search('not found')).toEqual([])
  })

  it('retains builder muscle matching for secondary muscles and groups rather than body regions', () => {
    expect(search('cable', 'Arms')).toEqual(['row'])
    expect(search('RDL', 'Legs')).toEqual(['rdl'])
    expect(search('dorsales', 'Back')).toEqual(['pulldown', 'row'])
    expect(search('press', 'Back')).toEqual([])
  })

  it('keeps recent-first ordering ahead of alphabetical display names', () => {
    const recentIds = new Map([['rdl', 0], ['press', 1]])
    const results = filterCustomPlanExercises(exercises, ' ', 'All', recentIds, displayName, 'en')
    expect(results.map((exercise) => exercise.id)).toEqual(['rdl', 'press', 'pulldown', 'row'])
    expect(exercises.map((exercise) => exercise.id)).toEqual(['press', 'row', 'rdl', 'pulldown'])
  })

  it('uses localized display names for the alphabetical fallback', () => {
    const results = filterCustomPlanExercises(
      exercises, 'cable', 'All', new Map(),
      (exercise) => exercise.nameEs ?? exercise.name, 'es',
    )
    expect(results.map((exercise) => exercise.id)).toEqual(['pulldown', 'row'])
  })
})

describe('WorkoutPlan', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

    describe('confirmed set values', () => {
      it('T123/T124: accepts unloaded bodyweight but rejects zero weighted load and zero reps', () => {
        expect(confirmedWorkoutSet(0, 12, 'bodyweight')).toMatchObject({ weight: 0, reps: 12 })
        expect(confirmedWorkoutSet(0, 12, 'barbell')).toBeUndefined()
        expect(confirmedWorkoutSet(40, 0, 'barbell')).toBeUndefined()
        expect(confirmedWorkoutSet(0, 0, 'bodyweight')).toBeUndefined()
        expect(confirmedWorkoutSet(Number.NaN, 8, 'barbell')).toBeUndefined()
      })

      it('T150/T151: records exactly both displayed parts with one confirmation, or omits a zero-rep drop', () => {
        const set = confirmedWorkoutSet(40, 12, 'machine', { weight: 30, reps: 12 })
        expect(set).toMatchObject({ weight: 40, reps: 12, drop: { weight: 30, reps: 12 } })
        expect(set).not.toHaveProperty('rir')
        const withoutDrop = confirmedWorkoutSet(40, 12, 'machine', { weight: 30, reps: 0 })
        expect(withoutDrop).toMatchObject({ weight: 40, reps: 12 })
        expect(withoutDrop).not.toHaveProperty('drop')
        expect(confirmedWorkoutSet(40, 12, 'machine', { weight: 0, reps: 12 })).toBeUndefined()
        expect(confirmedWorkoutSet(40, 12, 'machine', { weight: 30, reps: Number.POSITIVE_INFINITY })).toBeUndefined()
        expect(confirmedWorkoutSet(40, 12, 'machine', { weight: 30, reps: Number.NaN })).toBeUndefined()
      })

      it('T116/T117/T118: never replaces an actual miss or above-target rep count', () => {
        expect(confirmedWorkoutSet(37.5, 6, 'barbell')).toMatchObject({ weight: 37.5, reps: 6 })
        expect(confirmedWorkoutSet(10, 13, 'cable')).toMatchObject({ weight: 10, reps: 13 })
      })
  })

  const strengthBlock: TrainingBlock = {
    id: 'strength-block',
    number: 1,
    name: 'Strength',
    method: 'flat',
    startDate: '2026-10-05',
    weeks: 6,
    origin: 'pt',
    summary: '',
    insights: [],
    days: [
      { key: 'chest-back-a', position: 1, name: 'Chest & Back A', exercises: [] },
      { key: 'chest-back-b', position: 2, name: 'Chest & Back B', exercises: [] },
    ],
  }

  function strengthEntry(date: string, dayKey: string, weight: number, reps: number, rir?: number): WorkoutEntry {
    return {
      id: `${date}-${dayKey}`,
      exerciseId: 'press',
      date,
      blockId: strengthBlock.id,
      dayKey,
      sets: [{ id: `${date}-set`, weight, reps, rir }],
    }
  }

  function strengthLine(current: WorkoutEntry, previous: WorkoutEntry[]) {
    const comparison = anyDayEstMaxComparison(current, previous, [strengthBlock])
    return formatEstMaxInsightLine(comparison, [strengthBlock], 'en', createTranslator('en'))
  }

  describe('plain strength comparison wording', () => {
    it('shows the actual best sets and adjusts for reps only when they differ', () => {
      expect(strengthLine(
        strengthEntry('2026-10-13', 'chest-back-a', 25, 10),
        [strengthEntry('2026-10-09', 'chest-back-b', 22.5, 12)]
      )).toContain('Stronger than last time (Chest & Back B, Fri 9 Oct): 25 kg × 10 vs 22.5 kg × 12 (+6% after adjusting for reps)')

      expect(strengthLine(
        strengthEntry('2026-10-12', 'chest-back-a', 72.5, 8),
        [strengthEntry('2026-10-05', 'chest-back-a', 70, 8)]
      )).toContain('Stronger than last time (Chest & Back A, Mon 5 Oct): 72.5 kg × 8 vs 70 kg × 8')
    })

    it('labels equivalent rep trades and same-day drops using real sets', () => {
      expect(strengthLine(
        strengthEntry('2026-10-12', 'chest-back-a', 30, 10),
        [strengthEntry('2026-10-08', 'chest-back-b', 28, 12)]
      )).toContain('Same strength as last time (Chest & Back B, Thu 8 Oct): 30 kg × 10 vs 28 kg × 12 (more weight, fewer reps)')

      expect(strengthLine(
        strengthEntry('2026-10-19', 'chest-back-a', 30, 10),
        [strengthEntry('2026-10-12', 'chest-back-a', 35, 6)]
      )).toContain('Below last time (Chest & Back A, Mon 12 Oct): 30 kg × 10 vs 35 kg × 6 (−5%)')
    })

    it('does not describe an equal-load rep trade as more or less weight', () => {
      const line = strengthLine(
        strengthEntry('2026-10-12', 'chest-back-a', 30, 10),
        [strengthEntry('2026-10-08', 'chest-back-b', 30, 11)]
      )
      expect(line).toContain('Same strength as last time')
      expect(line).not.toContain('more weight')
      expect(line).not.toContain('less weight')
    })

    it('uses today’s day type but never displays historical RIR answers', () => {
      expect(strengthLine(
        strengthEntry('2026-10-12', 'chest-back-a', 15, 15),
        [strengthEntry('2026-10-08', 'chest-back-b', 15, 20)]
      )).toContain('compared with your last A day.')

      expect(strengthLine(
        strengthEntry('2026-10-16', 'chest-back-b', 25, 10, 3),
        [strengthEntry('2026-10-13', 'chest-back-a', 25, 10, 1)]
      )).not.toContain('reps left in the tank')
    })

    it('keeps a lower cross-day result neutral with lighter-on-purpose context', () => {
      expect(strengthLine(
        strengthEntry('2026-10-15', 'chest-back-b', 28, 12),
        [strengthEntry('2026-10-12', 'chest-back-a', 35, 6)]
      )).toContain('Lighter on purpose: B days use less weight and more reps.')
    })

    it('never calls a lower A day "lighter on purpose" (A is the heavy day)', () => {
      const line = strengthLine(
        strengthEntry('2026-10-12', 'chest-back-a', 82.5, 8),
        [strengthEntry('2026-10-08', 'chest-back-b', 82.5, 10)]
      )
      expect(line).not.toContain('Lighter on purpose')
      expect(line).toContain('Below last time')
    })

    it('V-T16: keeps the workout strength insight free of a total-weight-moved comparison', () => {
      const line = strengthLine(
        strengthEntry('2026-10-16', 'chest-back-b', 25, 10),
        [strengthEntry('2026-10-13', 'chest-back-a', 25, 10)]
      )
      expect(line).toContain('Same strength as last time')
      expect(line).not.toContain('Total weight moved')
    })
  })

  it('shows the custom-plan heading without an empty day card', () => {
    const html = renderToString(
      <WorkoutPlan mode="custom" lockMode onSignIn={() => undefined} onStartRest={() => undefined} />
    )

    expect(html).toContain('<h3>Make your plan</h3>')
    expect(html).toContain('No exercises added yet.')
    expect(html).toContain('role="tablist" aria-label="Plan days"')
    expect(html).toContain('Day A')
    expect(html).toContain('Add exercise')
    expect(html).not.toContain('day-plan-card')
  })

  it('renders each custom-plan day and the selected day prescription', () => {
    const plan = {
      version: 2,
      days: [
        {
          id: 'day-a',
          name: 'Day A',
          exercises: [{
            id: 'row-a',
            exerciseId: 'catalogue-bench',
            name: 'Bench press',
            muscle: 'Chest',
            sets: '4',
            reps: '8-10',
            restSeconds: 90,
          }],
        },
        { id: 'day-b', name: 'Day B', exercises: [] },
      ],
    }
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => key === 'gym-studio.custom-plan' ? JSON.stringify(plan) : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const html = renderToString(
      <WorkoutPlan mode="custom" lockMode onSignIn={() => undefined} onStartRest={() => undefined} />
    )

    expect(html).toContain('Day A')
    expect(html).toContain('Day B')
    expect(html).toContain('Bench press')
    expect(html).toMatch(/class="custom-plan-exercise-edit"[\s\S]*?Bench press[\s\S]*?4[\s\S]*?×[\s\S]*?8-10/)
  })

  it('does not show trainer load suggestions for user exercises in a custom day', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => key === 'gym-studio.custom-plan'
        ? JSON.stringify({
            version: 2,
            days: [{
              id: 'day-a',
              name: 'Day A',
              exercises: [{
                id: 'plan-exercise',
                exerciseId: 'custom-user-exercise',
                name: 'My exercise',
                muscle: 'Chest',
                sets: '3',
                reps: '8-12',
                restSeconds: 120,
              }],
            }],
          })
        : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const html = renderToString(
      <WorkoutPlan mode="custom" lockMode onSignIn={() => undefined} onStartRest={() => undefined} />
    )
    expect(html).toContain('My exercise')
    expect(html).not.toContain('trainer-recommendation-card')
  })

  it('keeps workout rest controls without restoring removed custom-plan tips', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === 'gym-studio.custom-plan'
          ? JSON.stringify([
              {
                name: 'Test exercise',
                sets: '3',
                reps: '8',
                rest: "1'30\"",
                focus: 'General',
                goal: 'Keep a stable posture.',
                tip: 'Brace before each rep.',
              },
            ])
          : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const html = renderToString(
      <WorkoutPlan mode="custom" lockMode onSignIn={() => undefined} onStartRest={() => undefined} />
    )

    expect(html.match(/class="rest-start-button"/g)).toHaveLength(1)
    expect(html.indexOf('Same as set 1')).toBeLessThan(html.indexOf('Start rest'))
    expect(html.indexOf('Start rest')).toBeLessThan(html.indexOf('class="planned-set-grid"'))
    expect(html).not.toContain('Brace before each rep.')
    expect(html).not.toContain('Posture tips')
  })

  it('lists three alternatives and routes each choice to its matching scope', () => {
    const alternatives: Exercise[] = [
      { id: 'alt-one', name: 'Alternative one', nameEs: 'Alternativa uno', primaryMuscle: 'Chest', equipment: 'dumbbell' },
      { id: 'alt-two', name: 'Alternative two', nameEs: 'Alternativa dos', primaryMuscle: 'Chest', equipment: 'barbell' },
      { id: 'alt-three', name: 'Alternative three', nameEs: 'Alternativa tres', primaryMuscle: 'Chest', equipment: 'cable' },
    ]
    const saveToday = vi.fn()
    const saveAlways = vi.fn()
    const onSelect = vi.fn((id: string, scope: 'today' | 'always') => {
      if (scope === 'today') saveToday(id)
      else saveAlways(id)
    })
    const sheet = ExerciseSwapSheet({
      alternatives,
      language: 'en',
      t: createTranslator('en'),
      onCancel: vi.fn(),
      onSelect,
    })
    const html = renderToString(sheet)
    const justToday = findButton(sheet, 'Just today')
    const always = findButton(sheet, 'Always')

    expect(html.match(/class="exercise-swap-suggestion"/g)).toHaveLength(3)
    expect(html).toContain('Alternative one')
    expect(html).toContain('Muscle')
    expect(html).toContain('Chest')
    expect(html).toContain('Equipment')
    expect(html).toContain('Dumbbell')
    expect(justToday).toBeDefined()
    expect(always).toBeDefined()
    justToday?.props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    always?.props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(saveToday).toHaveBeenCalledWith('alt-one')
    expect(saveAlways).toHaveBeenCalledWith('alt-one')
    expect(onSelect).toHaveBeenNthCalledWith(1, 'alt-one', 'today')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'alt-one', 'always')
  })
})

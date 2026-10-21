import React from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkoutPlan, { ExerciseSwapSheet, filterCustomPlanExercises, formatEstMaxInsightLine } from './WorkoutPlan'
import { createTranslator } from '../i18n/translate'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { anyDayEstMaxComparison } from '../progress/estMax'

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

    it('uses today’s day type in the different-rep-range line and preserves effort context', () => {
      expect(strengthLine(
        strengthEntry('2026-10-12', 'chest-back-a', 15, 15),
        [strengthEntry('2026-10-08', 'chest-back-b', 15, 20)]
      )).toContain('compared with your last A day.')

      expect(strengthLine(
        strengthEntry('2026-10-16', 'chest-back-b', 25, 10, 3),
        [strengthEntry('2026-10-13', 'chest-back-a', 25, 10, 1)]
      )).toContain('(reps left in the tank: 3 today vs 1)')
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

import React from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkoutPlan, { ExerciseSwapButton, ExerciseSwapSheet } from './WorkoutPlan'
import { createTranslator } from '../i18n/translate'
import type { Exercise } from '../types'

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

describe('WorkoutPlan', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  it('shows the custom-plan heading without an empty day card', () => {
    const html = renderToString(
      <WorkoutPlan mode="custom" lockMode onSignIn={() => undefined} onStartRest={() => undefined} />
    )

    expect(html).toContain('<h3>Make your plan</h3>')
    expect(html).toContain('No exercises added yet.')
    expect(html).not.toContain('day-plan-card')
  })

  it('places rest and posture controls with the set and squeeze sections', () => {
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
    expect(html).toContain('class="squeeze-cue-box"')
    expect(html).toContain('aria-controls="posture-tips-test-exercise"')
    expect(html).toContain('id="posture-tips-test-exercise" class="squeeze-cue-tips" hidden=""')
    expect(html).not.toContain('class="exercise-detail-toggle">Posture tips')
  })

  it('renders the change icon as an accessible labeled button', () => {
    const onClick = vi.fn()
    const button = ExerciseSwapButton({ label: 'Change exercise', onClick })
    const html = renderToString(button)

    expect(html).toContain('aria-label="Change exercise"')
    expect(html).toContain('class="exercise-swap-button"')
    expect(html).toContain('<svg')
    button.props.onClick?.({ stopPropagation: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>)
    expect(onClick).toHaveBeenCalledTimes(1)
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

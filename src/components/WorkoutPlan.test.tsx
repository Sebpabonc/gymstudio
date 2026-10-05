import React from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkoutPlan from './WorkoutPlan'

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
})

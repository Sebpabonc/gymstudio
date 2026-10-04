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
})

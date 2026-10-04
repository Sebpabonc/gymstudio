import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { WorkoutSet } from '../types'
import ExerciseSetTable from './ExerciseSetTable'

describe('ExerciseSetTable', () => {
  it('shows weight steppers, a completion control, and a separate remove control for each set', () => {
    const sets: WorkoutSet[] = [{ id: 'set-1', weight: 20, reps: 8 }]
    const html = renderToString(
      <ExerciseSetTable
        sets={sets}
        previousSets={[]}
        completedSets={[false]}
        onUpdateSet={vi.fn()}
        onToggleComplete={vi.fn()}
        onRemoveSet={vi.fn()}
      />
    )

    expect(html).toContain('<span>kg</span>')
    expect(html).toContain('aria-label="Decrease Set 1 weight in kilograms"')
    expect(html).toContain('aria-label="Increase Set 1 weight in kilograms"')
    expect(html).toContain('aria-label="Mark set 1 complete"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('aria-label="Remove set 1"')
  })
})

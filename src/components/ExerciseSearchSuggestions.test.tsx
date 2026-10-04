import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ExerciseSearchSuggestions from './ExerciseSearchSuggestions'

describe('ExerciseSearchSuggestions', () => {
  it('does not expose button results as a listbox', () => {
    const html = renderToString(
      <ExerciseSearchSuggestions
        exercises={[{ id: 'bench-press', name: 'Bench Press', primaryMuscle: 'Chest' }]}
        selectedExerciseId="bench-press"
        onSelect={vi.fn()}
      />
    )

    expect(html).not.toContain('role="listbox"')
    expect(html).toContain('<button')
    expect(html).toContain('result-item active')
  })
})

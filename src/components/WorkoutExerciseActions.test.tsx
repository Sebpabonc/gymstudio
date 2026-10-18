import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import WorkoutExerciseActions from './WorkoutExerciseActions'

function renderActions(onSwap?: () => void) {
  return renderToStaticMarkup(
    <WorkoutExerciseActions
      label="Exercise actions"
      googleLabel="Google"
      googleActionLabel="Search on Google"
      swapLabel="Swap"
      notesLabel="Notes"
      techniqueLabel="Technique"
      techniqueOpen={false}
      onGoogle={vi.fn()}
      onSwap={onSwap}
      onNotes={vi.fn()}
      onTechnique={vi.fn()}
    />
  )
}

describe('WorkoutExerciseActions', () => {
  it('shows the labelled tools in Proposal A order', () => {
    const html = renderActions(vi.fn())

    expect(html.indexOf('>Technique</span>')).toBeLessThan(html.indexOf('>Swap</span>'))
    expect(html.indexOf('>Swap</span>')).toBeLessThan(html.indexOf('>Notes</span>'))
    expect(html.indexOf('>Notes</span>')).toBeLessThan(html.indexOf('>Google</span>'))
    expect(html).toContain('aria-label="Search on Google"')
  })

  it('uses three equal tool columns when swapping is unavailable', () => {
    const html = renderActions()

    expect(html).toContain('class="workout-exercise-tools"')
    expect(html).not.toContain('>Swap</span>')
    expect(html).toContain('>Technique</span>')
    expect(html).toContain('>Notes</span>')
    expect(html).toContain('>Google</span>')
  })
})

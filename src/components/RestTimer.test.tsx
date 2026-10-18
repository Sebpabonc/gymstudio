import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import RestTimer from './RestTimer'

describe('RestTimer', () => {
  it('renders Workout mode rest controls in place with a 15-second extension', () => {
    const html = renderToStaticMarkup(
      <RestTimer
        timer={{ endAt: Date.now() + 120_000 }}
        hidden={false}
        onChange={vi.fn()}
        workoutMode
        inPlace
        label="✓ Set 1 logged · Next: set 2 · 80×12"
      />
    )

    expect(html).toContain('workout-rest-timer in-place')
    expect(html).toContain('>2:00</button>')
    expect(html).toContain('>+15s</button>')
    expect(html).toContain('>Skip</button>')
  })
})

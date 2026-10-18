import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { SupersetLogger } from './SupersetLogger'

describe('SupersetLogger', () => {
  it('shows one three-column table with last-session values and visible tools', () => {
    const html = renderToStaticMarkup(
      <SupersetLogger
        exercises={[{
          code: 'A1',
          name: 'Barbell Back Squat',
          techniqueLabel: 'Pyramid',
          planNote: 'Add weight each set.',
          sets: [{ weight: 75, reps: 8 }],
          previousSets: [{ id: 'previous-set', weight: 90, reps: 8 }],
          previousDate: '2026-10-15',
          restSeconds: 120,
          actions: <button type="button">Technique</button>,
        }]}
        loggedRounds={[false]}
        groupIndex={0}
        current
        t={createTranslator('en')}
        language="en"
        onChange={vi.fn()}
        onStartRest={vi.fn()}
        restBetweenSets={120}
        onSave={vi.fn(async () => undefined)}
      />
    )

    expect(html).toContain('role="table"')
    expect(html).toContain('>Last time</span>')
    expect(html).toContain('>Today</span>')
    expect(html).not.toContain('>Target</span>')
    expect(html).toContain('90×8')
    expect(html).toContain('75')
    expect(html).toContain('>Technique</button>')
    expect(html).toContain('>Pyramid</strong>')
  })
})

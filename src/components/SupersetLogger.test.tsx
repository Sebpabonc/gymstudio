import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { SupersetLogger } from './SupersetLogger'

function renderSuperset(language: 'en' | 'es' = 'en') {
  return renderToStaticMarkup(
    <SupersetLogger
      exercises={[
        {
          code: 'C1',
          name: 'Dumbbell Shoulder Press',
          equipment: 'dumbbell',
          sets: [
            { weight: 24, reps: 10 },
            { weight: 27.5, reps: 8 },
            { weight: 30, reps: 8 },
          ],
          previousSets: [
            { id: 'previous-c1', weight: 24, reps: 10 },
            { id: 'previous-c1-round-2', weight: 27, reps: 10 },
          ],
          previousDate: '2026-10-15',
          restSeconds: 10,
          actions: <button type="button">Technique</button>,
        },
        {
          code: 'C2',
          name: 'Cable Lat Pulldown',
          equipment: 'cable',
          sets: [
            { weight: 33.5, reps: 10 },
            { weight: 37.5, reps: 8 },
            { weight: 40, reps: 8 },
          ],
          previousSets: [
            { id: 'previous-c2', weight: 33.5, reps: 10 },
            { id: 'previous-c2-round-2', weight: 37.5, reps: 10 },
          ],
          previousDate: '2026-10-15',
          restSeconds: 10,
          actions: <button type="button">Notes</button>,
        },
      ]}
      loggedRounds={[true, false, false]}
      groupIndex={0}
      current
      t={createTranslator(language)}
      language={language}
      onChange={vi.fn()}
      onStartRest={vi.fn()}
      restBetweenSets={120}
      onSave={vi.fn(async () => undefined)}
    />
  )
}

describe('SupersetLogger', () => {
  it('shows compact per-exercise controls and only the current round open', () => {
    const html = renderSuperset()

    expect(html).toContain('Round 2 of 3')
    expect(html).toContain('✓ Round 1 of 3')
    expect(html).toContain('Round 3 of 3')
    expect(html).toContain('Dumbbell Shoulder Press')
    expect(html).toContain('Last time: 27×10 · Thu 15 Oct')
    expect(html).toContain('inputMode="decimal"')
    expect(html).toContain('value="27.5"')
    expect(html).toContain('>kg</span>')
    expect(html).toContain('>Reps</span>')
    expect(html).toContain('>Technique</button>')
    expect(html).not.toContain('role="table"')
    expect(html.match(/class="complete-set-button/g)).toHaveLength(2)
  })

  it('formats decimal stepper values and round labels in Spanish', () => {
    const html = renderSuperset('es')

    expect(html).toContain('Ronda 2 de 3')
    expect(html).toContain('✓ Ronda 1 de 3')
    expect(html).toContain('value="27,5"')
    expect(html).toContain('value="37,5"')
  })
})

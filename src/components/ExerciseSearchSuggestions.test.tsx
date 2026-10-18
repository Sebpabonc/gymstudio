import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ExerciseSearchSuggestions from './ExerciseSearchSuggestions'
import * as i18n from '../i18n'
import { createTranslator } from '../i18n/translate'

describe('ExerciseSearchSuggestions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('renders an equipment icon, compact metadata, truncation hooks, and chevron', () => {
    const html = renderToString(
      <ExerciseSearchSuggestions
        exercises={[{
          id: 'row', name: 'A very long Barbell Row name', primaryMuscle: 'Back',
          primaryMuscles: ['Lats', 'Upper Back'], bodyRegion: 'Back', equipment: 'barbell',
        }]}
        onSelect={vi.fn()}
      />
    )
    expect(html).toContain('class="result-equipment" aria-hidden="true"')
    expect(html).toContain('<svg')
    expect(html).toContain('class="result-text"')
    expect(html).toContain('class="result-name">A very long Barbell Row name')
    expect(html).toContain('class="result-meta">Lats · Barbell')
    expect(html).not.toContain('Upper Back')
    expect(html).toContain('class="result-chevron" aria-hidden="true"')
  })

  it('renders Spanish names and localized equipment', () => {
    vi.spyOn(i18n, 'useT').mockReturnValue({
      t: createTranslator('es'), language: 'es', locale: 'es-MX', setLanguage: vi.fn(),
    })
    const html = renderToString(
      <ExerciseSearchSuggestions
        exercises={[{
          id: 'curl', name: 'Dumbbell Curl', nameEs: 'Curl de bíceps', primaryMuscle: 'Biceps', equipment: 'dumbbell',
        }]}
        onSelect={vi.fn()}
      />
    )
    expect(html).toContain('Curl de bíceps')
    expect(html).toContain('Bíceps · Mancuernas')
  })

  it.each([
    ['en', 'No match for “hack squat”.'],
    ['es', 'Nada coincide con “hack squat”.'],
  ] as const)('localizes the query-aware empty state in %s without a create action', (language, message) => {
    vi.spyOn(i18n, 'useT').mockReturnValue({
      t: createTranslator(language), language, locale: language, setLanguage: vi.fn(),
    })
    const html = renderToString(
      <ExerciseSearchSuggestions exercises={[]} query="  hack squat  " onSelect={vi.fn()} />
    )
    expect(html).toContain(message)
    expect(html).not.toContain('<button')
  })

  it('retains the generic empty state when there is no query', () => {
    const html = renderToString(
      <ExerciseSearchSuggestions exercises={[]} query="  " onSelect={vi.fn()} />
    )
    expect(html).toContain('No exercises found.')
  })
})

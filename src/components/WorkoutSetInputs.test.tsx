import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import WorkoutSetInputs from './WorkoutSetInputs'

const html = (weight: number, equipment: 'cable' | 'machine', language: 'en' | 'es' = 'en') => renderToStaticMarkup(
  <WorkoutSetInputs setIndex={0} weight={weight} weightInput={String(weight)} reps={10} equipment={equipment}
    language={language} t={createTranslator(language)} repsLabel="Reps" onWeightInputChange={() => {}} onValueChange={() => {}} />
)

describe('R31 off-grid cable hint', () => {
  it('shows the grid load under an off-grid cable set', () => {
    expect(html(6, 'cable')).toContain('Not on the 2.5 kg steps; counts as 5 kg.')
    expect(html(26, 'cable', 'es')).toContain('Fuera de los pasos de 2,5 kg; cuenta como 25 kg.')
  })

  it('stays quiet on the grid and on machines', () => {
    expect(html(7.5, 'cable')).not.toContain('set-off-grid-hint')
    expect(html(6.25, 'machine')).not.toContain('set-off-grid-hint')
    expect(html(0, 'cable')).not.toContain('set-off-grid-hint')
  })
})

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createTranslator, localeFor } from '../i18n/translate'

let language: 'en' | 'es' = 'es'
vi.mock('../i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../i18n')>()),
  useT: () => ({ language, locale: localeFor(language), t: createTranslator(language) }),
}))
import { FirstRunQuestions } from './FirstRunScreen'

describe('FirstRunQuestions', () => {
  it('shows the safety notice and all six questions with nothing preselected', () => {
    language = 'es'
    const html = renderToStaticMarkup(<FirstRunQuestions onAnswered={() => undefined} onHaveAccount={() => undefined} />)
    expect(html).toContain('Entrena con seguridad')
    expect(html).toContain('Tu plan puede esperar.')
    for (const label of ['¿Qué quieres lograr?', 'Experiencia', 'Días por semana', 'Equipo', 'Duración de la sesión', 'Nivel de actividad']) {
      expect(html).toContain(`<legend>${label}</legend>`)
    }
    expect(html).not.toContain('aria-pressed="true"')
    expect(html).toContain('Te faltan 6')
    expect(html).toContain('Ya tengo cuenta')
  })

  it('Q22: activity options carry their helper lines in English and Spanish', () => {
    language = 'en'
    const en = renderToStaticMarkup(<FirstRunQuestions onAnswered={() => undefined} onHaveAccount={() => undefined} />)
    expect(en).toContain('<span>High</span><small>Outside your workouts, you have a physical job')
    language = 'es'
    const es = renderToStaticMarkup(<FirstRunQuestions onAnswered={() => undefined} onHaveAccount={() => undefined} />)
    expect(es).toContain('<span>Alto</span><small>Fuera de tus entrenamientos, tienes un trabajo físico')
    expect(es).toContain('<span>En casa</span><small>Mancuernas y un banco ajustable.</small>')
  })

  it('restores saved answers after a reload', () => {
    language = 'en'
    const goal = { goal: 'muscle', daysPerWeek: 4, experience: 'beginner', activityLevel: 'high', sessionMinutes: 60, equipment: 'home', notes: '' } as const
    const html = renderToStaticMarkup(<FirstRunQuestions initialAnswers={goal} onAnswered={() => undefined} onHaveAccount={() => undefined} />)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(6)
    expect(html).toContain('>Continue<')
  })
})

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createTranslator, localeFor } from '../i18n/translate'

let language: 'en' | 'es' = 'es'
vi.mock('../i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../i18n')>()),
  useT: () => ({ language, locale: localeFor(language), t: createTranslator(language) }),
}))
import { FirstRunQuestions, PlanReadyCard } from './FirstRunScreen'
import { loadSpanishContent } from '../i18n/content'
import type { BuiltPlan } from '../plans/buildMyPlan'

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
    // QA #63: the fieldset legend names each group once; no inner role=group repeating it.
    expect(html).not.toContain('role="group"')
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

describe('PlanReadyCard', () => {
  const plan = {
    templateId: 'tpl-4d-upper-lower-db',
    startDate: '2026-11-09',
    source: 'template',
    cappedForBeginner: false,
    block: {
      id: 'user-tpl-4d-upper-lower-db', number: 1, name: 'Upper / Lower · Dumbbells & Bodyweight · 4 Days', method: 'straight sets',
      startDate: '2026-11-09', weeks: 6, origin: 'pt', summary: '', insights: [],
      days: [
        { key: 'upper-a', position: 1, name: 'Upper A', exercises: [{ code: 'A1', position: 1, exerciseId: 'x', sets: 3, reps: ['8'], restSeconds: 90, technique: 'straight' }] },
        { key: 'lower-a', position: 2, name: 'Lower A', exercises: [] },
      ],
    },
  } as unknown as BuiltPlan

  it('QA 2026-11-07: shows the plan name and days in Spanish, the labelled 6-week bar and the start line', async () => {
    await loadSpanishContent()
    language = 'es'
    const html = renderToStaticMarkup(<PlanReadyCard plan={plan} />)
    expect(html).toContain('Tu plan está listo')
    expect(html).toContain('Superior / Inferior · Mancuernas y peso corporal · 4 días')
    expect(html).not.toContain('Upper / Lower')
    expect(html).toContain('Semana 1 de 6')
    expect(html.match(/<i><\/i>/g)).toHaveLength(6)
    expect(html).toContain('Día 1 · ')
    expect(html).toContain('1 ejercicios')
  })

  it('shows the English name in English', () => {
    language = 'en'
    const html = renderToStaticMarkup(<PlanReadyCard plan={plan} />)
    expect(html).toContain('Upper / Lower · Dumbbells &amp; Bodyweight · 4 Days')
    expect(html).toContain('Day 1 · Upper A')
    expect(html).toContain('Week 1 of 6')
  })
})

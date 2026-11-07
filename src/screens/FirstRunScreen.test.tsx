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

describe('FirstRunQuestions (survey, one question per screen)', () => {
  const none = { onAnswered: () => undefined, onHaveAccount: () => undefined }

  it('opens on a welcome with the full safety notice before the first question', () => {
    language = 'es'
    const html = renderToStaticMarkup(<FirstRunQuestions {...none} />)
    expect(html).toContain('Armemos tu plan')
    expect(html).toContain('Entrena con seguridad')
    expect(html).toContain('Tu plan puede esperar.')
    expect(html).toContain('>Empezar<')
    expect(html).toContain('Ya tengo cuenta')
    expect(html).not.toContain('<fieldset')
  })

  it('resumes at the first unanswered question, one question per screen, nothing preselected there', () => {
    language = 'es'
    const html = renderToStaticMarkup(<FirstRunQuestions {...none} initialAnswers={{ goal: 'muscle', experience: 'beginner' } as never} />)
    expect(html).toContain('Pregunta 3 de 6')
    expect(html).toContain('¿Cuántos días a la semana puedes entrenar?')
    expect(html.match(/<fieldset/g)).toHaveLength(1)
    expect(html).not.toContain('aria-pressed="true"')
    expect(html).toContain('Entrena con seguridad')
  })

  it('Q22: activity options carry their helper lines in English and Spanish', () => {
    const five = { goal: 'muscle', experience: 'beginner', daysPerWeek: 3, equipment: 'home', sessionMinutes: 45 } as never
    language = 'en'
    const en = renderToStaticMarkup(<FirstRunQuestions {...none} initialAnswers={five} />)
    expect(en).toContain('How much do you move outside your workouts?')
    expect(en).toContain('<span>High</span><small>Outside your workouts, you have a physical job')
    language = 'es'
    const es = renderToStaticMarkup(<FirstRunQuestions {...none} initialAnswers={five} />)
    expect(es).toContain('<span>Alto</span><small>Fuera de tus entrenamientos, tienes un trabajo físico')
  })

  it('restores a complete set of answers on the last question, ready to continue', () => {
    language = 'en'
    const goal = { goal: 'muscle', daysPerWeek: 4, experience: 'beginner', activityLevel: 'high', sessionMinutes: 60, equipment: 'home', notes: '' } as const
    const html = renderToStaticMarkup(<FirstRunQuestions {...none} initialAnswers={goal} />)
    expect(html).toContain('Question 6 of 6')
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
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

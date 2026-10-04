import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { en } from './en'
import { es } from './es'
import { dictionaries, createTranslator, detectLanguage, translate } from './translate'
import { formatShortDate, formatWeekdayDate } from './format'
import { useT } from './LanguageProvider'
import { filterExercises } from '../utils/exerciseFilters'
import { getExerciseDisplayName } from '../utils/storage'
import type { Exercise } from '../types'

describe('dictionaries', () => {
  it('have exactly the same keys in English and Spanish', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })

  it('have no empty values and keep interpolation placeholders aligned', () => {
    const placeholders = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(en[key].trim(), key).not.toBe('')
      expect(es[key].trim(), key).not.toBe('')
      expect(placeholders(es[key]), key).toEqual(placeholders(en[key]))
    }
  })

  it('uses the approved Spanish gym vocabulary', () => {
    expect(es['nav.today']).toBe('Hoy')
    expect(es['nav.exercises']).toBe('Ejercicios')
    expect(es['nav.progress']).toBe('Progreso')
    expect(es['nav.you']).toBe('Tú')
    expect(es['exercises.logWorkout']).toBe('Registrar ejercicio')
    expect(es['rest.label']).toBe('Descanso')
  })
})

describe('translate', () => {
  afterEach(() => {
    Object.assign(dictionaries.es, { 'nav.today': es['nav.today'] })
  })

  it('translates and interpolates params', () => {
    expect(translate('en', 'exercises.logged', { summary: '3 sets' })).toBe('Logged · 3 sets')
    expect(translate('es', 'exercises.logged', { summary: '3 series' })).toBe('Registrado · 3 series')
  })

  it('falls back to English when a Spanish entry is missing, then to the key', () => {
    delete (dictionaries.es as Partial<Record<string, string>>)['nav.today']
    expect(translate('es', 'nav.today')).toBe('Today')
    expect(translate('es', 'not.a.key' as never)).toBe('not.a.key')
  })

  it('keeps unknown placeholders untouched', () => {
    expect(translate('en', 'exercises.logged')).toBe('Logged · {summary}')
  })
})

describe('useT', () => {
  it('falls back to English when rendered without a provider', () => {
    function Probe() {
      const { t, language } = useT()
      return React.createElement('span', null, `${language}:${t('nav.today')}`)
    }
    expect(renderToStaticMarkup(React.createElement(Probe))).toBe('<span>en:Today</span>')
  })

  it('createTranslator binds a language', () => {
    expect(createTranslator('es')('nav.you')).toBe('Tú')
  })
})

describe('detectLanguage', () => {
  it('maps es* device languages to Spanish and everything else to English', () => {
    expect(detectLanguage('es')).toBe('es')
    expect(detectLanguage('es-MX')).toBe('es')
    expect(detectLanguage('ES-ar')).toBe('es')
    expect(detectLanguage('en-US')).toBe('en')
    expect(detectLanguage('fr-FR')).toBe('en')
    expect(detectLanguage('')).toBe('en')
  })
})

describe('date formatting', () => {
  it('formats weekday dates in both languages', () => {
    expect(formatWeekdayDate('en', '2026-10-05')).toBe('Mon 5 Oct')
    expect(formatWeekdayDate('es', '2026-10-05')).toBe('lun 5 oct')
  })

  it('formats short dates in both languages', () => {
    expect(formatShortDate('en', '2026-10-05')).toBe('Oct 5')
    expect(formatShortDate('es', '2026-10-05')).toBe('5 oct')
  })
})

describe('Spanish exercise names', () => {
  const squat: Exercise = {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    nameEs: 'Sentadilla trasera con barra',
    primaryMuscle: 'Quads',
    equipment: 'Barbell',
  }
  const noEs: Exercise = { id: 'x', name: 'Cable Row', primaryMuscle: 'Back' }

  it('shows the Spanish name when available and falls back to English', () => {
    expect(getExerciseDisplayName(squat, 'es')).toBe('Sentadilla trasera con barra')
    expect(getExerciseDisplayName(squat, 'en')).toBe('Barbell Back Squat')
    expect(getExerciseDisplayName(noEs, 'es')).toBe('Cable Row')
  })

  it('matches searches in both languages, ignoring accents', () => {
    expect(filterExercises([squat, noEs], 'sentadilla')).toEqual([squat])
    expect(filterExercises([squat, noEs], 'SENTADILLA tra')).toEqual([squat])
    expect(filterExercises([squat, noEs], 'back squat')).toEqual([squat])
  })
})

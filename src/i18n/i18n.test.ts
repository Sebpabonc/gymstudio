import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { en } from './en'
import { es } from './es'
import { dictionaries, createTranslator, detectLanguage, translate } from './translate'
import { formatNumber, formatShortDate, formatWeekdayDate } from './format'
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

  it('removes translations for the decluttered layout and history controls', () => {
    const removedKeys = [
      'layout.label',
      'layout.boxes',
      'layout.sheet',
      'exercises.lastVolume',
      'exercises.previousPerformance',
      'exercises.noPrevious',
      'exercises.setOne',
      'exercises.setMany',
      'exercises.progress',
      'exercises.volumeSuffix',
      'exercises.noTrend',
      'workout.run.history',
    ]

    for (const key of removedKeys) {
      expect(en).not.toHaveProperty(key)
      expect(es).not.toHaveProperty(key)
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

  it('uses sentence case for posture section labels', () => {
    expect(en['workout.posture.title']).toBe('Posture tips')
    expect(es['workout.posture.title']).toBe('Consejos de postura')
    expect(en['exercises.postureTips']).toBe('Posture tips')
    expect(es['exercises.postureTips']).toBe('Consejos de postura')
  })

  it('uses sentence case for the current set label in both languages', () => {
    expect(en['workout.run.currentSet']).toBe('Set {set} of {total}')
    expect(es['workout.run.currentSet']).toBe('Serie {set} de {total}')
    expect(en['workout.label.repsInline']).toBe('Reps')
    expect(es['workout.label.repsInline']).toBe('Reps')
  })

  it('T110: removes the retired logged-effort and RIR prompt keys in both languages', () => {
    const removedKeys = [
      'workout.insight.watch.W4',
      'workout.insight.watch.W5',
      'progress.v3.watch.W4',
      'progress.v3.watch.W5',
      'progress.v3.worth.rir',
      'workout.insight.estMax.effort',
      'workout.rir.question',
      'workout.rir.hint',
      'workout.rir.zero',
      'workout.rir.oneTwo',
      'workout.rir.threePlus',
      'workout.rir.saved',
      'workout.rir.skip',
    ]
    for (const key of removedKeys) {
      expect(Object.keys(en)).not.toContain(key)
      expect(Object.keys(es)).not.toContain(key)
    }
  })

  it('T108: uses the approved no-watch summary without calling existing history a baseline', () => {
    expect(en['progress.v3.summary.empty']).toBe('Nothing to review right now. New lifts start as a baseline.')
    expect(es['progress.v3.summary.empty']).toBe('Nada para revisar por ahora. Los ejercicios nuevos empiezan como base.')
  })

  it('uses the approved logging safety hints and partial labels in both languages', () => {
    expect(en['workout.run.newWeightCheck']).toBe('New weight: check your reps')
    expect(es['workout.run.newWeightCheck']).toBe('Peso nuevo: revisa tus reps')
    expect(en['workout.run.weightCarried']).toBe('Applied to the next sets')
    expect(es['workout.run.weightCarried']).toBe('Aplicado a las siguientes series')
    expect(en['workout.run.extraThenDone']).toBe("Finish the last-set extra in the note, then mark the set. Log only the main set's full reps.")
    expect(es['workout.run.extraThenDone']).toBe('Termina el extra de la última serie (ver nota) y luego marca la serie. Registra solo las reps completas de la serie principal.')
    expect(translate('en', 'workout.run.partial', { done: 2, total: 3 })).toBe('2 of 3 sets')
    expect(translate('es', 'workout.run.partial', { done: 2, total: 3 })).toBe('2 de 3 series')
    expect(translate('en', 'workout.run.loggedSet', { set: 2 })).toBe('Set 2 logged')
    expect(translate('es', 'workout.run.loggedSet', { set: 2 })).toBe('Serie 2 registrada')
    expect(translate('en', 'workout.run.nextSuperset', { name: 'Bench' })).toBe('Next: Bench')
    expect(translate('es', 'workout.run.nextSuperset', { name: 'Bench' })).toBe('Siguiente: Bench')
    expect(en['workout.run.enterWeight']).toBe('Enter weight')
    expect(es['workout.run.enterWeight']).toBe('Ingresa el peso')
    expect(en['workout.run.finishMissing']).toBe('Finish now? Unlogged sets will stay empty.')
    expect(es['workout.run.finishMissing']).toBe('¿Terminar ahora? Las series sin registrar quedarán vacías.')
  })

  it('uses separate sign-in hints for saving goals and creating personal plans', () => {
    expect(en['profile.goal.signIn']).toBe('Sign in to save your goal')
    expect(es['profile.goal.signIn']).toBe('Inicia sesión para guardar tu objetivo')
    expect(en['profile.plan.signIn']).toBe('Sign in to create your personal plan')
    expect(es['profile.plan.signIn']).toBe('Inicia sesión para crear tu plan personal')
  })

  it('uses bilingual rest controls and an explicit alert-permission reason', () => {
    expect(en['rest.title']).toBe('Rest')
    expect(es['rest.title']).toBe('Descanso')
    expect(en['rest.done']).toBe('Go')
    expect(es['rest.done']).toBe('Ya')
    expect(en['rest.hide']).toBe('Hide')
    expect(es['rest.hide']).toBe('Ocultar')
    expect(en['rest.open']).toBe('Open')
    expect(es['rest.open']).toBe('Abrir')
    expect(en['rest.startNext']).toBe('Start next set now')
    expect(es['rest.startNext']).toBe('Empezar la siguiente serie ahora')
    expect(en['rest.permissionReason']).toBe('Allow alerts to let you know when rest ends.')
    expect(es['rest.permissionReason']).toBe('Permite alertas para avisarte cuando termine el descanso.')
    expect(en['rest.allowAlerts']).toBe('Allow alerts')
    expect(es['rest.allowAlerts']).toBe('Permitir alertas')
    expect(en['rest.notNow']).toBe('Not now')
    expect(es['rest.notNow']).toBe('Ahora no')
  })

  it('states the exact saved values on Big Done in both languages', () => {
    expect(translate('en', 'workout.run.doneWeight', { weight: '37.5', reps: 8 })).toBe('Done · 37.5 kg × 8')
    expect(translate('es', 'workout.run.doneWeight', { weight: '37,5', reps: 8 })).toBe('Hecho · 37,5 kg × 8')
    expect(translate('en', 'workout.run.doneBodyweight', { reps: 12 })).toBe('Done · 12 reps')
    expect(translate('es', 'workout.run.doneBodyweight', { reps: 12 })).toBe('Hecho · 12 reps')
    const drop = { weight: 40, reps: 12, dropWeight: 30, dropReps: 12 }
    expect(translate('en', 'workout.run.doneDrop', drop)).toBe('Done · 40 kg × 12 → 30 kg × 12')
    expect(translate('es', 'workout.run.doneDrop', drop)).toBe('Hecho · 40 kg × 12 → 30 kg × 12')
    expect(translate('en', 'workout.run.supersetThenRest', { name: 'Bench' })).toBe('Superset with Bench · then rest')
    expect(translate('es', 'workout.run.supersetThenRest', { name: 'Bench' })).toBe('Superserie con Bench · luego descansa')
    expect(en['workout.run.exit']).toBe('‹ Today')
    expect(es['workout.run.exit']).toBe('‹ Hoy')
  })

  it('uses approved exercise-rest precedence wording for the Profile fallback', () => {
    expect(en['profile.restBetweenSets']).toBe('Rest when the plan sets none')
    expect(en['profile.restBetweenSetsHelp']).toBe("Plan workouts use each exercise's own rest. This time applies only to exercises without one.")
    expect(es['profile.restBetweenSets']).toBe('Descanso cuando el plan no indica uno')
    expect(es['profile.restBetweenSetsHelp']).toBe('Los entrenamientos del plan usan el descanso de cada ejercicio. Este tiempo solo aplica a ejercicios que no lo tienen.')
  })

  it('uses the approved plain strength wording and confines one-rep-max language to its explanation', () => {
    expect(en['workout.insight.estMax.up']).toBe('Stronger than last time ({day}, {date}): {now} vs {before}')
    expect(es['workout.insight.estMax.up']).toBe('Más fuerte que la última vez ({day}, {date}): {now} vs {before}')
    expect(en['workout.insight.strengthHelp.link']).toBe('How we compare')
    expect(es['workout.insight.strengthHelp.link']).toBe('¿Cómo comparamos?')
    expect(en['progress.v3.detail.volume']).toBe('Total weight moved (kg × reps)')
    expect(es['progress.v3.detail.volume']).toBe('Peso total movido (kg × reps)')

    const jargon = /est\. max|máx\. est\.|e1rm|1\s*rep max/i
    for (const [key, value] of Object.entries(en)) {
      if (key === 'workout.insight.strengthHelp.explanation') continue
      expect(value, key).not.toMatch(jargon)
    }
    for (const [key, value] of Object.entries(es)) {
      if (key === 'workout.insight.strengthHelp.explanation') continue
      expect(value, key).not.toMatch(jargon)
    }
  })
})

describe('translate', () => {
  afterEach(() => {
    Object.assign(dictionaries.es, { 'nav.today': es['nav.today'] })
  })

  it('translates and interpolates params', () => {
    expect(translate('en', 'exercises.logged', { summary: '3 sets' })).toBe('Logged · 3 sets')
    expect(translate('es', 'exercises.logged', { summary: '3 series' })).toBe('Registrado · 3 series')
    expect(translate('en', 'workout.previous.day', { day: 'A' })).toBe('Day A')
    expect(translate('es', 'workout.previous.day', { day: 'A' })).toBe('Día A')
  })

  it('labels completed weekly comparisons and actual versus planned sessions explicitly', () => {
    expect(translate('en', 'progress.habits.sessionsDonePlanned', { done: 6, planned: 4 }))
      .toBe('6 done · 4 planned')
    expect(translate('es', 'progress.habits.sessionsDonePlanned', { done: 6, planned: 4 }))
      .toBe('6 realizadas · 4 planificadas')
    expect(translate('en', 'progress.weeklySets.compare', { muscle: 'Chest', current: 0, average: 18.7 }))
      .toContain('last complete week')
    expect(translate('es', 'progress.weeklySets.compare', { muscle: 'Pecho', current: 0, average: 18.7 }))
      .toContain('última semana completa')
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

  describe('number formatting', () => {
    it('formats grouped values using the selected language', () => {
      expect(formatNumber('en', 2720)).toBe('2,720')
      expect(formatNumber('es', 2720)).toBe('2.720')
      expect(formatNumber('es', 50.7)).toBe('50,7')
    })
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

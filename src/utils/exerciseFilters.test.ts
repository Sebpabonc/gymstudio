import { describe, expect, it } from 'vitest'
import { Exercise } from '../types'
import {
  ALL_BODY_REGIONS,
  equipmentLabel,
  filterExercises,
  getAvailableBodyRegions,
  getExerciseSubtitle,
  getExerciseResultSubtitle,
  getExerciseTips,
} from './exerciseFilters'

const exercises: Exercise[] = [
  {
    id: 'back-row',
    name: 'Barbell Row',
    primaryMuscle: 'Back',
    primaryMuscles: ['Lats', 'Upper Back'],
    secondaryMuscle: 'Biceps',
    secondaryMuscles: ['Biceps', 'Forearms'],
    bodyRegion: 'Back',
    equipment: 'barbell',
  },
  {
    id: 'chest-press',
    name: 'Bench Press',
    primaryMuscle: 'Chest',
    bodyRegion: 'Chest',
    equipment: 'barbell',
  },
]

describe('exercise filters', () => {
  it('filters by body region and searches English names, muscle groups, and equipment', () => {
    expect(filterExercises(exercises, '', 'Back')).toEqual([exercises[0]])
    expect(filterExercises(exercises, 'row')).toEqual([exercises[0]])
    expect(filterExercises(exercises, 'pull')).toEqual([])
    expect(filterExercises(exercises, 'forearms', 'Back')).toEqual([exercises[0]])
    expect(filterExercises(exercises, 'barbell', 'Chest')).toEqual([exercises[1]])
    expect(filterExercises(exercises, 'row', 'Chest')).toEqual([])
  })

  it('finds user exercises by their saved body region chip', () => {
    const yours: Exercise = {
      id: 'custom-uuid', name: 'My press', primaryMuscle: 'Shoulders',
      bodyRegion: 'Shoulders', equipment: 'bodyweight', isUserCreated: true,
    }
    expect(getAvailableBodyRegions([...exercises, yours])).toContain('Shoulders')
    expect(filterExercises([...exercises, yours], 'my press', 'Shoulders')).toEqual([yours])
  })

  it('finds exercises by Spanish muscle and region words', () => {
    const core: Exercise = { id: 'crunch', name: 'Cable Crunch', primaryMuscle: 'Abs', bodyRegion: 'Core' }
    const calf: Exercise = { id: 'calf', name: 'Calf Raise', primaryMuscle: 'Calves', bodyRegion: 'Legs' }
    const all = [...exercises, core, calf]

    expect(filterExercises(all, 'espalda')).toEqual([exercises[0]])
    expect(filterExercises(all, 'dorsales')).toEqual([exercises[0]])
    expect(filterExercises(all, 'bíceps')).toEqual([exercises[0]])
    expect(filterExercises(all, 'abdomen')).toEqual([core])
    expect(filterExercises(all, 'pantorrillas')).toEqual([calf])
    expect(filterExercises(all, 'gemelos')).toEqual([calf])
    expect(filterExercises(all, 'pecho')).toEqual([exercises[1]])
  })

  it('matches accent-free Spanish names, muscle aliases, and localized equipment', () => {
    const curl: Exercise = {
      id: 'curl', name: 'Dumbbell Curl', nameEs: 'Curl de bíceps con mancuernas',
      primaryMuscle: 'Biceps', equipment: 'dumbbell',
    }
    const calf: Exercise = { id: 'calf', name: 'Calf Raise', primaryMuscle: 'Calves', equipment: 'machine' }
    const crunch: Exercise = { id: 'crunch', name: 'Cable Crunch', primaryMuscle: 'Abs', equipment: 'cable' }
    const all = [curl, calf, crunch]
    for (const query of ['curl de biceps', 'bíceps', 'mancuernas', 'DB curl']) {
      expect(filterExercises(all, query)).toEqual([curl])
    }
    for (const query of ['gemelos', 'pantorrillas', 'maquina']) {
      expect(filterExercises(all, query)).toEqual([calf])
    }
    for (const query of ['abdomen', 'abdominales', 'polea']) {
      expect(filterExercises(all, query)).toEqual([crunch])
    }
  })

  it('uses only the first primary muscle and localized equipment in result rows', () => {
    expect(getExerciseResultSubtitle(exercises[0])).toBe('Lats · Barbell')
    expect(getExerciseResultSubtitle(exercises[0], 'es')).toBe('Dorsales · Barra')
    expect(getExerciseResultSubtitle(exercises[1], 'es')).toBe('Pecho · Barra')
    expect(getExerciseResultSubtitle({ ...exercises[0], primaryMuscles: [], equipment: undefined }, 'es')).toBe('Espalda · Otro')
  })

  it('labels equipment using prototype copy and preserves unknown equipment', () => {
    expect(equipmentLabel('cable', 'es')).toBe('Polea')
    expect(equipmentLabel('dumbbell', 'es')).toBe('Mancuernas')
    expect(equipmentLabel('ez-bar', 'es')).toBe('Barra Z')
    expect(equipmentLabel('machine', 'es')).toBe('Máquina')
    expect(equipmentLabel('bodyweight', 'es')).toBe('Peso corporal')
    expect(equipmentLabel('band', 'es')).toBe('Banda')
    expect(equipmentLabel(undefined)).toBe('Other')
    expect(equipmentLabel('unlisted')).toBe('unlisted')
  })

  it('shows the subtitle region and muscles in Spanish', () => {
    expect(getExerciseSubtitle(exercises[0], 'es')).toBe('Espalda · Dorsales · Espalda alta')
    expect(getExerciseSubtitle(exercises[0])).toBe('Back · Lats · Upper Back')
  })

  it('normalizes spacing and hyphens and matches query words in any order', () => {
    const pulldown = { ...exercises[0], name: 'Lat Pulldown', equipment: 'cable' }
    const dumbbellPress = { ...exercises[1], name: 'Dumbbell Bench Press', equipment: 'dumbbell' }

    expect(filterExercises([pulldown], 'lat pull down')).toEqual([pulldown])
    expect(filterExercises([pulldown], 'lat-pulldown')).toEqual([pulldown])
    expect(filterExercises([dumbbellPress], 'press dumbbell')).toEqual([dumbbellPress])
  })

  it('expands common gym abbreviations while searching exercise names', () => {
    const gymExercises: Exercise[] = [
      { id: 'rdl', name: 'Barbell Romanian Deadlift', primaryMuscle: 'Hamstrings' },
      { id: 'sldl', name: 'Barbell Stiff-Leg Deadlift', primaryMuscle: 'Hamstrings' },
      { id: 'ohp', name: 'Barbell Overhead Press', primaryMuscle: 'Shoulders' },
      { id: 'db', name: 'Dumbbell Bench Press', primaryMuscle: 'Chest' },
      { id: 'bb', name: 'Barbell Bench Press', primaryMuscle: 'Chest' },
      { id: 'ez', name: 'EZ-Bar Curl', primaryMuscle: 'Biceps' },
      { id: 'bss', name: 'Dumbbell Bulgarian Split Squat', primaryMuscle: 'Quads' },
      { id: 'lpd', name: 'Cable Lat Pulldown', primaryMuscle: 'Lats' },
      { id: 't-bar', name: 'Barbell T-Bar Row', primaryMuscle: 'Back' },
    ]

    for (const [query, exerciseId] of [
      ['RDL', 'rdl'],
      ['SLDL', 'sldl'],
      ['OHP', 'ohp'],
      ['DB', 'db'],
      ['BB', 'bb'],
      ['EZ', 'ez'],
      ['BSS', 'bss'],
      ['LPD', 'lpd'],
      ['T-bar', 't-bar'],
    ]) {
      expect(filterExercises(gymExercises, query).map((exercise) => exercise.id)).toContain(exerciseId)
    }
  })

  it('omits a primary muscle that duplicates the body-region subtitle', () => {
    expect(getExerciseSubtitle({
      ...exercises[1],
      bodyRegion: 'Chest',
      primaryMuscles: ['Chest'],
    })).toBe('Chest')
    expect(getExerciseSubtitle({
      ...exercises[0],
      bodyRegion: 'Back',
      primaryMuscles: ['Back', 'Lats'],
    })).toBe('Back · Lats')
  })

  it('returns only available regions in the catalogue order', () => {
    expect(getAvailableBodyRegions(exercises)).toEqual([ALL_BODY_REGIONS, 'Chest', 'Back'])
    expect(getAvailableBodyRegions([])).toEqual([ALL_BODY_REGIONS])
  })

  it('omits Full Body from chips without removing it from search or region filtering', () => {
    const fullBody: Exercise = { id: 'burpee', name: 'Burpee', primaryMuscle: 'Quads', bodyRegion: 'Full Body' }
    const all = [...exercises, fullBody]
    expect(getAvailableBodyRegions(all)).toEqual([ALL_BODY_REGIONS, 'Chest', 'Back'])
    expect(filterExercises(all, 'full body')).toEqual([fullBody])
    expect(filterExercises(all, 'cuerpo completo')).toEqual([fullBody])
    expect(filterExercises(all, '', 'Full Body')).toEqual([fullBody])
    expect(filterExercises(all, '')).toEqual(all)
  })

  it('uses posture tips when present and falls back to bundled tips only when missing', () => {
    const bundled = { id: 'exercise', name: 'Exercise', primaryMuscle: 'Core', tips: ['Bundled'] }
    expect(getExerciseTips({ ...bundled, postureTips: ['Catalogue'] })).toEqual(['Catalogue'])
    expect(getExerciseTips({ ...bundled, postureTips: [] })).toEqual([])
    expect(getExerciseTips(bundled)).toEqual(['Bundled'])
  })
})

describe('search ranking', () => {
  it('puts primary-muscle matches before secondary-muscle matches', () => {
    const exercises = [
      { id: 'plank', name: 'Plank', primaryMuscle: 'Abs', primaryMuscles: ['Abs'], secondaryMuscles: ['Glutes'], bodyRegion: 'Core' },
      { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscle: 'Glutes', primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'], bodyRegion: 'Glutes' },
    ]
    expect(filterExercises(exercises as never, 'glutes').map((exercise) => exercise.id)).toEqual(['hip-thrust', 'plank'])
  })
})

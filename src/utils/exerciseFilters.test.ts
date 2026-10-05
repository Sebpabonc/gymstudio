import { describe, expect, it } from 'vitest'
import { Exercise } from '../types'
import {
  ALL_BODY_REGIONS,
  filterExercises,
  getAvailableBodyRegions,
  getExerciseSubtitle,
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

  it('uses posture tips when present and falls back to bundled tips only when missing', () => {
    const bundled = { id: 'exercise', name: 'Exercise', primaryMuscle: 'Core', tips: ['Bundled'] }
    expect(getExerciseTips({ ...bundled, postureTips: ['Catalogue'] })).toEqual(['Catalogue'])
    expect(getExerciseTips({ ...bundled, postureTips: [] })).toEqual([])
    expect(getExerciseTips(bundled)).toEqual(['Bundled'])
  })
})

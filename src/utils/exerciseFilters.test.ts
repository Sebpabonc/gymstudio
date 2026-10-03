import { describe, expect, it } from 'vitest'
import { Exercise } from '../types'
import { ALL_BODY_REGIONS, filterExercises, getAvailableBodyRegions, getExerciseTips } from './exerciseFilters'

const exercises: Exercise[] = [
  {
    id: 'back-row',
    name: 'Barbell Row',
    nameEs: 'Remo con barra',
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
    nameEs: 'Press de banca',
    primaryMuscle: 'Chest',
    bodyRegion: 'Chest',
    equipment: 'barbell',
  },
]

describe('exercise filters', () => {
  it('filters by body region and searches English names, muscle groups, and equipment', () => {
    expect(filterExercises(exercises, '', 'Back')).toEqual([exercises[0]])
    expect(filterExercises(exercises, 'row')).toEqual([exercises[0]])
    expect(filterExercises(exercises, 'remo')).toEqual([])
    expect(filterExercises(exercises, 'forearms', 'Back')).toEqual([exercises[0]])
    expect(filterExercises(exercises, 'barbell', 'Chest')).toEqual([exercises[1]])
    expect(filterExercises(exercises, 'row', 'Chest')).toEqual([])
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

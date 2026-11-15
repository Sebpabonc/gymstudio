import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { exerciseVideos, getExerciseVideo } from './exerciseVideos'

describe('getExerciseVideo (#442)', () => {
  it('returns the approved clip for a listed exercise', () => {
    expect(getExerciseVideo('incline-dumbbell-press')).toEqual({
      src: 'exercise-videos/incline-dumbbell-press.mp4',
      poster: 'exercise-videos/incline-dumbbell-press.jpg',
      model: 'Seb',
      status: 'approved',
    })
  })

  it('returns nothing for an exercise without a clip', () => {
    expect(getExerciseVideo('hammer-curls')).toBeUndefined()
    expect(getExerciseVideo(undefined)).toBeUndefined()
    expect(getExerciseVideo('')).toBeUndefined()
  })

  it('only listed ids return a video (no inherited keys)', () => {
    expect(Object.keys(exerciseVideos)).toHaveLength(19)
    expect(Object.values(exerciseVideos).filter((v) => v.status === 'approved')).toHaveLength(8)
    expect(getExerciseVideo('toString')).toBeUndefined()
    expect(getExerciseVideo('__proto__')).toBeUndefined()
    expect(getExerciseVideo('constructor')).toBeUndefined()
  })

  it('uses relative paths to bundled files that exist and stay small', () => {
    for (const video of Object.values(exerciseVideos)) {
      for (const path of [video.src, video.poster]) {
        expect(path.startsWith('/')).toBe(false)
        const file = resolve(__dirname, '../../public', path)
        expect(existsSync(file), path).toBe(true)
      }
      expect(statSync(resolve(__dirname, '../../public', video.src)).size).toBeLessThan(2.2 * 1024 * 1024)
    }
  })
})

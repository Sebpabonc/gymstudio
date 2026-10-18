import { describe, expect, it } from 'vitest'
import { overallProgressStatus } from './status'

describe('approved overall progress status', () => {
  it('stays Building until two lifts have a verdict', () => {
    expect(overallProgressStatus(['improving', 'not-enough-data']).status).toBe('building')
  })

  it('uses the approved improving, lower, and fallback rules', () => {
    expect(overallProgressStatus(['improving', 'held']).status).toBe('progressing')
    expect(overallProgressStatus(['lower', 'held']).status).toBe('dipping')
    expect(overallProgressStatus(['improving', 'lower']).status).toBe('holding')
    expect(overallProgressStatus(['held', 'held']).status).toBe('holding')
  })
})

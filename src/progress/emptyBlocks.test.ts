import { describe, expect, it } from 'vitest'
import { adherence, blockReports, personalRecords, weeklySets } from './index'
import { visibleBlockReports } from './viewModel'

describe('progress without blocks', () => {
  it('computes block-based reports without throwing', () => {
    expect(() => {
      adherence([], [], '2026-10-05')
      personalRecords([], [])
      visibleBlockReports(blockReports([], [], []), [], [])
      weeklySets([], [], [], '2026-10-05')
    }).not.toThrow()
  })
})

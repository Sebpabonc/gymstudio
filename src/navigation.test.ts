import { describe, expect, it } from 'vitest'
import { getNavigationTitle, navigationTabs } from './navigation'

describe('primary navigation', () => {
  it('provides the approved destinations in order', () => {
    expect(navigationTabs.map(({ id, label }) => [id, label])).toEqual([
      ['today', 'Today'],
      ['exercises', 'Exercises'],
      ['progress', 'Progress'],
      ['you', 'You'],
    ])
  })

  it('uses each destination label as its compact header title', () => {
    for (const tab of navigationTabs) {
      expect(getNavigationTitle(tab.id)).toBe(tab.label)
    }
  })
})

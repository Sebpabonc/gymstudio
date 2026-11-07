import { describe, expect, it } from 'vitest'
import { prefersReducedMotion, scrollBehavior } from './motion'

describe('motion preferences', () => {
  it('reads prefers-reduced-motion from matchMedia', () => {
    expect(prefersReducedMotion((query) => ({ matches: query === '(prefers-reduced-motion: reduce)' }))).toBe(true)
    expect(prefersReducedMotion(() => ({ matches: false }))).toBe(false)
  })

  it('treats a missing or failing matchMedia as no preference', () => {
    expect(prefersReducedMotion(undefined)).toBe(false)
    expect(prefersReducedMotion(() => { throw new Error('blocked') })).toBe(false)
  })

  it('jumps instead of smooth scrolling when motion is reduced', () => {
    expect(scrollBehavior(true)).toBe('auto')
    expect(scrollBehavior(false)).toBe('smooth')
  })
})

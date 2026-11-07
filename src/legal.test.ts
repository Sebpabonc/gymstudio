import { describe, expect, it } from 'vitest'
import { legalUrl } from './legal'

describe('legalUrl', () => {
  it('points at the public GitHub Pages legal pages in the app language', () => {
    expect(legalUrl('privacy', 'en')).toBe('https://sebpabonc.github.io/gymstudio/privacy/')
    expect(legalUrl('support', 'es')).toBe('https://sebpabonc.github.io/gymstudio/support/es/')
    expect(legalUrl('terms', 'es')).toBe('https://sebpabonc.github.io/gymstudio/terms/es/')
  })
})

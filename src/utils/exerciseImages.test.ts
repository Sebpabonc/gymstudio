import { describe, expect, it } from 'vitest'
import { exerciseImageQuery, exerciseImageSearchUrl } from './exerciseImages'

describe('exercise image links', () => {
  it('builds a Google Images search URL', () => {
    expect(exerciseImageSearchUrl('seated leg curl machine'))
      .toBe('https://www.google.com/search?tbm=isch&q=seated%20leg%20curl%20machine')
  })

  it('falls back to the name plus equipment when there is no approved query', () => {
    expect(exerciseImageQuery('not-in-catalogue', 'Cable Fly (High to Low)', 'cable'))
      .toBe('Cable Fly High to Low exercise')
    expect(exerciseImageQuery(undefined, 'Pec Deck Fly', 'machine')).toBe('Pec Deck Fly machine exercise')
  })
})

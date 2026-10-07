import { describe, expect, it } from 'vitest'
import { cleanNumberInput } from './numberInput'

const change = (value: string) => ({ target: { value } }) as unknown as Parameters<typeof cleanNumberInput>[0]

describe('cleanNumberInput', () => {
  it('drops leading zeros while typing (PO: "015" on iPhone)', () => {
    const event = change('015')
    expect(cleanNumberInput(event)).toBe('15')
    expect(event.target.value).toBe('15')
  })
  it('keeps zero, decimals and normal values', () => {
    expect(cleanNumberInput(change('0'))).toBe('0')
    expect(cleanNumberInput(change('0.5'))).toBe('0.5')
    expect(cleanNumberInput(change('22.5'))).toBe('22.5')
  })
})

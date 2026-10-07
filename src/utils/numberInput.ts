import type React from 'react'

/** Number inputs: drop leading zeros the browser keeps while typing (iOS showed "015"). */
export function cleanNumberInput(event: React.ChangeEvent<HTMLInputElement>) {
  const cleaned = event.target.value.replace(/^0+(?=\d)/, '')
  if (cleaned !== event.target.value) event.target.value = cleaned
  return cleaned
}

/** Select the whole value on focus so typing replaces it instead of appending. */
export const selectOnFocus = (event: React.FocusEvent<HTMLInputElement>) => event.currentTarget.select()

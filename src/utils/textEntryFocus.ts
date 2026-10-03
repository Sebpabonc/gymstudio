import { useEffect, useState } from 'react'

const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image'])

export function isTextEntryElement(element: { tagName?: string; type?: string } | null | undefined) {
  const tag = element?.tagName?.toUpperCase()
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') return !NON_TEXT_INPUT_TYPES.has((element?.type ?? 'text').toLowerCase())
  return false
}

/** True while an input, textarea or select has focus (on-screen keyboard likely open). */
export function useTextEntryFocused() {
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => setFocused(isTextEntryElement(event.target as HTMLInputElement | null))
    const onFocusOut = () => setFocused(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return focused
}

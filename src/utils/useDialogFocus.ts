import { RefObject, useEffect, useRef } from 'react'

/** Elements a keyboard user can reach with Tab inside a dialog. */
export const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  'input:not(:disabled):not([type="hidden"])',
  'textarea:not(:disabled)',
  'select:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Decides where Tab should go inside a dialog. Returns the element to focus,
 * or null when the browser's default Tab move already stays inside.
 */
export function nextDialogFocus<T>(targets: readonly T[], active: T | null, container: T, shift: boolean, contains: (node: T | null) => boolean): T | null {
  if (!targets.length) return container
  const first = targets[0]
  const last = targets[targets.length - 1]
  if (!contains(active) || active === container) return shift ? last : first
  if (shift && active === first) return last
  if (!shift && active === last) return first
  return null
}

function focusable(element: Element | null | undefined): HTMLElement | null {
  return element && typeof (element as HTMLElement).focus === 'function' ? element as HTMLElement : null
}

// Only the most recently opened dialog reacts to Tab/Escape (a sheet opened from another sheet).
const dialogStack: object[] = []

export function isTopDialog(token: object) {
  return dialogStack[dialogStack.length - 1] === token
}

export function pushDialog(token: object) {
  dialogStack.push(token)
}

export function removeDialog(token: object) {
  const index = dialogStack.lastIndexOf(token)
  if (index >= 0) dialogStack.splice(index, 1)
}

/**
 * Modal dialog focus: moves focus into the dialog when it opens, keeps Tab
 * inside it, closes it on Escape (when onEscape is given) and gives focus
 * back to whatever was focused before it opened.
 */
export function useDialogFocus(ref: RefObject<HTMLElement>, active = true, onEscape?: () => void) {
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined
    const token = {}
    pushDialog(token)
    const previousFocus = focusable(document.activeElement)
    const dialog = ref.current
    if (dialog) {
      if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1')
      if (!dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true })
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const container = ref.current
      if (!container || !isTopDialog(token)) return
      if (event.key === 'Escape' && escapeRef.current) {
        event.preventDefault()
        escapeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const targets = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.getClientRects().length > 0)
      const active = focusable(document.activeElement)
      const target = nextDialogFocus<HTMLElement>(targets, active, container, event.shiftKey, (node) => !!node && container.contains(node))
      if (target) {
        event.preventDefault()
        target.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      removeDialog(token)
      if (previousFocus && previousFocus.isConnected !== false) previousFocus.focus({ preventScroll: true })
    }
  }, [active, ref])
}

/**
 * Props for a control that is visually hidden (opacity 0) but stays mounted:
 * removes it from the Tab order and the accessibility tree while hidden.
 * React 18 has no typed `inert`, so it is passed as an empty-string attribute.
 */
export function hiddenControlProps(hidden: boolean): Record<string, string | boolean> {
  return hidden ? { inert: '', 'aria-hidden': true } : {}
}

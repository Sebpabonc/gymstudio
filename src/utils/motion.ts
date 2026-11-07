/** True when the user asked the OS to reduce motion. Safe outside the browser. */
export function prefersReducedMotion(matchMedia: ((query: string) => { matches: boolean }) | undefined =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined): boolean {
  try {
    return !!matchMedia?.('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Scroll behaviour that honours prefers-reduced-motion: an instant jump instead of a smooth scroll. */
export function scrollBehavior(reduced = prefersReducedMotion()): ScrollBehavior {
  return reduced ? 'auto' : 'smooth'
}

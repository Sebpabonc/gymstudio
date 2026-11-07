import type { KeyboardEvent } from 'react'

/** ARIA tab pattern: which tab index a key moves to (wrapping), or null for keys it ignores. */
export function tabKeyIndex(key: string, current: number, count: number): number | null {
  if (count <= 0) return null
  if (key === 'ArrowRight') return (current + 1) % count
  if (key === 'ArrowLeft') return (current - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

/**
 * Keyboard handler for a role="tablist": Left/Right/Home/End select the tab
 * (automatic activation) and move focus to it. Tabs use a roving tabindex.
 */
export function onTabListKeyDown<T>(event: KeyboardEvent<HTMLElement>, tabs: readonly T[], selected: T, select: (tab: T) => void) {
  const next = tabKeyIndex(event.key, Math.max(0, tabs.indexOf(selected)), tabs.length)
  if (next === null) return
  event.preventDefault()
  select(tabs[next])
  event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
}

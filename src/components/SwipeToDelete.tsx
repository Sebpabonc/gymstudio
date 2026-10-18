import React, { useRef, useState } from 'react'

const REVEAL = 88

export function createSwipeToDeleteHandlers(onDelete: () => void, onClose: () => void) {
  const requestDelete = () => {
    onClose()
    onDelete()
  }
  return { onTapDelete: requestDelete, onSwipeDelete: requestDelete }
}

/**
 * Swipe a row left to reveal a Delete button (PO 2026-10-07: delete a log straight from the exercise's Progress list).
 * Tapping elsewhere or swiping right hides it again. Delete is also available without swiping.
 */
export default function SwipeToDelete({
  label,
  accessibleLabel = label,
  onDelete,
  children,
}: {
  label: string
  accessibleLabel?: string
  onDelete: () => void
  children: React.ReactNode
}) {
  const [offset, setOffset] = useState(0)
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const open = offset <= -REVEAL / 2
  const { onTapDelete, onSwipeDelete } = createSwipeToDeleteHandlers(onDelete, () => setOffset(0))

  return (
    <div className="swipe-row">
      <button
        type="button"
        className="swipe-row-delete"
        aria-label={accessibleLabel}
        tabIndex={open ? 0 : -1}
        onClick={onSwipeDelete}
      >
        {label}
      </button>
      <div
        className="swipe-row-content"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(event) => {
          const touch = event.touches[0]
          start.current = { x: touch.clientX, y: touch.clientY, base: offset }
        }}
        onTouchMove={(event) => {
          if (!start.current) return
          const touch = event.touches[0]
          const dx = touch.clientX - start.current.x
          const dy = touch.clientY - start.current.y
          if (Math.abs(dy) > Math.abs(dx)) return
          setOffset(Math.max(-REVEAL, Math.min(0, start.current.base + dx)))
        }}
        onTouchEnd={() => {
          start.current = null
          setOffset((value) => (value <= -REVEAL / 2 ? -REVEAL : 0))
        }}
        onClick={() => { if (open) setOffset(0) }}
      >
        {children}
        <button
          type="button"
          className="swipe-row-tap-delete"
          aria-label={accessibleLabel}
          onClick={onTapDelete}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

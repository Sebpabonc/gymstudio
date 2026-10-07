import React, { useRef, useState } from 'react'

const REVEAL = 88

/**
 * Swipe a row left to reveal a Delete button (PO 2026-10-07: delete a log straight from the exercise's Progress list).
 * Tapping elsewhere or swiping right hides it again. Keyboard/mouse users get the same button via focus.
 */
export default function SwipeToDelete({
  label,
  onDelete,
  children,
}: {
  label: string
  onDelete: () => void
  children: React.ReactNode
}) {
  const [offset, setOffset] = useState(0)
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const open = offset <= -REVEAL / 2

  return (
    <div className="swipe-row">
      <button
        type="button"
        className="swipe-row-delete"
        aria-label={label}
        tabIndex={open ? 0 : -1}
        onClick={() => {
          setOffset(0)
          onDelete()
        }}
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
      </div>
    </div>
  )
}

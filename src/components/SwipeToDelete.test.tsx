import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import SwipeToDelete, { createSwipeToDeleteHandlers } from './SwipeToDelete'

describe('SwipeToDelete', () => {
  it('exposes a visible keyboard-accessible tap action', () => {
    const html = renderToStaticMarkup(
      <SwipeToDelete label="Delete" onDelete={() => undefined}>
        <span>Workout entry</span>
      </SwipeToDelete>
    )

    expect(html).toContain('class="swipe-row-tap-delete"')
    expect(html).toContain('aria-label="Delete"')
  })

  it('uses the same delete request for swipe and tap, resetting the reveal first', () => {
    const onDelete = vi.fn()
    const onClose = vi.fn()
    const handlers = createSwipeToDeleteHandlers(onDelete, onClose)

    expect(handlers.onTapDelete).toBe(handlers.onSwipeDelete)
    handlers.onTapDelete()

    expect(onClose).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledOnce()
  })
})

import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary'
import { isChunkLoadError } from '../utils/chunkReload'

describe('ErrorBoundary', () => {
  it('renders the fallback with a reload button', () => {
    const html = renderToString(<ErrorFallback />)
    expect(html).toContain('Something went wrong')
    expect(html).toContain('Reload app')
  })

  it('switches to the fallback after an error', () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ hasError: true })
  })

  it('renders children when there is no error', () => {
    expect(renderToString(<ErrorBoundary><p>ok</p></ErrorBoundary>)).toContain('ok')
  })

  it('detects chunk load errors', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /a.js'))).toBe(true)
    expect(isChunkLoadError(new Error('boom'))).toBe(false)
  })
})

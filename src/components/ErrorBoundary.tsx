import React from 'react'
import { isChunkLoadError, reloadOnceForChunkError } from '../utils/chunkReload'

type State = { hasError: boolean }

export function ErrorFallback() {
  return (
    <div role="alert" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>The app could not be displayed. Reloading usually fixes it.</p>
      <button type="button" onClick={() => window.location.reload()}>
        Reload app
      </button>
    </div>
  )
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) reloadOnceForChunkError()
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children
  }
}

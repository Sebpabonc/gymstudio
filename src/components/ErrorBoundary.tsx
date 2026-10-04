import React from 'react'
import { getLanguage } from '../utils/storage'
import { createTranslator, detectLanguage } from '../i18n/translate'
import { isChunkLoadError, reloadOnceForChunkError } from '../utils/chunkReload'

type State = { hasError: boolean }

export function ErrorFallback() {
  const t = createTranslator(getLanguage() ?? detectLanguage())
  return (
    <div role="alert" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      <h1>{t('error.title')}</h1>
      <p>{t('error.body')}</p>
      <button type="button" onClick={() => window.location.reload()}>
        {t('error.reload')}
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

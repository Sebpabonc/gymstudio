import { getSessionStorageValue, setSessionStorageValue } from './storage'

const RELOAD_FLAG = 'gym-studio.chunk-reload'

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk .* failed|ChunkLoadError/i.test(
    message,
  )
}

/** Reloads the page once per session; returns false if a reload was already attempted. */
export function reloadOnceForChunkError(reload: () => void = () => window.location.reload()): boolean {
  if (getSessionStorageValue(RELOAD_FLAG)) return false
  setSessionStorageValue(RELOAD_FLAG, '1')
  reload()
  return true
}

export function installChunkErrorHandlers(target: Pick<Window, 'addEventListener'> = window) {
  target.addEventListener('vite:preloadError', (event) => {
    if (reloadOnceForChunkError()) event.preventDefault()
  })
  target.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError((event as PromiseRejectionEvent).reason)) reloadOnceForChunkError()
  })
}

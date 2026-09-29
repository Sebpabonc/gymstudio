import { useEffect, useState } from 'react'

/**
 * Tiny hash router: works on GitHub Pages and inside Capacitor without server config.
 *   #/                 → home (search)
 *   #/exercise/:id     → exercise page
 */
export type Route = { name: 'home' } | { name: 'exercise'; exerciseId: string }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  const match = path.match(/^\/exercise\/([^/]+)\/?$/)
  if (match) return { name: 'exercise', exerciseId: decodeURIComponent(match[1]) }
  return { name: 'home' }
}

let navigatedInApp = false

export function navigate(path: string) {
  navigatedInApp = true
  window.location.hash = path
}

/** Goes back within the app if possible, otherwise to home. */
export function goBack() {
  if (navigatedInApp && window.history.length > 1) window.history.back()
  else window.location.hash = '/'
}

export const exercisePath = (exerciseId: string) => `/exercise/${encodeURIComponent(exerciseId)}`

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

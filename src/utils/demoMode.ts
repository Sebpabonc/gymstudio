const DEMO_SESSION_KEY = 'gym-studio.demo-mode'
// PO 2026-11-07: a new-user demo to test the first run without an account or email. Its data lives in its own
// namespace and starts empty every time it is opened.
const NEW_USER_PREFIX = 'gym-studio.demo-new.'

export function initializeDemoMode() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const demo = url.searchParams.get('demo')

  if (demo === 'new') {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith(NEW_USER_PREFIX)) window.localStorage.removeItem(key)
    window.sessionStorage.setItem(DEMO_SESSION_KEY, 'new')
    url.searchParams.delete('demo')
    window.history.replaceState(window.history.state, '', url)
  } else if (demo === '1') {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, '1')
    url.searchParams.delete('demo')
    window.history.replaceState(window.history.state, '', url)
  } else if (demo === '0') {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY)
    url.searchParams.delete('demo')
    window.location.replace(url.toString())
  }
}

export function isDemoMode() {
  if (typeof sessionStorage === 'undefined') return false
  const mode = sessionStorage.getItem(DEMO_SESSION_KEY)
  return mode === '1' || mode === 'new'
}

/** The new-user demo: no generated history, the first run instead, and a personal plan kept on this device. */
export function isNewUserDemo() {
  return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DEMO_SESSION_KEY) === 'new'
}

export const NEW_USER_DEMO_URL = '?demo=new'

export function exitDemoMode() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(DEMO_SESSION_KEY)
  const url = new URL(window.location.href)
  url.searchParams.delete('demo')
  window.location.replace(url.toString())
}

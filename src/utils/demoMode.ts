const DEMO_SESSION_KEY = 'gym-studio.demo-mode'

export function initializeDemoMode() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const demo = url.searchParams.get('demo')

  if (demo === '1') {
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
  return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DEMO_SESSION_KEY) === '1'
}

export function exitDemoMode() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(DEMO_SESSION_KEY)
  const url = new URL(window.location.href)
  url.searchParams.delete('demo')
  window.location.replace(url.toString())
}

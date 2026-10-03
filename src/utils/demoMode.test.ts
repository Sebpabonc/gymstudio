import { afterEach, describe, expect, it, vi } from 'vitest'
import { exitDemoMode, initializeDemoMode, isDemoMode } from './demoMode'

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  }
}

function stubWindow(href: string) {
  const sessionStorage = createMemoryStorage()
  const replace = vi.fn()
  const replaceState = vi.fn()
  vi.stubGlobal('sessionStorage', sessionStorage)
  vi.stubGlobal('window', {
    sessionStorage,
    location: { href, replace },
    history: { state: null, replaceState },
  })
  return { sessionStorage, replace, replaceState }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('demo mode', () => {
  it('persists the demo flag for the session and removes the query parameter', () => {
    const { sessionStorage, replaceState } = stubWindow('https://example.test/app/?demo=1&tab=track')

    initializeDemoMode()

    expect(sessionStorage.getItem('gym-studio.demo-mode')).toBe('1')
    expect(isDemoMode()).toBe(true)
    const cleanUrl = replaceState.mock.calls[0][2] as URL
    expect(cleanUrl.searchParams.has('demo')).toBe(false)
    expect(cleanUrl.searchParams.get('tab')).toBe('track')
  })

  it('clears demo mode and reloads without the demo query', () => {
    const { sessionStorage, replace } = stubWindow('https://example.test/app/?demo=0')
    sessionStorage.setItem('gym-studio.demo-mode', '1')

    initializeDemoMode()

    expect(isDemoMode()).toBe(false)
    expect(replace).toHaveBeenCalledWith('https://example.test/app/')
  })

  it('exits demo mode without re-enabling it on reload', () => {
    const { sessionStorage, replace } = stubWindow('https://example.test/app/?demo=1')
    sessionStorage.setItem('gym-studio.demo-mode', '1')

    exitDemoMode()

    expect(isDemoMode()).toBe(false)
    expect(replace).toHaveBeenCalledWith('https://example.test/app/')
  })
})

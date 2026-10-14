import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTranslator, localeFor } from '../i18n/translate'

const auth = {
  user: { id: 'account', email: 'lifter@example.com', user_metadata: {} },
  signOut: vi.fn(),
  syncStatus: 'synced',
  lastSyncedAt: null,
  syncErrorDetail: 'Unknown exercise',
  syncSignInRequired: false,
  pendingSyncCount: 2,
  quarantinedEntries: [{
    id: 'entry', exerciseId: 'Bench press', date: '2026-10-14', sets: [],
    dirty: true, updatedAt: '2026-10-14T10:00:00Z',
    syncError: { code: 'UNKNOWN_EXERCISE', message: 'Unknown exercise', at: '2026-10-14T10:00:00Z' },
  }],
  retrySyncNow: vi.fn(),
  retryQuarantinedEntry: vi.fn(),
}
let language: 'en' | 'es' = 'en'
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => auth }))
vi.mock('../i18n', () => ({
  useT: () => ({ language, locale: localeFor(language), t: createTranslator(language) }),
}))
vi.mock('./ProfileDataSections', () => ({ default: () => null }))
import ProfileScreen from './ProfileScreen'

describe('profile sync feedback', () => {
  beforeEach(() => {
    language = 'en'
    auth.syncSignInRequired = false
  })

  it('shows the pending count, quarantine reason and retry controls even after a successful pull', () => {
    const html = renderToStaticMarkup(<ProfileScreen onClose={() => undefined} />)
    expect(html).toContain('2 logs not uploaded')
    expect(html).toContain('Last sync error: Unknown exercise')
    expect(html).toContain('Logs needing attention')
    expect(html).toContain('Bench press')
    expect(html).toContain('2026')
    expect(html).toContain('Retry now')
    expect(html).toContain('Retry Bench press logged on')
  })

  it('localizes sign-in recovery and pending feedback into Spanish', () => {
    language = 'es'
    auth.syncSignInRequired = true
    const html = renderToStaticMarkup(<ProfileScreen onClose={() => undefined} />)
    expect(html).toContain('Inicia sesión de nuevo para sincronizar')
    expect(html).toContain('2 registros sin subir')
    expect(html).toContain('Reintentar ahora')
    expect(html).toContain('Registros que necesitan atención')
    expect(html).toContain('Último error de sincronización: Unknown exercise')
  })
})

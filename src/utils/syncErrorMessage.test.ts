import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import { syncErrorKey } from './syncErrorMessage'

describe('syncErrorKey (QA 2026-11-07: no raw developer errors on You)', () => {
  it('maps quarantined logs to plain reasons', () => {
    expect(syncErrorKey({ code: 'VALIDATION', message: 'date must be a valid YYYY-MM-DD date' })).toBe('profile.syncError.validation')
    expect(syncErrorKey({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe('profile.syncError.validation')
    expect(syncErrorKey({ code: '22P02', message: 'invalid input syntax' })).toBe('profile.syncError.validation')
    expect(syncErrorKey({ code: '42501', message: 'new row violates row-level security policy' })).toBe('profile.syncError.permission')
  })

  it('maps the scheduler detail string', () => {
    expect(syncErrorKey('Supabase is unavailable')).toBe('profile.syncError.network')
    expect(syncErrorKey('TypeError: Failed to fetch')).toBe('profile.syncError.network')
    expect(syncErrorKey('SIGN_IN_REQUIRED · Sign in again to sync')).toBe('profile.syncError.signIn')
    expect(syncErrorKey('sets must contain finite non-negative numbers')).toBe('profile.syncError.validation')
    expect(syncErrorKey('PGRST116 · something odd')).toBe('profile.syncError.generic')
    expect(syncErrorKey(undefined)).toBe('profile.syncError.generic')
  })

  it('has Spanish text for every reason', () => {
    const es = createTranslator('es')
    expect(es(syncErrorKey({ code: 'VALIDATION', message: 'x' }))).toBe('Este registro tiene datos no válidos y no se puede subir.')
  })
})

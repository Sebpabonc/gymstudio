import type { TranslationKey } from '../i18n'

// QA 2026-11-07: people see a plain reason in their language; the raw code and message stay for logs only.
export type SyncErrorKey = Extract<TranslationKey,
  'profile.syncError.validation' | 'profile.syncError.permission' | 'profile.syncError.network' |
  'profile.syncError.signIn' | 'profile.syncError.generic'>

/** Maps a sync error (a quarantined log's code, or the scheduler's "code · message" detail) to a user message key. */
export function syncErrorKey(error: { code?: string; message?: string } | string | null | undefined): SyncErrorKey {
  const code = typeof error === 'string' ? error.split(' · ')[0].trim() : String(error?.code ?? '')
  const text = (typeof error === 'string' ? error : `${error?.code ?? ''} ${error?.message ?? ''}`).toLowerCase()
  if (code === 'SIGN_IN_REQUIRED' || /sign in again|jwt.*expired|pgrst30[13]/.test(text)) return 'profile.syncError.signIn'
  if (code === '42501' || /permission denied|row-level security/.test(text)) return 'profile.syncError.permission'
  if (code === 'VALIDATION' || /^(22|23)[a-z0-9]{3}$/i.test(code) ||
      /must be a valid|must not be empty|must contain finite|must be a string|must be an object/.test(text)) {
    return 'profile.syncError.validation'
  }
  if (/unavailable|failed to fetch|network|offline|timeout|timed out|load failed/.test(text)) return 'profile.syncError.network'
  return 'profile.syncError.generic'
}

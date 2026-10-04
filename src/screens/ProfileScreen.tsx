import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { getSupabaseClient } from '../lib/supabaseClient'
import { useT } from '../i18n'

export default function ProfileScreen({ onClose }: { onClose: () => void }) {
  const { t, locale } = useT()
  const { user, signOut, syncStatus, lastSyncedAt } = useAuth()
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    if (!user) return () => { active = false }

    void getSupabaseClient().then(async (client) => {
      if (!client) return
      const { data } = await client.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      if (active && data?.full_name) setFullName(data.full_name)
    }).catch(() => undefined)

    return () => { active = false }
  }, [user])

  const metadata = user?.user_metadata as { full_name?: string; name?: string } | undefined
  const name = fullName || metadata?.full_name || metadata?.name
  const syncMessage = syncStatus === 'syncing'
    ? t('profile.syncing')
    : syncStatus === 'offline'
      ? t('profile.offline')
      : syncStatus === 'error'
        ? t('profile.error')
        : t('profile.synced', {
          when: lastSyncedAt && Date.now() - Date.parse(lastSyncedAt) < 60_000
            ? t('profile.justNow')
            : lastSyncedAt
              ? new Date(lastSyncedAt).toLocaleString(locale)
              : t('profile.justNow'),
        })

  const leaveAccount = async () => {
    setBusy(true)
    const result = await signOut()
    setBusy(false)
    if (result.error) setError(t('profile.signOutError'))
  }

  return (
    <section className="card account-screen profile-screen">
      <button type="button" className="account-back" onClick={onClose}>{t('login.backToToday')}</button>
      <h2>{t('profile.title')}</h2>
      {name && <p className="profile-name">{name}</p>}
      <p className="profile-email">{user?.email}</p>
      <p className="account-message" role="status" aria-live="polite">
        {syncMessage}
      </p>
      <button type="button" className="secondary-button profile-signout" onClick={leaveAccount} disabled={busy}>
        {busy ? t('profile.signingOut') : t('profile.signOut')}
      </button>
      {error && <p className="account-error" role="alert">{error}</p>}
    </section>
  )
}

import CollapsibleCard from './CollapsibleCard'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { getSupabaseClient } from '../lib/supabaseClient'
import { useT } from '../i18n'
import ProfileDataSections from './ProfileDataSections'
import { loadExercises, loadRestBetweenSets, saveRestBetweenSets } from '../utils/storage'
import type { Exercise } from '../types'

export default function ProfileScreen({ onClose }: { onClose: () => void }) {
  const { t, locale, language } = useT()
  const { user, signOut, syncStatus, lastSyncedAt, syncErrorDetail, syncSignInRequired,
    pendingSyncCount, quarantinedEntries, retrySyncNow, retryQuarantinedEntry } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [restBetweenSets, setRestBetweenSets] = useState(loadRestBetweenSets)

  useEffect(() => {
    let active = true
    void loadExercises().then(library => { if (active) setExercises(library) }).catch(() => undefined)
    return () => { active = false }
  }, [])

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
  const syncMessage = syncSignInRequired
    ? t('profile.syncSignInRequired')
    : syncStatus === 'syncing'
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
    <>
      <CollapsibleCard className="card account-screen profile-screen" titleId="profile-account-title" title={t('profile.title')} defaultOpen>
        <button type="button" className="account-back" onClick={onClose}>{t('login.backToToday')}</button>
        {name && <p className="profile-name">{name}</p>}
        <p className="profile-email">{user?.email}</p>
        <fieldset className="profile-rest-setting">
          <legend>{t('profile.restBetweenSets')}</legend>
          <p>{t('profile.restBetweenSetsHelp')}</p>
          <div className="profile-rest-options">
            {[60, 90, 120, 150, 180].map((seconds) => (
              <button
                key={seconds}
                type="button"
                className={restBetweenSets === seconds ? 'chip active' : 'chip'}
                aria-pressed={restBetweenSets === seconds}
                onClick={() => {
                  setRestBetweenSets(seconds)
                  saveRestBetweenSets(seconds)
                }}
              >
                {t('workout.custom.restChoice', { seconds })}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="account-message" role="status" aria-live="polite">
          {syncMessage}
        </p>
        <p className="sync-pending-summary" role="status">{t('profile.pendingLogs', { count: pendingSyncCount })}</p>
        {syncErrorDetail && (
          <p className="sync-error-detail">{t('profile.lastSyncError', { reason: syncErrorDetail })}</p>
        )}
        <button type="button" className="secondary-button" onClick={retrySyncNow} disabled={syncStatus === 'syncing'}>
          {t('profile.retryNow')}
        </button>
        {quarantinedEntries.length > 0 && (
          <section className="sync-quarantine" aria-labelledby="sync-quarantine-title">
            <h3 id="sync-quarantine-title">{t('profile.quarantinedLogs')}</h3>
            <ul>
              {quarantinedEntries.map(entry => {
                const exercise = exercises.find(item => item.id === entry.exerciseId)
                const name = (language === 'es' ? exercise?.nameEs : undefined) || exercise?.name || String(entry.exerciseId)
                const rawDate = String(entry.date)
                const parsedDate = new Date(`${rawDate}T12:00:00Z`)
                const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && Number.isFinite(parsedDate.getTime()) &&
                  parsedDate.toISOString().slice(0, 10) === rawDate
                const date = validDate ? new Date(`${rawDate}T12:00:00`).toLocaleDateString(locale) : rawDate
                return (
                  <li key={entry.id}>
                    <strong>{name}</strong>
                    <span>{date}</span>
                    <p>{entry.syncError?.message}</p>
                    <button type="button" className="secondary-button" disabled={syncStatus === 'syncing'}
                      aria-label={t('profile.retryLog', { name, date })} onClick={() => retryQuarantinedEntry(entry.id)}>
                      {t('profile.retry')}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        <button type="button" className="secondary-button profile-signout" onClick={leaveAccount} disabled={busy}>
          {busy ? t('profile.signingOut') : t('profile.signOut')}
        </button>
        {error && <p className="account-error" role="alert">{error}</p>}
      </CollapsibleCard>
      <ProfileDataSections />
    </>
  )
}

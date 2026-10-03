import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { getSupabaseClient } from '../lib/supabaseClient'

export default function ProfileScreen({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth()
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

  const leaveAccount = async () => {
    setBusy(true)
    const result = await signOut()
    setBusy(false)
    if (result.error) setError('Unable to sign out. Please try again.')
  }

  return (
    <section className="card account-screen profile-screen">
      <button type="button" className="account-back" onClick={onClose}>← Back to workout</button>
      <h2>Your profile</h2>
      {name && <p className="profile-name">{name}</p>}
      <p className="profile-email">{user?.email}</p>
      <p className="account-message">Sync: coming soon</p>
      <button type="button" className="secondary-button profile-signout" onClick={leaveAccount} disabled={busy}>
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <p className="account-error" role="alert">{error}</p>}
    </section>
  )
}

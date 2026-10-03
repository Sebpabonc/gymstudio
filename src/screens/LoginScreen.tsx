import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

type LoginMode = 'sign-in' | 'sign-up'

function friendlyError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('provider is not enabled') || normalized.includes('provider not enabled')) {
    return "Google sign-in isn't set up yet."
  }
  if (normalized.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (normalized.includes('invalid login credentials') || normalized.includes('wrong password')) {
    return 'Incorrect email or password.'
  }
  if (normalized.includes('too many') || normalized.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (normalized.includes('sign-in unavailable offline')) return 'Sign-in unavailable offline.'
  return 'Something went wrong. Please try again.'
}

export default function LoginScreen({ onClose }: { onClose: () => void }) {
  const { available, status, signInWithPassword, signUp, resetPassword, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<LoginMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setErrorMessage('')
    setNotice('')
    const result = mode === 'sign-in'
      ? await signInWithPassword(email.trim(), password)
      : await signUp(email.trim(), password)
    setBusy(false)
    if (result.error) {
      setErrorMessage(friendlyError(result.error))
    } else if (result.needsConfirmation) {
      setNotice('Check your email to confirm your account.')
    }
  }

  const sendReset = async () => {
    if (!email.trim()) {
      setErrorMessage('Enter your email address first.')
      return
    }
    setBusy(true)
    setErrorMessage('')
    setNotice('')
    const result = await resetPassword(email.trim())
    setBusy(false)
    if (result.error) setErrorMessage(friendlyError(result.error))
    else setNotice('If an account exists for that email, a password reset link is on its way.')
  }

  const continueWithGoogle = async () => {
    setBusy(true)
    setErrorMessage('')
    setNotice('')
    const result = await signInWithGoogle()
    setBusy(false)
    if (result.error) setErrorMessage(friendlyError(result.error))
  }

  if (status === 'loading') {
    return <section className="card account-screen" aria-live="polite"><p>Loading account…</p></section>
  }

  if (!available) {
    return (
      <section className="card account-screen">
        <button type="button" className="account-back" onClick={onClose}>← Back to Today</button>
        <h2>Account</h2>
        <p className="account-message">Sign-in unavailable offline.</p>
      </section>
    )
  }

  return (
    <section className="card account-screen">
      <button type="button" className="account-back" onClick={onClose}>← Back to Today</button>
      <h2>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
      <div className="account-mode-tabs" role="tablist" aria-label="Account action">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sign-in'}
          className={mode === 'sign-in' ? 'active' : ''}
          onClick={() => { setMode('sign-in'); setErrorMessage(''); setNotice('') }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sign-up'}
          className={mode === 'sign-up' ? 'active' : ''}
          onClick={() => { setMode('sign-up'); setErrorMessage(''); setNotice('') }}
        >
          Create account
        </button>
      </div>

      <form className="account-form" onSubmit={submit}>
        <label className="account-label" htmlFor="account-email">Email</label>
        <input
          id="account-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="account-label" htmlFor="account-password">Password</label>
        <div className="password-field">
          <input
            id="account-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {mode === 'sign-in' && (
          <button type="button" className="forgot-password" onClick={sendReset} disabled={busy}>
            Forgot password?
          </button>
        )}
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="account-divider"><span>or</span></div>
      <button type="button" className="google-button" onClick={continueWithGoogle} disabled={busy}>
        <span className="google-mark" aria-hidden="true">G</span>
        Continue with Google
      </button>
      {errorMessage && <p className="account-error" role="alert">{errorMessage}</p>}
      {notice && <p className="account-message" role="status">{notice}</p>}
    </section>
  )
}

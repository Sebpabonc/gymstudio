import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { hasGuestWorkoutData } from '../utils/storage'
import { Translate, useT } from '../i18n'

type LoginMode = 'sign-in' | 'sign-up'

function friendlyError(message: string, t: Translate) {
  const normalized = message.toLowerCase()
  if (normalized.includes('provider is not enabled') || normalized.includes('provider not enabled')) {
    return t('login.googleNotSetUp')
  }
  if (normalized.includes('email not confirmed')) return t('login.confirmEmail')
  if (normalized.includes('invalid login credentials') || normalized.includes('wrong password')) {
    return t('login.badCredentials')
  }
  if (normalized.includes('too many') || normalized.includes('rate limit')) {
    return t('login.tooMany')
  }
  if (normalized.includes('user already registered') || normalized.includes('already been registered')) {
    return t('login.alreadyRegistered')
  }
  if (normalized.includes('password should be') || normalized.includes('weak password')) return t('login.weakPassword')
  if (normalized.includes('sign-in unavailable offline')) return t('login.offline')
  return t('login.generic')
}

export default function LoginScreen({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const { available, status, signInWithPassword, signUp, resetPassword, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<LoginMode>(() => hasGuestWorkoutData() ? 'sign-in' : 'sign-up')
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
      setErrorMessage(friendlyError(result.error, t))
    } else if (result.needsConfirmation) {
      setNotice(t('login.checkEmail'))
    }
  }

  const sendReset = async () => {
    if (!email.trim()) {
      setErrorMessage(t('login.enterEmail'))
      return
    }
    setBusy(true)
    setErrorMessage('')
    setNotice('')
    const result = await resetPassword(email.trim())
    setBusy(false)
    if (result.error) setErrorMessage(friendlyError(result.error, t))
    else setNotice(t('login.resetSent'))
  }

  const continueWithGoogle = async () => {
    setBusy(true)
    setErrorMessage('')
    setNotice('')
    const result = await signInWithGoogle()
    setBusy(false)
    if (result.error) setErrorMessage(friendlyError(result.error, t))
  }

  if (status === 'loading') {
    return <section className="card account-screen" aria-live="polite"><p>{t('account.loading')}</p></section>
  }

  if (!available) {
    return (
      <section className="card account-screen">
        <button type="button" className="account-back" onClick={onClose}>{t('login.backToToday')}</button>
        <h2>{t('login.account')}</h2>
        <p className="account-message">{t('login.offline')}</p>
      </section>
    )
  }

  return (
    <section className="card account-screen">
      <button type="button" className="account-back" onClick={onClose}>{t('login.backToToday')}</button>
      <h2>{mode === 'sign-in' ? t('login.welcomeBack') : t('login.createTitle')}</h2>
      <ul className="account-benefits">
        <li>{t('login.benefit1')}</li>
        <li>{t('login.benefit2')}</li>
        <li>{t('login.benefit3')}</li>
      </ul>
      <p className="account-local-data">
        {t('login.localData')}
      </p>
      <details className="account-privacy">
        <summary>{t('login.privacyNote')}</summary>
        <p>{t('login.privacyBody')}</p>
      </details>
      <div className="account-mode-tabs" role="tablist" aria-label={t('login.accountAction')}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sign-in'}
          className={mode === 'sign-in' ? 'active' : ''}
          onClick={() => { setMode('sign-in'); setErrorMessage(''); setNotice('') }}
        >
          {t('login.signIn')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sign-up'}
          className={mode === 'sign-up' ? 'active' : ''}
          onClick={() => { setMode('sign-up'); setErrorMessage(''); setNotice('') }}
        >
          {t('login.createAccount')}
        </button>
      </div>

      <form className="account-form" onSubmit={submit}>
        <label className="account-label" htmlFor="account-email">{t('login.email')}</label>
        <input
          id="account-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="account-label" htmlFor="account-password">{t('login.password')}</label>
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
            {showPassword ? t('login.hide') : t('login.show')}
          </button>
        </div>
        {mode === 'sign-in' && (
          <button type="button" className="forgot-password" onClick={sendReset} disabled={busy}>
            {t('login.forgot')}
          </button>
        )}
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? t('login.wait') : mode === 'sign-in' ? t('login.signIn') : t('login.createAccount')}
        </button>
      </form>

      <div className="account-divider"><span>{t('login.or')}</span></div>
      <button type="button" className="google-button" onClick={continueWithGoogle} disabled={busy}>
        <span className="google-mark" aria-hidden="true">G</span>
        {t('login.google')}
      </button>
      {errorMessage && <p className="account-error" role="alert">{errorMessage}</p>}
      {notice && <p className="account-message" role="status">{notice}</p>}
    </section>
  )
}

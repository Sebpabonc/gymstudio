import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = {
  available: false,
  status: 'signed-out',
  syncSignInRequired: false,
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  passwordRecovery: false,
  updatePassword: vi.fn(),
  signInWithGoogle: vi.fn(),
}
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => auth,
}))

import LoginScreen from './LoginScreen'

describe('LoginScreen', () => {
  beforeEach(() => {
    auth.available = false
    auth.syncSignInRequired = false
    auth.passwordRecovery = false
  })

  it('keeps a demo path visible in the signed-out offline card', () => {
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} />)

    expect(html).toContain('Sign-in unavailable offline.')
    expect(html.match(/class="card account-screen"/g)).toHaveLength(1)
    expect(html).toContain('class="secondary-button login-demo-button" href="?demo=1"')
    expect(html).toContain('Try the demo')
  })

  it('QA #61: the sign-in / create-account switch is a pressed-button group, not a tablist without panels', () => {
    auth.available = true
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} />)
    expect(html).not.toContain('role="tablist"')
    expect(html).not.toContain('role="tab"')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-pressed="false"')
  })

  it('shows an accessible reauth message and sign-in form after automatic signout', () => {
    auth.available = true
    auth.syncSignInRequired = true
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} />)
    expect(html).toContain('role="status" aria-live="polite">Sign in again to sync')
    expect(html).toContain('Welcome back')
    expect(html.toLowerCase()).toContain('autocomplete="current-password"')
  })

  it('shows the new-password form for a recovery session', () => {
    auth.available = true
    auth.status = 'signed-in'
    auth.passwordRecovery = true
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} />)

    expect(html).toContain('Set a new password')
    expect(html).toContain('New password')
    expect(html).toContain('Confirm new password')
    expect(html).toContain('id="recovery-password"')
  })

  it('requires the unticked 18+ box before creating an account with email or Google', () => {
    auth.available = true
    auth.status = 'signed-out'
    auth.passwordRecovery = false
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} initialMode="sign-up" />)
    expect(html).toContain('I am 18 or older and I accept the Terms and Privacy Policy.')
    expect(html).toMatch(/type="checkbox"\/>/)
    expect(html).toMatch(/<button type="submit" class="primary-button" disabled="">Create account/)
    expect(html).toMatch(/class="google-button" disabled=""/)
  })

  it('does not ask for the 18+ box when signing in', () => {
    auth.available = true
    auth.status = 'signed-out'
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} initialMode="sign-in" />)
    expect(html).not.toContain('I am 18 or older')
    expect(html).toMatch(/class="google-button">/)
  })
})

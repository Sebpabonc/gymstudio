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
})

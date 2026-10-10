import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    available: false,
    status: 'signed-out',
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    signInWithGoogle: vi.fn(),
  }),
}))

import LoginScreen from './LoginScreen'

describe('LoginScreen', () => {
  it('keeps a demo path visible in the signed-out offline card', () => {
    const html = renderToStaticMarkup(<LoginScreen onClose={() => undefined} />)

    expect(html).toContain('Sign-in unavailable offline.')
    expect(html.match(/class="card account-screen"/g)).toHaveLength(1)
    expect(html).toContain('class="secondary-button login-demo-button" href="?demo=1"')
    expect(html).toContain('Try the demo')
  })
})

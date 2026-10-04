import { describe, expect, it } from 'vitest'
import { NATIVE_AUTH_CALLBACK, parseNativeAuthCallback } from './nativeOAuth'

describe('parseNativeAuthCallback', () => {
  it('reads the PKCE code from the app deep link', () => {
    expect(parseNativeAuthCallback(`${NATIVE_AUTH_CALLBACK}?code=abc123`)).toEqual({ code: 'abc123', error: null })
  })

  it('reports OAuth errors', () => {
    expect(parseNativeAuthCallback(`${NATIVE_AUTH_CALLBACK}?error=access_denied&error_description=User%20cancelled`))
      .toEqual({ code: null, error: 'User cancelled' })
  })

  it('ignores other deep links', () => {
    expect(parseNativeAuthCallback('gymstudio://something-else?code=x')).toBeNull()
    expect(parseNativeAuthCallback('https://sebpabonc.github.io/gymstudio/?code=x')).toBeNull()
  })
})

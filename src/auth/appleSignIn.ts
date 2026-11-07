import type { SupabaseClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

/** iOS bundle id, also the Apple provider's Client ID in Supabase (Authentication → Providers → Apple). */
export const APPLE_CLIENT_ID = 'com.gymstudioapp.app'

/** Sign in with Apple is offered in the iPhone app only (App Store guideline 4.8); the web keeps email and Google. */
export function isAppleSignInAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

type AppleAuthorize = (options: { clientId: string; redirectURI: string; scopes: string; nonce: string }) =>
  Promise<{ response: { identityToken: string; givenName: string | null; familyName: string | null } }>

async function nativeAuthorize(): Promise<AppleAuthorize> {
  const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
  return (options) => SignInWithApple.authorize(options)
}

/**
 * Native Sign in with Apple: Apple gets the SHA-256 of a one-time nonce, Supabase gets the raw nonce and checks
 * the identity token against it. Apple shares the person's name only on the first sign-in, so it is kept then.
 * Returns an error message, or null on success; a cancelled sheet is not an error.
 */
export async function signInWithAppleNative(client: SupabaseClient, authorize?: AppleAuthorize): Promise<string | null> {
  const nonce = randomNonce()
  let response: Awaited<ReturnType<AppleAuthorize>>['response']
  try {
    const run = authorize ?? await nativeAuthorize()
    response = (await run({ clientId: APPLE_CLIENT_ID, redirectURI: '', scopes: 'email name', nonce: await sha256Hex(nonce) })).response
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // ASAuthorizationError.canceled (1001): the person closed the sheet.
    return /1001|cancel/i.test(message) ? null : message
  }
  const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token: response.identityToken, nonce })
  if (error) return error.message
  const fullName = [response.givenName, response.familyName].filter(Boolean).join(' ')
  if (fullName) await client.auth.updateUser({ data: { full_name: fullName } })
  return null
}

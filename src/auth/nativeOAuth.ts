import type { SupabaseClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

/** Deep link the iOS/Android app registers (Info.plist CFBundleURLSchemes = "gymstudio"). */
export const NATIVE_AUTH_CALLBACK = 'gymstudio://auth-callback'

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

/** Reads the PKCE code (or an OAuth error) from the deep link Supabase redirects to. */
export function parseNativeAuthCallback(url: string): { code: string | null; error: string | null } | null {
  if (!url.startsWith(NATIVE_AUTH_CALLBACK)) return null
  const query = url.split('?')[1]?.split('#')[0] ?? ''
  const params = new URLSearchParams(query)
  return {
    code: params.get('code'),
    error: params.get('error_description') ?? params.get('error'),
  }
}

/**
 * Native Google sign-in: open the provider page in an in-app browser instead of navigating the
 * app's WebView (which would end on the web site), then come back through the deep link.
 */
export async function startNativeGoogleOAuth(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: NATIVE_AUTH_CALLBACK, skipBrowserRedirect: true },
  })
  if (error || !data?.url) return error?.message ?? 'Google sign-in is unavailable.'
  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url: data.url, presentationStyle: 'popover' })
  return null
}

/** Finishes native sign-in when the deep link arrives; returns an unsubscribe function. */
export async function listenForNativeAuthCallback(client: SupabaseClient): Promise<() => void> {
  const { App } = await import('@capacitor/app')
  const { Browser } = await import('@capacitor/browser')
  const handle = await App.addListener('appUrlOpen', async ({ url }) => {
    const callback = parseNativeAuthCallback(url)
    if (!callback) return
    await Browser.close().catch(() => undefined)
    if (callback.code) await client.auth.exchangeCodeForSession(callback.code)
  })
  return () => void handle.remove()
}

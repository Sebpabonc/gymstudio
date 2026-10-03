import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
let googleProviderEnabled: Promise<boolean> | null = null

export function isGoogleProviderEnabled(): Promise<boolean> {
  if (!googleProviderEnabled) {
    googleProviderEnabled = (async () => {
      const url = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!url || !anonKey) return false

      try {
        const response = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/settings`, {
          headers: { apikey: anonKey },
        })
        if (!response.ok) return false
        const settings = await response.json() as { external?: { google?: boolean } }
        return settings.external?.google === true
      } catch {
        return false
      }
    })()
  }

  return googleProviderEnabled
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  if (!supabaseClient) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseClient = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }

  return supabaseClient
}

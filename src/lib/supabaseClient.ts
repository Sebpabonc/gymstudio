import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

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

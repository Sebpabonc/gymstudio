// GymStudio account deletion (Supabase Edge Function). App Store guideline 5.1.1(v): people can delete their
// account inside the app. The caller's JWT identifies the account; only that account is deleted. Every user
// table references auth.users with ON DELETE CASCADE, so deleting the auth user removes all of their data.
// The service-role key lives only in the function's environment and never reaches the client.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  let body: { confirm?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  // Guards against an accidental call: the app sends this only after the person confirms in the dialog.
  if (body.confirm !== 'DELETE') return json(400, { error: 'confirmation_required' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData } = await userClient.auth.getUser()
  const user = userData?.user
  if (!user) return json(401, { error: 'sign_in_required' })

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('delete_account_failed', user.id, error.message)
    return json(500, { error: 'delete_failed' })
  }
  return json(200, { deleted: true })
})

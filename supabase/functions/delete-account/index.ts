import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateOrigin, getAllowedOrigin } from '../_shared/originGuard.ts'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (!validateOrigin(req)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized origin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create client with user's token to get their ID
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const userId = user.id

    // Create admin client with service role to delete user data and auth record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Delete all user data from tables (comprehensive cleanup)
    const tablesToClean = [
      'messages',
      'profiles', 
      'user_settings',
      'user_roles',
      'user_memory',
      'device_fingerprints',
      'calculation_history',
      'engineering_activity',
      'engineering_portfolio',
      'engineering_projects',
      'grading_projects',
      'chat_sessions',
      'favorite_chats',
      'pinned_sessions',
      'saved_insights',
      'saved_responses',
      'support_tickets',
      'usage_logs',
      'user_ai_limits',
      'user_preferences',
      'user_subscriptions',
      'access_grants',
      'alert_history',
      'creator_profiles',
      'rate_limits',
      'api_rate_limits'
    ]

    // Delete from all tables (ignore errors for tables that may not exist)
    for (const table of tablesToClean) {
      try {
        await supabaseAdmin.from(table).delete().eq('user_id', userId)
      } catch {
        // Table may not exist, continue
      }
    }

    // Delete the user from auth.users using Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      throw deleteError
    }

    console.log(`Successfully deleted user ${userId} and all associated data`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete account error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

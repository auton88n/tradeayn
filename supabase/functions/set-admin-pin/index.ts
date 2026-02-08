import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateOrigin, getAllowedOrigin } from '../_shared/originGuard.ts';

// Same hash function as verify-admin-pin
function hashPin(pin: string, salt: string): string {
  let hash = 0;
  const str = pin + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Generate random token for approval
function generateApprovalToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!validateOrigin(req)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized origin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { newPin } = await req.json();

    if (!newPin || typeof newPin !== 'string' || newPin.length < 4 || newPin.length > 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format (4-6 digits)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing pending PIN change
    const { data: existingPending } = await supabase
      .from('pending_pin_changes')
      .select('id')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existingPending) {
      return new Response(
        JSON.stringify({ success: false, error: 'A PIN change is already pending approval' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate hash and approval token
    const salt = 'ayn_admin_salt_2024';
    const newHash = hashPin(newPin, salt);
    const approvalToken = generateApprovalToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    console.log(`Creating pending PIN change for admin ${user.id}`);

    // Create pending PIN change record
    const { data: pendingChange, error: insertError } = await supabase
      .from('pending_pin_changes')
      .insert({
        user_id: user.id,
        new_pin_hash: newHash,
        approval_token: approvalToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating pending PIN change:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create PIN change request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send approval email via admin-notifications
    const approveUrl = `${supabaseUrl}/functions/v1/approve-pin-change?token=${approvalToken}&action=approve`;
    const rejectUrl = `${supabaseUrl}/functions/v1/approve-pin-change?token=${approvalToken}&action=reject`;

    const { error: notifyError } = await supabase.functions.invoke('admin-notifications', {
      body: {
        type: 'pin_change_approval',
        user_id: user.id,
        user_email: user.email,
        approve_url: approveUrl,
        reject_url: rejectUrl,
        expires_at: expiresAt.toISOString()
      }
    });

    if (notifyError) {
      console.error('Failed to send approval email:', notifyError);
      // Delete the pending change since we couldn't send email
      await supabase.from('pending_pin_changes').delete().eq('id', pendingChange.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send approval email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request
    await supabase.from('security_logs').insert({
      user_id: user.id,
      action: 'admin_pin_change_requested',
      details: { pending_id: pendingChange.id, expires_at: expiresAt.toISOString() },
      severity: 'high'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PIN change request sent. Check your email to approve.',
        pending_id: pendingChange.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting PIN:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

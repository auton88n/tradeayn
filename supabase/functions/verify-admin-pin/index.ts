import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateOrigin, getAllowedOrigin } from '../_shared/originGuard.ts';

// Simple hash function for PIN comparison
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

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
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
    const { pin } = await req.json();

    if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 6) {
      console.log('Invalid PIN format received');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header');
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
      console.log('Auth error:', authError?.message);
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

    if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'duty')) {
      console.log('User is not admin/duty:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for lockout
    const { data: lockoutData } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'admin_pin_lockout')
      .single();

    if (lockoutData?.value) {
      const lockout = lockoutData.value as { lockedUntil?: string; userId?: string };
      if (lockout.lockedUntil && lockout.userId === user.id) {
        const lockedUntil = new Date(lockout.lockedUntil);
        if (lockedUntil > new Date()) {
          const remainingSeconds = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
          console.log('User is locked out:', user.id, 'for', remainingSeconds, 'seconds');
          return new Response(
            JSON.stringify({ success: false, locked: true, lockoutRemaining: remainingSeconds }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Get stored PIN hash
    const { data: pinData } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'admin_pin')
      .single();

    // Default PIN is 1234 if not set
    let storedHash = '';
    let salt = 'ayn_admin_salt_2024';
    
    if (pinData?.value) {
      const pinConfig = pinData.value as { hash?: string; salt?: string };
      storedHash = pinConfig.hash || '';
      salt = pinConfig.salt || salt;
    } else {
      // Set default PIN if not exists
      storedHash = hashPin('1234', salt);
      await supabase
        .from('system_config')
        .upsert({ 
          key: 'admin_pin', 
          value: { hash: storedHash, salt },
          updated_at: new Date().toISOString()
        });
    }

    // Verify PIN
    const inputHash = hashPin(pin, salt);
    console.log('PIN verification - Input hash:', inputHash, 'Stored hash:', storedHash);
    
    // TEMPORARY BYPASS: If stored hash is the known problematic hash and PIN is 1234, allow access
    // This allows initial login to change the PIN via System Settings
    const isKnownBadHash = storedHash === '5765b3bb';
    const isDefaultPin = pin === '1234';
    const isTemporaryBypass = isKnownBadHash && isDefaultPin;
    
    const isValid = inputHash === storedHash || isTemporaryBypass;
    
    if (isTemporaryBypass) {
      console.log('SECURITY WARNING: Temporary bypass used for initial PIN setup. User should change PIN immediately.');
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'admin_pin_temporary_bypass',
        details: { warning: 'Temporary bypass used - PIN change required' },
        severity: 'high'
      });
    }

    if (isValid) {
      console.log('PIN verified successfully for user:', user.id);
      
      // Clear any lockout
      await supabase
        .from('system_config')
        .delete()
        .eq('key', 'admin_pin_lockout');

      // Log successful access
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'admin_pin_verified',
        details: { success: true },
        severity: 'info'
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Invalid PIN attempt for user:', user.id);
      
      // Log failed attempt
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'admin_pin_failed',
        details: { success: false },
        severity: 'high'
      });

      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error verifying PIN:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

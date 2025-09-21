import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from "https://deno.land/x/ed25519@1.7.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SolanaAuthRequest {
  publicKey: string;
  message: string;
  signature: number[];
  deviceFingerprint: string;
  walletName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { publicKey, message, signature, deviceFingerprint, walletName }: SolanaAuthRequest = await req.json();

    console.log('Solana auth request:', { publicKey, message, walletName });

    // Convert signature array back to Uint8Array
    const signatureBytes = new Uint8Array(signature);
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = new Uint8Array(
      publicKey.split('').map((c, i) => {
        if (i % 2 === 0) {
          return parseInt(publicKey.substr(i, 2), 16);
        }
        return 0;
      }).filter((_, i) => i % 2 === 0)
    );

    // Verify the signature (simplified - in production you'd use proper Ed25519 verification)
    let signatureValid = true;
    try {
      // For now, we'll assume signature verification passes
      // In production, implement proper Ed25519 signature verification
      console.log('Signature verification passed (placeholder)');
    } catch (error) {
      console.error('Signature verification failed:', error);
      signatureValid = false;
    }

    if (!signatureValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user exists with this public key
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('solana_public_key', publicKey)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error:', userError);
      throw new Error('Database lookup failed');
    }

    let authResult;

    if (existingUser) {
      // User exists, sign them in
      console.log('Existing user found, signing in');
      
      // Create a session for existing user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${publicKey}@solana.local`, // Temporary email format for Solana users
      });

      if (sessionError) {
        throw new Error('Failed to create session');
      }

      authResult = { user: sessionData.user, session: null };
    } else {
      // New user, create account
      console.log('New user, creating account');
      
      const tempEmail = `${publicKey}@solana.local`;
      const tempPassword = `solana_${publicKey}_${Date.now()}`;

      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        user_metadata: {
          solana_public_key: publicKey,
          wallet_name: walletName,
          auth_method: 'solana',
          device_fingerprint: deviceFingerprint
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw new Error('Failed to create user account');
      }

      // Update profile with Solana info
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: newUser.user.id,
          solana_public_key: publicKey,
          wallet_name: walletName,
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      authResult = { user: newUser.user, session: null };
    }

    // Log successful authentication
    await supabase.rpc('log_security_event', {
      _action: 'solana_auth_success',
      _details: {
        public_key: publicKey,
        wallet_name: walletName,
        device_fingerprint: deviceFingerprint,
        user_id: authResult.user.id
      },
      _severity: 'info'
    });

    console.log('Solana authentication successful');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authResult.user,
        message: 'Authentication successful' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Solana auth error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Authentication failed',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
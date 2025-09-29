import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HOO Token Configuration
const HOO_TOKEN_CONFIG = {
  mintAddress: 'G13U4uE8MZvof7U9JG87etqvWZaP5baZa6HyrsSSaEPA',
  minBalance: 10000000,
  decimals: 9,
  network: 'mainnet-beta',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { walletAddress } = await req.json();

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    console.log(`Verifying HOO token balance for wallet: ${walletAddress}`);

    // Query Solana blockchain for token balance
    const response = await fetch(HOO_TOKEN_CONFIG.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          {
            mint: HOO_TOKEN_CONFIG.mintAddress
          },
          {
            encoding: 'jsonParsed'
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Solana RPC error:', data.error);
      throw new Error(`Solana RPC error: ${data.error.message}`);
    }

    // Extract token balance
    let balance = 0;
    if (data.result && data.result.value && data.result.value.length > 0) {
      const tokenAccount = data.result.value[0];
      const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
      balance = Number(tokenAmount.amount) / Math.pow(10, HOO_TOKEN_CONFIG.decimals);
    }

    console.log(`Token balance found: ${balance} HOO`);

    const verified = balance >= HOO_TOKEN_CONFIG.minBalance;

    // Log verification attempt
    const { error: logError } = await supabase
      .from('security_logs')
      .insert({
        action: 'hoo_token_verification',
        details: {
          wallet_address: walletAddress,
          balance: balance,
          required: HOO_TOKEN_CONFIG.minBalance,
          verified: verified,
          timestamp: new Date().toISOString()
        },
        severity: verified ? 'info' : 'medium'
      });

    if (logError) {
      console.error('Failed to log verification:', logError);
    }

    return new Response(
      JSON.stringify({
        verified,
        balance,
        required: HOO_TOKEN_CONFIG.minBalance,
        message: verified 
          ? `Verification successful: ${balance} HOO tokens found`
          : `Insufficient tokens: ${balance} HOO (requires ${HOO_TOKEN_CONFIG.minBalance})`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in verify-solana-token function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        verified: false,
        balance: 0,
        required: HOO_TOKEN_CONFIG.minBalance
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

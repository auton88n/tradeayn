import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      ticker, timeframe, signal, entryPrice, stopLoss,
      takeProfit1, takeProfit2, confidence, setupType,
      reasoning, marketContext, chartImageUrl,
    } = body;

    console.log(`[ayn-open-trade] Received: ${signal} ${ticker} @ ${entryPrice}, confidence: ${confidence}`);

    // Validate signal
    if (!signal || signal === 'WAIT' || signal === 'NEUTRAL') {
      return new Response(JSON.stringify({ opened: false, reason: 'Signal is WAIT/NEUTRAL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!confidence || confidence < 60) {
      return new Response(JSON.stringify({ opened: false, reason: `Confidence ${confidence}% < 60% threshold` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check open positions (max 3)
    const { count } = await supabase
      .from('ayn_paper_trades')
      .select('id', { count: 'exact', head: true })
      .in('status', ['OPEN', 'PARTIAL_CLOSE']);

    if ((count || 0) >= 3) {
      console.log(`[ayn-open-trade] Already ${count} open positions. Max 3. Skipping.`);
      return new Response(JSON.stringify({ opened: false, reason: `Max positions reached (${count}/3)` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate ticker
    const { count: dupeCount } = await supabase
      .from('ayn_paper_trades')
      .select('id', { count: 'exact', head: true })
      .eq('ticker', ticker)
      .in('status', ['OPEN', 'PARTIAL_CLOSE']);

    if ((dupeCount || 0) > 0) {
      console.log(`[ayn-open-trade] Already have open position on ${ticker}. Skipping.`);
      return new Response(JSON.stringify({ opened: false, reason: `Already in ${ticker}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get account balance
    const { data: account } = await supabase
      .from('ayn_account_state')
      .select('current_balance')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (!account) {
      throw new Error('Account state not found');
    }

    const balance = Number(account.current_balance);

    // Position sizing based on conviction
    let riskPercent = 2;
    if (confidence >= 80) riskPercent = 3;
    else if (confidence < 65) riskPercent = 1.5;

    const riskDollars = balance * (riskPercent / 100);
    const stopDistance = Math.abs(Number(entryPrice) - Number(stopLoss));

    if (stopDistance <= 0) {
      return new Response(JSON.stringify({ opened: false, reason: 'Invalid stop distance (0)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sharesOrCoins = riskDollars / stopDistance;
    const positionSizeDollars = sharesOrCoins * Number(entryPrice);

    // Don't open if position size exceeds 50% of account
    if (positionSizeDollars > balance * 0.5) {
      console.log(`[ayn-open-trade] Position size $${positionSizeDollars.toFixed(2)} exceeds 50% of account. Skipping.`);
      return new Response(JSON.stringify({ opened: false, reason: 'Position too large for account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert trade
    const { data: trade, error } = await supabase
      .from('ayn_paper_trades')
      .insert({
        ticker,
        timeframe: timeframe || 'unknown',
        signal: signal === 'BUY' || signal === 'BULLISH' ? 'BUY' : 'SELL',
        entry_price: Number(entryPrice),
        entry_time: new Date().toISOString(),
        position_size_percent: riskPercent,
        position_size_dollars: Math.round(positionSizeDollars * 100) / 100,
        shares_or_coins: sharesOrCoins,
        stop_loss_price: Number(stopLoss),
        take_profit_1_price: takeProfit1 ? Number(takeProfit1) : null,
        take_profit_2_price: takeProfit2 ? Number(takeProfit2) : null,
        take_profit_1_percent: 50,
        take_profit_2_percent: 50,
        confidence_score: confidence,
        setup_type: setupType || null,
        reasoning: reasoning || null,
        chart_image_url: chartImageUrl || null,
        market_context: marketContext || null,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) {
      console.error('[ayn-open-trade] Insert error:', error);
      throw error;
    }

    console.log(`[ayn-open-trade] ✅ Trade opened: ${signal} ${ticker} @ $${entryPrice} | Risk: ${riskPercent}% ($${riskDollars.toFixed(2)}) | Size: $${positionSizeDollars.toFixed(2)}`);

    return new Response(JSON.stringify({
      opened: true,
      trade,
      summary: `${signal} ${ticker} @ $${entryPrice} | ${riskPercent}% risk ($${riskDollars.toFixed(2)}) | Stop: $${stopLoss}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ayn-open-trade] Error:', err);
    return new Response(JSON.stringify({ opened: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

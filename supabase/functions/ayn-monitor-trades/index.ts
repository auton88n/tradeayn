import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pionex HMAC signing (same pattern as analyze-trading-chart)
async function signPionexRequest(path: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(path));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getCurrentPrice(ticker: string): Promise<number | null> {
  const apiKey = Deno.env.get('PIONEX_API_KEY');
  const apiSecret = Deno.env.get('PIONEX_API_SECRET');
  if (!apiKey || !apiSecret) return null;

  const cleanTicker = ticker.replace(/\/USDT|\/USD|\/BUSD/i, '').toUpperCase();
  const symbol = `${cleanTicker}_USDT`;
  const timestamp = Date.now().toString();
  const tickerPath = `/api/v1/market/tickers?symbol=${symbol}&timestamp=${timestamp}`;
  const signature = await signPionexRequest(tickerPath, apiSecret);

  try {
    const res = await fetch(`https://api.pionex.com${tickerPath}`, {
      headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': signature },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[ayn-monitor] Pionex ticker failed for ${symbol}: ${errText}`);
      return null;
    }
    const data = await res.json();
    const tickerInfo = data?.data?.tickers?.[0];
    if (tickerInfo?.close) return parseFloat(tickerInfo.close);
    return null;
  } catch (err) {
    console.warn(`[ayn-monitor] Pionex fetch error for ${symbol}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all open trades
    const { data: trades, error: fetchErr } = await supabase
      .from('ayn_paper_trades')
      .select('*')
      .in('status', ['OPEN', 'PARTIAL_CLOSE']);

    if (fetchErr) throw fetchErr;

    if (!trades || trades.length === 0) {
      console.log('[ayn-monitor] No open trades to monitor');
      return new Response(JSON.stringify({ message: 'No open trades', checked: 0, closed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ayn-monitor] Checking ${trades.length} open trades`);

    const results: Array<{ ticker: string; action: string; price?: number; pnl?: number }> = [];

    for (const trade of trades) {
      const currentPrice = await getCurrentPrice(trade.ticker);
      if (!currentPrice) {
        console.warn(`[ayn-monitor] Could not get price for ${trade.ticker}, skipping`);
        results.push({ ticker: trade.ticker, action: 'PRICE_UNAVAILABLE' });
        continue;
      }

      const isBuy = trade.signal === 'BUY';
      const entryPrice = Number(trade.entry_price);
      const stopLoss = Number(trade.stop_loss_price);
      const tp1 = trade.take_profit_1_price ? Number(trade.take_profit_1_price) : null;
      const tp2 = trade.take_profit_2_price ? Number(trade.take_profit_2_price) : null;
      const shares = Number(trade.shares_or_coins);

      // Check stop loss
      const stopHit = isBuy ? currentPrice <= stopLoss : currentPrice >= stopLoss;
      if (stopHit) {
        const pnlDollars = isBuy
          ? (stopLoss - entryPrice) * shares
          : (entryPrice - stopLoss) * shares;
        const pnlPercent = (pnlDollars / Number(trade.position_size_dollars)) * 100;

        await supabase.from('ayn_paper_trades').update({
          exit_price: currentPrice,
          exit_time: new Date().toISOString(),
          exit_reason: 'STOP_HIT',
          pnl_dollars: Math.round(pnlDollars * 100) / 100,
          pnl_percent: Math.round(pnlPercent * 100) / 100,
          status: 'STOPPED_OUT',
          updated_at: new Date().toISOString(),
        }).eq('id', trade.id);

        console.log(`[ayn-monitor] ❌ STOPPED OUT: ${trade.ticker} @ $${currentPrice} | P&L: $${pnlDollars.toFixed(2)}`);
        results.push({ ticker: trade.ticker, action: 'STOPPED_OUT', price: currentPrice, pnl: pnlDollars });
        continue;
      }

      // Check TP1 (partial close 50%)
      const partialExits = trade.partial_exits || [];
      const tp1AlreadyHit = partialExits.some((e: any) => e.reason === 'TP1_HIT');

      if (tp1 && !tp1AlreadyHit) {
        const tp1Hit = isBuy ? currentPrice >= tp1 : currentPrice <= tp1;
        if (tp1Hit) {
          const sharesClosing = shares * 0.5;
          const pnlDollars = isBuy
            ? (tp1 - entryPrice) * sharesClosing
            : (entryPrice - tp1) * sharesClosing;

          const newPartialExits = [...partialExits, {
            price: tp1,
            percent: 50,
            shares: sharesClosing,
            pnl: Math.round(pnlDollars * 100) / 100,
            time: new Date().toISOString(),
            reason: 'TP1_HIT',
          }];

          // Move stop to breakeven, reduce position
          await supabase.from('ayn_paper_trades').update({
            shares_or_coins: shares - sharesClosing,
            stop_loss_price: entryPrice, // breakeven
            partial_exits: newPartialExits,
            pnl_dollars: Number(trade.pnl_dollars) + Math.round(pnlDollars * 100) / 100,
            status: 'PARTIAL_CLOSE',
            updated_at: new Date().toISOString(),
          }).eq('id', trade.id);

          console.log(`[ayn-monitor] ✅ TP1 HIT: ${trade.ticker} @ $${tp1} | Partial P&L: +$${pnlDollars.toFixed(2)} | Stop → breakeven`);
          results.push({ ticker: trade.ticker, action: 'TP1_HIT', price: tp1, pnl: pnlDollars });
          continue;
        }
      }

      // Check TP2 (full close)
      if (tp2) {
        const tp2Hit = isBuy ? currentPrice >= tp2 : currentPrice <= tp2;
        if (tp2Hit) {
          const remainingShares = Number(trade.shares_or_coins);
          const pnlDollars = isBuy
            ? (tp2 - entryPrice) * remainingShares
            : (entryPrice - tp2) * remainingShares;
          const totalPnl = Number(trade.pnl_dollars) + pnlDollars;
          const totalPnlPercent = (totalPnl / Number(trade.position_size_dollars)) * 100;

          await supabase.from('ayn_paper_trades').update({
            exit_price: tp2,
            exit_time: new Date().toISOString(),
            exit_reason: 'TP2_HIT',
            pnl_dollars: Math.round(totalPnl * 100) / 100,
            pnl_percent: Math.round(totalPnlPercent * 100) / 100,
            status: 'CLOSED_WIN',
            updated_at: new Date().toISOString(),
          }).eq('id', trade.id);

          console.log(`[ayn-monitor] 🎯 TP2 HIT: ${trade.ticker} @ $${tp2} | Total P&L: +$${totalPnl.toFixed(2)}`);
          results.push({ ticker: trade.ticker, action: 'TP2_HIT', price: tp2, pnl: totalPnl });
          continue;
        }
      }

      results.push({ ticker: trade.ticker, action: 'HOLDING', price: currentPrice });
    }

    console.log(`[ayn-monitor] Complete. ${results.filter(r => r.action !== 'HOLDING' && r.action !== 'PRICE_UNAVAILABLE').length} trades updated.`);

    return new Response(JSON.stringify({
      message: 'Monitor complete',
      checked: trades.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ayn-monitor] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

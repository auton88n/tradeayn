import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { searchWeb } from "../_shared/firecrawlHelper.ts";
import { uploadImageToStorage } from "../_shared/storageUpload.ts";
import { getFullKnowledgeBase, getCompactKnowledge } from "./tradingKnowledge.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// ─── Step 1: Vision Analysis (Enhanced with Knowledge Base Checklist) ───
async function analyzeChartImage(imageUrl: string, apiKey: string) {
  console.log('[chart-analyzer] Step 1: Gemini Vision analysis with knowledge base checklist');

  const compactKnowledge = getCompactKnowledge('both');

  const prompt = `## TRADING KNOWLEDGE BASE (PRIMARY REFERENCE)
${compactKnowledge}

---

You are a professional technical analyst. Analyze this trading chart image using ONLY the patterns and indicators listed above in the knowledge base.

**CHECK PATTERNS IN THIS PRIORITY ORDER:**

**FIRST: Chart Patterns** (these show overall structure)
- Bull flag = sharp upward move (pole) + tight downward/sideways consolidation (flag body)
- Bear flag = sharp downward move + tight upward consolidation
- Ascending triangle = flat resistance + rising support (minimum 3 touches each)
- Descending triangle = flat support + falling resistance
- Symmetrical triangle = converging trendlines (lower highs + higher lows)
- Head and shoulders = left shoulder, head (higher peak), right shoulder (similar to left)
- Inverse H&S = left trough, head (lower trough), right trough
- Bull/Bear pennant = sharp move + converging triangle consolidation
- Wedge = both trendlines sloping same direction but converging
- Double top/bottom = two peaks/troughs at similar levels
- Cup and handle = rounded bottom + small consolidation at resistance

**THEN: Candlestick Patterns** (analyze last 5-10 candles for entry/exit signals)
- Bullish engulfing = large green candle completely covers prior red candle body
- Bearish engulfing = large red candle completely covers prior green candle body
- Hammer = small body at top, long lower wick (2-3x body size), appears after downtrend
- Shooting star = small body at bottom, long upper wick, appears after uptrend
- Doji = open ≈ close (indecision candle)
- Morning star = large red → small body → large green (three candle reversal)
- Evening star = large green → small body → large red

**THEN: Volume Behavior**
- Is volume increasing or decreasing over recent candles?
- Volume spike = 2x+ average volume bar height
- Spikes often mark: reversals (capitulation), breakouts (confirmation), or false moves
- Note WHERE spikes occur (at support, resistance, or breakout point)
- Does volume confirm the pattern? (e.g., decreasing volume during flag = bullish confirmation)

**FINALLY: Support/Resistance and Trend**
- Support = horizontal levels where price bounced up (minimum 2 touches)
- Resistance = horizontal levels where price was rejected down (minimum 2 touches)
- Bullish trend = higher highs AND higher lows
- Bearish trend = lower highs AND lower lows
- Sideways = ranging between horizontal levels

**CONFIDENCE CALIBRATION:**
- HIGH (score 70-90): Textbook pattern, all rules met, volume confirms
- MEDIUM (score 50-70): Pattern present but not perfect (e.g., flag too steep, weak volume)
- LOW (score 30-50): Questionable pattern or mixed signals

**CRITICAL RULES:**
- Only identify patterns that exist in the knowledge base above
- Use exact pattern names from the knowledge base (e.g., "bull_flag", "bullish_engulfing", "ascending_triangle")
- If no clear pattern matches knowledge base, say "no clear patterns detected" but still analyze trend and levels
- **Describe WHY you identified each pattern** (cite specific visual evidence from the chart)

Return ONLY valid JSON (no markdown, no code fences) with exactly this structure:
{
  "ticker": "the asset symbol visible on chart (e.g. AAPL, BTC/USDT, EUR/USD). If unclear, use UNKNOWN",
  "assetType": "one of: stock, crypto, forex, commodity, index",
  "timeframe": "detected chart timeframe e.g. 1m, 5m, 15m, 1H, 4H, Daily, Weekly, Monthly. If unclear, use unknown",
  "currentPrice": null,
  "trend": "bullish, bearish, or sideways",
  "trendReasoning": "explain the HH/HL or LH/LL structure you see, or why sideways",
  "patterns": [
    {
      "name": "exact_pattern_name_from_knowledge_base",
      "type": "BULLISH" | "BEARISH" | "NEUTRAL",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "score": 70,
      "reasoning": "describe what you see in the chart that matches this pattern",
      "location": "where on chart (e.g., 'forming at current resistance', 'at support level')"
    }
  ],
  "support": [0.0],
  "resistance": [0.0],
  "volume": {
    "trend": "increasing" | "decreasing" | "stable",
    "spikes": "describe any volume spikes and their locations relative to price action",
    "significance": "does volume confirm patterns? explain how"
  },
  "indicators": {
    "rsi": null,
    "macd": null,
    "movingAverages": null,
    "volume": null,
    "other": null
  },
  "technicalSummary": "2-3 sentences describing what the chart shows overall"
}

Be specific with price levels. If you can see indicator values, include them. If not visible, set to null.`;

  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 3000,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vision API failed [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('[chart-analyzer] Failed to parse vision response:', content);
    throw new Error('Failed to parse chart analysis from AI');
  }
}

// ─── Step 2: News Fetch via Firecrawl (with filtering) ───
async function fetchTickerNews(ticker: string, assetType: string) {
  console.log(`[chart-analyzer] Step 2: Fetching news for ${ticker} (${assetType})`);
  
  if (ticker === 'UNKNOWN') {
    return { headlines: [], raw: [] };
  }

  const typeLabel = assetType === 'crypto' ? 'cryptocurrency' : assetType;
  const query = `${ticker} ${typeLabel} news latest`;

  const result = await searchWeb(query, { limit: 8 });
  
  if (!result.success || !result.data?.length) {
    console.warn('[chart-analyzer] No news found:', result.error);
    return { headlines: [], raw: [] };
  }

  // Filter out chart/price index pages (not actual news)
  const filtered = result.data.filter(d => {
    const title = (d.title || '').toLowerCase();
    const isChartPage = title.includes('price chart') || title.includes('price index') || 
      title.includes('to usd chart') || title.includes('live chart');
    const isPriceTracker = /^[\w\/]+ price/i.test(d.title || '') && 
      !title.includes('surges') && !title.includes('drops') && 
      !title.includes('crashes') && !title.includes('jumps') && !title.includes('falls');
    return !isChartPage && !isPriceTracker;
  });

  console.log(`[chart-analyzer] Filtered ${result.data.length - filtered.length} non-news results`);

  return {
    headlines: filtered.map(d => d.title).filter(Boolean),
    raw: filtered.map(d => ({
      title: d.title,
      url: d.url,
      description: d.description || '',
    })),
  };
}

// ─── Step 3: Sentiment + Prediction (Enhanced with Weighted Scoring) ───
async function generatePrediction(
  technical: Record<string, unknown>,
  news: { headlines: string[]; raw: Array<{ title: string; url: string; description: string }> },
  apiKey: string
) {
  console.log('[chart-analyzer] Step 3: Generating sentiment + prediction with weighted scoring');

  const detectedAssetType = (technical as any).assetType || 'stock';
  const mappedAssetType: 'stock' | 'crypto' | 'both' = 
    detectedAssetType === 'crypto' ? 'crypto' : 
    detectedAssetType === 'stock' ? 'stock' : 'both';
  const tradingContext = getFullKnowledgeBase(mappedAssetType);

  // Calculate technical score from pattern data
  const patterns = (technical as any).patterns || [];
  const highConfPatterns = Array.isArray(patterns) 
    ? patterns.filter((p: any) => typeof p === 'object' && p.confidence === 'HIGH')
    : [];
  const technicalScore = highConfPatterns.length > 0
    ? Math.round(highConfPatterns.reduce((sum: number, p: any) => sum + (p.score || 50), 0) / highConfPatterns.length)
    : 40;

  console.log(`[chart-analyzer] Technical score from ${highConfPatterns.length} HIGH confidence patterns: ${technicalScore}`);

  const currentPrice = (technical as any).currentPrice;
  const support = (technical as any).support || [];
  const resistance = (technical as any).resistance || [];

  const prompt = `## TRADING KNOWLEDGE BASE
${tradingContext}

---

You are an expert trading analyst combining technical and fundamental analysis. Generate a comprehensive trading prediction using WEIGHTED SCORING.

## Technical Analysis (from chart vision - weight: 60%)
${JSON.stringify(technical, null, 2)}

**Pre-calculated technical score: ${technicalScore}** (based on HIGH confidence pattern scores)
**Current Price: ${currentPrice || 'unknown'}**
**Support Levels: ${JSON.stringify(support)}**
**Resistance Levels: ${JSON.stringify(resistance)}**

## Recent News Headlines (weight: 40%)
${news.headlines.length > 0 ? news.headlines.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No recent news found.'}

---

## SCORING RULES:
1. Combined score = (technicalScore × 0.6) + (newsSentimentScore × 0.4)
   - newsSentimentScore: map overallSentiment (-1 to +1) to (0 to 100) scale
2. Signal determination:
   - BULLISH: combinedScore > 55 AND technicalScore >= 60
   - BEARISH: combinedScore < 45 AND technicalScore <= 40
   - WAIT: everything else (including when confidence < 50%)
3. If confidence < 50% → signal MUST be "WAIT" regardless of other factors
4. If technical and news conflict, technical takes priority (60% weight)

## ENTRY TIMING RULES:
Determine if NOW is a good time to enter, based on price location:
- If signal is BEARISH and currentPrice is near a support level → status "WAIT", risk of bounce
- If signal is BULLISH and currentPrice is near a resistance level → status "WAIT", risk of rejection
- If price is at ideal entry zone away from conflicting levels → status "READY"
- "Near" means within 1-2% of the level
- Always provide both aggressive (enter now) and conservative (wait for retest) options

## ACTIONABLE PLAN RULES:
- For WAIT signal: provide conditional scenarios (IF breaks above X → BULLISH setup, IF breaks below Y → BEARISH setup)
- For BULLISH/BEARISH: provide specific entry, stop loss, and take profit levels
- Always calculate risk/reward ratio
- Reference pattern reliability from knowledge base

Return ONLY valid JSON (no markdown, no code fences):
{
  "newsSentiment": [
    {"headline": "...", "sentiment": 0.0, "impact": "high/medium/low"}
  ],
  "overallSentiment": 0.0,
  "signal": "BULLISH" | "BEARISH" | "WAIT",
  "confidence": 0,
  "technicalScore": ${technicalScore},
  "reasoning": "On the ${(technical as any).timeframe || 'unknown'} timeframe, ${(technical as any).ticker || 'this asset'} shows... (1) What patterns were detected and their significance from the knowledge base, (2) How technical and news align or conflict, (3) Why this signal and confidence level. 3-5 sentences.",
  "entry_zone": "specific price range or 'N/A' for WAIT",
  "stop_loss": "specific price or 'N/A' for WAIT",
  "take_profit": "specific price range or 'N/A' for WAIT",
  "risk_reward": "ratio like '1:1.5' or 'N/A' for WAIT",
  "entryTiming": {
    "status": "READY" | "WAIT",
    "reason": "Why now is or isn't a good time to enter. Reference specific price levels.",
    "aggressive": "Enter now plan with specific price, stop, target",
    "conservative": "Wait for retest plan with specific trigger, entry, stop, target"
  },
  "actionablePlan": {
    "current": "What to do right now",
    "ifBullishBreakout": "IF price breaks above [resistance] → entry, stop, targets",
    "ifBearishBreakdown": "IF price breaks below [support] → entry, stop, targets"
  },
  "riskManagement": "Position sizing recommendation (1-2% account risk per trade)"
}

Rules:
- Sentiment scores: -1.0 (very bearish) to +1.0 (very bullish)
- Confidence: 0-100 (higher = more conviction)
- Always reference the timeframe and asset type in reasoning
- Reference specific patterns by name and their knowledge base reliability rating
- If no news, base prediction purely on technicals and note that`;

  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Prediction API failed [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('[chart-analyzer] Failed to parse prediction:', content);
    throw new Error('Failed to parse prediction from AI');
  }
}

// ─── Step 4: Store in DB ───
async function storeAnalysis(
  userId: string,
  sessionId: string | null,
  imageUrl: string,
  technical: Record<string, unknown>,
  newsData: unknown[],
  prediction: Record<string, unknown>
) {
  console.log('[chart-analyzer] Step 4: Storing analysis in DB');
  const supabase = getServiceClient();

  const { data, error } = await supabase.from('chart_analyses').insert({
    user_id: userId,
    session_id: sessionId,
    image_url: imageUrl,
    ticker: (technical as any).ticker || null,
    asset_type: (technical as any).assetType || null,
    timeframe: (technical as any).timeframe || null,
    technical_analysis: technical,
    news_data: newsData,
    sentiment_score: (prediction as any).overallSentiment ?? null,
    prediction_signal: (prediction as any).signal || null,
    confidence: (prediction as any).confidence ?? null,
    prediction_details: prediction,
  }).select('id').single();

  if (error) {
    console.error('[chart-analyzer] DB insert failed:', error.message);
    return null;
  }
  return data?.id;
}

// ─── Main Handler ───
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    // Parse request
    const { imageBase64, imageUrl: directImageUrl, sessionId } = await req.json();
    if (!imageBase64 && !directImageUrl) {
      return new Response(JSON.stringify({ error: 'imageBase64 or imageUrl is required' }), { status: 400, headers: corsHeaders });
    }

    // Upload image to storage
    console.log('[chart-analyzer] Preparing chart image...');
    const imageUrl = directImageUrl || await uploadImageToStorage(imageBase64, userId);

    // Step 1: Vision analysis (enhanced with knowledge base checklist)
    const technical = await analyzeChartImage(imageUrl, LOVABLE_API_KEY);

    // Step 2: News fetch
    const news = await fetchTickerNews(technical.ticker, technical.assetType);

    // Step 3: Sentiment + Prediction (enhanced with weighted scoring)
    const prediction = await generatePrediction(technical, news, LOVABLE_API_KEY);

    // Step 4: Store in DB
    const analysisId = await storeAnalysis(
      userId, sessionId || null, imageUrl, technical, news.raw, prediction
    );

    // Step 5: Build result (preserve rich pattern objects for frontend)
    const rawPatterns = technical.patterns || [];
    const richPatterns = Array.isArray(rawPatterns)
      ? rawPatterns.map((p: any) => {
          if (typeof p === 'object' && p.name) {
            return {
              name: p.name,
              type: p.type || 'NEUTRAL',
              confidence: p.confidence || 'MEDIUM',
              score: p.score || 50,
              reasoning: p.reasoning || '',
              location: p.location || '',
            };
          }
          return { name: String(p), type: 'NEUTRAL', confidence: 'MEDIUM', score: 50, reasoning: '', location: '' };
        })
      : [];

    // Build volume description from structured volume object (backward compat string)
    const volumeObj = (technical as any).volume;
    const volumeDesc = volumeObj && typeof volumeObj === 'object'
      ? `${volumeObj.trend || 'unknown'} volume. ${volumeObj.significance || ''} ${volumeObj.spikes || ''}`.trim()
      : (technical as any).indicators?.volume || null;

    // Structured volume analysis for frontend
    const volumeAnalysis = volumeObj && typeof volumeObj === 'object'
      ? { trend: volumeObj.trend || 'unknown', spikes: volumeObj.spikes || '', significance: volumeObj.significance || '' }
      : null;

    // Build key observations from technical summary + trend reasoning
    const keyObs = [
      (technical as any).technicalSummary,
      (technical as any).trendReasoning ? `Trend: ${(technical as any).trendReasoning}` : null,
    ].filter(Boolean).join(' ');

    // Build reasoning with actionable plan
    let reasoning = prediction.reasoning || '';
    if (prediction.actionablePlan) {
      const plan = prediction.actionablePlan;
      const planParts = [
        plan.current ? `\n\n📋 ${plan.current}` : '',
        plan.ifBullishBreakout ? `\n🟢 ${plan.ifBullishBreakout}` : '',
        plan.ifBearishBreakdown ? `\n🔴 ${plan.ifBearishBreakdown}` : '',
      ].filter(Boolean).join('');
      if (planParts) reasoning += planParts;
    }
    if (prediction.riskManagement) {
      reasoning += `\n\n⚠️ Risk: ${prediction.riskManagement}`;
    }

    const result = {
      ticker: technical.ticker,
      assetType: technical.assetType,
      timeframe: technical.timeframe,
      technical: {
        trend: technical.trend,
        patterns: richPatterns,
        support: technical.support || [],
        resistance: technical.resistance || [],
        indicators: {
          ...(technical.indicators || {}),
          volume: volumeDesc,
        },
        keyObservations: keyObs || (technical as any).keyObservations || '',
        ...(volumeAnalysis ? { volumeAnalysis } : {}),
      },
      news: news.raw.map((n, i) => ({
        ...n,
        sentiment: prediction.newsSentiment?.[i]?.sentiment ?? 0,
        impact: prediction.newsSentiment?.[i]?.impact ?? 'low',
      })),
      prediction: {
        signal: prediction.signal,
        confidence: prediction.confidence,
        timeframe: technical.timeframe,
        assetType: technical.assetType,
        reasoning,
        entry_zone: prediction.entry_zone,
        stop_loss: prediction.stop_loss,
        take_profit: prediction.take_profit,
        risk_reward: prediction.risk_reward,
        overallSentiment: prediction.overallSentiment,
        ...(prediction.entryTiming ? { entryTiming: prediction.entryTiming } : {}),
      },
      imageUrl,
      analysisId: analysisId || null,
      disclaimer: 'This analysis is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.',
    };

    console.log('[chart-analyzer] ✅ Analysis complete for', technical.ticker, '| Signal:', prediction.signal, '| Confidence:', prediction.confidence);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[chart-analyzer] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { searchWeb } from "../_shared/firecrawlHelper.ts";
import { uploadImageToStorage } from "../_shared/storageUpload.ts";
import {
  getFullKnowledgeBase,
  getCompactKnowledge,
  calculatePatternReliability,
  CHART_PATTERNS,
  CANDLESTICK_PATTERNS,
  TRADING_PSYCHOLOGY,
} from "./tradingKnowledge.ts";

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
- Calculate approximate volume ratio: current volume / recent average
- Spikes often mark: reversals (capitulation), breakouts (confirmation), or false moves
- Note WHERE spikes occur (at support, resistance, or breakout point)
- Does volume confirm the pattern? (e.g., decreasing volume during flag = bullish confirmation)

**FINALLY: Support/Resistance and Trend**
- Support = horizontal levels where price bounced up (minimum 2 touches)
- Resistance = horizontal levels where price was rejected down (minimum 2 touches)
- Bullish trend = higher highs AND higher lows
- Bearish trend = lower highs AND lower lows
- Sideways = ranging between horizontal levels

**CONFIDENCE CALIBRATION (MANDATORY):**
- HIGH (score 70-90): Textbook pattern, all rules met, volume confirms
- MEDIUM (score 50-69): Pattern present but not perfect (e.g., flag too steep, weak volume)
- LOW (score 30-49): Questionable pattern or mixed signals

**STRICT RULES:**
- If score < 70, confidence MUST be "MEDIUM" or "LOW" (NEVER "HIGH")
- If score >= 70, confidence MUST be "HIGH"
- If score < 50, confidence MUST be "LOW"
- If volume confirms pattern, add +10 to base score (may promote MEDIUM to HIGH)

**PATTERN LIMIT: Maximum 3 patterns per analysis.**
If you identify 4+ patterns, only report the 3 with HIGHEST confidence.
Reason: Too many patterns causes confusion and contradictory signals.

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
    "currentRatio": 1.0,
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

  // Filter out chart/price index pages and generic non-news pages
  const filtered = result.data.filter((d: any) => {
    const title = (d.title || '').toLowerCase();
    const url = (d.url || '').toLowerCase();
    
    // Filter chart/price pages
    const isChartPage = title.includes('price chart') || title.includes('price index') || 
      title.includes('to usd chart') || title.includes('live chart');
    const isPriceTracker = /^[\w\/]+ price/i.test(d.title || '') && 
      !title.includes('surges') && !title.includes('drops') && 
      !title.includes('crashes') && !title.includes('jumps') && !title.includes('falls');
    
    // Filter generic non-news pages
    const isGenericPage = title.includes('converter') || title.includes('calculator') || 
      title.includes('market cap') || title.includes('token info') || title.includes('coin info');
    
    // Filter known non-news domains (unless path contains /news or /article)
    const isNonNewsDomain = (url.includes('coinmarketcap.com') || url.includes('coingecko.com')) &&
      !url.includes('/news') && !url.includes('/article');
    
    // Filter generic news aggregator titles
    const isGenericNews = title.includes('latest stock news') || title.includes('latest news update') ||
      title.includes('price today') || title.includes('live price');
    
    // Filter very short titles (usually generic pages)
    const isTooShort = (d.title || '').length < 20;
    
    return !isChartPage && !isPriceTracker && !isGenericPage && !isGenericNews && !isNonNewsDomain && !isTooShort;
  });

  console.log(`[chart-analyzer] Filtered ${result.data.length - filtered.length} non-news results`);

  return {
    headlines: filtered.map((d: any) => d.title).filter(Boolean),
    raw: filtered.map((d: any) => ({
      title: d.title,
      url: d.url,
      description: d.description || '',
    })),
  };
}

// ─── Step 3: Sentiment + Prediction (Enhanced with Psychology & Context) ───
async function generatePrediction(
  technical: Record<string, unknown>,
  news: { headlines: string[]; raw: Array<{ title: string; url: string; description: string }> },
  apiKey: string
) {
  console.log('[chart-analyzer] Step 3: Generating prediction with psychology & context-adjusted scoring');

  const detectedAssetType = (technical as any).assetType || 'stock';
  const mappedAssetType: 'stock' | 'crypto' | 'both' = 
    detectedAssetType === 'crypto' ? 'crypto' : 
    detectedAssetType === 'stock' ? 'stock' : 'both';
  const tradingContext = getFullKnowledgeBase(mappedAssetType);

  // Calculate context-adjusted scores for each pattern
  const patterns = (technical as any).patterns || [];
  const currentPrice = (technical as any).currentPrice;
  const support = (technical as any).support || [];
  const resistance = (technical as any).resistance || [];
  const volumeObj = (technical as any).volume;
  const volumeRatio = (volumeObj && typeof volumeObj === 'object') ? (volumeObj.currentRatio || 1.0) : 1.0;
  const timeframe = (technical as any).timeframe || 'unknown';
  const trend = (technical as any).trend || 'sideways';

  const adjustedPatterns = Array.isArray(patterns)
    ? patterns.map((p: any) => {
        if (typeof p !== 'object' || !p.name) return p;
        
        const patternDef = CHART_PATTERNS[p.name] || CANDLESTICK_PATTERNS[p.name];
        const assetCtx: 'stock' | 'crypto' = mappedAssetType === 'both' ? 'stock' : mappedAssetType;
        
        const isNearSupport = currentPrice && support.length > 0 && 
          support.some((s: number) => Math.abs(currentPrice - s) / currentPrice < 0.02);
        const isNearResistance = currentPrice && resistance.length > 0 && 
          resistance.some((r: number) => Math.abs(currentPrice - r) / currentPrice < 0.02);

        if (patternDef && patternDef.successRate) {
          const adjusted = calculatePatternReliability(patternDef, {
            timeframe,
            assetType: assetCtx,
            volumeRatio,
            atSupport: isNearSupport,
            atResistance: isNearResistance,
            inTrend: trend !== 'sideways'
          });
          
          return {
            ...p,
            adjustedScore: adjusted.adjustedScore,
            adjustedReliability: adjusted.adjustedReliability,
            adjustments: adjusted.breakdown,
            baseSuccessRate: patternDef.successRate.overall,
            failureMode: patternDef.failureMode || null,
            invalidationLevel: patternDef.invalidation || null,
            source: patternDef.successRate.source,
          };
        }
        
        return p;
      })
    : [];

  // Calculate technical score from adjusted pattern data
  const scoredPatterns = adjustedPatterns.filter((p: any) => typeof p === 'object' && (p.adjustedScore || p.score));
  const technicalScore = scoredPatterns.length > 0
    ? Math.round(scoredPatterns.reduce((sum: number, p: any) => sum + (p.adjustedScore || p.score || 50), 0) / scoredPatterns.length)
    : 40;

  console.log(`[chart-analyzer] Technical score from ${scoredPatterns.length} patterns: ${technicalScore}`);

  // Determine if psychology warnings should be included
  const shouldIncludePsychology = volumeRatio >= 2.0 || 
    (currentPrice && (
      support.some((s: number) => Math.abs(currentPrice - s) / currentPrice < 0.02) ||
      resistance.some((r: number) => Math.abs(currentPrice - r) / currentPrice < 0.02)
    ));

  const psychologyContext = shouldIncludePsychology ? `

## 🧠 PSYCHOLOGY CONTEXT (Include psychologyWarnings in response)
Market cycle emotions: ${JSON.stringify(TRADING_PSYCHOLOGY.market_psychology.market_cycle_emotions)}
Common biases: Confirmation bias, FOMO, Loss aversion, Gamblers fallacy, Recency bias
Why retail loses: ${JSON.stringify(TRADING_PSYCHOLOGY.market_psychology.why_retail_loses)}

Assess: What stage of the market cycle? What emotions are driving price? What mistakes will traders make?
` : `

## Psychology: Skip psychologyWarnings (normal price action, no extremes detected). Set psychologyWarnings to null.
`;

  const prompt = `## TRADING KNOWLEDGE BASE
${tradingContext}

---

You are an expert trading analyst combining technical and fundamental analysis. Generate a comprehensive trading prediction using WEIGHTED SCORING and CONTEXT-ADJUSTED pattern reliability.

## Technical Analysis (from chart vision - weight: 60%)
${JSON.stringify(technical, null, 2)}

## Context-Adjusted Pattern Scores
${JSON.stringify(adjustedPatterns, null, 2)}

**Pre-calculated technical score: ${technicalScore}** (based on context-adjusted pattern scores)
**Current Price: ${currentPrice || 'unknown'}**
**Support Levels: ${JSON.stringify(support)}**
**Resistance Levels: ${JSON.stringify(resistance)}**
**Volume Ratio: ${volumeRatio}x average**

## Recent News Headlines (weight: 40%)
${news.headlines.length > 0 ? news.headlines.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No recent news found.'}
${psychologyContext}
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
5. **HARD CAP: confidence MUST NOT exceed 90.** Nothing is certain.

## ENTRY TIMING RULES:
- If signal is BEARISH and currentPrice is near a support level → status "WAIT", risk of bounce
- If signal is BULLISH and currentPrice is near a resistance level → status "WAIT", risk of rejection
- If price is at ideal entry zone away from conflicting levels → status "READY"
- "Near" means within 1-2% of the level
- Always provide both aggressive and conservative options

## CONSISTENCY RULES (CRITICAL):
- entry_zone, entryTiming.aggressive, entryTiming.conservative, and actionablePlan MUST all reference the SAME price levels
- If signal is BEARISH and entryTiming.status is WAIT: entry_zone must match the conservative plan's entry price
- If entryTiming.status is READY: entry_zone should be near current price
- stop_loss and take_profit must be consistent across all sections

## ACTIONABLE PLAN RULES:
- For WAIT signal: provide conditional scenarios (IF breaks above X → BULLISH setup, IF breaks below Y → BEARISH setup)
- For BULLISH/BEARISH: provide specific entry, stop loss, and take profit levels
- Always calculate risk/reward ratio
- Reference pattern success rates from knowledge base

Return ONLY valid JSON (no markdown, no code fences):
{
  "newsSentiment": [
    {"headline": "...", "sentiment": 0.0, "impact": "high/medium/low"}
  ],
  "overallSentiment": 0.0,
  "signal": "BULLISH" | "BEARISH" | "WAIT",
  "confidence": 0,
  "technicalScore": ${technicalScore},
  "reasoning": "On the ${timeframe} timeframe, ${(technical as any).ticker || 'this asset'} shows... (1) Pattern reliability with context adjustments and success rates, (2) How technical and news align or conflict, (3) Psychology/emotion stage if relevant. 3-5 sentences.",
  "entry_zone": "specific price range or 'N/A' for WAIT",
  "stop_loss": "specific price or 'N/A' for WAIT",
  "take_profit": "specific price range or 'N/A' for WAIT",
  "risk_reward": "ratio like '1:1.5' or 'N/A' for WAIT",
  "confidenceBreakdown": {
    "technicalScore": ${technicalScore},
    "newsScore": 0,
    "conflictPenalty": 0,
    "calculation": "Technical (X) × 60% + News (Y) × 40% + penalties = Z%",
    "explanation": "Explain why pattern scores led to this confidence. If patterns conflict (BULLISH and BEARISH both present with scores within 30 points), apply -35% conflict penalty."
  },
  "entryTiming": {
    "status": "READY" | "WAIT",
    "reason": "Why now is or isn't a good time to enter. Reference specific price levels.",
    "aggressive": "If signal is WAIT: explain WHY aggressive entry is NOT recommended (e.g. 'Not recommended - conflicting signals at support give 60%+ stop-out probability. If you must enter, use 0.5% risk with tight stop.'). If signal is BULLISH/BEARISH: provide specific entry plan with price, stop, target.",
    "conservative": "Wait for retest plan with specific trigger, entry, stop, target"
  },
  "actionablePlan": {
    "current": "What to do right now",
    "ifBullishBreakout": "IF price breaks above [resistance] → entry, stop, targets",
    "ifBearishBreakdown": "IF price breaks below [support] → entry, stop, targets"
  },
  "riskManagement": "Position sizing recommendation (1-2% account risk per trade)",
  "patternBreakdown": [
    {
      "name": "pattern_name",
      "baseScore": 68,
      "adjustments": ["Timeframe 15m: -5%", "At support: +20%"],
      "finalScore": 78,
      "historicalSuccess": "68% overall, 78% with current context (Bulkowski, 10K+ patterns)",
      "failureMode": "Breaks below support (32% of cases)",
      "invalidation": "Close below 0.044"
    }
  ],
  "psychologyWarnings": ${shouldIncludePsychology ? `{
    "marketStage": "optimism | excitement | thrill | euphoria | anxiety | denial | panic | capitulation",
    "crowdPosition": "early adopters | early majority | late majority | laggards",
    "emotionalDrivers": ["FOMO", "fear", "greed"],
    "commonMistakes": [
      "Many traders will [do wrong thing] due to [bias]",
      "If you feel [emotion], that's [bias] - do [correct action] instead"
    ],
    "contrarian_insight": "Smart money is likely [doing opposite of crowd]"
  }` : 'null'},
  "disciplineReminders": {
    "positionSizing": "Risk 1-2% of account maximum on this trade",
    "stopLoss": "Set at [specific level] BEFORE entering, NEVER move wider",
    "emotionalCheck": "If you feel strong emotion (FOMO/fear), wait 10 minutes before entering",
    "invalidation": "If [specific level] breaks, accept you were wrong and exit"
  }
}

Rules:
- Sentiment scores: -1.0 (very bearish) to +1.0 (very bullish)
- Confidence: 0-90 (HARD CAP at 90, nothing is certain)
- Always reference the timeframe and asset type in reasoning
- Reference specific patterns by name and their research-backed success rates
- Include pattern success rates in reasoning (e.g., "bull flag has 68% success rate, adjusted to 78% given current context")
- If no news, base prediction purely on technicals and note that`;

  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
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

    // Step 3: Sentiment + Prediction (enhanced with psychology & context)
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

    // Build enhanced disclaimer with success rate
    const topPattern = prediction.patternBreakdown?.[0];
    const disclaimerRate = topPattern ? ` Top pattern success rate: ${topPattern.historicalSuccess || topPattern.finalScore + '%'}.` : '';

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
        confidence: Math.min(prediction.confidence || 0, 90), // Hard cap
        timeframe: technical.timeframe,
        assetType: technical.assetType,
        reasoning,
        entry_zone: prediction.entry_zone,
        stop_loss: prediction.stop_loss,
        take_profit: prediction.take_profit,
        risk_reward: prediction.risk_reward,
        overallSentiment: prediction.overallSentiment,
        ...(prediction.entryTiming ? { entryTiming: prediction.entryTiming } : {}),
        ...(prediction.patternBreakdown ? { patternBreakdown: prediction.patternBreakdown } : {}),
        ...(prediction.psychologyWarnings ? { psychologyWarnings: prediction.psychologyWarnings } : {}),
        ...(prediction.disciplineReminders ? { disciplineReminders: prediction.disciplineReminders } : {}),
        ...(prediction.confidenceBreakdown ? { confidenceBreakdown: prediction.confidenceBreakdown } : {}),
      },
      imageUrl,
      analysisId: analysisId || null,
      disclaimer: `This analysis is for educational purposes only. Not financial advice.${disclaimerRate} Always do your own research and use stop losses.`,
    };

    console.log('[chart-analyzer] ✅ Analysis complete for', technical.ticker, '| Signal:', prediction.signal, '| Confidence:', result.prediction.confidence);
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

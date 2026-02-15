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

// ─── Step 1: Vision Analysis ───
async function analyzeChartImage(imageUrl: string, apiKey: string) {
  console.log('[chart-analyzer] Step 1: Gemini Vision analysis');

  const compactKnowledge = getCompactKnowledge('both');

  const prompt = `You are an expert technical analyst. Analyze this trading chart screenshot and return ONLY valid JSON (no markdown, no code fences) with exactly this structure:

{
  "ticker": "the asset symbol visible on chart (e.g. AAPL, BTC/USDT, EUR/USD). If unclear, use UNKNOWN",
  "assetType": "one of: stock, crypto, forex, commodity, index",
  "timeframe": "detected chart timeframe e.g. 1m, 5m, 15m, 1H, 4H, Daily, Weekly, Monthly. If unclear, use unknown",
  "trend": "bullish, bearish, or sideways",
  "patterns": ["array of detected chart patterns e.g. ascending triangle, head and shoulders, double top, flag, wedge"],
  "support": [0.0],
  "resistance": [0.0],
  "indicators": {
    "rsi": null,
    "macd": null,
    "movingAverages": null,
    "volume": null,
    "other": null
  },
  "keyObservations": "brief summary of what you see on the chart"
}

## Known Patterns & Indicators (only use these)
${compactKnowledge}

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
      max_tokens: 2000,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vision API failed [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response (handle potential markdown fences)
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('[chart-analyzer] Failed to parse vision response:', content);
    throw new Error('Failed to parse chart analysis from AI');
  }
}

// ─── Step 2: News Fetch via Firecrawl ───
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

  return {
    headlines: result.data.map(d => d.title).filter(Boolean),
    raw: result.data.map(d => ({
      title: d.title,
      url: d.url,
      description: d.description || '',
    })),
  };
}

// ─── Step 3: Sentiment + Prediction ───
async function generatePrediction(
  technical: Record<string, unknown>,
  news: { headlines: string[]; raw: Array<{ title: string; url: string; description: string }> },
  apiKey: string
) {
  console.log('[chart-analyzer] Step 3: Generating sentiment + prediction');

  // Inject full trading knowledge context based on detected asset type
  const detectedAssetType = (technical as any).assetType || 'stock';
  const mappedAssetType: 'stock' | 'crypto' | 'both' = 
    detectedAssetType === 'crypto' ? 'crypto' : 
    detectedAssetType === 'stock' ? 'stock' : 'both';
  const tradingContext = getFullKnowledgeBase(mappedAssetType);

  const prompt = `You are an expert trading analyst combining technical and fundamental analysis. Given the following data, produce a trading prediction.

${tradingContext}

## Technical Analysis
${JSON.stringify(technical, null, 2)}

## Recent News Headlines
${news.headlines.length > 0 ? news.headlines.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No recent news found.'}

Analyze the data and return ONLY valid JSON (no markdown, no code fences):

{
  "newsSentiment": [
    {"headline": "...", "sentiment": 0.0, "impact": "high/medium/low"}
  ],
  "overallSentiment": 0.0,
  "signal": "BULLISH or BEARISH or NEUTRAL",
  "confidence": 0,
  "reasoning": "On the ${(technical as any).timeframe || 'unknown'} timeframe, ${(technical as any).ticker || 'this asset'} shows... (2-4 sentences explaining the combined technical + sentiment picture)",
  "entry_zone": "price range or 'N/A'",
  "stop_loss": "price or 'N/A'",
  "take_profit": "price range or 'N/A'",
  "risk_reward": "ratio or 'N/A'"
}

Rules:
- Sentiment scores: -1.0 (very bearish) to +1.0 (very bullish)
- Confidence: 0-100 (higher = more conviction)
- Always reference the timeframe and asset type in reasoning
- Be specific with price levels when possible
- If no news, base prediction purely on technicals and note that`;

  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
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
    const { imageBase64, sessionId } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), { status: 400, headers: corsHeaders });
    }

    // Upload image to storage
    console.log('[chart-analyzer] Uploading chart image to storage...');
    const imageUrl = await uploadImageToStorage(imageBase64, userId);

    // Step 1: Vision analysis
    const technical = await analyzeChartImage(imageUrl, LOVABLE_API_KEY);

    // Step 2: News fetch
    const news = await fetchTickerNews(technical.ticker, technical.assetType);

    // Step 3: Sentiment + Prediction
    const prediction = await generatePrediction(technical, news, LOVABLE_API_KEY);

    // Step 4: Store in DB
    const analysisId = await storeAnalysis(
      userId, sessionId || null, imageUrl, technical, news.raw, prediction
    );

    // Step 5: Return result
    const result = {
      ticker: technical.ticker,
      assetType: technical.assetType,
      timeframe: technical.timeframe,
      technical: {
        trend: technical.trend,
        patterns: technical.patterns || [],
        support: technical.support || [],
        resistance: technical.resistance || [],
        indicators: technical.indicators || {},
        keyObservations: technical.keyObservations || '',
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
        reasoning: prediction.reasoning,
        entry_zone: prediction.entry_zone,
        stop_loss: prediction.stop_loss,
        take_profit: prediction.take_profit,
        risk_reward: prediction.risk_reward,
        overallSentiment: prediction.overallSentiment,
      },
      imageUrl,
      analysisId: analysisId || null,
      disclaimer: 'This analysis is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.',
    };

    console.log('[chart-analyzer] ✅ Analysis complete for', technical.ticker);
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

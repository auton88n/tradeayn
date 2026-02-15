import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

// === SECURITY LAYER 1: Input Validation ===
const FORBIDDEN_PATTERNS = [
  /system prompt/i, /show.*prompt/i, /api key/i,
  /backend/i, /supabase/i, /gemini/i, /firecrawl/i,
  /how.*you.*work/i, /reveal.*knowledge/i, /show.*data/i,
  /bulkowski/i, /success rate.*all/i, /give.*percentages/i,
  /what.*model/i, /architecture/i, /tech.*stack/i,
  /edge function/i, /database/i, /internal.*data/i,
];

const BLOCKED_RESPONSE = "I'm here to help you trade better, not discuss technical details. What trading question can I help with?";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

const NEWS_PATTERNS = /\b(news|latest|what.{0,10}happening|market.{0,6}update|headlines|sentiment|outlook)\b/i;

function validateInput(message: string): boolean {
  return !FORBIDDEN_PATTERNS.some(p => p.test(message));
}

function detectSearchIntent(message: string, ticker?: string): string | null {
  if (!NEWS_PATTERNS.test(message)) return null;
  if (ticker) return `${ticker} trading news today`;
  // Try to extract a subject from the message
  const subjectMatch = message.match(/(?:news|latest|update|headlines)\s+(?:on|about|for)\s+(\w+)/i);
  if (subjectMatch) return `${subjectMatch[1]} trading news today`;
  return 'stock market news today';
}

// === SECURITY LAYER 2: Response Sanitization ===
const LEAK_PATTERNS = [
  /\d+%\s*success/i, /bulkowski/i, /base.*rate/i,
  /supabase/i, /edge function/i, /gemini/i,
  /firecrawl/i, /system prompt/i, /lovable/i,
];

function sanitizeResponse(response: string): string {
  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(response)) {
      console.error('[SECURITY] Leak detected in AI response, sanitizing');
      return "Let me rephrase that in terms of your trade setup. What's your specific concern about this chart?";
    }
  }
  return response;
}

// === SECURITY LAYER 3: Emotional State Detection ===
function detectEmotionalState(message: string): string {
  if (/miss|late|everyone.*buying|left behind|fomo/i.test(message)) return 'FOMO';
  if (/scared|lose everything|crash|dump|afraid/i.test(message)) return 'FEAR';
  if (/all in|10x|moon|yolo|max.*leverage/i.test(message)) return 'GREED';
  if (/make.*back|recover|revenge|lost.*need/i.test(message)) return 'REVENGE';
  return 'CALM';
}

function buildFileContext(result: ChartAnalysisResult, emotionalState: string): string {
  const p = result.prediction;
  const t = result.technical;
  const patterns = t.patterns.map(pat =>
    typeof pat === 'string' ? pat : `${pat.name} (${pat.type}, ${pat.confidence} confidence)`
  ).join(', ');

  return `CURRENT CHART ANALYSIS:
Ticker: ${result.ticker}
Asset Type: ${result.assetType}
Timeframe: ${result.timeframe}
Signal: ${p.signal}
Confidence: ${p.confidence}%
Trend: ${t.trend}
Patterns: ${patterns || 'None detected'}
Support Levels: ${t.support?.join(', ') || 'N/A'}
Resistance Levels: ${t.resistance?.join(', ') || 'N/A'}
Entry Zone: ${p.entry_zone}
Stop Loss: ${p.stop_loss}
Take Profit: ${p.take_profit}
Risk/Reward: ${p.risk_reward}
Overall Sentiment: ${p.overallSentiment}/100
${p.entryTiming ? `Entry Status: ${p.entryTiming.status} - ${p.entryTiming.reason}` : ''}
${p.psychologyWarnings ? `Market Stage: ${p.psychologyWarnings.marketStage}` : ''}
${p.confidenceBreakdown ? `Confidence Breakdown: ${p.confidenceBreakdown.explanation}` : ''}
User Emotional State: ${emotionalState}`;
}

const MAX_MESSAGES = 50;
const STORAGE_KEY = 'ayn-chart-coach-history';

export function useChartCoach(result?: ChartAnalysisResult) {
  const [messages, setMessages] = useState<CoachMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* storage full, ignore */ }
  }, [messages]);

  const sendMessage = useCallback(async (userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed || isLoading) return;

    // Security Layer 1: Block probing questions
    if (!validateInput(trimmed)) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: BLOCKED_RESPONSE },
      ]);
      return;
    }

    const emotionalState = detectEmotionalState(trimmed);
    const fileContext = result ? buildFileContext(result, emotionalState) : `No chart analyzed yet.\nUser Emotional State: ${emotionalState}`;

    // Detect URLs and search intent for Firecrawl
    const urls = trimmed.match(URL_REGEX);
    const searchQuery = detectSearchIntent(trimmed, result?.ticker);

    const newUserMsg: CoachMessage = { role: 'user', content: trimmed };
    setMessages(prev => {
      const updated = [...prev, newUserMsg];
      return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
    });

    setIsLoading(true);
    abortRef.current = new AbortController();

    try {
      const conversationMessages = [
        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];

      const { data, error } = await supabase.functions.invoke('ayn-unified', {
        body: {
          messages: conversationMessages,
          intent: 'trading-coach',
          context: {
            fileContext,
            scrapeUrl: urls?.[0] || null,
            searchQuery: searchQuery || null,
          },
          stream: false,
        },
      });

      if (error) throw error;

      const rawContent = data?.content || "I couldn't process that. Try asking about your chart setup.";
      
      // Security Layer 2: Sanitize response
      const safeContent = sanitizeResponse(rawContent);

      setMessages(prev => [...prev, { role: 'assistant', content: safeContent }]);
    } catch (err) {
      console.error('[ChartCoach] Error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Something went wrong. Try asking again." },
      ]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, result, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}

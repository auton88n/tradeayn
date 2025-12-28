import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  message?: string;
  userId?: string;
  allowPersonalization?: boolean;
  contactPerson?: string;
  detectedLanguage?: string;
  concise?: boolean;
  mode?: string;
  has_attachment?: boolean;
  file_data?: {
    url: string;
    name: string;
    type: string;
    size?: number;
  } | null;
  sessionId?: string;
  conversationHistory?: any[];
  emotionHistory?: EmotionHistoryEntry[];
}

interface EmotionHistoryEntry {
  emotion: UserEmotion;
  intensity: number;
  timestamp: string;
}

interface MoodPattern {
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  dominantEmotion: UserEmotion;
  averageIntensity: number;
  emotionCounts: Record<UserEmotion, number>;
  adaptiveContext: string;
}

interface LABResponse {
  json: Record<string, unknown> | null;
  text: string;
  emotion: string;
  raw: string;
  hasStructuredData: boolean;
}

interface WebhookResponse {
  response: string;
  status: 'success' | 'error' | 'upstream_error';
  upstream?: {
    status: number;
    contentType: string;
  };
  error?: string;
  userEmotion?: EmotionAnalysis;
  suggestedAynEmotion?: string;
  moodPattern?: MoodPattern;
  labData?: LABResponse;
}

// Emotion detection types and logic (ported from frontend)
type UserEmotion = 'happy' | 'sad' | 'frustrated' | 'excited' | 'anxious' | 'neutral' | 'confused';

interface EmotionAnalysis {
  emotion: UserEmotion;
  intensity: number;
  indicators: string[];
}

const EMOTION_PATTERNS: Record<UserEmotion, { keywords: string[]; patterns: RegExp[] }> = {
  happy: {
    keywords: ['happy', 'great', 'awesome', 'love', 'amazing', 'wonderful', 'fantastic', 'excited', 'joy', 'glad', 'thrilled', 'سعيد', 'رائع', 'ممتاز', 'مذهل', 'فرحان'],
    patterns: [/😊|😄|😃|🎉|❤️|💕|🥰|😍/g, /!{2,}/g, /\byes+\b/gi]
  },
  sad: {
    keywords: ['sad', 'disappointed', 'unhappy', 'depressed', 'down', 'upset', 'crying', 'tears', 'heartbroken', 'حزين', 'محبط', 'زعلان'],
    patterns: [/😢|😭|💔|😞|😔/g, /\.{3,}/g]
  },
  frustrated: {
    keywords: ['frustrated', 'annoyed', 'angry', 'irritated', 'fed up', 'hate', 'stupid', 'useless', 'broken', 'wrong', 'not working', 'محبط', 'غاضب', 'زهقان', 'مش شغال'],
    patterns: [/😤|😠|😡|🤬/g, /!{3,}/g, /\?{2,}/g, /wtf|omg/gi]
  },
  excited: {
    keywords: ['excited', 'cant wait', 'amazing', 'incredible', 'wow', 'omg', 'unbelievable', 'متحمس', 'واو', 'مش مصدق'],
    patterns: [/🎉|🚀|✨|🔥|💫|⭐/g, /!{2,}/g, /\b(so+|very+|really+)\b/gi]
  },
  anxious: {
    keywords: ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'concern', 'stress', 'panic', 'fear', 'قلقان', 'خايف', 'متوتر'],
    patterns: [/😰|😨|😱|🥺/g, /\?{2,}/g]
  },
  confused: {
    keywords: ['confused', 'dont understand', 'what do you mean', 'unclear', 'lost', 'help', 'how do i', 'مش فاهم', 'ازاي', 'كيف'],
    patterns: [/🤔|😕|❓|🤷/g, /\?{2,}/g, /huh|what\?/gi]
  },
  neutral: {
    keywords: [],
    patterns: []
  }
};

function analyzeUserEmotion(message: string): EmotionAnalysis {
  const lowerMessage = message.toLowerCase();
  const emotionScores: Record<UserEmotion, number> = {
    happy: 0, sad: 0, frustrated: 0, excited: 0, anxious: 0, confused: 0, neutral: 0
  };
  const indicators: string[] = [];

  for (const [emotion, { keywords, patterns }] of Object.entries(EMOTION_PATTERNS) as [UserEmotion, { keywords: string[]; patterns: RegExp[] }][]) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        emotionScores[emotion] += 1;
        indicators.push(keyword);
      }
    }
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        emotionScores[emotion] += matches.length * 0.5;
        indicators.push(...matches);
      }
    }
  }

  // Intensity modifiers
  const exclamationCount = (message.match(/!/g) || []).length;
  const capsRatio = (message.match(/[A-Z]/g) || []).length / Math.max(message.length, 1);
  const intensityBoost = exclamationCount * 0.1 + (capsRatio > 0.5 ? 0.3 : 0);

  let maxEmotion: UserEmotion = 'neutral';
  let maxScore = 0;
  for (const [emotion, score] of Object.entries(emotionScores) as [UserEmotion, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }

  const intensity = Math.min(1, (maxScore / 3) + intensityBoost);

  return {
    emotion: maxScore > 0.5 ? maxEmotion : 'neutral',
    intensity,
    indicators: [...new Set(indicators)].slice(0, 5)
  };
}

function getEmotionContext(analysis: EmotionAnalysis): string {
  switch (analysis.emotion) {
    case 'frustrated':
      return 'User seems frustrated. Be extra patient, acknowledge their frustration, offer clear solutions.';
    case 'sad':
      return 'User seems down. Be supportive, warm, and encouraging.';
    case 'excited':
      return 'User is excited! Match their energy, be enthusiastic.';
    case 'anxious':
      return 'User seems worried. Be calm, reassuring, and provide clear guidance.';
    case 'confused':
      return 'User seems confused. Explain clearly, offer to clarify.';
    case 'happy':
      return 'User is in a good mood. Be positive and engaging.';
    default:
      return '';
  }
}

function getEmpathyResponse(emotion: UserEmotion): { aynEmotion: string } {
  const mapping: Record<UserEmotion, string> = {
    frustrated: 'calm',
    sad: 'calm',
    anxious: 'calm',
    happy: 'happy',
    excited: 'excited',
    confused: 'thinking',
    neutral: 'calm'
  };
  return { aynEmotion: mapping[emotion] || 'calm' };
}

// Mood pattern analysis - tracks emotion history to detect trends
function analyzeMoodPattern(emotionHistory: EmotionHistoryEntry[], currentEmotion: EmotionAnalysis): MoodPattern {
  const allEmotions = [...emotionHistory, { 
    emotion: currentEmotion.emotion, 
    intensity: currentEmotion.intensity, 
    timestamp: new Date().toISOString() 
  }];
  
  // Count emotions
  const emotionCounts: Record<UserEmotion, number> = {
    happy: 0, sad: 0, frustrated: 0, excited: 0, anxious: 0, confused: 0, neutral: 0
  };
  
  let totalIntensity = 0;
  for (const entry of allEmotions) {
    emotionCounts[entry.emotion]++;
    totalIntensity += entry.intensity;
  }
  
  // Find dominant emotion
  let dominantEmotion: UserEmotion = 'neutral';
  let maxCount = 0;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion as UserEmotion;
    }
  }
  
  const averageIntensity = allEmotions.length > 0 ? totalIntensity / allEmotions.length : 0;
  
  // Determine trend based on recent vs earlier emotions
  let trend: 'improving' | 'declining' | 'stable' | 'volatile' = 'stable';
  
  if (allEmotions.length >= 3) {
    const positiveEmotions = ['happy', 'excited'];
    const negativeEmotions = ['sad', 'frustrated', 'anxious'];
    
    const recentHalf = allEmotions.slice(-Math.ceil(allEmotions.length / 2));
    const earlierHalf = allEmotions.slice(0, Math.floor(allEmotions.length / 2));
    
    const recentPositive = recentHalf.filter(e => positiveEmotions.includes(e.emotion)).length;
    const recentNegative = recentHalf.filter(e => negativeEmotions.includes(e.emotion)).length;
    const earlierPositive = earlierHalf.filter(e => positiveEmotions.includes(e.emotion)).length;
    const earlierNegative = earlierHalf.filter(e => negativeEmotions.includes(e.emotion)).length;
    
    // Check for volatility (frequent emotion changes)
    let changes = 0;
    for (let i = 1; i < allEmotions.length; i++) {
      if (allEmotions[i].emotion !== allEmotions[i-1].emotion) changes++;
    }
    const volatilityRatio = changes / Math.max(allEmotions.length - 1, 1);
    
    if (volatilityRatio > 0.7) {
      trend = 'volatile';
    } else if (recentPositive > earlierPositive && recentNegative < earlierNegative) {
      trend = 'improving';
    } else if (recentNegative > earlierNegative && recentPositive < earlierPositive) {
      trend = 'declining';
    }
  }
  
  // Generate adaptive context based on pattern
  const adaptiveContext = generateAdaptiveContext(trend, dominantEmotion, averageIntensity, emotionCounts);
  
  return {
    trend,
    dominantEmotion,
    averageIntensity,
    emotionCounts,
    adaptiveContext
  };
}

function generateAdaptiveContext(
  trend: 'improving' | 'declining' | 'stable' | 'volatile',
  dominantEmotion: UserEmotion,
  averageIntensity: number,
  emotionCounts: Record<UserEmotion, number>
): string {
  const contexts: string[] = [];
  
  // Trend-based context
  switch (trend) {
    case 'improving':
      contexts.push('User mood is improving throughout the conversation. Maintain positive momentum.');
      break;
    case 'declining':
      contexts.push('User mood has been declining. Be extra supportive and patient. Acknowledge any difficulties.');
      break;
    case 'volatile':
      contexts.push('User emotions are fluctuating. Provide steady, grounding responses.');
      break;
  }
  
  // Dominant emotion context
  if (dominantEmotion !== 'neutral') {
    const persistentThreshold = 3;
    if (emotionCounts[dominantEmotion] >= persistentThreshold) {
      switch (dominantEmotion) {
        case 'frustrated':
          contexts.push('User has shown persistent frustration. Consider offering alternative approaches or asking if they need a break.');
          break;
        case 'confused':
          contexts.push('User has been frequently confused. Simplify explanations and check understanding more often.');
          break;
        case 'anxious':
          contexts.push('User has shown ongoing anxiety. Be reassuring and break down tasks into smaller steps.');
          break;
        case 'happy':
        case 'excited':
          contexts.push('User has been consistently positive. Match their enthusiasm!');
          break;
      }
    }
  }
  
  // High intensity warning
  if (averageIntensity > 0.7) {
    contexts.push('User is expressing emotions with high intensity. Be attentive and responsive.');
  }
  
  return contexts.join(' ');
}

// Enhanced text processing utilities
const textProcessor = {
  // Extract content from various object structures
  extractContent(obj: any): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    
    const contentFields = ['output', 'response', 'message', 'content', 'text', 'data'];
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }
    return undefined;
  },

  // Extract content AND emotion from n8n response
  extractContentAndEmotion(obj: any): { content?: string; emotion?: string } {
    if (!obj || typeof obj !== 'object') return {};
    
    let content: string | undefined;
    let emotion: string | undefined;
    
    // Extract content
    const contentFields = ['output', 'response', 'message', 'content', 'text', 'data'];
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        content = obj[field];
        break;
      }
    }
    
    // Extract emotion from n8n response
    const emotionFields = ['suggestedEmotion', 'emotion', 'aynEmotion'];
    for (const field of emotionFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        emotion = obj[field];
        break;
      }
    }
    
    return { content, emotion };
  },

  // Parse NDJSON (newline-delimited JSON)
  parseNDJSON(text: string): any[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: any[] = [];
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        items.push(parsed);
      } catch {
        // Skip invalid JSON lines
      }
    }
    return items;
  },

  // Clean and normalize text (strips newlines - use for plain text only)
  normalizeText(text: string): string {
    if (!text) return '';
    
    return text
      // Replace multiple newlines with single spaces
      .replace(/\n+/g, ' ')
      // Replace multiple spaces/tabs with single space
      .replace(/[\s\t]+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Ensure proper sentence spacing
      .replace(/([.!?])\s+/g, '$1 ')
      // Fix common formatting issues
      .replace(/\s+([,.!?;:])/g, '$1');
  },

  // Preserve markdown formatting (keeps newlines for tables, lists, etc.)
  preserveMarkdown(text: string): string {
    if (!text) return '';
    
    return text
      // Normalize excessive newlines (3+ → 2) but keep structure
      .replace(/\n{3,}/g, '\n\n')
      // Replace tabs with spaces but preserve structure
      .replace(/\t/g, '  ')
      // Trim each line but keep newlines
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      // Final trim
      .trim();
  },

  // Strip embedded EMOTION: markers from AI response text
  stripEmotionMarker(text: string): string {
    if (!text) return '';
    
    return text
      // Remove emotion markers at end of text (most common pattern)
      .replace(/\n*\s*EMOTION:\s*\w+\s*$/gi, '')
      // Remove emotion markers anywhere with surrounding newlines
      .replace(/\n+EMOTION:\s*\w+\s*\n*/gi, '\n')
      // Remove inline emotion markers
      .replace(/\s+EMOTION:\s*\w+/gi, '')
      .trim();
  },

  // Process raw response into clean text (legacy - use processResponseWithEmotion for emotion extraction)
  processResponse(rawText: string, contentType: string): string {
    const { text } = this.processResponseWithEmotion(rawText, contentType);
    return text;
  },

  // Process raw response and extract both text AND emotion from n8n
  processResponseWithEmotion(rawText: string, contentType: string): { text: string; emotion?: string } {
    let normalized = '';
    let extractedEmotion: string | undefined;
    let isMarkdownContent = false;

    // Try JSON first (object OR array)
    const trimmed = rawText.trim();
    if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawText);
        
        // Handle ARRAY format: [{ output: "...", emotion: "..." }]
        if (Array.isArray(parsed)) {
          const results = parsed.map(item => this.extractContentAndEmotion(item));
          const contents = results.map(r => r.content).filter(Boolean) as string[];
          // Use first found emotion
          extractedEmotion = results.find(r => r.emotion)?.emotion;
          
          if (contents.length > 0) {
            normalized = contents.join('\n\n');  // Preserve paragraphs!
            isMarkdownContent = true;
          }
        } else {
          // Handle OBJECT format: { output: "...", emotion: "..." }
          const { content, emotion } = this.extractContentAndEmotion(parsed);
          if (content) {
            normalized = content;
            extractedEmotion = emotion;
            isMarkdownContent = true;
          }
        }
      } catch {
        // Not valid JSON, continue to NDJSON parsing
      }
    }

    // If no JSON content found, try NDJSON
    if (!normalized && rawText.includes('\n')) {
      const ndjsonItems = this.parseNDJSON(rawText);
      if (ndjsonItems.length > 0) {
        const results = ndjsonItems.map(item => this.extractContentAndEmotion(item));
        const contents = results.map(r => r.content).filter(Boolean) as string[];
        // Use first found emotion from NDJSON
        if (!extractedEmotion) {
          extractedEmotion = results.find(r => r.emotion)?.emotion;
        }
        
        if (contents.length > 0) {
          normalized = contents.join('\n\n');
          isMarkdownContent = true;
        }
      }
    }

    // Fallback to raw text
    if (!normalized) {
      normalized = rawText;
    }

    // Use preserveMarkdown for JSON content (keeps tables, lists intact)
    // Use normalizeText only for raw text fallback
    // Then strip any embedded EMOTION: markers from the text
    const processedText = isMarkdownContent ? this.preserveMarkdown(normalized) : this.normalizeText(normalized);
    const text = this.stripEmotionMarker(processedText);
    return { text, emotion: extractedEmotion };
  },

  // Parse LAB mode structured response format
  // Handles both structured format AND standard JSON format from n8n
  parseLABResponse(response: string): LABResponse {
    const trimmed = response.trim();
    
    // FIRST: Try to parse as standard JSON ({"output": "...", "suggestedEmotion": "..."})
    // This is what n8n typically returns
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        
        // Handle array format [{"output": "..."}]
        const obj = Array.isArray(parsed) ? parsed[0] : parsed;
        
        if (obj && typeof obj === 'object') {
          // Extract text from standard fields
          const textFields = ['output', 'response', 'message', 'content', 'text'];
          let text = '';
          for (const field of textFields) {
            if (obj[field] && typeof obj[field] === 'string') {
              text = obj[field];
              break;
            }
          }
          
          // Strip EMOTION marker from extracted text
          text = this.stripEmotionMarker(text);
          
          // Extract emotion
          const emotionFields = ['suggestedEmotion', 'emotion', 'aynEmotion'];
          let emotion = 'calm';
          for (const field of emotionFields) {
            if (obj[field] && typeof obj[field] === 'string') {
              emotion = obj[field].toLowerCase();
              break;
            }
          }
          
          // Check if response contains structured LAB data (beyond just output/emotion)
          let labJson: Record<string, unknown> | null = null;
          
          // FIRST: Check for top-level n8n marketing format with contentType + data
          if (obj.contentType && obj.data && typeof obj.data === 'object') {
            labJson = {
              contentType: obj.contentType,
              templateId: obj.templateId || null,
              data: obj.data
            };
          } else {
            // FALLBACK: Check for nested data fields
            const labDataFields = ['analysis', 'data', 'report', 'campaign', 'metrics', 'json'];
            for (const field of labDataFields) {
              if (obj[field] && typeof obj[field] === 'object') {
                labJson = obj[field] as Record<string, unknown>;
                break;
              }
            }
          }
          
          // Generate fallback text when output is empty but structured data exists
          const generateFallbackText = (labData: Record<string, unknown> | null): string => {
            if (!labData) return "Here's what I created for you.";
            
            const data = labData.data as Record<string, unknown> | undefined;
            const contentType = labData.contentType as string | undefined;
            
            // Try to get a headline/title from the data
            const headline = data?.headline || data?.title || data?.name;
            if (headline) {
              const typeLabel = contentType === 'social' ? 'social post' : (contentType || 'content');
              return `Here's your ${typeLabel}: "${headline}"`;
            }
            
            // Generic fallback based on content type
            switch (contentType) {
              case 'social':
              case 'social_post':
                return "Here's your social media post!";
              case 'report':
                return "Here's your marketing report.";
              case 'campaign_analysis':
                return "Here's your campaign analysis.";
              case 'brand_kit':
                return "Here's your brand kit.";
              case 'content_calendar':
                return "Here's your content calendar.";
              default:
                return "Here's what I created for you.";
            }
          };
          
          // Return if we have text OR structured data (generate fallback if text is empty)
          if (text || labJson) {
            return {
              json: labJson,
              text: text || generateFallbackText(labJson),
              emotion: emotion,
              raw: response,
              hasStructuredData: !!labJson
            };
          }
        }
      } catch (e) {
        // Not valid JSON, continue to structured format parsing
        console.log('LAB standard JSON parse failed, trying structured format');
      }
    }
    
    // SECOND: Try structured format with markdown code blocks and markers
    // ```json\n{...}\n```\nCONVERSATIONAL RESPONSE:\n...\n\nEMOTION: happy
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    const conversationalMatch = response.match(/CONVERSATIONAL RESPONSE:\n([\s\S]*?)\n\nEMOTION:/);
    const emotionMatch = response.match(/EMOTION:\s*(\w+)/i);
    
    let jsonData: Record<string, unknown> | null = null;
    if (jsonMatch) {
      try {
        jsonData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.log('LAB markdown JSON parse error:', e);
      }
    }
    
    // Get text content - prefer conversational section
    let text = response;
    if (conversationalMatch) {
      text = conversationalMatch[1].trim();
    } else if (jsonMatch || emotionMatch) {
      // Strip markers to get clean text
      text = response
        .replace(/```json\n[\s\S]*?\n```/g, '')
        .replace(/EMOTION:\s*\w+/gi, '')
        .replace(/CONVERSATIONAL RESPONSE:/gi, '')
        .trim();
    }
    
    return {
      json: jsonData,
      text: text || response,
      emotion: emotionMatch ? emotionMatch[1].toLowerCase() : 'calm',
      raw: response,
      hasStructuredData: !!jsonData
    };
  }
};

// Enforce concise responses: limit to 3 sentences or ~320 characters and plain text style
function enforceConciseness(text: string): string {
  if (!text) return '';
  // Remove bullet/numbered list formatting to keep plain text
  let t = text.replace(/^[\s*-•]+\s*/gm, '').replace(/^\d+\.\s+/gm, '');
  // Split into sentences (support Arabic question mark)
  const parts = t.split(/(?<=[.!?؟])\s+/).filter(Boolean);
  t = parts.slice(0, 3).join(' ');
  // Hard cap length
  if (t.length > 320) t = t.slice(0, 320).replace(/\s+\S*$/, '') + '...';
  // Remove leading greetings
  t = t.replace(/^(hello|hi|hey)[,!\s]*/i, '');
  return t.trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Processing webhook request`);

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Parse request body
    let requestData: WebhookRequest = {};
    
    try {
      const body = await req.json();
      requestData = {
        message: body?.message || '',
        userId: body?.userId || '',
        allowPersonalization: body?.allowPersonalization || false,
        contactPerson: body?.contactPerson || '',
        detectedLanguage: body?.detectedLanguage || 'en',
        concise: body?.concise ?? true,
        mode: body?.mode || 'General',
        has_attachment: body?.has_attachment || false,
        file_data: body?.file_data || null,
        sessionId: body?.sessionId || '',
        conversationHistory: body?.conversationHistory || []
      };
    } catch (e) {
      console.warn(`[${requestId}] Request body was not valid JSON, using defaults`);
    }

    // Validate required fields
    if (!requestData.message || typeof requestData.message !== 'string') {
      console.error(`[${requestId}] Invalid message field`);
      throw new Error('Message is required and must be a string');
    }

    const sanitizedMessage = requestData.message.trim();
    if (sanitizedMessage.length === 0) {
      console.error(`[${requestId}] Empty message`);
      throw new Error('Message cannot be empty');
    }

    // Truncate message if too long (keep first 100k chars - handles large PDFs/documents)
    const maxMessageLength = 100000;
    const truncatedMessage = sanitizedMessage.length > maxMessageLength 
      ? sanitizedMessage.slice(0, maxMessageLength) + '...[truncated]'
      : sanitizedMessage;
    
    if (sanitizedMessage.length > maxMessageLength) {
      console.warn(`[${requestId}] Message truncated from ${sanitizedMessage.length} to ${maxMessageLength} characters`);
    }

    // Limit conversation history to last 10 messages to prevent payload bloat
    const maxHistoryItems = 10;
    let conversationHistory = requestData.conversationHistory || [];
    if (conversationHistory.length > maxHistoryItems) {
      conversationHistory = conversationHistory.slice(-maxHistoryItems);
      console.log(`[${requestId}] Conversation history truncated to last ${maxHistoryItems} messages`);
    }
    
    // Also truncate individual history messages if they're too long
    conversationHistory = conversationHistory.map((msg: any) => {
      if (msg.content && typeof msg.content === 'string' && msg.content.length > 10000) {
        return { ...msg, content: msg.content.slice(0, 10000) + '...[truncated]' };
      }
      return msg;
    });

    if (!requestData.userId) {
      console.error(`[${requestId}] Missing user ID`);
      throw new Error('User ID is required');
    }

    // SERVER-SIDE RATE LIMIT CHECK (100 requests per hour)
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('check_api_rate_limit', {
        p_user_id: requestData.userId,
        p_endpoint: 'ayn-webhook',
        p_max_requests: 100,
        p_window_minutes: 60
      });

    if (rateLimitError) {
      console.error(`[${requestId}] Rate limit check error:`, rateLimitError);
    }

    if (rateLimitResult && rateLimitResult.length > 0 && !rateLimitResult[0].allowed) {
      const result = rateLimitResult[0];
      console.warn(`[${requestId}] Rate limit exceeded for user:`, requestData.userId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          response: 'You have exceeded the maximum number of requests. Please wait before sending more messages.',
          status: 'error',
          retryAfter: result.retry_after_seconds || 3600,
          resetAt: result.reset_at
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(result.retry_after_seconds || 3600),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': String(result.remaining_requests || 0),
            'X-RateLimit-Reset': result.reset_at || ''
          }
        }
      );
    }

    // Check usage thresholds and send alerts if needed (non-blocking)
    EdgeRuntime.waitUntil((async () => {
      try {
        // Get user's access grant with usage info
        const { data: accessGrant } = await supabase
          .from('access_grants')
          .select('current_month_usage, monthly_limit, usage_reset_date')
          .eq('user_id', requestData.userId)
          .maybeSingle();

        if (accessGrant && accessGrant.monthly_limit && accessGrant.monthly_limit > 0) {
          const currentUsage = accessGrant.current_month_usage || 0;
          const monthlyLimit = accessGrant.monthly_limit;
          const percentageUsed = Math.round((currentUsage / monthlyLimit) * 100);
          const resetDate = accessGrant.usage_reset_date || new Date().toISOString();

          // Check thresholds: 75%, 90%, 100%
          let alertType: '75_percent' | '90_percent' | '100_percent' | null = null;
          if (percentageUsed >= 100) {
            alertType = '100_percent';
          } else if (percentageUsed >= 90) {
            alertType = '90_percent';
          } else if (percentageUsed >= 75) {
            alertType = '75_percent';
          }

          if (alertType) {
            // Get user's email and name for notification
            const { data: userData } = await supabase.auth.admin.getUserById(requestData.userId);
            
            if (userData?.user?.email) {
              // Get user's notification preferences
              const { data: userSettings } = await supabase
                .from('user_settings')
                .select('email_usage_warnings')
                .eq('user_id', requestData.userId)
                .maybeSingle();

              // Only send if user has usage warnings enabled (default true)
              if (userSettings?.email_usage_warnings !== false) {
                // Get user's name from profile
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('contact_person')
                  .eq('user_id', requestData.userId)
                  .maybeSingle();

                // Call send-usage-alert function
                const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
                await fetch(`${supabaseUrl}/functions/v1/send-usage-alert`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                  },
                  body: JSON.stringify({
                    userId: requestData.userId,
                    userEmail: userData.user.email,
                    userName: profile?.contact_person || userData.user.user_metadata?.full_name,
                    currentUsage,
                    monthlyLimit,
                    percentageUsed,
                    alertType,
                    resetDate
                  })
                });

                console.log(`[${requestId}] Usage alert triggered: ${alertType} (${percentageUsed}%)`);
              }
            }
          }
        }
      } catch (alertError) {
        console.error(`[${requestId}] Error checking usage alerts:`, alertError);
        // Don't fail the main request for alert errors
      }
    })());

    // Analyze user emotion from message
    const userEmotionAnalysis = analyzeUserEmotion(sanitizedMessage);
    const emotionContext = getEmotionContext(userEmotionAnalysis);
    
    // Analyze mood patterns from emotion history
    const emotionHistory = requestData.emotionHistory || [];
    const moodPattern = analyzeMoodPattern(emotionHistory, userEmotionAnalysis);
    
    console.log(`[${requestId}] Detected user emotion:`, userEmotionAnalysis);
    console.log(`[${requestId}] Mood pattern:`, { trend: moodPattern.trend, dominant: moodPattern.dominantEmotion });

    console.log(`[${requestId}] Edge function started`);
    console.log(`[${requestId}] User ID:`, requestData.userId);
    console.log(`[${requestId}] Message length:`, requestData.message?.length || 0);
    console.log(`[${requestId}] Mode:`, requestData.mode);
    console.log(`[${requestId}] Has attachments:`, requestData.has_attachment);
    console.log(`[${requestId}] Request data:`, {
      message: requestData.message?.slice(0, 100) + (requestData.message?.length > 100 ? '...' : ''),
      userId: requestData.userId,
      allowPersonalization: requestData.allowPersonalization,
      detectedLanguage: requestData.detectedLanguage,
      concise: requestData.concise,
      mode: requestData.mode,
      has_attachment: requestData.has_attachment,
      file_data: requestData.file_data ? { name: requestData.file_data.name, type: requestData.file_data.type } : null
    });

    // Get webhook URL for the selected mode
    const { data: modeConfig, error: modeError } = await supabase
      .from('ai_mode_configs')
      .select('webhook_url')
      .eq('mode_name', requestData.mode)
      .eq('is_active', true)
      .maybeSingle();

    if (modeError) {
      console.error(`[${requestId}] Database error fetching mode config:`, modeError);
      throw new Error(`Failed to fetch webhook configuration for mode: ${requestData.mode}`);
    }

    if (!modeConfig) {
      console.error(`[${requestId}] No active webhook found for mode: ${requestData.mode}`);
      throw new Error(`No active webhook configuration found for mode: ${requestData.mode}`);
    }

    const upstreamUrl = modeConfig.webhook_url;
    console.log(`[${requestId}] Using webhook URL for mode '${requestData.mode}': ${upstreamUrl}`);

    // Fetch recent engineering activities for user context (last 5)
    let engineeringContext: string | null = null;
    try {
      const { data: engineeringActivities } = await supabase
        .from('engineering_activity')
        .select('activity_type, summary, created_at')
        .eq('user_id', requestData.userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (engineeringActivities && engineeringActivities.length > 0) {
        engineeringContext = `Recent engineering activities:\n${engineeringActivities.map(a => 
          `- ${a.activity_type}: ${a.summary} (${new Date(a.created_at).toLocaleDateString()})`
        ).join('\n')}`;
        console.log(`[${requestId}] Engineering context found:`, engineeringActivities.length, 'activities');
      }
    } catch (engErr) {
      console.warn(`[${requestId}] Failed to fetch engineering context:`, engErr);
      // Non-blocking - continue without engineering context
    }

  // Prepare conversation key and system message based on personalization settings
  const conversationKey = requestData.allowPersonalization
    ? requestData.userId
    : `${requestData.userId}:np`; // separate non-personalized memory to avoid name bleed

  // Simplified system prompt - let n8n handle language and conciseness via payload fields
  const systemPrompt = requestData.contactPerson
    ? `You may address the user as ${requestData.contactPerson}. Respond in the user's language naturally.`
    : `Do not use or infer personal names. Ignore any prior memory of names. Respond in the user's language naturally.`;

  // Call upstream webhook with authentication and error handling
  let upstream;
  let contentType = '';
  let rawText = '';
  
  try {
    console.log(`[${requestId}] Calling n8n webhook:`, upstreamUrl);
    
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': Deno.env.get('N8N_WEBHOOK_SECRET') || '',
      },
      body: JSON.stringify({
        message: truncatedMessage,
        userId: requestData.userId,
        contactPerson: requestData.contactPerson,
        conversationKey, // isolate memory per user and mode
        system: systemPrompt,
        detectedLanguage: requestData.detectedLanguage,
        concise: requestData.concise,
        mode: requestData.mode,
        timestamp: new Date().toISOString(),
        requestId,
        has_attachment: requestData.has_attachment,
        file_data: requestData.file_data,
        sessionId: requestData.sessionId,
        conversationHistory: conversationHistory,
        userEmotion: userEmotionAnalysis,
        emotionContext: emotionContext,
        moodPattern: moodPattern,
        adaptiveContext: moodPattern.adaptiveContext,
        engineeringContext: engineeringContext, // NEW: User's recent engineering activities
      }),
    });

    console.log(`[${requestId}] N8N response status:`, upstream.status);

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error(`[${requestId}] N8N webhook error:`, errorText);
      throw new Error(`N8N webhook failed: ${upstream.status} - ${errorText}`);
    }

    contentType = upstream.headers.get('content-type') || '';
    rawText = await upstream.text();

    console.log(`[${requestId}] Upstream response:`, {
      status: upstream.status,
      contentType,
      bodyLength: rawText.length,
      bodyPreview: rawText.slice(0, 200) + (rawText.length > 200 ? '...' : '')
    });
  } catch (upstreamError) {
    console.error(`[${requestId}] Error calling n8n:`, upstreamError);
    
    const errorResponse: WebhookResponse = {
      response: "I'm having trouble connecting to my AI brain right now. Please try again in a moment.",
      status: 'error',
      error: upstreamError instanceof Error ? upstreamError.message : String(upstreamError)
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Return 200 so frontend doesn't show error modal
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

    // Check if this is LAB mode - use special parsing
    const isLABMode = requestData.mode === 'LAB';
    let labData: LABResponse | undefined;
    let processedText: string;
    let n8nEmotion: string | undefined;

    if (isLABMode) {
      // Parse LAB structured response
      labData = textProcessor.parseLABResponse(rawText);
      processedText = labData.text;
      n8nEmotion = labData.emotion;
      
      console.log(`[${requestId}] LAB mode parsing:`, {
        hasStructuredData: labData.hasStructuredData,
        jsonFields: labData.json ? Object.keys(labData.json) : [],
        emotion: labData.emotion,
        textPreview: processedText.slice(0, 100)
      });
    } else {
      // Standard processing for other modes
      const result = textProcessor.processResponseWithEmotion(rawText, contentType);
      processedText = result.text;
      n8nEmotion = result.emotion;
    }

    // Enhanced sanitization when personalization is disabled
    const sanitizeNonPersonalized = (text: string) => {
      let t = text;

      // Remove leading greetings with potential names
      t = t.replace(/^(?:hello|hi|hey)\s+[^,!]{0,40}[,!]?\s*/i, '');

      // Remove explicit statements about the user's name
      t = t.replace(/\b(your name is|you are called|I'll call you|I will call you)\s+[A-Z][a-z]{1,30}[.!?]?/gi, '');

      // Remove addressing patterns like 'Name,' at sentence start
      t = t.replace(/^([A-Z][a-z]{1,30}),\s+/gm, '');

      // If we know a contactPerson, strip it anywhere
      if (requestData.contactPerson) {
        const escaped = requestData.contactPerson.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRegex = new RegExp(`\\b${escaped}\\b`, 'g');
        t = t.replace(nameRegex, '');
      }

      // Preserve markdown formatting instead of normalizing to plain text
      return textProcessor.preserveMarkdown(t);
    };

    // When personalization is enabled, normalize greetings to the user's contact person
    const applyPersonalization = (text: string) => {
      if (!requestData.contactPerson) return text;

      const name = requestData.contactPerson.trim();
      if (!name) return text;

      // Title-case the name for greetings
      const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      let t = text;

      // Replace greeting at start of text like "Hi Sara," -> "Hi Ghazi,"
      t = t.replace(/^(hello|hi|hey)\s+[A-Z][a-z]{1,30}([,!])?/i, (_m, g1, g2) => {
        const greet = String(g1);
        const punct = g2 ?? ',';
        const greetCap = greet.charAt(0).toUpperCase() + greet.slice(1).toLowerCase();
        return `${greetCap} ${titleCase(name)}${punct} `;
      });

      // Replace greetings at the start of sentences
      t = t.replace(/([.!?]\s+)(hello|hi|hey)\s+[A-Z][a-z]{1,30}([,!])?/g, (_m, p1, g1, g3) => {
        const greetCap = String(g1).charAt(0).toUpperCase() + String(g1).slice(1).toLowerCase();
        const punct = g3 ?? ',';
        return `${p1}${greetCap} ${titleCase(name)}${punct} `;
      });

      // Preserve markdown formatting instead of normalizing to plain text
      return textProcessor.preserveMarkdown(t);
    };

    const sanitizedText = requestData.allowPersonalization ? applyPersonalization(processedText) : sanitizeNonPersonalized(processedText);

    // Log name stripping if it occurred
    if (!requestData.allowPersonalization && processedText !== sanitizedText) {
      console.log(`[${requestId}] Stripped potential personalization:`, {
        original: processedText.slice(0, 120),
        sanitized: sanitizedText.slice(0, 120)
      });
    }

    // For LAB mode, don't enforce conciseness - we want full structured responses
    let finalText = (requestData.concise && !isLABMode) ? enforceConciseness(sanitizedText) : sanitizedText;

    // Persist DALL-E images immediately before they expire
    // DALL-E URLs expire in ~1 hour, so we must save them now
    const dalleUrlPattern = /https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net[^\s"')]+/g;
    const dalleMatches = finalText.match(dalleUrlPattern);
    
    if (dalleMatches && dalleMatches.length > 0) {
      console.log(`[${requestId}] Found ${dalleMatches.length} DALL-E image(s) to persist`);
      
      for (const dalleUrl of dalleMatches) {
        try {
          console.log(`[${requestId}] Fetching DALL-E image...`);
          const imageResponse = await fetch(dalleUrl);
          
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const imageBuffer = await imageBlob.arrayBuffer();
            const uint8Array = new Uint8Array(imageBuffer);
            
            // Generate unique filename
            const timestamp = Date.now();
            const randomId = crypto.randomUUID().split('-')[0];
            const filename = `dalle-${timestamp}-${randomId}.png`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('generated-images')
              .upload(filename, uint8Array, {
                contentType: 'image/png',
                upsert: false
              });
            
            if (!uploadError && uploadData) {
              // Get public URL
              const { data: publicUrlData } = supabase.storage
                .from('generated-images')
                .getPublicUrl(filename);
              
              // Replace the DALL-E URL with the permanent URL in the response
              finalText = finalText.replace(dalleUrl, publicUrlData.publicUrl);
              console.log(`[${requestId}] Image persisted: ${filename}`);
            } else {
              console.error(`[${requestId}] Failed to upload image:`, uploadError);
            }
          } else {
            console.error(`[${requestId}] Failed to fetch DALL-E image: ${imageResponse.status}`);
          }
        } catch (imgError) {
          console.error(`[${requestId}] Error persisting image:`, imgError);
          // Continue with original URL if persistence fails
        }
      }
    }

    console.log(`[${requestId}] Text processing:`, {
      original: rawText.slice(0, 100),
      processed: finalText.slice(0, 100),
      lengthChange: `${rawText.length} -> ${finalText.length}`,
      personalizationEnabled: requestData.allowPersonalization,
      isLABMode
    });

    // Validate and determine final emotion - prefer n8n's emotion, fallback to user empathy mapping
    // Include ALL supported emotions to prevent fallback to calm for valid emotions
    const validEmotions = [
      'calm', 'happy', 'excited', 'thinking', 'frustrated', 'curious',
      'comfort', 'supportive', 'sad', 'mad', 'bored'
    ];
    const suggestedAynEmotion = (n8nEmotion && validEmotions.includes(n8nEmotion)) 
      ? n8nEmotion 
      : getEmpathyResponse(userEmotionAnalysis.emotion).aynEmotion;

    console.log(`[${requestId}] Emotion source:`, {
      n8nEmotion: n8nEmotion || 'none',
      userEmotion: userEmotionAnalysis.emotion,
      finalEmotion: suggestedAynEmotion,
      source: (n8nEmotion && validEmotions.includes(n8nEmotion)) ? 'n8n' : 'user-empathy-mapping'
    });

    // Prepare response with emotion data, mood pattern, and LAB data if applicable
    const response: WebhookResponse = {
      response: finalText || 'I received your message but got an empty response. Please try again.',
      status: upstream.ok ? 'success' : 'upstream_error',
      upstream: {
        status: upstream.status,
        contentType
      },
      userEmotion: userEmotionAnalysis,
      suggestedAynEmotion: suggestedAynEmotion,
      moodPattern: moodPattern,
      ...(isLABMode && labData ? { labData } : {})
    };

    if (!upstream.ok) {
      response.error = `Upstream returned ${upstream.status}: ${sanitizedText || 'No response body'}`;
    }

    console.log(`[${requestId}] Final response prepared, length: ${response.response.length}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Error processing webhook:`, error);
    
    const errorResponse: WebhookResponse = {
      response: 'I encountered an error while processing your request. Please try again.',
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
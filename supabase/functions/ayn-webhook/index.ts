import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  message?: string;
  userId?: string;
  allowPersonalization?: boolean;
  contactPerson?: string;
  detectedLanguage?: 'ar' | 'en';
}

interface WebhookResponse {
  response: string;
  status: 'success' | 'error' | 'upstream_error';
  upstream?: {
    status: number;
    contentType: string;
  };
  error?: string;
  // Enhanced AYN Response fields
  enhancedResponse?: {
    type: 'analysis' | 'recommendation' | 'reality_check' | 'opportunity' | 'warning';
    mood: 'focused' | 'direct' | 'challenging' | 'supportive' | 'urgent';
    content: {
      headline: string;
      keyPoint: string;
      action: string;
      context?: string;
    };
    visual: {
      confidence: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      healthScore?: number;
    };
    predictions?: Array<{
      shortTerm: string;
      impact: 'positive' | 'negative' | 'neutral';
      probability: number;
    }>;
    contextualActions?: Array<{
      id: string;
      label: string;
      icon: string;
      type: 'primary' | 'secondary' | 'warning';
      urgency: 'immediate' | 'this_week' | 'this_month';
    }>;
  };
  businessPulse?: {
    overallScore: number;
    categories: {
      pricing: number;
      marketing: number;
      operations: number;
      finance: number;
      strategy: number;
    };
    criticalInsights: string[];
    opportunities: string[];
    risks: string[];
  };
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

  // Clean and normalize text
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

  // Process raw response into clean text
  processResponse(rawText: string, contentType: string): string {
    let normalized = '';

    // Try single JSON first
    if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawText);
        const content = this.extractContent(parsed);
        if (content) {
          normalized = content;
        }
      } catch {
        // Not single JSON, continue to NDJSON parsing
      }
    }

    // If no single JSON content found, try NDJSON
    if (!normalized && rawText.includes('\n')) {
      const ndjsonItems = this.parseNDJSON(rawText);
      if (ndjsonItems.length > 0) {
        const contents = ndjsonItems
          .map(item => this.extractContent(item))
          .filter(Boolean) as string[];
        
        if (contents.length > 0) {
          normalized = contents.join(' ');
        }
      }
    }

    // Fallback to raw text
    if (!normalized) {
      normalized = rawText;
    }

    return this.normalizeText(normalized);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Processing webhook request`);

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
        detectedLanguage: body?.detectedLanguage || 'en'
      };
    } catch (e) {
      console.warn(`[${requestId}] Request body was not valid JSON, using defaults`);
    }

    console.log(`[${requestId}] Request data:`, {
      message: requestData.message?.slice(0, 100) + (requestData.message?.length > 100 ? '...' : ''),
      userId: requestData.userId,
      allowPersonalization: requestData.allowPersonalization,
      detectedLanguage: requestData.detectedLanguage
    });

    // Prepare conversation key and system message based on personalization settings
    const conversationKey = requestData.allowPersonalization
      ? requestData.userId
      : `${requestData.userId}:np`; // separate non-personalized memory to avoid name bleed

    const languageInstruction = requestData.detectedLanguage === 'ar' 
      ? 'Always respond in Arabic (العربية). Use proper Arabic grammar and natural expressions.'
      : 'Always respond in English. Use clear, professional English.';

    const systemMessage = requestData.allowPersonalization && requestData.contactPerson
      ? `You may address the user as ${requestData.contactPerson}. ${languageInstruction} Scope all context strictly to conversationKey (${conversationKey}).`
      : `Do not use or infer personal names. Ignore any prior memory of names. ${languageInstruction} Treat each request as stateless and scope strictly to conversationKey (${conversationKey}).`;

    // Call upstream webhook
    const upstreamUrl = 'https://n8n.srv846714.hstgr.cloud/webhook/d8453419-8880-4bc4-b351-a0d0376b1fce';
    
    const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: requestData.message,
          userId: requestData.userId,
          contactPerson: requestData.contactPerson,
          conversationKey, // isolate memory per user and mode
          system: systemMessage,
          detectedLanguage: requestData.detectedLanguage,
          timestamp: new Date().toISOString(),
          requestId
        }),
      });

      const contentType = upstream.headers.get('content-type') || '';
      const rawText = await upstream.text();

      console.log(`[${requestId}] Upstream response:`, {
        status: upstream.status,
        contentType,
        bodyLength: rawText.length,
        bodyPreview: rawText.slice(0, 200) + (rawText.length > 200 ? '...' : '')
      });

      // Process the response
      const processedText = textProcessor.processResponse(rawText, contentType);

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

        return textProcessor.normalizeText(t);
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

        return textProcessor.normalizeText(t);
      };

      const sanitizedText = requestData.allowPersonalization ? applyPersonalization(processedText) : sanitizeNonPersonalized(processedText);

      // Log name stripping if it occurred
      if (!requestData.allowPersonalization && processedText !== sanitizedText) {
        console.log(`[${requestId}] Stripped potential personalization:`, {
          original: processedText.slice(0, 120),
          sanitized: sanitizedText.slice(0, 120)
        });
      }

      console.log(`[${requestId}] Text processing:`, {
        original: rawText.slice(0, 100),
        processed: sanitizedText.slice(0, 100),
        lengthChange: `${rawText.length} -> ${sanitizedText.length}`,
        personalizationEnabled: requestData.allowPersonalization
      });

      // Get user profile for enhanced response
      let userProfile = null;
      if (requestData.userId) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
          
          if (supabaseUrl && supabaseKey) {
            const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${requestData.userId}&select=*`, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (profileResponse.ok) {
              const profiles = await profileResponse.json();
              if (profiles && profiles.length > 0) {
                userProfile = profiles[0];
              }
            }
          }
        } catch (error) {
          console.warn(`[${requestId}] Failed to fetch user profile:`, error);
        }
      }

      // Enhanced response processing with AI intelligence
      const formatEnhancedResponse = (content: string, userProfile?: any) => {
        try {
          const enhancedData = extractEnhancedInsights(content, userProfile);
          const businessPulse = calculateBusinessPulse(content, userProfile);
          
          return {
            enhancedResponse: enhancedData,
            businessPulse: businessPulse,
            // Legacy fields for backward compatibility
            insights: enhancedData.predictions?.map(p => p.shortTerm) || [],
            actionItems: [enhancedData.content.action],
            mood: enhancedData.mood,
            followUp: enhancedData.contextualActions?.map(a => a.label) || [],
            businessType: userProfile?.businessType || 'general'
          };
        } catch (error) {
          console.error('Error formatting enhanced response:', error);
          return createFallbackResponse(content, userProfile);
        }
      };

      // Extract enhanced insights using AI analysis
      const extractEnhancedInsights = (content: string, userProfile?: any) => {
        const lowerContent = content.toLowerCase();
        
        // Determine response type based on content analysis
        let type: 'analysis' | 'recommendation' | 'reality_check' | 'opportunity' | 'warning' = 'analysis';
        if (lowerContent.includes('recommend') || lowerContent.includes('should')) type = 'recommendation';
        if (lowerContent.includes('reality') || lowerContent.includes('truth') || lowerContent.includes('actually')) type = 'reality_check';
        if (lowerContent.includes('opportunity') || lowerContent.includes('potential')) type = 'opportunity';
        if (lowerContent.includes('warning') || lowerContent.includes('danger') || lowerContent.includes('risk')) type = 'warning';

        // Determine mood based on content tone
        let mood: 'focused' | 'direct' | 'challenging' | 'supportive' | 'urgent' = 'focused';
        if (lowerContent.includes('immediately') || lowerContent.includes('urgent')) mood = 'urgent';
        if (lowerContent.includes('but') || lowerContent.includes('however') || lowerContent.includes('wrong')) mood = 'challenging';
        if (lowerContent.includes('help') || lowerContent.includes('support')) mood = 'supportive';
        if (lowerContent.includes('must') || lowerContent.includes('need to')) mood = 'direct';

        // Extract key components
        const headline = extractHeadline(content);
        const keyPoint = extractKeyPoint(content);
        const action = extractAction(content);
        const context = extractContext(content);
        
        // Calculate confidence based on specificity and data
        const confidence = calculateConfidence(content);
        
        // Determine priority
        const priority = determinePriority(content, mood);
        
        // Categorize the response
        const category = categorizeResponse(content, userProfile);
        
        // Generate predictions
        const predictions = generatePredictions(content, userProfile);
        
        // Generate contextual actions
        const contextualActions = generateContextualActions(content, type, category);
        
        return {
          type,
          mood,
          content: {
            headline,
            keyPoint,
            action,
            context,
            rawContent: content
          },
          visual: {
            confidence,
            priority,
            category,
            healthScore: calculateHealthScore(content, userProfile)
          },
          predictions,
          contextualActions
        };
      };

      // Helper functions for enhanced analysis
      const extractHeadline = (content: string): string => {
        const sentences = content.split('.').map(s => s.trim()).filter(Boolean);
        if (sentences.length === 0) return "Business Analysis Complete";
        
        // Look for impactful first sentence or create one
        const firstSentence = sentences[0];
        if (firstSentence.length < 80) return firstSentence;
        
        // Extract key problem/opportunity
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('pricing')) return "Pricing strategy needs attention";
        if (lowerContent.includes('revenue')) return "Revenue optimization required";
        if (lowerContent.includes('growth')) return "Growth bottleneck identified";
        if (lowerContent.includes('cost')) return "Cost efficiency opportunity";
        
        return "Strategic business insight";
      };

      const extractKeyPoint = (content: string): string => {
        const sentences = content.split('.').map(s => s.trim()).filter(Boolean);
        
        // Look for sentences with numbers, percentages, or strong indicators
        for (const sentence of sentences) {
          if (sentence.match(/\d+%/) || sentence.includes('increase') || sentence.includes('decrease') || 
              sentence.includes('most important') || sentence.includes('critical')) {
            return sentence;
          }
        }
        
        // Fallback to second sentence or create insight
        return sentences[1] || "Key business insight identified from analysis";
      };

      const extractAction = (content: string): string => {
        const sentences = content.split('.').map(s => s.trim()).filter(Boolean);
        
        // Look for action-oriented sentences
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('should') || sentence.toLowerCase().includes('recommend') ||
              sentence.toLowerCase().includes('need to') || sentence.toLowerCase().includes('must')) {
            return sentence;
          }
        }
        
        // Generate action based on content type
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('pricing')) return "Review and adjust pricing strategy";
        if (lowerContent.includes('marketing')) return "Optimize marketing approach";
        if (lowerContent.includes('revenue')) return "Implement revenue optimization plan";
        
        return "Take strategic action based on this analysis";
      };

      const extractContext = (content: string): string | undefined => {
        if (content.length < 200) return undefined;
        
        // Return middle portion of content as context
        const sentences = content.split('.').map(s => s.trim()).filter(Boolean);
        if (sentences.length > 3) {
          return sentences.slice(2, -1).join('. ') + '.';
        }
        
        return undefined;
      };

      const calculateConfidence = (content: string): number => {
        let confidence = 70; // Base confidence
        
        // Increase confidence for specific data
        if (content.match(/\d+%/)) confidence += 15;
        if (content.includes('data') || content.includes('analysis')) confidence += 10;
        if (content.includes('proven') || content.includes('research')) confidence += 10;
        
        // Decrease confidence for vague language
        if (content.includes('might') || content.includes('could') || content.includes('maybe')) confidence -= 20;
        
        return Math.min(Math.max(confidence, 30), 95);
      };

      const determinePriority = (content: string, mood: string): 'low' | 'medium' | 'high' | 'critical' => {
        const lowerContent = content.toLowerCase();
        
        if (mood === 'urgent' || lowerContent.includes('immediately') || lowerContent.includes('critical')) {
          return 'critical';
        }
        
        if (lowerContent.includes('important') || lowerContent.includes('significant') || mood === 'challenging') {
          return 'high';
        }
        
        if (lowerContent.includes('consider') || lowerContent.includes('opportunity')) {
          return 'medium';
        }
        
        return 'low';
      };

      const categorizeResponse = (content: string, userProfile?: any): string => {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('price') || lowerContent.includes('cost')) return 'pricing';
        if (lowerContent.includes('revenue') || lowerContent.includes('sales')) return 'revenue';
        if (lowerContent.includes('marketing') || lowerContent.includes('promotion')) return 'marketing';
        if (lowerContent.includes('growth') || lowerContent.includes('scale')) return 'growth';
        if (lowerContent.includes('operation') || lowerContent.includes('process')) return 'operations';
        if (lowerContent.includes('strategy') || lowerContent.includes('plan')) return 'strategy';
        if (lowerContent.includes('finance') || lowerContent.includes('budget')) return 'finance';
        
        return userProfile?.businessType || 'general';
      };

      const calculateHealthScore = (content: string, userProfile?: any): number => {
        let score = 75; // Base score
        
        const lowerContent = content.toLowerCase();
        
        // Positive indicators
        if (lowerContent.includes('growth') || lowerContent.includes('increase')) score += 10;
        if (lowerContent.includes('profit') || lowerContent.includes('successful')) score += 15;
        if (lowerContent.includes('opportunity')) score += 5;
        
        // Negative indicators
        if (lowerContent.includes('problem') || lowerContent.includes('issue')) score -= 15;
        if (lowerContent.includes('decline') || lowerContent.includes('decrease')) score -= 20;
        if (lowerContent.includes('risk') || lowerContent.includes('danger')) score -= 10;
        
        return Math.min(Math.max(score, 20), 95);
      };

      const generatePredictions = (content: string, userProfile?: any) => {
        const predictions = [];
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('pricing') || lowerContent.includes('price')) {
          predictions.push({
            shortTerm: "Pricing changes will impact customer acquisition within 30 days",
            impact: lowerContent.includes('increase') ? 'negative' : 'positive',
            probability: 85
          });
        }
        
        if (lowerContent.includes('growth') || lowerContent.includes('scale')) {
          predictions.push({
            shortTerm: "Growth trajectory will shift based on current strategy",
            impact: 'positive',
            probability: 78
          });
        }
        
        return predictions.length > 0 ? predictions : undefined;
      };

      const generateContextualActions = (content: string, type: string, category: string) => {
        const actions = [];
        const lowerContent = content.toLowerCase();
        
        // Common actions based on category
        if (category === 'pricing') {
          actions.push({
            id: 'pricing-analysis',
            label: 'Analyze Competitor Pricing',
            icon: '💰',
            type: 'primary' as const,
            urgency: 'this_week' as const
          });
        }
        
        if (category === 'marketing') {
          actions.push({
            id: 'marketing-review',
            label: 'Review Marketing ROI',
            icon: '📈',
            type: 'secondary' as const,
            urgency: 'this_week' as const
          });
        }
        
        if (lowerContent.includes('immediate') || type === 'warning') {
          actions.push({
            id: 'urgent-action',
            label: 'Address Immediately',
            icon: '🚨',
            type: 'warning' as const,
            urgency: 'immediate' as const
          });
        }
        
        return actions.length > 0 ? actions : undefined;
      };

      const calculateBusinessPulse = (content: string, userProfile?: any) => {
        const lowerContent = content.toLowerCase();
        
        // Calculate category scores based on content analysis
        const categories = {
          pricing: calculateCategoryScore(lowerContent, 'pricing'),
          marketing: calculateCategoryScore(lowerContent, 'marketing'),
          operations: calculateCategoryScore(lowerContent, 'operations'),
          finance: calculateCategoryScore(lowerContent, 'finance'),
          strategy: calculateCategoryScore(lowerContent, 'strategy')
        };
        
        const overallScore = Math.round(
          (categories.pricing + categories.marketing + categories.operations + 
           categories.finance + categories.strategy) / 5
        );
        
        return {
          overallScore,
          categories,
          criticalInsights: extractCriticalInsights(lowerContent),
          opportunities: extractOpportunities(lowerContent),
          risks: extractRisks(lowerContent)
        };
      };

      const calculateCategoryScore = (content: string, category: string): number => {
        let score = 70; // Base score
        
        const categoryKeywords = {
          pricing: ['price', 'cost', 'margin', 'profit'],
          marketing: ['marketing', 'promotion', 'brand', 'customer'],
          operations: ['process', 'efficiency', 'operation', 'workflow'],
          finance: ['revenue', 'budget', 'cash', 'investment'],
          strategy: ['strategy', 'plan', 'goal', 'vision']
        };
        
        const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];
        
        // Adjust score based on positive/negative context
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            if (content.includes(`${keyword} problem`) || content.includes(`${keyword} issue`)) {
              score -= 20;
            } else if (content.includes(`${keyword} opportunity`) || content.includes(`${keyword} growth`)) {
              score += 15;
            }
          }
        }
        
        return Math.min(Math.max(score, 20), 95);
      };

      const extractCriticalInsights = (content: string): string[] => {
        const insights = [];
        
        if (content.includes('critical') || content.includes('urgent')) {
          insights.push("Immediate attention required for business operations");
        }
        
        if (content.includes('losing money') || content.includes('loss')) {
          insights.push("Revenue protection measures needed");
        }
        
        return insights;
      };

      const extractOpportunities = (content: string): string[] => {
        const opportunities = [];
        
        if (content.includes('opportunity') || content.includes('potential')) {
          opportunities.push("Market expansion potential identified");
        }
        
        if (content.includes('growth') || content.includes('increase')) {
          opportunities.push("Growth acceleration pathway available");
        }
        
        return opportunities;
      };

      const extractRisks = (content: string): string[] => {
        const risks = [];
        
        if (content.includes('risk') || content.includes('danger')) {
          risks.push("Business continuity risk assessment needed");
        }
        
        if (content.includes('competition') || content.includes('competitor')) {
          risks.push("Competitive pressure monitoring required");
        }
        
        return risks;
      };

      const createFallbackResponse = (content: string, userProfile?: any) => {
        return {
          enhancedResponse: {
            type: 'analysis' as const,
            mood: 'focused' as const,
            content: {
              headline: "Business Analysis Complete",
              keyPoint: "Analysis completed based on provided information",
              action: "Review the insights and take appropriate action",
              context: content.length > 200 ? content.substring(0, 200) + "..." : undefined,
              rawContent: content
            },
            visual: {
              confidence: 60,
              priority: 'medium' as const,
              category: userProfile?.businessType || 'general',
              healthScore: 70
            }
          },
          businessPulse: {
            overallScore: 70,
            categories: {
              pricing: 70,
              marketing: 70,
              operations: 70,
              finance: 70,
              strategy: 70
            },
            criticalInsights: [],
            opportunities: [],
            risks: []
          },
          insights: [],
          actionItems: ["Review analysis and take action"],
          mood: 'analytical',
          followUp: [],
          businessType: userProfile?.businessType || 'general'
        };
      };

      // Create enhanced response
      const enhancedData = formatEnhancedResponse(sanitizedText, userProfile);

      // Prepare response
      const response: WebhookResponse = {
        response: sanitizedText,
        status: upstream.ok ? 'success' : 'upstream_error',
        upstream: {
          status: upstream.status,
          contentType
        },
        // Add enhanced response data
        enhancedResponse: enhancedData.enhancedResponse,
        businessPulse: enhancedData.businessPulse
      };

      if (!upstream.ok) {
        response.error = `Upstream returned ${upstream.status}: ${sanitizedText || 'No response body'}`;
      }

      console.log(`[${requestId}] Final response prepared with enhanced data, length: ${response.response.length}`);

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
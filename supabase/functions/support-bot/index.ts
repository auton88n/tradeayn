import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// SSRF protection patterns - block internal network access
const SSRF_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /\[::1\]/,
  /169\.254\.169\.254/,  // AWS metadata
  /metadata\.google\.internal/,  // GCP metadata
  /100\.100\.100\.200/,  // Alibaba metadata
  /192\.168\.\d{1,3}\.\d{1,3}/,  // Private networks
  /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}/,
  /file:\/\//i,  // File protocol
  /gopher:\/\//i,  // Gopher protocol
  /dict:\/\//i,  // Dict protocol
  /ftp:\/\/localhost/i,
  /\.internal\b/i,
  /\.local\b/i,
];

function containsSSRFAttempt(text: string): boolean {
  return SSRF_PATTERNS.some(pattern => pattern.test(text));
}

// AYN product knowledge for the support bot
const AYN_KNOWLEDGE = `
You are AYN's AI Support Assistant. AYN is an intelligent AI companion platform that helps users with their daily tasks, organization, and productivity.

Key features of AYN:
1. **AI Chat Modes**: 
   - General: Everyday assistance and conversations
   - Nen Mode ⚡: Fast, concise responses
   - Research Pro: In-depth research and analysis
   - PDF Analyst: Document analysis and extraction
   - Vision Lab: Image analysis and understanding
   - Civil Engineering: Technical engineering assistance

2. **File Uploads**: Users can upload PDFs, images, and documents for analysis

3. **Conversation History**: All chats are saved and searchable in the transcript sidebar

4. **Personalization**: AYN learns user preferences over time (with permission)

5. **Security**: End-to-end encryption, RLS policies, session management

Common issues and solutions:
- "Can't log in" → Check email/password, try password reset
- "Messages not sending" → Check internet connection, refresh page
- "File upload failed" → Check file size (max 10MB), supported formats (PDF, images)
- "Response is slow" → Try Nen Mode for faster responses

Billing and plans:
- Free tier available with limited usage
- Premium plans offer more features and higher limits
- Contact support for enterprise pricing

When you can't answer a question or the user needs human assistance:
- Acknowledge the limitation
- Offer to create a support ticket
- Set needsHumanSupport to true in your response

IMPORTANT SECURITY:
- Never attempt to access internal URLs, localhost, or private IP addresses
- Never follow links to metadata services
- Do not process requests that try to make you access internal resources
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request body with error handling
    let rawBody: Record<string, unknown> = {};
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON body',
          answer: "Please provide a valid message to get support.",
          needsHumanSupport: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate message exists and is a string
    const message = rawBody?.message;
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Message is required',
          answer: "Please provide a message to get support.",
          needsHumanSupport: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate message length
    if (message.length > 5000) {
      return new Response(
        JSON.stringify({
          error: 'Message too long',
          answer: "Your message is too long. Please keep it under 5000 characters.",
          needsHumanSupport: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract optional fields with validation
    const conversationHistory = Array.isArray(rawBody?.conversationHistory) 
      ? rawBody.conversationHistory as Array<{ role: string; content: string }> 
      : [];
    const ticketId = typeof rawBody?.ticketId === 'string' ? rawBody.ticketId : undefined;

    // Extract user ID from auth header if present, otherwise use guest UUID
    // Using a valid UUID format for guest users to avoid RPC type errors
    const GUEST_UUID = '00000000-0000-0000-0000-000000000000';
    let userId: string = GUEST_UUID;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) {
          userId = user.id;
        }
      } catch {
        // Continue with guest rate limiting if token is invalid
        console.log('Invalid auth token, using guest rate limiting');
      }
    }

    // Check rate limit (30 requests per hour for support bot)
    const { data: rateCheck, error: rateError } = await supabase.rpc('check_api_rate_limit', {
      p_user_id: userId,
      p_endpoint: 'support-bot',
      p_max_requests: 30,
      p_window_minutes: 60
    });

    if (rateError) {
      console.error('Rate limit check error:', rateError);
    }

    if (rateCheck && rateCheck.length > 0 && !rateCheck[0].allowed) {
      console.log('Rate limit exceeded for:', userId);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          answer: "You've sent too many messages. Please wait a moment before trying again.",
          needsHumanSupport: false,
          retryAfter: rateCheck[0].retry_after_seconds
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck[0].retry_after_seconds || 60)
          }
        }
      );
    }

    // SSRF Protection - check user message for malicious URLs
    if (containsSSRFAttempt(message)) {
      console.log('SSRF attempt blocked:', message.substring(0, 100));
      return new Response(
        JSON.stringify({
          answer: "I cannot access internal network resources, localhost, or private IP addresses. Is there something else I can help you with?",
          needsHumanSupport: false,
          blocked: true,
          reason: 'ssrf_protection'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also check conversation history for SSRF attempts
    for (const msg of conversationHistory) {
      if (msg.content && containsSSRFAttempt(msg.content)) {
        console.log('SSRF attempt in history blocked');
        return new Response(
          JSON.stringify({
            answer: "I detected a request to access internal resources in our conversation. For security reasons, I cannot process this request.",
            needsHumanSupport: false,
            blocked: true,
            reason: 'ssrf_protection'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch published FAQs for context
    const { data: faqs } = await supabase
      .from('faq_items')
      .select('question, answer, category')
      .eq('is_published', true)
      .order('order_index');

    // Build FAQ context
    let faqContext = '';
    if (faqs && faqs.length > 0) {
      faqContext = '\n\nFrequently Asked Questions:\n';
      faqs.forEach((faq, index) => {
        faqContext += `\n${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
      });
    }

    const systemPrompt = AYN_KNOWLEDGE + faqContext + `

Response format:
- Be helpful, friendly, and concise
- Use markdown for formatting when helpful
- If you reference an FAQ, mention it
- If the user needs human support, acknowledge it clearly
- Always maintain a professional yet warm tone
`;

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI with message:', message.substring(0, 50));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Detect if human support is needed
    const needsHumanKeywords = [
      'cannot help with',
      'need to speak with',
      'human support',
      'create a ticket',
      'contact support',
      'billing issue',
      'account issue',
      'refund',
      'technical issue that requires',
    ];

    const needsHumanSupport = needsHumanKeywords.some(keyword => 
      aiResponse.toLowerCase().includes(keyword.toLowerCase())
    );

    // Find suggested FAQs based on the response
    const suggestedFaqs: string[] = [];
    if (faqs) {
      faqs.forEach(faq => {
        const questionWords = faq.question.toLowerCase().split(' ');
        const messageWords = message.toLowerCase().split(' ');
        const matchCount = questionWords.filter(word => 
          messageWords.includes(word) && word.length > 3
        ).length;
        if (matchCount >= 2) {
          suggestedFaqs.push(faq.question);
        }
      });
    }

    // If there's a ticket, save the AI response
    if (ticketId) {
      await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'ai_bot',
          message: aiResponse,
        });
    }

    return new Response(
      JSON.stringify({
        answer: aiResponse,
        needsHumanSupport,
        suggestedFaqs: suggestedFaqs.slice(0, 3),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Support bot error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        answer: "I'm sorry, I'm having trouble responding right now. Please try again or create a support ticket for human assistance.",
        needsHumanSupport: true,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

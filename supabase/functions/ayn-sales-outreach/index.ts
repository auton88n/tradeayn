import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SERVICES = [
  { name: 'AI Employees', desc: 'Custom AI agents that handle customer support, scheduling, data entry, and internal operations 24/7' },
  { name: 'Smart Ticketing Systems', desc: 'AI-powered support ticket management with auto-routing, priority detection, and smart responses' },
  { name: 'Business Automation', desc: 'End-to-end workflow automation — from lead capture to invoicing to reporting' },
  { name: 'Company & Influencer Websites', desc: 'High-performance, beautifully designed websites with AI-powered features built in' },
  { name: 'AI-Powered Customer Support', desc: 'Conversational AI chatbots trained on your business, handling inquiries in multiple languages' },
  { name: 'Engineering Consultation Tools', desc: 'Specialized calculators, compliance checkers, and project management tools for engineering firms' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mode, url, lead_id, email_draft, search_query } = await req.json();

    switch (mode) {
      case 'prospect':
        return await handleProspect(supabase, url, supabaseUrl, supabaseKey);
      case 'draft_email':
        return await handleDraftEmail(supabase, lead_id);
      case 'send_email':
        return await handleSendEmail(supabase, lead_id, email_draft);
      case 'follow_up':
        return await handleFollowUp(supabase, lead_id);
      case 'pipeline_status':
        return await handlePipelineStatus(supabase);
      case 'search_leads':
        return await handleSearchLeads(supabase, search_query, supabaseUrl, supabaseKey);
      default:
        return jsonResponse({ error: `Unknown mode: ${mode}` }, 400);
    }
  } catch (error) {
    console.error('ayn-sales-outreach error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ─── Prospect a company URL ───
async function handleProspect(supabase: any, url: string, supabaseUrl: string, supabaseKey: string) {
  if (!url) return jsonResponse({ error: 'URL is required' }, 400);

  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) return jsonResponse({ error: 'FIRECRAWL_API_KEY not configured' }, 500);

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

  console.log('Prospecting:', formattedUrl);

  // Scrape the website
  let scrapeData: any = null;
  try {
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });
    if (scrapeRes.ok) {
      scrapeData = await scrapeRes.json();
    }
  } catch (e) {
    console.error('Firecrawl scrape failed:', e);
  }

  // Use AI to analyze the company
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return jsonResponse({ error: 'LOVABLE_API_KEY not configured' }, 500);

  const websiteContent = scrapeData?.data?.markdown || scrapeData?.markdown || 'Could not scrape website content';
  const metadata = scrapeData?.data?.metadata || scrapeData?.metadata || {};

  const analysisRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{
        role: 'system',
        content: `You are a sales analyst. Analyze this company's website and identify:
1. Company name
2. Industry
3. Contact email (look for info@, contact@, hello@, or any visible email)
4. Contact person name (if visible)
5. Pain points — what problems do they have that our services could solve?
6. Website quality score (1-10) — is their site modern, fast, well-designed?
7. Which of our services would help them most?

Our services: ${SERVICES.map(s => `${s.name}: ${s.desc}`).join('\n')}

Respond in JSON format:
{
  "company_name": "...",
  "industry": "...",
  "contact_email": "...",
  "contact_name": "...",
  "pain_points": ["..."],
  "website_quality": 7,
  "recommended_services": ["AI Employees", "Smart Ticketing Systems"],
  "notes": "Brief assessment of opportunity"
}`,
      }, {
        role: 'user',
        content: `Website URL: ${formattedUrl}\nTitle: ${metadata.title || 'Unknown'}\n\nContent:\n${websiteContent.slice(0, 8000)}`,
      }],
    }),
  });

  if (!analysisRes.ok) {
    return jsonResponse({ error: 'AI analysis failed' }, 500);
  }

  const aiData = await analysisRes.json();
  let analysis: any;
  try {
    const content = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return jsonResponse({ error: 'Failed to parse AI analysis' }, 500);
  }

  if (!analysis) return jsonResponse({ error: 'No analysis result' }, 500);

  // Check if lead already exists
  const { data: existing } = await supabase
    .from('ayn_sales_pipeline')
    .select('id')
    .eq('company_url', formattedUrl)
    .limit(1);

  if (existing?.length) {
    return jsonResponse({ success: true, message: 'Lead already exists in pipeline', lead_id: existing[0].id, analysis });
  }

  // Insert new lead
  const { data: newLead, error: insertErr } = await supabase
    .from('ayn_sales_pipeline')
    .insert({
      company_name: analysis.company_name || metadata.title || 'Unknown Company',
      company_url: formattedUrl,
      contact_email: analysis.contact_email || '',
      contact_name: analysis.contact_name || null,
      industry: analysis.industry || null,
      pain_points: analysis.pain_points || [],
      recommended_services: analysis.recommended_services || [],
      notes: analysis.notes || null,
      context: { website_quality: analysis.website_quality, scraped_at: new Date().toISOString(), metadata },
      status: 'lead',
    })
    .select('id')
    .single();

  if (insertErr) return jsonResponse({ error: `Failed to save lead: ${insertErr.message}` }, 500);

  // Also log to ayn_mind
  await supabase.from('ayn_mind').insert({
    type: 'sales_lead',
    content: `Found potential lead: ${analysis.company_name} (${analysis.industry}). Pain points: ${analysis.pain_points?.join(', ')}. Recommended: ${analysis.recommended_services?.join(', ')}`,
    context: { lead_id: newLead.id, company_url: formattedUrl, ...analysis },
    shared_with_admin: false,
  });

  await logAynActivity(supabase, 'sales_prospect', `Prospected ${analysis.company_name} from ${formattedUrl}`, {
    target_id: newLead.id, target_type: 'sales_lead',
    details: analysis,
    triggered_by: 'sales_outreach',
  });

  return jsonResponse({ success: true, lead_id: newLead.id, analysis });
}

// ─── Draft an outreach email ───
async function handleDraftEmail(supabase: any, lead_id: string) {
  if (!lead_id) return jsonResponse({ error: 'lead_id is required' }, 400);

  const { data: lead } = await supabase
    .from('ayn_sales_pipeline')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (!lead) return jsonResponse({ error: 'Lead not found' }, 404);

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return jsonResponse({ error: 'LOVABLE_API_KEY not configured' }, 500);

  const emailNumber = (lead.emails_sent || 0) + 1;
  const angle = emailNumber === 1
    ? 'First contact — identify their biggest pain point and show how we solve it. Reference almufaijer.com as proof.'
    : emailNumber === 2
    ? 'Follow-up — different angle, more specific value proposition. Mention a specific feature that would help them.'
    : 'Final follow-up — create urgency or offer a free consultation/demo. Keep it short.';

  const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{
        role: 'system',
        content: `You are a professional sales copywriter for AYN (aynn.io), a tech company that builds AI-powered solutions.

Write a ${emailNumber === 1 ? 'cold outreach' : 'follow-up'} email.

Rules:
- Professional but conversational — not corporate-speak
- Short (3-4 paragraphs max)
- Reference their SPECIFIC problems, not generic benefits
- Include a clear CTA (book a call, reply, visit our portfolio)
- Portfolio link: https://almufaijer.com (a live project we built)
- Sign as "The AYN Team"
- From email: info@aynn.io
- ${angle}

Our services: ${SERVICES.map(s => s.name).join(', ')}

Respond in JSON:
{
  "subject": "...",
  "html_body": "...",
  "plain_text": "..."
}`,
      }, {
        role: 'user',
        content: `Company: ${lead.company_name}\nContact: ${lead.contact_name || 'there'}\nIndustry: ${lead.industry || 'Unknown'}\nWebsite: ${lead.company_url || 'N/A'}\nPain points: ${lead.pain_points?.join(', ') || 'Unknown'}\nRecommended services: ${lead.recommended_services?.join(', ') || 'General'}\nPrevious emails sent: ${lead.emails_sent || 0}\nNotes: ${lead.notes || 'None'}`,
      }],
    }),
  });

  if (!aiRes.ok) return jsonResponse({ error: 'AI draft generation failed' }, 500);

  const aiData = await aiRes.json();
  let draft: any;
  try {
    const content = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    draft = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return jsonResponse({ error: 'Failed to parse email draft' }, 500);
  }

  // Save draft to ayn_mind for admin review
  await supabase.from('ayn_mind').insert({
    type: 'sales_draft',
    content: `Email draft for ${lead.company_name}: "${draft?.subject}"`,
    context: { lead_id, draft, email_number: emailNumber },
    shared_with_admin: true,
  });

  return jsonResponse({ success: true, lead_id, draft, email_number: emailNumber });
}

// ─── Send an approved email ───
async function handleSendEmail(supabase: any, lead_id: string, email_draft: any) {
  if (!lead_id) return jsonResponse({ error: 'lead_id is required' }, 400);

  const { data: lead } = await supabase
    .from('ayn_sales_pipeline')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (!lead) return jsonResponse({ error: 'Lead not found' }, 404);
  if (!lead.contact_email) return jsonResponse({ error: 'No contact email for this lead' }, 400);

  // For first contact, require admin_approved
  if (lead.emails_sent === 0 && !lead.admin_approved) {
    return jsonResponse({ error: 'First contact requires admin approval. Use Telegram to approve.' }, 403);
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);

  // If no draft provided, generate one
  let draft = email_draft;
  if (!draft) {
    const draftRes = await handleDraftEmail(supabase, lead_id);
    const draftData = await draftRes.json();
    draft = draftData.draft;
  }

  if (!draft?.subject || !draft?.html_body) {
    return jsonResponse({ error: 'Invalid email draft' }, 400);
  }

  // Send via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AYN <info@aynn.io>',
      to: [lead.contact_email],
      subject: draft.subject,
      html: draft.html_body,
    }),
  });

  const emailResult = await emailRes.json();
  const sent = emailRes.ok;

  // Update pipeline
  const nextFollowUp = new Date();
  nextFollowUp.setDate(nextFollowUp.getDate() + (lead.emails_sent === 0 ? 3 : 7));

  await supabase.from('ayn_sales_pipeline').update({
    emails_sent: (lead.emails_sent || 0) + 1,
    last_email_at: new Date().toISOString(),
    next_follow_up_at: nextFollowUp.toISOString(),
    status: lead.emails_sent === 0 ? 'contacted' : 'followed_up',
  }).eq('id', lead_id);

  await logAynActivity(supabase, 'sales_email_sent', `Sent ${lead.emails_sent === 0 ? 'outreach' : 'follow-up'} to ${lead.company_name} (${lead.contact_email})`, {
    target_id: lead_id, target_type: 'sales_lead',
    details: { subject: draft.subject, email_sent: sent, resend_result: emailResult },
    triggered_by: 'sales_outreach',
  });

  return jsonResponse({ success: sent, lead_id, email_result: emailResult });
}

// ─── Follow up on existing leads ───
async function handleFollowUp(supabase: any, lead_id: string) {
  if (!lead_id) return jsonResponse({ error: 'lead_id is required' }, 400);

  const { data: lead } = await supabase
    .from('ayn_sales_pipeline')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (!lead) return jsonResponse({ error: 'Lead not found' }, 404);

  // Safety checks
  if (lead.emails_sent >= 3) {
    return jsonResponse({ error: 'Max 3 emails per lead reached' }, 400);
  }
  if (lead.status === 'rejected' || lead.status === 'converted') {
    return jsonResponse({ error: `Lead is ${lead.status}, no follow-up needed` }, 400);
  }
  if (lead.last_email_at) {
    const daysSince = (Date.now() - new Date(lead.last_email_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) {
      return jsonResponse({ error: `Too soon for follow-up. Last email was ${Math.round(daysSince)} day(s) ago. Minimum 3 days.` }, 400);
    }
  }

  // Draft and send
  const draftRes = await handleDraftEmail(supabase, lead_id);
  const draftData = await draftRes.json();

  if (!draftData.success) return jsonResponse(draftData, 500);

  // For follow-ups on approved leads, send automatically
  if (lead.admin_approved) {
    return await handleSendEmail(supabase, lead_id, draftData.draft);
  }

  // Otherwise return draft for admin review
  return jsonResponse({ success: true, needs_approval: true, draft: draftData.draft, lead_id });
}

// ─── Pipeline status ───
async function handlePipelineStatus(supabase: any) {
  const { data: leads } = await supabase
    .from('ayn_sales_pipeline')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!leads?.length) {
    return jsonResponse({ success: true, message: 'Pipeline is empty', stats: {}, leads: [] });
  }

  const stats: Record<string, number> = {};
  for (const lead of leads) {
    stats[lead.status] = (stats[lead.status] || 0) + 1;
  }

  const dueFollowUps = leads.filter((l: any) =>
    l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date() &&
    !['converted', 'rejected'].includes(l.status) && l.emails_sent < 3
  );

  return jsonResponse({
    success: true,
    total: leads.length,
    stats,
    due_follow_ups: dueFollowUps.length,
    leads: leads.map((l: any) => ({
      id: l.id,
      company: l.company_name,
      status: l.status,
      emails_sent: l.emails_sent,
      approved: l.admin_approved,
      next_follow_up: l.next_follow_up_at,
    })),
  });
}

// ─── Search for leads using Firecrawl ───
async function handleSearchLeads(supabase: any, query: string, supabaseUrl: string, supabaseKey: string) {
  if (!query) return jsonResponse({ error: 'search_query is required' }, 400);

  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) return jsonResponse({ error: 'FIRECRAWL_API_KEY not configured' }, 500);

  console.log('Searching for leads:', query);

  const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `${query} company website`,
      limit: 5,
    }),
  });

  if (!searchRes.ok) return jsonResponse({ error: 'Firecrawl search failed' }, 500);

  const searchData = await searchRes.json();
  const results = searchData.data || [];

  // Prospect each result
  const prospected: any[] = [];
  for (const result of results.slice(0, 3)) {
    if (!result.url) continue;
    try {
      const prospectRes = await handleProspect(supabase, result.url, supabaseUrl, supabaseKey);
      const prospectData = await prospectRes.json();
      if (prospectData.success) {
        prospected.push({ url: result.url, lead_id: prospectData.lead_id, analysis: prospectData.analysis });
      }
    } catch (e) {
      console.error('Failed to prospect:', result.url, e);
    }
  }

  await logAynActivity(supabase, 'sales_search', `Searched for leads: "${query}" — found ${prospected.length}`, {
    details: { query, results_count: results.length, prospected_count: prospected.length },
    triggered_by: 'sales_outreach',
  });

  return jsonResponse({ success: true, query, total_results: results.length, prospected });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    let body: any = {};
    try { body = await req.json(); } catch {}
    const mode = body.mode || 'check_follow_ups';

    const results: string[] = [];

    if (mode === 'reply_detected' && body.record) {
      // Event-driven: inbound_email_replies INSERT
      const reply = body.record;
      const leadId = reply.pipeline_lead_id;

      if (leadId) {
        const { data: lead } = await supabase.from('ayn_sales_pipeline').select('*').eq('id', leadId).single();
        if (lead) {
          // Update lead status to replied
          await supabase.from('ayn_sales_pipeline').update({ status: 'replied' }).eq('id', leadId);

          const reportMsg = `📬 ${lead.company_name} replied to our outreach!\n\nFrom: ${reply.from_email}\nSubject: ${reply.subject || '(no subject)'}\n\n${(reply.body_text || '').slice(0, 500)}`;

          // Employee report for co-founder
          await supabase.from('ayn_mind').insert({
            type: 'employee_report',
            content: reportMsg,
            context: { from_employee: 'follow_up_agent', lead_id: leadId, reply_id: reply.id },
            shared_with_admin: false,
          });

          // Immediate Telegram alert
          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `📬 Follow-Up Agent\n\n${reportMsg}`);
          }

          results.push(`Reply detected from ${lead.company_name} — marked as replied`);

          await logAynActivity(supabase, 'reply_detected', `${lead.company_name} replied to outreach`, {
            target_id: leadId, target_type: 'sales_lead',
            details: { from: reply.from_email, subject: reply.subject },
            triggered_by: 'follow_up_agent',
          });
        }
      } else {
        // Try to match by email
        const { data: matchedLead } = await supabase
          .from('ayn_sales_pipeline')
          .select('id, company_name')
          .eq('contact_email', reply.from_email)
          .in('status', ['contacted', 'followed_up'])
          .limit(1)
          .maybeSingle();

        if (matchedLead) {
          await supabase.from('ayn_sales_pipeline').update({ status: 'replied' }).eq('id', matchedLead.id);
          // Update the reply with pipeline_lead_id
          await supabase.from('inbound_email_replies').update({ pipeline_lead_id: matchedLead.id }).eq('id', reply.id);

          results.push(`Matched reply from ${reply.from_email} to lead ${matchedLead.company_name}`);

          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
              `📬 ${matchedLead.company_name} (${reply.from_email}) replied!\n\n${(reply.body_text || '').slice(0, 300)}`
            );
          }
        }
      }
    } else {
      // Cron mode: check for due follow-ups
      const now = new Date();

      // Get leads that need follow-up
      const { data: dueLeads } = await supabase
        .from('ayn_sales_pipeline')
        .select('*')
        .in('status', ['contacted', 'followed_up'])
        .lte('next_follow_up_at', now.toISOString())
        .lt('emails_sent', 3)
        .limit(10);

      for (const lead of dueLeads || []) {
        // Check if they replied (check inbound_email_replies)
        const { data: replies } = await supabase
          .from('inbound_email_replies')
          .select('id')
          .eq('from_email', lead.contact_email)
          .limit(1);

        if (replies?.length) {
          // They replied! Update status
          await supabase.from('ayn_sales_pipeline').update({ status: 'replied' }).eq('id', lead.id);
          results.push(`${lead.company_name} replied — updated status`);

          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
              `📬 Follow-Up Agent: Found reply from ${lead.company_name} during routine check`
            );
          }
          continue;
        }

        // No reply — check if we should send follow-up or drop
        if (lead.emails_sent >= 3) {
          // Max emails reached — mark as cold
          await supabase.from('ayn_sales_pipeline').update({ status: 'cold' }).eq('id', lead.id);
          results.push(`${lead.company_name} — no response after ${lead.emails_sent} emails → marked cold`);
          continue;
        }

        // Calculate days since last email
        const daysSinceLastEmail = lead.last_email_at
          ? (Date.now() - new Date(lead.last_email_at).getTime()) / (1000 * 60 * 60 * 24)
          : 999;

        // Follow-up timing: #1 at 3 days, #2 at 5 days after previous
        const minDays = lead.emails_sent === 1 ? 3 : 5;

        if (daysSinceLastEmail < minDays) {
          results.push(`${lead.company_name} — too soon for follow-up (${Math.round(daysSinceLastEmail)}d/${minDays}d)`);
          continue;
        }

        // Send follow-up via ayn-sales-outreach
        if (lead.admin_approved) {
          try {
            const followUpRes = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'follow_up', lead_id: lead.id }),
            });
            const followUpData = await followUpRes.json();

            if (followUpData.success) {
              results.push(`Sent follow-up #${lead.emails_sent + 1} to ${lead.company_name}`);
            } else {
              results.push(`Follow-up failed for ${lead.company_name}: ${followUpData.error}`);
            }
          } catch (e) {
            results.push(`Follow-up error for ${lead.company_name}: ${e instanceof Error ? e.message : 'error'}`);
          }
        } else {
          results.push(`${lead.company_name} — follow-up due but needs approval`);
        }

        // Small delay between emails to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      }

      // Check for leads that should be marked cold (emails_sent >= 3, still contacted/followed_up)
      const { data: staleLeads } = await supabase
        .from('ayn_sales_pipeline')
        .select('id, company_name, emails_sent, last_email_at')
        .in('status', ['contacted', 'followed_up'])
        .gte('emails_sent', 3);

      for (const lead of staleLeads || []) {
        const daysSince = lead.last_email_at
          ? (Date.now() - new Date(lead.last_email_at).getTime()) / (1000 * 60 * 60 * 24)
          : 0;

        if (daysSince >= 5) {
          await supabase.from('ayn_sales_pipeline').update({ status: 'cold' }).eq('id', lead.id);
          results.push(`Dropped ${lead.company_name} — no response after ${lead.emails_sent} emails, ${Math.round(daysSince)} days`);
        }
      }

      // Summary report
      if (results.length > 0) {
        await supabase.from('ayn_mind').insert({
          type: 'employee_report',
          content: `📧 Follow-Up Agent Report:\n${results.map(r => `• ${r}`).join('\n')}`,
          context: { from_employee: 'follow_up_agent', leads_processed: dueLeads?.length || 0 },
          shared_with_admin: false,
        });
      }
    }

    await logAynActivity(supabase, 'follow_up_check', `Follow-up agent: ${results.length} action(s)`, {
      details: { results },
      triggered_by: 'follow_up_agent',
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-follow-up-agent error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

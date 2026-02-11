import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";
import { formatEmployeeReport } from "../_shared/aynBrand.ts";

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
      const reply = body.record;
      const leadId = reply.pipeline_lead_id;

      if (leadId) {
        const { data: lead } = await supabase.from('ayn_sales_pipeline').select('*').eq('id', leadId).single();
        if (lead) {
          await supabase.from('ayn_sales_pipeline').update({ status: 'replied' }).eq('id', leadId);

          const reportMsg = `🎉 They wrote back!\n\n${lead.company_name} replied to our outreach.\n\nFrom: ${reply.from_email}\nSubject: ${reply.subject || '(no subject)'}\n\nPreview: "${(reply.body_text || '').slice(0, 300)}"\n\nThis is a warm lead now — time to have a real conversation.`;

          await supabase.from('ayn_mind').insert({
            type: 'employee_report',
            content: formatEmployeeReport('follow_up', reportMsg),
            context: { from_employee: 'follow_up_agent', lead_id: leadId, reply_id: reply.id },
            shared_with_admin: false,
          });

          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, formatEmployeeReport('follow_up', reportMsg));
          }

          results.push(`${lead.company_name} replied — marked as warm lead ✅`);

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
          await supabase.from('inbound_email_replies').update({ pipeline_lead_id: matchedLead.id }).eq('id', reply.id);

          results.push(`Matched reply from ${reply.from_email} → ${matchedLead.company_name} 🎯`);

          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
              formatEmployeeReport('follow_up', `Found a match! ${matchedLead.company_name} (${reply.from_email}) replied to our outreach.\n\nPreview: "${(reply.body_text || '').slice(0, 300)}"`)
            );
          }
        }
      }
    } else {
      // Cron mode: check for due follow-ups
      const now = new Date();

      const { data: dueLeads } = await supabase
        .from('ayn_sales_pipeline')
        .select('*')
        .in('status', ['contacted', 'followed_up'])
        .lte('next_follow_up_at', now.toISOString())
        .lt('emails_sent', 3)
        .limit(10);

      for (const lead of dueLeads || []) {
        const { data: replies } = await supabase
          .from('inbound_email_replies')
          .select('id')
          .eq('from_email', lead.contact_email)
          .limit(1);

        if (replies?.length) {
          await supabase.from('ayn_sales_pipeline').update({ status: 'replied' }).eq('id', lead.id);
          results.push(`${lead.company_name} — found their reply during routine check! Updating status.`);

          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
              formatEmployeeReport('follow_up', `Good news during my rounds — ${lead.company_name} actually replied! Just updated their status.`)
            );
          }
          continue;
        }

        if (lead.emails_sent >= 3) {
          await supabase.from('ayn_sales_pipeline').update({ status: 'cold' }).eq('id', lead.id);
          results.push(`${lead.company_name} — ${lead.emails_sent} emails, no response. Moving to cold. Sometimes it's just not the right time. 🤷`);
          continue;
        }

        const daysSinceLastEmail = lead.last_email_at
          ? (Date.now() - new Date(lead.last_email_at).getTime()) / (1000 * 60 * 60 * 24)
          : 999;

        const minDays = lead.emails_sent === 1 ? 3 : 5;

        if (daysSinceLastEmail < minDays) {
          results.push(`${lead.company_name} — patience. ${Math.round(daysSinceLastEmail)}d/${minDays}d minimum. Not yet.`);
          continue;
        }

        if (lead.admin_approved) {
          try {
            const followUpRes = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'follow_up', lead_id: lead.id }),
            });
            const followUpData = await followUpRes.json();

            if (followUpData.success) {
              results.push(`📤 Sent follow-up #${lead.emails_sent + 1} to ${lead.company_name} — timing felt right.`);
            } else {
              results.push(`Follow-up to ${lead.company_name} failed: ${followUpData.error}`);
            }
          } catch (e) {
            results.push(`Error following up with ${lead.company_name}: ${e instanceof Error ? e.message : 'error'}`);
          }
        } else {
          results.push(`${lead.company_name} — follow-up due but needs your approval first.`);
        }

        await new Promise(r => setTimeout(r, 2000));
      }

      // Check for leads that should be marked cold
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
          results.push(`Retired ${lead.company_name} — ${lead.emails_sent} emails over ${Math.round(daysSince)} days. No hard feelings.`);
        }
      }

      // Summary report with personality
      if (results.length > 0) {
        await supabase.from('ayn_mind').insert({
          type: 'employee_report',
          content: formatEmployeeReport('follow_up', `Here's my pipeline update:\n\n${results.map(r => `• ${r}`).join('\n')}\n\nI'll keep watching. Every lead gets exactly the attention they deserve — no more, no less.`),
          context: { from_employee: 'follow_up_agent', leads_processed: dueLeads?.length || 0 },
          shared_with_admin: false,
        });
      }
    }

    await logAynActivity(supabase, 'follow_up_check', `Follow-up rounds: ${results.length} action(s)`, {
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

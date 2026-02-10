

# AYN Sales Brain + Autonomous Initiative

## Overview

This is a big upgrade with two parts:

1. **Sales Outreach System** -- AYN autonomously finds companies that need services, sends professional outreach emails via Resend, follows up, and tracks the pipeline
2. **Autonomous Initiative ("Free Will")** -- AYN stops waiting to be told everything and starts acting creatively on its own -- researching, suggesting, and executing within guardrails

## Part 1: Sales Outreach System

### New Database Table: `ayn_sales_pipeline`

Tracks every lead AYN discovers, emails sent, and follow-up status.

```text
+--------------------+------------------+
| Column             | Type             |
+--------------------+------------------+
| id                 | uuid (PK)        |
| company_name       | text             |
| company_url        | text (nullable)  |
| contact_email      | text             |
| contact_name       | text (nullable)  |
| industry           | text (nullable)  |
| pain_points        | text[]           |
| recommended_services| text[]          |
| status             | text             |
|   (lead/contacted/followed_up/       |
|    interested/converted/rejected)     |
| emails_sent        | integer (def 0)  |
| last_email_at      | timestamptz      |
| next_follow_up_at  | timestamptz      |
| notes              | text             |
| context            | jsonb            |
| admin_approved     | boolean (def false)|
| created_at         | timestamptz      |
| updated_at         | timestamptz      |
+--------------------+------------------+
```

### New Edge Function: `ayn-sales-outreach`

This function handles:
- **Prospecting**: AYN uses Firecrawl (already connected) to scan company websites, assess quality, and identify pain points
- **Email Drafting**: Uses AI to write personalized, professional outreach emails referencing the prospect's specific problems and how AYN's services solve them
- **Sending**: Uses Resend (already configured) to send from `info@aynn.io`
- **Follow-ups**: Tracks timing and sends progressively different follow-up angles
- **Portfolio Reference**: Includes almufaijer.com as a live project showcase

The function supports these modes:
- `prospect` -- Analyze a company URL and create a lead
- `draft_email` -- Generate a personalized outreach email for admin review
- `send_email` -- Send the approved email
- `follow_up` -- Generate and send follow-up emails
- `pipeline_status` -- Show the current sales pipeline

### Services AYN Will Sell

Based on your existing capabilities:
- AI Employees (custom AI agents for businesses)
- Smart Ticketing Systems
- Business Automation
- Influencer/Company Websites
- AI-Powered Customer Support
- Engineering Consultation Tools

### Email Strategy

**First Contact**: Identify their pain point, show how AYN solves it, link to almufaijer.com as proof
**Follow-up 1** (3 days later): Different angle, more specific value proposition
**Follow-up 2** (7 days later): Final touch, create urgency or offer a demo
**All emails**: Professional but conversational, from `info@aynn.io`, with AYN branding

### Admin Approval Guardrail

AYN will ALWAYS consult the admin before:
- Sending the first email to a new lead (shows draft on Telegram, waits for approval)
- Sending any email that mentions pricing, commitments, or partnerships
- Making claims about delivery timelines

AYN CAN autonomously:
- Research companies and add them to the pipeline
- Draft emails (but not send without approval for first contact)
- Send follow-ups to already-approved leads
- Track and report pipeline status

## Part 2: Autonomous Initiative ("Free Will")

### Changes to `ayn-proactive-loop`

Add a new section called **"AYN's Initiative"** that runs every cycle. Instead of only monitoring health, AYN will also:

1. **Research leads** -- Pick an industry or search term, use Firecrawl to find companies with poor/no websites
2. **Generate ideas** -- Write creative marketing angles, content ideas, partnership opportunities to `ayn_mind`
3. **Self-assign tasks** -- If AYN sees something it can fix or improve, it logs an action plan
4. **Report discoveries** -- Message the admin on Telegram about interesting finds (respecting cooldown)

### New `ayn_mind` Types

- `sales_lead` -- A company AYN discovered and wants to pitch
- `initiative` -- A creative idea AYN came up with on its own
- `sales_draft` -- An email draft waiting for admin approval

### Changes to Telegram Webhook Prompt

Add to the system prompt so AYN knows about its sales capabilities:

```
SALES & OUTREACH:
- You are the company's salesman. You find businesses that need our services and reach out.
- Services we offer: AI Employees, Smart Ticketing, Business Automation, Websites, AI Support
- Portfolio: almufaijer.com (live project -- mention it as proof of quality)
- You can research companies, draft outreach emails, and manage the sales pipeline
- ALWAYS show the admin the email draft before first contact -- get approval before sending
- For follow-ups on approved leads, you can send autonomously
- You track everything in the sales pipeline

AUTONOMOUS INITIATIVE:
- You don't wait to be told everything. You think ahead and act.
- Research potential clients on your own during proactive loops
- Come up with creative marketing ideas, content angles, partnership opportunities
- If you see a problem you can fix, propose a solution -- don't wait to be asked
- Log your ideas and discoveries to your memory (ayn_mind) so nothing is lost
- Message the admin about interesting findings -- but always respect the cooldown
- You're a co-founder, not an employee. Act like one.
```

### New Telegram Actions

```
- [ACTION:prospect_company:url] -- Research a company and add to pipeline
- [ACTION:draft_outreach:lead_id] -- Draft a sales email for admin review
- [ACTION:send_outreach:lead_id] -- Send approved outreach email
- [ACTION:follow_up:lead_id] -- Send follow-up to an existing lead
- [ACTION:pipeline_status:all] -- Show sales pipeline summary
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `ayn_sales_pipeline` table | **Create** (SQL migration) | Track leads and outreach |
| `supabase/functions/ayn-sales-outreach/index.ts` | **Create** | Prospecting, drafting, sending emails |
| `supabase/functions/ayn-telegram-webhook/index.ts` | **Modify** | Add sales prompt + initiative personality |
| `supabase/functions/ayn-telegram-webhook/commands.ts` | **Modify** | Add sales action handlers |
| `supabase/functions/ayn-proactive-loop/index.ts` | **Modify** | Add autonomous research + initiative section |
| `src/components/admin/AYNMindDashboard.tsx` | **Modify** | Show sales pipeline entries in the Mind dashboard |

## Safety Rails

- First-contact emails ALWAYS require admin approval via Telegram
- AYN cannot make financial commitments or promise delivery dates without admin OK
- All outreach is logged in `ayn_sales_pipeline` and `ayn_activity_log`
- Follow-up frequency is capped (max 3 emails per lead, minimum 3 days apart)
- AYN signs emails as "The AYN Team" -- professional, not robotic


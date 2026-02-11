

# Fix AYN Telegram: Accuracy, Email Execution, and Autonomous Company Work

## Problems

1. **AYN lies about users**: Says "Mouad was active today" when he wasn't (last activity was Feb 5). The system context only has anonymous message counts -- no user names or login times. AYN fills the gap with hallucinations from old conversation memory.

2. **AYN says "sending" but doesn't send**: When you say "send email", AYN often writes "I'm sending it now" or "firing it off" as narration text instead of including the actual `[ACTION:send_email:to:subject:body]` tag that triggers real execution.

3. **No autonomous company work**: When you tell AYN "go find companies" or "work on outreach", it can't batch-prospect multiple companies on its own. It needs a new action to autonomously research and queue multiple leads.

## Solution

### 1. Add Real User Data to System Context

In `gatherSystemContext`, add a query for recently active users with actual names and login times:

```sql
SELECT p.contact_person, p.last_login, ag.current_month_usage
FROM profiles p
JOIN access_grants ag ON p.user_id = ag.user_id
WHERE p.last_login > now() - interval '24 hours'
ORDER BY p.last_login DESC
LIMIT 10
```

Add `recently_active_users` to the context object so AYN can only cite users it actually sees.

### 2. Force Email Execution with Stronger Prompt Rules

Add to `AYN_PERSONALITY`:

```
DATA INTEGRITY (NON-NEGOTIABLE):
- You can ONLY mention a specific user's activity if their name appears in 
  "recently_active_users" in your system context.
- Old conversation memory is NOT current data. Never cite it as fact.
- If asked about a user and they're not in your context, say "I don't 
  have recent data for them. Want me to look them up?"

EMAIL EXECUTION (NON-NEGOTIABLE):
- When the admin says "send email to X about Y" -- you MUST include 
  [ACTION:send_email:recipient@email.com:subject:body] in your response.
- NEVER say "I'm sending it" or "done" without an actual ACTION tag.
- If you draft an email for review, say "here's the draft -- want me 
  to send it?" Do NOT include the send ACTION yet.
- When the admin confirms "send it" or "yes", include the ACTION tag 
  immediately. No narration without action.
- The ONLY way an email gets sent is through an [ACTION:...] tag. 
  Words alone do nothing.
```

### 3. Add Autonomous Company Prospecting Mode

Add a new action `[ACTION:autonomous_prospect:industry:region:count]` that triggers the `ayn-sales-outreach` function in a batch loop:

- AYN calls `search_leads` to find companies matching industry/region
- For each result, it calls `prospect_company` to research them
- It drafts outreach emails for the top-quality leads
- It sends a summary back to Telegram with all leads found and drafts pending approval

In `executeAction`, add:

```typescript
case 'autonomous_prospect': {
  // Parse params: "industry:region:count"
  const [industry, region, countStr] = params.split(':');
  const count = Math.min(parseInt(countStr) || 5, 10); // Max 10
  
  // Step 1: Search for leads
  const searchRes = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'search_leads', search_query: `${industry} ${region}` }),
  });
  const searchData = await searchRes.json();
  const leads = searchData.leads?.slice(0, count) || [];
  
  // Step 2: Prospect each lead
  const results = [];
  for (const lead of leads) {
    const prospectRes = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'prospect', url: lead.url || lead.website }),
    });
    const prospectData = await prospectRes.json();
    if (prospectData.success) {
      results.push({
        company: prospectData.analysis?.company_name || lead.url,
        quality: prospectData.analysis?.website_quality,
        lead_id: prospectData.lead_id,
      });
      // Draft email for high-quality leads (quality >= 6)
      if (prospectData.analysis?.website_quality >= 6) {
        await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'draft_email', lead_id: prospectData.lead_id }),
        });
      }
      await new Promise(r => setTimeout(r, 2000)); // Rate limit
    }
  }
  
  return `Prospected ${results.length} companies:\n${results.map(r => 
    `- ${r.company} (quality: ${r.quality}/10, ID: ${r.lead_id?.slice(0,8)})`
  ).join('\n')}\n\nDrafts ready for high-quality leads. Check pipeline for details.`;
}
```

### 4. Add the action to AYN's toolkit list

Add to the AVAILABLE AI ACTIONS section:
```
- [ACTION:autonomous_prospect:industry:region:count] -- Batch-prospect companies by industry/region (max 10)
```

And update SALES & OUTREACH instructions:
```
- When the admin says "go find companies" or "work on [industry]", use 
  [ACTION:autonomous_prospect:industry:region:count] to batch-prospect.
- Report back with all leads found and their quality scores.
- High-quality leads (6+/10) get drafts auto-generated for approval.
```

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/ayn-telegram-webhook/index.ts` | Add user activity query to `gatherSystemContext`, add `autonomous_prospect` to `executeAction`, update `AYN_PERSONALITY` with data integrity + email execution rules, add action to toolkit list |


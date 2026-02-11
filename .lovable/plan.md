

# Give All AI Employees Personality, Brand Knowledge, and Run a Live Test

## The Problem

Right now, all 7 AI employee edge functions are just mechanical — they process data but have no personality, no understanding of AYN's brand, and no consistency in how they communicate. The Investigator's system prompt says "You are an AI investigator", the Lawyer says "You are AYN's Legal AI" (vague), and the others have no AI personality at all (Security Guard, QA Watchdog, Customer Success, Follow-Up Agent are pure code with no LLM calls for personality).

## What We'll Do

### 1. Create a Shared Brand Knowledge Module

A new file `supabase/functions/_shared/aynBrand.ts` that ALL employees import. It contains:

- **AYN Identity**: name meaning, founding story, team references
- **Services catalog**: AI Employees, Smart Ticketing, Business Automation, Websites, AI Support, Engineering Tools
- **Subscription tiers**: Free, Starter, Pro, Business, Enterprise with exact limits
- **Brand voice guidelines**: casual but professional, no corporate speak, warm and direct
- **Key selling points**: 24/7 AI workforce, Arabic + English, engineering focus, privacy-first
- **Identity protection**: never mention Google, Gemini, OpenAI, etc.

### 2. Add Personality Prompts to Each AI Employee

Each employee gets a unique personality that fits their role but stays on-brand:

| Employee | Personality Trait | Communication Style |
|----------|-------------------|---------------------|
| Security Guard | Vigilant, protective, no-nonsense | Short, alert-style messages. Military precision. |
| Investigator | Curious, thorough, detail-obsessed | Structured dossiers, confidence ratings, methodical |
| Customer Success | Warm, empathetic, people-first | Friendly, encouraging, proactive check-ins |
| QA Watchdog | Reliable, watchful, status-focused | Clean status reports, uptime metrics, concise |
| Advisor | Strategic, big-picture, analytical | Executive briefing style, bullet points, bold recommendations |
| Lawyer | Cautious, precise, risk-aware | Formal-leaning, cites regulations, flags risks clearly |
| Follow-Up Agent | Persistent, tactful, timing-conscious | Sales-aware, respects boundaries, tracks patterns |

Each employee's Telegram reports and `ayn_mind` entries will reflect their personality — not just raw data dumps.

### 3. Update All 7 Edge Functions

For each function, the changes are:

- Import the shared brand module
- Add a personality-infused system prompt (for functions that use LLM: Investigator, Advisor, Lawyer)
- Format reports with personality (for non-LLM functions: Security Guard, QA Watchdog, Customer Success, Follow-Up Agent) — their `ayn_mind` entries and Telegram messages will use branded, personality-driven language instead of raw data
- All functions reference AYN services correctly when relevant

### 4. Live Test: Prospect crosmint7@gmail.com

After deploying the personality updates, we'll run a full pipeline test:

1. **Sales AI** prospects the email/company via `ayn-sales-outreach` (mode: `prospect`)
2. **Investigator** auto-investigates the lead (creates a dossier)
3. **Sales AI** drafts an outreach email (mode: `draft_email`)
4. **Customer Success** checks the pipeline state
5. **QA Watchdog** runs a health check
6. **Advisor** synthesizes all the reports
7. **Security Guard** runs a threat scan

We'll call each function directly via the edge function curl tool and check that:
- Reports in `ayn_mind` show personality
- Activity logs appear in the Workforce Dashboard
- Employee tasks flow between agents (Sales creates task for Investigator)

## Technical Details

### New shared file: `supabase/functions/_shared/aynBrand.ts`

```text
Exports:
- AYN_BRAND: object with identity, services, tiers, voice guidelines
- getEmployeePersonality(employeeId): returns personality prompt for each employee
- formatEmployeeReport(employeeId, content): wraps content in branded format
```

### Edge function changes (7 files):

Each file gets:
1. `import { getEmployeePersonality, AYN_BRAND } from "../_shared/aynBrand.ts";`
2. Updated system prompts that include brand knowledge + personality
3. Branded report formatting for `ayn_mind` inserts and Telegram messages

### Test sequence (using curl tool):

```text
Step 1: POST /ayn-sales-outreach  { mode: "prospect", url: "crosmint7@gmail.com" }
Step 2: POST /ayn-investigator    { lead_id: "<from step 1>" }
Step 3: POST /ayn-sales-outreach  { mode: "draft_email", lead_id: "<from step 1>" }
Step 4: POST /ayn-customer-success { mode: "check_retention" }
Step 5: POST /ayn-qa-watchdog     {}
Step 6: POST /ayn-security-guard  {}
Step 7: POST /ayn-advisor         {}
```

Results will show up in the AYN Logs panel and AI Workforce Dashboard in real-time.


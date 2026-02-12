

# Live Deliberation Feed in Telegram — "The War Room in Your Pocket"

## What Changes

Instead of deliberations happening silently in the database, you'll **watch each agent speak in your Telegram chat in real-time** as they debate. Each agent posts their position as a separate message, then AYN posts the final decision.

## What You'll See

When a deliberation triggers (e.g., a high-impact sales decision), your Telegram gets a stream like this:

```text
--- Message 1 ---
🏢 INTERNAL DEBATE
"Should we pivot pricing for Engineering Tools?"
Impact: HIGH | Agents: 5

--- Message 2 ---
🎯 Sales Hunter (rep: 0.72, confidence: 0.85)
"Support. Current pricing is leaving money on the table. SaaS margins on Engineering Tools are 78% — we should push annual plans harder."
[doctrine-aligned]

--- Message 3 ---
🔒 Security Guard (rep: 0.55, confidence: 0.70)
"Conditional. Price changes affect existing contracts. Need legal review first."

--- Message 4 ---
💡 Innovation Lead (rep: 0.61, confidence: 0.78)
"Support. But bundle it with AI features to justify the increase. Pure price hike without added value risks churn."

--- Message 5 ---
⚖️ Lawyer (rep: 0.50, confidence: 0.65)
"Oppose. Existing contracts have fixed pricing clauses. We can only change for new customers."
Objection: "Sales is ignoring contractual obligations."

--- Message 6 ---
🧠 AYN — DECISION
Winner: Sales Hunter (weight: 0.82)
Decision: "Push annual SaaS pricing for new customers only"
Doctrine: "SaaS-first strategy" — aligned
Dissent: Lawyer raised contract concerns (trust: 0.45)
Confidence: 7/10

⚠️ High-impact — waiting for your go-ahead.
```

You reply "yes" or "no" in chat like you already do.

## How It Works

### 1. Update `deliberation.ts` — Add Telegram broadcast

After each agent generates their position (the parallel LLM calls), **send each position as a separate Telegram message** before moving to synthesis. This means:

- Send a "debate opening" message with the topic and impact level
- As each agent's position resolves, send it immediately (with a small delay between messages so they read naturally — 800ms gaps)
- After synthesis, send the final decision message
- All messages go to the existing `TELEGRAM_CHAT_ID`

The function signature gets two new optional parameters: `telegramToken` and `telegramChatId`. When provided, the debate is broadcast live. When omitted (e.g., during background cron jobs where you don't want noise), it stays silent.

### 2. Update callers to pass Telegram credentials

Any function that calls `deliberate()` and wants live broadcast passes the token and chat ID. The main caller is the **Telegram webhook** itself (when AYN internally consults the team before answering you). Other callers (cron jobs like Outcome Evaluator, Chief of Staff) will NOT broadcast by default — they run silently unless they detect something critical.

### 3. Agent emoji mapping

Each agent gets a consistent emoji in the broadcast messages (reusing the personality system):

| Agent | Emoji |
|-------|-------|
| system (AYN) | 🧠 |
| sales | 🎯 |
| security_guard | 🔒 |
| advisor | 📊 |
| innovation_lead | 💡 |
| hr_manager | 👥 |
| chief_of_staff | 🏢 |
| investigator | 🔍 |
| follow_up | 📬 |
| marketing | 📈 |
| customer_success | 🤝 |
| qa_watchdog | 🐛 |
| lawyer | ⚖️ |

### 4. Message formatting

Each agent message includes:
- Emoji + Agent name + (reputation score, confidence)
- Their position in quotes
- [doctrine-aligned] tag if applicable
- Objections shown as a separate line if they exist
- Cognitive load badge only if above 0.6 (shows the agent is stretched)

The final AYN decision message includes:
- Winner and their weight score
- Decision summary
- Current doctrine reference
- Dissent summary (who pushed back and why)
- Overall confidence
- Whether approval is required

### 5. Throttling and noise control

- Only broadcast deliberations for **medium, high, and irreversible** impact levels (low impact stays silent)
- Maximum **1 live broadcast per hour** — if multiple deliberations fire within an hour, only the highest-impact one gets broadcast. Others get a single summary message: "3 internal debates resolved silently. Ask me for details."
- Each agent message has an 800ms delay between sends to create a natural "typing" feel
- If the founder's `frustration_signals > 0.6`, suppress live broadcasts entirely and send only the final decision

## Technical Details

### `deliberation.ts` changes

```text
export async function deliberate(
  supabase, topic, involvedEmployeeIds, context, apiKey,
  broadcast?: { token: string; chatId: string }  // NEW optional param
)
```

Inside the position generation loop, after each position resolves:
- If `broadcast` is provided, call `sendTelegramMessage()` with the formatted agent position
- Add 800ms delay between messages
- After synthesis, send the decision message

### `telegramHelper.ts` — New helper

Add `sendDeliberationMessage(token, chatId, agentId, position, meta)` that formats the agent-specific message with emoji, scores, and tags.

### Telegram webhook changes

When the webhook triggers a deliberation (via chime-in logic or explicit "what does the team think" requests), pass `{ token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID }` as the broadcast parameter.

### Rate limiting

Add a simple check in deliberation: query `ayn_activity_log` for `deliberation_broadcast` actions in the last hour. If one exists, skip broadcasting for the current deliberation and log it silently.

## What Does NOT Change

- The deliberation logic itself (60/40, doctrine, trust filtering) stays exactly the same
- Database storage of discussions stays the same
- Background cron agents stay silent unless they opt into broadcasting
- All existing Telegram features (commands, confirmations, photos, documents) are untouched

## Implementation Sequence

1. Add emoji mapping constant to `aynBrand.ts`
2. Add `sendDeliberationMessage()` to `telegramHelper.ts`
3. Update `deliberate()` in `deliberation.ts` with optional broadcast parameter
4. Update `ayn-telegram-webhook` to pass broadcast credentials when triggering deliberations
5. Add broadcast rate limiting (1 per hour max)
6. Deploy all updated functions



# Fix AYN's Emotional Intelligence + Feedback Reactions

## Problem 1: AYN responds like a robot to hostility

When a user says "You are stupid. You piece of shit", AYN responds with a flat corporate message: "I'm AYN, built by the AYN Team. I'm here to help with your questions..."

Compare to ChatGPT which responds warmly: "Hey. That sounds like frustration talking. If something I said annoyed you, tell me what it was and I'll fix it. I'm here to help you, not to get in your way."

**Root cause:** The system prompt in `systemPrompts.ts` has zero guidance on handling hostility, insults, or emotionally charged messages. AYN defaults to its identity script.

**Fix:** Add an emotional intelligence section to the system prompt that instructs AYN to:
- Acknowledge the user's frustration without being defensive
- Stay warm and grounded (like the ChatGPT example)
- Never mirror hostility, never be passive-aggressive
- Offer to reset and try again
- Not repeat its identity intro when insulted

## Problem 2: Eye emotion doesn't match the conversation

The emotion detection in `emotionDetector.ts` (backend) and `emotionMapping.ts` (frontend) only analyzes AYN's own response text for keywords. When AYN responds to an insult with "I'm here to help", it detects "supportive" from the response -- but that's weak. The system should also consider the user's emotion to pick the right eye state.

**Fix:** In `useMessages.ts`, after getting the response, also analyze the user's message emotion and blend it with the response emotion. If the user is angry/frustrated, AYN's eye should show "comfort" or "supportive" (warm colors), not just "calm" (the default).

## Problem 3: Like/Dislike doesn't trigger eye reaction

When a user taps thumbs up or thumbs down on a response, the only feedback is a toast message. The eye doesn't react at all.

**Fix:** In `ResponseCard.tsx`, after saving feedback, call `orchestrateEmotionChange`:
- Thumbs up: trigger "happy" emotion (AYN is pleased the user liked the response)
- Thumbs down: trigger "sad" emotion (AYN feels the response didn't help)

---

## Changes

### 1. `supabase/functions/ayn-unified/systemPrompts.ts`
Add emotional intelligence rules to the base system prompt:

```
EMOTIONAL INTELLIGENCE:
- If the user is frustrated, angry, or insulting: stay calm and warm
- Acknowledge their frustration without being defensive: "I hear you" / "That sounds like frustration"
- Never mirror hostility or get passive-aggressive
- Offer to reset: "Take a breath -- we can start fresh however you want"
- Don't repeat your identity intro when someone is venting
- Match their energy for positive emotions (excitement, happiness)
- For negative emotions, be a grounding, empathetic presence
```

### 2. `src/components/eye/ResponseCard.tsx`
Update `handleFeedback` to trigger eye emotion changes:
- Import `useEmotionOrchestrator`
- On thumbs up: call `orchestrateEmotionChange('happy')`
- On thumbs down: call `orchestrateEmotionChange('sad')`

### 3. `src/hooks/useMessages.ts`
After getting a response, also factor in the user's message emotion:
- Import `analyzeUserEmotion` from `userEmotionDetection.ts`
- If user emotion is strongly negative (angry, frustrated) and AYN's detected response emotion is just "calm", override to "comfort" or "supportive" to ensure the eye shows warmth
- This ensures the eye state reflects AYN empathizing with the user, not just keyword-matching its own response

### 4. `supabase/functions/ayn-unified/emotionDetector.ts`
Add a new function `detectUserEmotion` that the backend can use to tag the user's emotional state. Return both `emotion` (AYN's response emotion) and `userEmotion` in the API response so the frontend has both signals.

---

## Technical Summary

| File | Change |
|---|---|
| `supabase/functions/ayn-unified/systemPrompts.ts` | Add emotional intelligence rules for handling hostility |
| `supabase/functions/ayn-unified/emotionDetector.ts` | Add `detectUserEmotion()` function, return user emotion in API |
| `supabase/functions/ayn-unified/index.ts` | Include `userEmotion` in response payload |
| `src/components/eye/ResponseCard.tsx` | Trigger happy/sad eye emotion on like/dislike |
| `src/hooks/useMessages.ts` | Blend user emotion with response emotion for better eye matching |

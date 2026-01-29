

# Fix AI Grammar/Capitalization and Response Speed

## Problem Summary

1. **Lowercase Only Responses**: The AI system prompt explicitly tells AYN to use "friendly, lowercase" style - this is a design choice that needs to be changed to proper grammar
2. **Slow Response Feeling**: The streaming speed is 50ms per batch of 3 words (150ms total), making users feel bored while waiting

---

## Solution

### Part 1: Fix Grammar & Capitalization

Update the system prompt in `ayn-unified/index.ts` to use proper grammar:

**Before (line 324-328):**
```
STYLE:
- be concise: 1-3 sentences for simple questions, bullet points for complex (max 5-6)
- match user's message length and energy
- friendly, lowercase, contractions (it's, gonna), light humor
- respond in ${isArabic ? 'Arabic (العربية)' : "user's language"}
```

**After:**
```
STYLE:
- Use proper grammar with correct capitalization (start sentences with capital letters)
- Be concise: 1-3 sentences for simple questions, bullet points for complex (max 5-6)
- Match user's message length and energy
- Friendly tone with contractions (it's, gonna), light humor
- Respond in ${isArabic ? 'Arabic (العربية)' : "user's language"}
```

**Also update identity examples (lines 289-293, 330-333):**
```
// Before:
"i'm AYN, built by the AYN Team to help you out"
"it's from the Arabic word عين"

// After:
"I'm AYN, built by the AYN Team to help you out"
"It's from the Arabic word عين"
```

---

### Part 2: Speed Up Response Display

Update streaming speed in two files:

**`StreamingMarkdown.tsx` - Default speed:**
```typescript
// Before (line 57):
speed = 35,

// After - faster default:
speed = 15,
```

**`ResponseCard.tsx` - Actual usage:**
```typescript
// Before (line 328):
speed={50}

// After - faster display:
speed={20}
```

**Also increase word batch size for smoother feel:**
```typescript
// StreamingMarkdown.tsx line 86
// Before:
const next = Math.min(prev + 3, words.length);

// After - batch 5 words at a time:
const next = Math.min(prev + 5, words.length);
```

---

## Technical Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/ayn-unified/index.ts` | Update system prompt to use proper capitalization, fix example responses |
| `src/components/eye/StreamingMarkdown.tsx` | Reduce default speed from 35ms to 15ms, batch 5 words instead of 3 |
| `src/components/eye/ResponseCard.tsx` | Reduce speed from 50ms to 20ms |

---

## Expected Results

| Before | After |
|--------|-------|
| "i'm ayn, built by the ayn team" | "I'm AYN, built by the AYN Team" |
| "it's from the arabic word عين" | "It's from the Arabic word عين" |
| ~150ms per 3 words (slow feel) | ~100ms per 5 words (snappy feel) |
| Users feel bored waiting | Responses appear 2.5x faster |


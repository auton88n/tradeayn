

# Fix PDF/Excel Downloads, Image Generation, and Display

## Root Causes Found

### Problem 1: Image intent never reaches the server
The **client-side** `detectIntent()` function in `src/hooks/useMessages.ts` (lines 308-328) has **zero image keywords**. It only returns `'image'` when `selectedMode === 'LAB'`. Since most users type naturally (e.g., "show me an image of Halifax"), the client sends `intent: 'chat'` to the server. The server then uses this forced intent (`forcedIntent || detectIntent(...)`) and never runs its own image detection. The LLM then hallucinates a fake `dalle.text2im` JSON tool call.

### Problem 2: Documents -- server expects structured JSON from LLM but LLM returns prose
When the document intent IS detected, `ayn-unified` asks the LLM to return structured JSON with `type`, `title`, and `sections`. But the LLM often returns natural language instead, causing `JSON.parse` to fail at line 690-692, which triggers the "I need more details" clarification response instead of generating the document.

### Problem 3: The `documentUrlUtils.ts` fix was already applied but may not be deployed
The `openDocumentUrl` function already has the correct fix (no `target="_blank"` for data URLs). The issue may be that documents are simply never being generated successfully due to Problem 2.

## Fixes

### Fix 1: Add image keywords to client-side intent detection (`src/hooks/useMessages.ts`)
Add image keyword detection in the client-side `detectIntent()` function so that image requests are sent with `intent: 'image'` and `stream: false`:

```
// After document detection (around line 321), add:
if (/generate image|create image|draw|picture of|image of|make image|photo of|illustration of|visualize|صورة|ارسم|dessine/.test(lower)) return 'image';
```

### Fix 2: Make server-side intent detection work as fallback (`supabase/functions/ayn-unified/index.ts`)
Change line 521 from:
```
const intent = forcedIntent || detectIntent(lastMessage);
```
to:
```
const intent = (forcedIntent && forcedIntent !== 'chat') ? forcedIntent : detectIntent(lastMessage);
```
This way, if the client sends `'chat'` as a fallback, the server still runs its own keyword detection which has a broader keyword list.

### Fix 3: Improve document JSON extraction robustness (`supabase/functions/ayn-unified/index.ts`)
The document generation system prompt needs to be more explicit about returning JSON. Additionally, add a retry mechanism or use tool calling to force structured output from the LLM.

### Fix 4: Add image generation visual state (`src/hooks/useMessages.ts`)
After detecting `image` intent, set a loading state so the user sees feedback while the image generates.

## Technical Details

### `src/hooks/useMessages.ts` -- client-side intent detection (around line 321)
Add image intent detection:
```typescript
// Image generation detection
if (/generate image|create image|draw |picture of|image of|make image|make me a picture|photo of|illustration of|visualize|render a |render an |صورة|ارسم|dessine|montre moi/.test(lower)) return 'image';
```

### `supabase/functions/ayn-unified/index.ts` -- line 521
Allow server-side re-detection when client sends generic 'chat':
```typescript
const intent = (forcedIntent && forcedIntent !== 'chat') ? forcedIntent : detectIntent(lastMessage);
```

### `supabase/functions/ayn-unified/index.ts` -- document JSON prompt
The system prompt for document generation needs to explicitly instruct the LLM to return ONLY valid JSON. Add tool calling for structured output extraction to ensure consistent JSON responses.

## Expected Outcome
- Image generation will trigger correctly from natural language prompts
- PDF and Excel documents will generate and download properly
- The server has a safety net to catch image/document intents the client misses


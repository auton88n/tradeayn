
## Fix: Download Button Missing for PDF/Excel/Image

### What's Happening

When you ask AYN to create a PDF, Excel, or image, the intent detection is classifying your request as regular "chat" instead of "document" or "image". This causes:
- The response gets **streamed as plain text** instead of triggering the document/image generation pipeline
- AYN describes what it *would* do ("The user wants to create a PDF...") instead of actually generating the file
- No file is generated, so no Download button appears

### Why It's Happening

Both the frontend and backend have regex-based intent detection that only matches specific phrasings. If your message uses slightly different wording (e.g., "pdf about Riyadh" without "create/make/generate" before it, or Arabic phrasing not covered), it falls through to "chat".

### Fix (3 changes)

**1. Broaden intent detection patterns (frontend + backend)**

Add more flexible patterns to catch variations:
- "I want a PDF", "I need a PDF", "can you make a PDF", "pdf about X" (without verb prefix)
- Same for Excel and images
- Arabic: "سوي pdf", "ابي pdf", "اعطني تقرير", "اعطني ملف"
- Handle "about" keyword better: "pdf about X", "excel about X", "image about X"

Files: `src/hooks/useMessages.ts` (frontend detection, ~line 374-382) and `supabase/functions/ayn-unified/intentDetector.ts` (backend detection)

**2. Add safety net in chat system prompt**

Update the chat system prompt so that if a document/image request slips through to chat mode, the LLM gives a helpful response instead of raw reasoning. Add a line like:
> "If the user asks you to create a PDF, Excel, or image, respond naturally -- do NOT narrate your intent (never say 'The user wants...')"

File: `supabase/functions/ayn-unified/systemPrompts.ts`

**3. Redeploy edge function**

Deploy the updated `ayn-unified` function with the improved backend intent detection and system prompt.

### Technical Details

**Frontend intent detection (`useMessages.ts` ~line 378-382) -- add patterns:**
```
// Broader PDF detection
/(?:i\s+(?:want|need)\s+(?:an?\s+)?)?pdf\s+(?:about|for|on)/
/(?:can\s+you\s+)?(?:make|create|get)\s+(?:me\s+)?(?:an?\s+)?pdf/

// Broader Excel detection  
/(?:i\s+(?:want|need)\s+(?:an?\s+)?)?(?:excel|spreadsheet)\s+(?:about|for|on)/

// Broader image detection
/(?:i\s+(?:want|need)\s+(?:an?\s+)?)?(?:image|picture|photo)\s+(?:about|of|for)/

// Arabic additions
/ابي\s*(?:pdf|صورة|اكسل|ملف)/
/اعطني\s*(?:تقرير|ملف|جدول)/
/سوي\s*(?:pdf|اكسل|ملف)/
```

**Backend intent detection (`intentDetector.ts`) -- mirror the same patterns**

**System prompt safety (`systemPrompts.ts` base prompt) -- add:**
```
CRITICAL: Never narrate your intent. Never say "The user wants..." or "I will generate...". 
Just respond naturally or do the task directly.
```

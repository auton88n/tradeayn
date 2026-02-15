
## Fix: "make it exel/excel" and "put it in pdf/excel" Not Detected as Document Intent

### Root Cause
The message "make it exel" is classified as "chat" because no regex pattern handles the word "it" between "make" and "exel/excel". The LLM then streams a fake response with a hallucinated Supabase storage URL that doesn't actually exist (404), causing "Download failed".

Same issue applies to phrases like:
- "put it in pdf"
- "make it in pdf"  
- "convert it to excel"
- "turn it into pdf"

### Fix

Add patterns for "make/put/convert/turn it [in/into/to] pdf/excel" to both frontend and backend intent detection.

**File 1: `src/hooks/useMessages.ts` (~line 383)**

Add these regex patterns to the document detection block:
```
/(?:make|put|convert|turn)\s+(?:it|this|that)\s+(?:in(?:to)?|to|as)?\s*(?:an?\s+)?(?:pdf|excel|exel|excell|exsel|exl|xlsx)/
/(?:make|put|convert|turn)\s+(?:it|this|that)\s+(?:in(?:to)?|to|as)?\s*(?:an?\s+)?(?:report|document|table|spreadsheet)/
```

**File 2: `supabase/functions/ayn-unified/intentDetector.ts` (~line 73)**

Add the same patterns to the `documentPatterns` array:
```
/(?:make|put|convert|turn)\s+(?:it|this|that)\s+(?:in(?:to)?|to|as)?\s*(?:an?\s+)?(?:pdf|excel|exel|excell|exsel|ecxel|exl|xlsx)/
/(?:make|put|convert|turn)\s+(?:it|this|that)\s+(?:in(?:to)?|to|as)?\s*(?:an?\s+)?(?:report|document|table|spreadsheet)/
```

Also add a standalone fallback: if the message is very short and contains just the file type keyword:
```
/^(?:in\s+)?(?:excel|exel|excell|exsel|exl|pdf|xlsx)\s*$/
```
This catches ultra-short messages like "exel", "in excel", "pdf".

**File 3: Redeploy `ayn-unified` edge function**

### What This Fixes
| User message | Before | After |
|---|---|---|
| "make it exel" | chat (hallucinated URL, 404) | document (real file generated) |
| "put it in pdf" | chat | document |
| "convert it to excel" | chat | document |
| "exel" | chat | document |
| "in pdf" | chat | document |

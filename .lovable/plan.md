
## Fix: Excel Sheet Download Navigates Away

### Root Cause
The user typed "create a **exel** sheet" (misspelling). The intent detection regex requires the exact word "excel", so it falls through to regular `chat` intent. The LLM then hallucinates a fake download link (`sandbox:/mnt/data/5_Day_Schedule.xlsx`) instead of using the proper document generation pipeline. When clicked, the browser navigates to that invalid URL, landing on the homepage.

### Two-Part Fix

**1. Add fuzzy spelling tolerance to intent detection (both frontend and backend)**

Add common misspellings of "excel" to the document intent patterns:
- "exel", "excell", "exsel", "ecxel", "exl"

Files to update:
- `src/hooks/useMessages.ts` (line 380) -- frontend intent detection regex
- `supabase/functions/ayn-unified/intentDetector.ts` (lines 39-42) -- backend intent detection

**2. Intercept `sandbox:` URLs in MessageFormatter as a safety net**

Even with better intent detection, the LLM may still sometimes hallucinate `sandbox:` URLs. The link handler in `MessageFormatter.tsx` should treat any `sandbox:` URL as invalid and prevent navigation. Instead, show a toast saying the file isn't available and suggesting the user try again.

File to update:
- `src/components/shared/MessageFormatter.tsx` (lines 411-451) -- add `sandbox:` URL interception in the `a` component

### Technical Details

**Intent detection fix (both files):**
Replace patterns like `/create\s+(an?\s+)?excel/` with `/create\s+(an?\s+)?e?xc?e?ll?/` or more readably, add alternate spellings:
```
/create\s+(an?\s+)?(excel|exel|excell)/
/make\s+(an?\s+)?(excel|exel|excell)/
/(excel|exel|excell)\s+(sheet|about|for|of)/
```

**Sandbox URL interception (MessageFormatter.tsx):**
In the `a` component handler, detect `sandbox:` URLs and block navigation:
```
if (href?.startsWith('sandbox:')) {
  e.preventDefault();
  toast({ title: 'File not available', description: 'Try asking again to generate the document.' });
  return;
}
```

### What This Does NOT Change
- PDF and image generation (already working)
- The document generation pipeline itself (already correct when triggered)
- The DocumentDownloadButton component (already works with proper attachments)

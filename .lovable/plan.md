
# Deep Investigation: Why Images and Excel Still Don't Work

## Root Cause Analysis

### Root Cause 1: Intent detection fails for natural language (articles break matching)

The keyword matching is **substring-based** and doesn't account for common English articles ("a", "an", "the") between words. This means most natural phrases fail silently and default to "chat".

**Examples that FAIL:**
- "create **an** excel about stocks" -- doesn't match "create excel"
- "make **an** excel sheet" -- doesn't match "make excel"  
- "generate **an** image of a sunset" -- doesn't match "generate image"
- "create **an** image" -- doesn't match "create image"
- "give me **an** excel" -- doesn't match any keyword
- "make me **an** image" -- doesn't match "make image"

Both the **client-side** (`src/hooks/useMessages.ts` line 317-323) and **server-side** (`intentDetector.ts` line 43-44) have this same flaw.

### Root Cause 2: "make me a" in document keywords hijacks image requests

The server-side `intentDetector.ts` has `"make me a"` as a document keyword (line 11). Since document keywords are checked BEFORE image keywords (line 43 vs 44), a request like "make me a picture of a cat" matches "make me a" and returns `document` instead of `image`.

This only affects the server fallback path (when client also fails), but it's still a bug.

### Root Cause 3: Image base64 data pollutes conversation history

Server logs show: `Truncating message (role=assistant) from 2075829 to 50000 chars`

When an image IS successfully generated, the client saves the entire response (including `![Generated Image](data:image/png;base64,...)`) as message content -- a 2MB string. On the next message, this gets loaded into conversation history and sent to the server, causing:
- Slow/failing requests due to massive payload
- Potential timeouts
- Wasted tokens on truncated base64 garbage

## Fix Plan

### Fix 1: Rewrite intent detection with flexible regex (BOTH client and server)

Replace rigid keyword matching with regex that allows optional articles:

**Server-side `intentDetector.ts`:**
- Use regex patterns like `/create\s+(a\s+|an\s+)?excel/` instead of substring `"create excel"`
- Check image keywords BEFORE document keywords to prevent "make me a" hijacking
- Remove the overly broad `"make me a"` from document keywords
- Add standalone word matching for key terms like "excel", "pdf", "image"

**Client-side `useMessages.ts`:**  
- Apply same flexible regex patterns with optional articles
- Ensure image check runs before document check

### Fix 2: Strip base64 data URLs from saved message content

In `useMessages.ts` (line 714), before saving the AYN response to the database, strip any inline base64 image data URLs from the content. Replace `![Generated Image](data:image/png;base64,...)` with `![Generated Image](saved)` or similar placeholder. The actual image data is already in `labData` / rendered inline -- it doesn't need to be in the persisted text.

Also strip base64 from conversation history before sending to server (line 354-357 area).

### Fix 3: Redeploy edge functions

Redeploy `ayn-unified` after changes.

## Technical Changes

### File 1: `supabase/functions/ayn-unified/intentDetector.ts`
- Reorder: check image BEFORE document
- Replace substring matching with regex for flexible article handling
- Remove overly broad "make me a" from document keywords
- Add patterns like: `create\s+(an?\s+)?excel`, `make\s+(an?\s+)?image`, `show me`, `give me\s+(an?\s+)?`

### File 2: `src/hooks/useMessages.ts`
- Lines 317-323: Replace rigid regex with flexible patterns matching optional articles
- Reorder: check image BEFORE document  
- Lines 354-357: Strip base64 data URLs from conversation history before sending
- Line 714: Strip base64 from response content before saving to DB

### File 3: Redeploy `ayn-unified`



# Fix Image Generation, PDF Layout Gap, and Excel Downloads

## 3 Issues Found

### Issue 1: Image generation returns raw JSON text instead of an actual image
**Root cause**: The server-side `intentDetector.ts` has image keywords but they are not matching the user's actual input. Server logs show `Detected intent: chat` for image requests. When the LLM receives a chat intent, it hallucinates a fake tool call JSON (e.g., `{ "action": "generate_image", ... }`) instead of the server calling the real `generateImage()` function.

**Fix**: 
- Add broader image keywords (e.g., "show me", "image", "sun", "picture") to both client-side (`useMessages.ts`) and server-side (`intentDetector.ts`)
- Add a **safety net** in the chat response handler: if the LLM response contains `"action": "generate_image"` or similar tool-call JSON, intercept it and re-route to the actual `generateImage()` function instead of returning the raw JSON to the user

### Issue 2: PDF has large gap between section heading and table
**Root cause**: In `generate-document/index.ts`, the page-break check at line 165 (`if (y > pageHeight - 50)`) only considers the heading position. If the heading fits at the bottom of page 1 but the table doesn't, the table moves to page 2 while the heading stays alone on page 1 with a huge gap.

**Fix**: Before placing a section heading, calculate the minimum height needed for heading + first part of its content/table. If the combined height doesn't fit on the current page, move the entire section (heading + table) to the next page together.

### Issue 3: Excel download shows as plain text instead of a download button
**Root cause**: Server logs confirm no Excel document was ever generated. The intent for the Excel request was detected as `chat` instead of `document`. The user's Excel request didn't match the client-side or server-side document keywords, so the LLM responded with prose text "[Click here to download your Excel sheet]" instead of triggering the document generation pipeline.

**Fix**: 
- Add more Excel-related keywords to both client and server intent detection (e.g., "excel about", "excel for", "table of", "data about", "create a table")
- Same safety net as images: if the LLM response mentions "download your Excel" without an actual URL, detect the failure

## Technical Changes

### File 1: `supabase/functions/ayn-unified/intentDetector.ts`
- Add more image keywords: `"show me", "image", "sun", "picture", "painting"` and standalone word matching
- Add more document/Excel keywords: `"excel about", "excel for", "table about", "create table", "data overview", "data about"`

### File 2: `src/hooks/useMessages.ts` (client-side intent detection, ~line 317-323)
- Add same expanded keywords to match the server-side improvements

### File 3: `supabase/functions/ayn-unified/index.ts` (chat response handler)
- Add a safety net after the LLM chat response: if the response contains `"generate_image"` or `"action_input"` JSON patterns, intercept it and call `generateImage()` with the extracted prompt
- This prevents hallucinated tool calls from reaching the user

### File 4: `supabase/functions/generate-document/index.ts` (PDF layout)
- Before each section, calculate `heading height + content/table height`
- If the combined height exceeds remaining page space, trigger page break BEFORE the heading (not after)
- Change the logic around lines 163-170:
```text
// Calculate needed space for heading + content/table
const headingHeight = 10;
let sectionContentHeight = 0;
if (section.content) {
  const lines = doc.splitTextToSize(section.content, contentWidth - 10);
  sectionContentHeight = lines.length * 6 + 5;
}
if (section.table) {
  const headerH = 14;
  const rowsH = (section.table.rows?.length || 0) * 12;
  sectionContentHeight = Math.max(sectionContentHeight, headerH + rowsH + 10);
}
// If heading + first content won't fit, move everything to next page
const neededSpace = headingHeight + Math.min(sectionContentHeight, 60);
if (y + neededSpace > pageHeight - 40) {
  addFooter(...);
  doc.addPage();
  y = 30;
}
```

### File 5: Deploy edge functions
- Redeploy both `ayn-unified` and `generate-document`




# Fix: AYN Document Generation Not Working

## The Problem

When you asked AYN to create a PDF about rug pulls, AYN responded with text instead of generating an actual downloadable PDF. The document generation feature was built on the backend but isn't being triggered.

## Root Cause

The **frontend intent detection** in `useMessages.ts` is missing document keywords:

```typescript
// Current code (missing document detection)
const detectIntent = (): string => {
  if (selectedMode === 'LAB') return 'image';
  if (selectedMode === 'Civil Engineering') return 'engineering';
  // ...
  return 'chat';  // ← Always defaults to 'chat' for PDF requests!
};
```

When you say "pdf about rug pull", the frontend sends `intent: 'chat'` to the backend, which uses this forced intent instead of re-detecting from your message.

## The Solution

Add document detection to the frontend `detectIntent()` function to match the backend keywords.

---

## Technical Changes

### File: `src/hooks/useMessages.ts` (lines 240-249)

**Add document intent detection before the default return:**

```typescript
const detectIntent = (): string => {
  if (selectedMode === 'LAB' || selectedMode === 'Vision Lab') return 'image';
  if (selectedMode === 'Civil Engineering') return 'engineering';
  if (selectedMode === 'Research Pro') return 'search';
  if (selectedMode === 'PDF Analyst') return 'files';
  
  const lower = messageContent.toLowerCase();
  
  // Document generation detection (all languages)
  if (/create pdf|make pdf|generate pdf|pdf report|pdf document|pdf about|give me a pdf/.test(lower)) return 'document';
  if (/create excel|make excel|excel sheet|spreadsheet|xlsx/.test(lower)) return 'document';
  if (/اعمل pdf|انشئ pdf|ملف pdf|تقرير pdf|اعمل لي|سوي لي/.test(lower)) return 'document';
  if (/créer pdf|faire pdf|rapport pdf|document pdf|créer excel/.test(lower)) return 'document';
  
  // Existing checks
  if (/search|find|look up|latest|news/.test(lower)) return 'search';
  if (/beam|column|foundation|slab|calculate|structural/.test(lower)) return 'engineering';
  
  return 'chat';
};
```

---

## Summary

| File | Change |
|------|--------|
| `src/hooks/useMessages.ts` | Add document intent detection with English, Arabic, and French keywords |

## After This Fix

When you say:
- "Create a PDF about rug pulls" → Intent = `document` → AYN generates downloadable PDF
- "اعمل لي PDF عن الطاقة" → Intent = `document` → Arabic PDF generated  
- "Faire un rapport PDF" → Intent = `document` → French PDF generated

The download card will appear in the chat with a button to download your professionally formatted document.




## Fix Inline Download Text and Excel Detection

### Problems Identified

1. **Inline download links still showing** -- The edge function returns content with the `📥` emoji (e.g., `📥 [Click here to download your PDF](url)`), but the stripping code only looks for `📄` and `📊` emojis.

2. **Excel download button not appearing** -- Same root cause: the `extractBestDocumentLink` function scans for `📄` and `📊` emoji links but not `📥`, so Excel download links returned by the backend are never detected.

3. **Arabic download links not stripped** -- Lines like `📥 [اضغط هنا لتحميل الملف](url)` are also missed because the Arabic text doesn't match "Download" or "Click here" patterns.

### Changes

**File 1: `src/lib/documentUrlUtils.ts`**
- Add `📥` to the `emojiRegex` character class: change `[📄📊]` to `[📄📊📥]`
- This ensures document links using the `📥` emoji are detected and the Download button appears

**File 2: `src/components/shared/MessageFormatter.tsx`**
- Add `📥` to the emoji stripping regex: change `[📄📊]` to `[📄📊📥]`
- Add a broader stripping regex for Arabic download link text (`اضغط` / `تحميل` patterns) and French (`Cliquez ici`)
- This removes inline download text for all supported languages

### Technical Detail

```text
documentUrlUtils.ts (line 95):
  Before: /[📄📊]\s*\[...
  After:  /[📄📊📥]\s*\[...

MessageFormatter.tsx (line 237):
  Before: /^[\s]*[📄📊]\s*\[...
  After:  /^[\s]*[📄📊📥]\s*\[...

MessageFormatter.tsx (line 239) -- add Arabic/French patterns:
  Before: /^[\s]*\[(?:[Dd]ownload[^\]]*|[Cc]lick here[^\]]*)\]...
  After:  /^[\s]*\[(?:[Dd]ownload[^\]]*|[Cc]lick here[^\]]*|[Cc]liquez ici[^\]]*|اضغط[^\]]*|تحميل[^\]]*)\]...
```

These are two small regex tweaks -- no structural changes needed.

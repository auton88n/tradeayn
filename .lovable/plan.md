
# Fix PDF Generation - Empty File Bug

## Problem Identified
The PDF downloads are corrupted (0KB) because of a type mismatch in the `generate-document` Edge Function.

**Root Cause:** Line 284 uses a type cast that doesn't actually convert data:
```typescript
return doc.output('arraybuffer') as unknown as Uint8Array;
```

`jsPDF.output('arraybuffer')` returns an `ArrayBuffer`, not a `Uint8Array`. The type cast only tells TypeScript to ignore the mismatch - it doesn't convert the data.

When `toDataUrl()` receives this ArrayBuffer and does `Array.from(data)`, it gets an empty array because ArrayBuffer isn't iterable like Uint8Array. Result: empty base64 string = 0KB corrupted PDF.

## The Fix

**File:** `supabase/functions/generate-document/index.ts`

**Line 284 - Change from:**
```typescript
return doc.output('arraybuffer') as unknown as Uint8Array;
```

**To:**
```typescript
const arrayBuffer = doc.output('arraybuffer');
return new Uint8Array(arrayBuffer);
```

This properly wraps the ArrayBuffer in a Uint8Array view, which can then be correctly iterated by `toDataUrl()` to produce a valid base64 string.

## Technical Details

| Before | After |
|--------|-------|
| ArrayBuffer (not iterable) | Uint8Array (iterable over bytes) |
| `Array.from(ArrayBuffer)` → `[]` | `Array.from(Uint8Array)` → `[37, 80, 68, 70, ...]` |
| Base64: "" (empty) | Base64: "JVBERi0xLjQ..." (valid PDF) |
| 0KB file | Proper file size |

## Summary
One-line fix that properly converts ArrayBuffer to Uint8Array so the base64 encoding works correctly.

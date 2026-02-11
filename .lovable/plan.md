

# Fix: "Maximum call stack size exceeded" on Image/File Vision

## The Problem

When you send AYN an image (or large file) on Telegram, it crashes with **"Vision failed: Maximum call stack size exceeded"**.

The bug is in how the code converts binary data to base64. It uses this pattern:

```
btoa(String.fromCharCode(...new Uint8Array(buffer)))
```

The `...` spread operator tries to pass every single byte as a separate argument to `String.fromCharCode()`. For a 500KB image, that's 500,000+ arguments -- JavaScript has a hard limit on function arguments and it blows the call stack.

This pattern appears **3 times** in the file, affecting photos, documents, and voice messages.

## The Fix

Replace the broken pattern with a chunked approach that processes bytes in batches of 8192:

```
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}
```

This processes 8KB chunks at a time (well within call stack limits) and works for files of any size.

## Changes

**File: `supabase/functions/ayn-telegram-webhook/index.ts`**

1. Add the `arrayBufferToBase64` helper function near the top of the file
2. Replace line 490: photo handler -- use `arrayBufferToBase64(imageBuffer)` instead of `btoa(String.fromCharCode(...))`
3. Replace line 601: document handler -- same fix
4. Replace line 681: voice/audio handler -- same fix

Then redeploy the `ayn-telegram-webhook` edge function.

## Result

AYN will be able to analyze images and documents of any size without crashing.

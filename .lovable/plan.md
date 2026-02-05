
# Strengthen File Upload Security

## Current State Assessment

Your main file upload system (`file-upload` edge function) has excellent security protection. However, there are gaps that could allow malicious files to slip through.

## Issues to Fix

### 1. Frontend Not Using Advanced Validation
The `useFileUpload.ts` hook has basic checks, but the comprehensive security functions in `fileValidation.ts` are **never actually called**. This means:
- Magic byte verification isn't happening on the client
- Malicious content scanning is skipped
- The server catches these, but catching them earlier is better

### 2. Survey Uploader Has No Protection
The `SurveyUploader.tsx` component:
- Accepts any file without validation
- Sends raw file content to the backend
- The `parse-survey-file` edge function has **no authentication**
- No rate limiting

### 3. Missing Security Headers on Survey Parser
The `parse-survey-file` function lacks the security headers present in `file-upload`.

---

## Implementation Plan

### Phase 1: Integrate Comprehensive Validation in Frontend

**File: `src/hooks/useFileUpload.ts`**

Import and use the advanced validation:
```typescript
import { validateFile } from '@/lib/fileValidation';

const handleFileSelect = async (file: File | null) => {
  if (!file) return;
  
  // Basic type/size check first (fast)
  if (!validateBasic(file)) return;
  
  // Then comprehensive security check
  const validation = await validateFile(file);
  if (!validation.isValid) {
    toast({
      title: "Security Check Failed",
      description: validation.error,
      variant: "destructive"
    });
    return;
  }
  
  // Warn about suspicious patterns (but allow)
  if (validation.warnings?.length) {
    console.warn('File warnings:', validation.warnings);
  }
  
  // Proceed with upload
  setSelectedFile(file);
  // ... rest of upload logic
};
```

---

### Phase 2: Secure Survey Uploader Component

**File: `src/components/engineering/SurveyUploader.tsx`**

Add validation before processing:
```typescript
import { validateFileExtension, scanForMaliciousContent } from '@/lib/fileValidation';

const handleFile = async (file: File) => {
  // Check file extension
  const extCheck = validateFileExtension(file.name);
  if (!extCheck.isValid) {
    toast({ title: 'Invalid File', description: extCheck.error, variant: 'destructive' });
    return;
  }

  // Check file size (limit to 5MB for survey files)
  if (file.size > 5 * 1024 * 1024) {
    toast({ title: 'File Too Large', description: 'Maximum 5MB', variant: 'destructive' });
    return;
  }

  // Scan for malicious content
  const scanResult = await scanForMaliciousContent(file);
  if (!scanResult.isValid) {
    toast({ title: 'Security Issue', description: scanResult.error, variant: 'destructive' });
    return;
  }

  // Continue with parsing...
};
```

---

### Phase 3: Harden Survey Parser Edge Function

**File: `supabase/functions/parse-survey-file/index.ts`**

Add critical security controls:

1. **Authentication** - Require valid user session
2. **Rate Limiting** - Prevent abuse (e.g., 20 parses per hour)
3. **Content Size Limit** - Maximum 5MB
4. **Content Validation** - Scan for malicious patterns
5. **Security Headers** - Match the main upload function

```typescript
// Add security headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

// Suspicious patterns to block
const SUSPICIOUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
];

serve(async (req) => {
  // ... CORS handling
  
  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const { data: { user }, error } = await supabaseClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Rate limiting
  const { data: rateLimitResult } = await supabaseClient.rpc('check_api_rate_limit', {
    p_user_id: user.id,
    p_endpoint: 'parse-survey',
    p_max_requests: 20,
    p_window_minutes: 60
  });
  
  if (rateLimitResult?.[0]?.allowed === false) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
  }

  const { content, fileName } = await req.json();
  
  // Content size check
  if (content.length > 5 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'Content too large' }), { status: 400 });
  }

  // Scan for malicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      console.warn('Malicious pattern detected in survey file', { userId: user.id });
      return new Response(JSON.stringify({ error: 'Suspicious content detected' }), { status: 400 });
    }
  }

  // Continue with parsing...
});
```

---

### Phase 4: Add ZIP Bomb Protection (Enhancement)

For any future ZIP/archive handling, add decompression limits:

```typescript
// In fileValidation.ts - add this check for xlsx files (which are ZIPs)
const MAX_DECOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB limit
const MAX_COMPRESSION_RATIO = 100; // Flag if compressed size × 100 < decompressed size
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/hooks/useFileUpload.ts` | Import and call `validateFile()` before upload |
| `src/components/engineering/SurveyUploader.tsx` | Add extension check, size limit, and content scan |
| `supabase/functions/parse-survey-file/index.ts` | Add auth, rate limiting, size limit, pattern scanning, security headers |
| `src/lib/fileValidation.ts` | Optional: Add ZIP bomb detection |

## Security Benefits

- **Defense in depth**: Validation on frontend AND backend
- **Consistent protection**: All upload paths use the same security checks
- **Rate limiting**: Prevents brute-force attacks on all endpoints
- **Authentication**: Survey parser now requires login
- **Audit logging**: Suspicious activity is logged for review

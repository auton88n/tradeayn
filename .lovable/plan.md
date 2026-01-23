

## Fix: PDF/Excel Download Not Working

### Root Cause Analysis
The documents bucket is configured as `public = true` but lacks an RLS SELECT policy to allow anonymous reads from `storage.objects`. When a user clicks the download link, Supabase blocks access because there's no policy granting read permissions.

**Evidence from database:**
- `documents` bucket: `public = true` ✓
- RLS policy for `documents`: **Missing** ✗
- Other buckets (`avatars`, `generated-images`) have proper SELECT policies

### Solution
Add an RLS policy to allow public SELECT access on the `documents` bucket, matching the pattern used for other public buckets.

---

## Implementation Plan

### Step 1: Add Storage RLS Policy via Database Migration

Create a new migration to add the missing SELECT policy:

```sql
-- Allow public read access to documents bucket
CREATE POLICY "Public read for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

This matches the pattern used for `avatars` and `generated-images` buckets.

---

## Technical Details

| Aspect | Details |
|--------|---------|
| **Files Changed** | 1 new migration file |
| **Bucket Affected** | `documents` |
| **Policy Type** | SELECT (read-only) |
| **Access Level** | Public (anyone with the link) |
| **Risk Level** | Low - documents are already stored with UUIDs making URLs unguessable |

### Security Consideration
Since the user confirmed they want documents to remain public, this policy allows anyone with the full URL to download the file. URLs contain:
- User UUID folder (`d2ceaad6-af0d-4001-a739-6b57f040e404/`)
- Unique filename with timestamp (`Document_Name_1769207550146.pdf`)

This makes URLs practically unguessable without prior knowledge.




# Add Production Error Logging to Supabase

## Overview
Enhance the ErrorBoundary to report caught errors to a new `error_logs` Supabase table, giving you visibility into production crashes. Also add a global unhandled promise rejection listener.

## Step 1: Database Migration -- Create `error_logs` Table

Run a migration to create the table with RLS policies:

```sql
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  url TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous) can insert errors
CREATE POLICY "Anyone can insert errors"
  ON error_logs FOR INSERT WITH CHECK (true);

-- Only admins can read error logs
CREATE POLICY "Admins can read all errors"
  ON error_logs FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Index for cleanup queries
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
```

This uses the existing `user_roles` table and `has_role()` function for admin-only read access. The `has_role` function already exists as a `SECURITY DEFINER` function (confirmed from the schema).

## Step 2: Update `src/components/shared/ErrorBoundary.tsx`

Add a private `reportError` method that dynamically imports the Supabase client and inserts an error log row. Call it from `componentDidCatch` in a non-blocking way (fire-and-forget with `.catch(() => {})`).

Key details:
- Dynamic import of supabase client avoids circular dependencies in this low-level component
- All string fields are truncated (message: 1000 chars, stacks: 5000 chars)
- Wrapped in try/catch so error reporting never breaks the app
- The existing auto-reload logic remains unchanged

## Step 3: Update `src/main.tsx`

Add a global `unhandledrejection` listener before `createRoot()` that logs unhandled promise rejections to the console. This provides visibility in browser DevTools for errors that escape React's error boundary.

## Files Changed

| File | Change |
|------|--------|
| Database migration | New `error_logs` table with RLS |
| `src/components/shared/ErrorBoundary.tsx` | Add `reportError` method, call from `componentDidCatch` |
| `src/main.tsx` | Add `window.addEventListener('unhandledrejection', ...)` |

## Technical Notes

- The INSERT policy uses `WITH CHECK (true)` so both authenticated and anonymous users can report errors
- No SELECT policy for regular users -- error logs are admin-only
- The Supabase types file will auto-update after migration to include the `error_logs` table
- Error reporting is fully non-blocking and failure-safe


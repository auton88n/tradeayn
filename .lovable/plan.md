

# Fix Credits Not Decreasing Bug

## The Problem

Users are sending messages but their credit counter stays at 0. The credits never decrease because:

**The backend increments DAILY counters, but the frontend displays MONTHLY counters**

| What Gets Incremented | What Gets Displayed | Result |
|----------------------|---------------------|--------|
| `current_daily_messages` | `current_monthly_messages` | Always shows 0 |

## Evidence from Database

```text
User cf5f4735... sent 9 messages:
├── current_daily_messages: 9  ← Backend increments this
├── current_monthly_messages: 0 ← Frontend reads this
└── User sees: "0 messages sent" (wrong!)
```

## Root Cause

The `check_user_ai_limit` database function only increments daily counters:

```sql
-- Current code (lines 59-80 in check_user_ai_limit function):
CASE _intent_type
  WHEN 'chat' THEN
    field_name := 'current_daily_messages';  -- Only daily!
  -- Never touches current_monthly_messages
END CASE;
```

---

## Solution

Update the database function to increment **BOTH** daily and monthly counters when a message is sent.

### Database Migration

Create a new migration to update `check_user_ai_limit` function:

```sql
CREATE OR REPLACE FUNCTION public.check_user_ai_limit(_user_id uuid, _intent_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  limits RECORD;
  current_val INTEGER;
  limit_val INTEGER;
  field_name TEXT;
  monthly_field_name TEXT;
BEGIN
  -- [existing insert and reset logic stays the same]
  
  -- Determine which fields to check and increment
  CASE _intent_type
    WHEN 'chat' THEN
      current_val := COALESCE(limits.current_daily_messages, 0);
      limit_val := COALESCE(limits.daily_messages, 10);
      field_name := 'current_daily_messages';
      monthly_field_name := 'current_monthly_messages';  -- NEW
    WHEN 'engineering' THEN
      current_val := COALESCE(limits.current_daily_engineering, 0);
      limit_val := COALESCE(limits.daily_engineering, 3);
      field_name := 'current_daily_engineering';
      monthly_field_name := 'current_monthly_engineering';  -- NEW
    ELSE
      current_val := COALESCE(limits.current_daily_messages, 0);
      limit_val := COALESCE(limits.daily_messages, 10);
      field_name := 'current_daily_messages';
      monthly_field_name := 'current_monthly_messages';  -- NEW
  END CASE;

  -- [limit check stays the same]

  -- Increment BOTH daily and monthly usage
  EXECUTE format(
    'UPDATE public.user_ai_limits SET 
      %I = COALESCE(%I, 0) + 1,
      %I = COALESCE(%I, 0) + 1,
      updated_at = now() 
    WHERE user_id = $1',
    field_name, field_name,
    monthly_field_name, monthly_field_name
  )
  USING _user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', current_val + 1,
    'limit', limit_val,
    'remaining', (limit_val - current_val - 1),
    'resets_at', limits.daily_reset_at
  );
END;
$function$;
```

---

## Technical Details

### Changes to Database Function

**File**: New migration SQL file

The updated function will:
1. Keep all existing daily limit checking logic
2. Add a `monthly_field_name` variable for each intent type
3. Increment BOTH the daily and monthly counters in a single UPDATE statement
4. Ensure monthly counters are properly reset on `monthly_reset_at`

### Monthly Reset Logic (Already Exists)

The function already resets monthly counters when `monthly_reset_at` passes:

```sql
IF limits.monthly_reset_at IS NULL OR limits.monthly_reset_at <= now() THEN
  UPDATE public.user_ai_limits SET
    current_month_cost_sar = 0,  -- Already resets cost
    -- Need to add: current_monthly_messages = 0
    -- Need to add: current_monthly_engineering = 0
    monthly_reset_at = now() + INTERVAL '1 month'
  WHERE user_id = _user_id;
END IF;
```

This also needs to be updated to reset the monthly message counters.

---

## Files to Modify

| Type | Action |
|------|--------|
| Database Migration | Create new migration to update `check_user_ai_limit` function |

---

## After This Fix

| Before | After |
|--------|-------|
| User sends message | User sends message |
| `current_daily_messages` += 1 | `current_daily_messages` += 1 |
| `current_monthly_messages` = 0 (unchanged) | `current_monthly_messages` += 1 |
| Frontend shows: "0 messages sent" | Frontend shows: "1 message sent" |
| Credit warning never triggers | Credit warning triggers at 90% |

---

## Testing Checklist

After implementation:
- Send a message as a test user
- Verify `current_monthly_messages` increases in database
- Verify UsageCard in frontend shows correct count
- Verify real-time subscription updates the display
- Verify monthly reset works correctly


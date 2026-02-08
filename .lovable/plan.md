

# Fix Copyright Year + Drop Dead Tables

## 1. Copyright Year (LanguageContext.tsx)

Replace the hardcoded "2024" in all 3 language blocks with a dynamic expression. Since these are static translation strings (not JSX), the approach is to use a template or helper:

- Line 52 (English): Change `'© 2024 AYN AI Business Consulting. All rights reserved.'` to use `new Date().getFullYear()`
- Line 807 (Arabic): Same pattern for the Arabic string
- Line 1487 (French): Same pattern for the French string

Since the translations object is built once at module level, we will compute `const currentYear = new Date().getFullYear()` at the top and interpolate it into the 3 strings.

## 2. Drop Dead Database Tables

No code references `webhook_health_metrics` or `webhook_rate_limits` anywhere in the frontend or edge functions. These were used by the deleted n8n webhook system.

Action: Run SQL to drop both tables. Keep `ai_mode_configs` for now (low risk, may be referenced by admin queries).

```sql
DROP TABLE IF EXISTS webhook_health_metrics;
DROP TABLE IF EXISTS webhook_rate_limits;
```

## 3. Mode System -- No Changes Needed

The mode system is already simplified:
- `getModes()` returns only `[{ name: 'General', ... }]` -- one mode
- `ayn-unified` auto-detects intent from the message content
- The `AIMode` type in `dashboard.types.ts` still lists 7 modes but nothing in the UI exposes them

No action needed here. Cleaning the type union would touch 9+ files for zero user benefit.

## Summary of file changes

| File | Change |
|------|--------|
| `src/contexts/LanguageContext.tsx` | Replace 3 hardcoded "2024" with dynamic year |
| Supabase SQL | DROP `webhook_health_metrics` and `webhook_rate_limits` |


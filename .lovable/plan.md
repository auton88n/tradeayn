

## Plan: Remove Paper Trade Functions + Fix Build Error

### 1. Fix build error — Replace all `npm:resend` imports
The build is failing because `npm:resend@2.0.0` isn't supported. Four files need fixing:
- `supabase/functions/auth-send-email/index.ts` line 2
- `supabase/functions/send-application-email/index.ts` line 2
- `supabase/functions/send-usage-alert/index.ts` line 2
- `supabase/functions/send-email/index.ts` line 2

Replace `import { Resend } from "npm:resend@2.0.0"` → `import { Resend } from "https://esm.sh/resend@2.0.0"` in all four.

### 2. Remove paper trade function configs from `supabase/config.toml`
Delete these 3 blocks (lines 271-278):
- `[functions.ayn-open-trade]`
- `[functions.ayn-monitor-trades]`
- `[functions.ayn-calculate-metrics]`

Note: The actual function directories are already empty/deleted — only the config entries remain. No `ayn-close-trade` entry exists in config. No frontend references exist either.


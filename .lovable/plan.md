
Goal: Fix (1) invisible “Send”/button text in the forgot-password flow, and (2) Reset Password page stuck forever on “Validating Reset Link”.

What’s happening (based on code + your screenshots)
1) “Send” text is dark/invisible
- The app’s ThemeProvider default is light, so CSS token `foreground` is near-black.
- In `AuthModal.tsx`, the forgot-password UI is rendered inside a dark modal (`bg-neutral-950`), but the outline button uses the shared Button variant:
  - `outline: ... text-foreground ...`
- In light theme, `text-foreground` is black, so on a dark modal it becomes unreadable (your “Send” / “Send Again” looks “missing”).

2) “Validating Reset Link” can hang indefinitely
- `src/pages/ResetPassword.tsx` starts with `isValidating=true`.
- It calls `supabase.auth.getSession().then(...)` with no timeout.
- If `getSession()` hangs (this can happen in some browsers/lock states), `isValidating` never flips to false → spinner forever (your “hours” symptom).
- There’s a 3s timeout only for the “waiting for auth event” branch, but not for `getSession()` itself.

Implementation plan (code changes)

A) Fix the invisible “Send” text (AuthModal)
Files:
- `src/components/auth/AuthModal.tsx`

Changes:
1. For every Button shown on the dark modal that currently uses `variant="outline"` (notably:
   - “Forgot Password?” prominent button
   - “Send Again” button on the “Reset Link Sent” confirmation screen
), override the outline styling to be “dark-modal friendly”:
   - `border-white/20 text-white`
   - hover: `hover:bg-white hover:text-neutral-950`
   - keep disabled readable: `disabled:opacity-50`
2. Keep the global Button component unchanged (we don’t want to break outline buttons elsewhere). This is a scoped fix to AuthModal only.

Why this will fix it:
- It removes reliance on theme tokens for text color inside a dark modal, so the label is always visible whether the site theme is light or dark.

B) Make ResetPassword validation reliable (never infinite spinner)
Files:
- `src/pages/ResetPassword.tsx`

Changes:
1. Add a “safe session fetch” with timeout:
   - Wrap `supabase.auth.getSession()` in `Promise.race()` with a timer (e.g., 5–7 seconds).
   - If it times out, stop validating and show a friendly error state (same “Request New Link” UI).
2. Add a direct fallback for recovery links:
   - If URL hash contains `type=recovery` and includes `access_token` + `refresh_token`, attempt:
     - `supabase.auth.setSession({ access_token, refresh_token })` with a timeout as well.
   - If successful: set session, stop validating.
   - If it fails/times out: stop validating and show expired/invalid state.
3. Add a UI “slow validation” guard (optional but recommended):
   - After ~8 seconds, swap the validating subtitle to something like:
     - “This is taking longer than expected. Please try again.”
   - Provide buttons: “Reload” + “Request New Link”.
4. Security/UX improvement:
   - After a session is established, remove the hash tokens from the URL via `history.replaceState` so tokens aren’t left in the address bar.

Why this will fix it:
- Even if Supabase auth session retrieval deadlocks/hangs, the page will not be stuck: it will time out and guide the user to request a new link.
- Parsing the hash and setting the session explicitly provides a second path that works even when the auth event doesn’t fire.

C) Verification checklist (what we’ll test)
1. Light theme:
- Open Auth modal → Forgot Password flow
- Confirm “Forgot Password?” / “Send Again” labels are readable (no black-on-dark).

2. Password reset happy path:
- Request reset email
- Click link → lands on `/reset-password`
- “Validating” should last only a moment
- Reset form appears and `updateUser({ password })` succeeds.

3. Invalid/expired token:
- Open an old reset link
- Should show “Reset Link Expired” within max timeout (no infinite spinner).

4. Cross-domain sanity (important):
- Request reset from the same domain you’ll open the email link on (e.g., https://aynn.io).
- If you use multiple domains (preview/published/custom), confirm Supabase Auth “Redirect URLs” includes them; otherwise Supabase can refuse/alter redirects.

Files we will change
- `src/components/auth/AuthModal.tsx` (button contrast fixes for dark modal)
- `src/pages/ResetPassword.tsx` (timeout + hash session fallback + never-stuck validation)

Risks / edge cases we’re covering
- Browser/session storage quirks causing `getSession()` to hang
- Recovery links that arrive with tokens in hash but no session established yet
- Users opening links long after creation (expired tokens)

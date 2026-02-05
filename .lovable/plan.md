
Goal
- Eliminate the remaining “two blacks” artifact that appears only during the first moments of page load in dark mode.

What I found in the codebase (why this still happens)
1) The “pre-paint theme” script in index.html still forces a hardcoded dark background
- index.html sets the body inline background to hsl(0 0% 4%), but the head script still does:
  - document.body.style.backgroundColor = isDark ? '#0a0a0a' : '#ffffff';
- This can create a tiny but visible mismatch during the first paint / animation because:
  - It uses a different color representation (hex vs HSL),
  - It updates body style from JS (timing-dependent),
  - And it does not set the html background (so any gaps can show through).

2) PageTransition reveals the “behind layer” briefly on initial load
- src/components/shared/PageTransition.tsx animates:
  - initial: { opacity: 0, y: 8 }
  - animate: { opacity: 1, y: 0 }
- That initial y offset can reveal the page behind the transition wrapper for a moment.
- If the behind layer (html/body) differs even slightly from the app layer (bg-background), you see a moving “second black” band/area during the first ~250ms.

Proposed fix (robust approach)
A) Make the very first painted background identical everywhere (html + body) and remove timing pitfalls
1. Update the index.html “Prevent FOUC” script:
   - Set background color on document.documentElement (html) immediately (always exists).
   - Only set document.body background if document.body is available (avoid timing issues).
   - Use the exact same value you want for dark mode: hsl(0 0% 4%) (not #0a0a0a).
   - Keep setting colorScheme for correct form control rendering.

   Outcome:
   - Even if there is a gap during an animation or while the app is mounting, the “behind” color is exactly the same.

2. Align the script with your storageKey (“ayn-theme”) and keep behavior consistent:
   - It already reads localStorage('ayn-theme'), which matches App.tsx.
   - We’ll just make the background assignment consistent and safe.

B) Prevent PageTransition from exposing a different background during the initial motion
Option 1 (recommended): Add a stationary, full-viewport background layer inside PageTransition
- Modify PageTransition so the background does not move/fade with the animated content:
  - Outer wrapper (non-animated): className="min-h-screen bg-background"
  - Inner motion.div: applies the current y/opacity animation to children only
- This ensures that during the first 250ms, the visible background remains stable and identical.

Option 2 (alternative): Disable “y: 8” (or opacity) on the very first route mount only
- More conditional logic (track “hasMounted” once), slightly more complex.
- Only needed if you want to keep PageTransition structure unchanged.

C) (Small safety net) Ensure html background matches theme variables in CSS
- In src/index.css, add a base rule that sets html background to hsl(var(--background)) (and/or bg-background).
- This ensures that even if body doesn’t cover something (rare cases, overscroll, transition gaps), html matches.

Files to change (implementation checklist)
1) index.html
- Update the “Prevent FOUC” script to:
  - Set document.documentElement.classList + style.colorScheme as now
  - Set document.documentElement.style.backgroundColor (dark: hsl(0 0% 4%), light: #fff or your light background choice)
  - Set document.body?.style.backgroundColor with the same values (optional, but helpful)

2) src/components/shared/PageTransition.tsx
- Wrap the motion content with a non-animated background container, so the background never “slides” and never reveals a different shade.

3) src/index.css
- Add html background rule consistent with theme variables.
- Keep existing body bg rules; this is just to make the “behind layer” consistent.

How we will verify (quick tests)
1) Dark mode set to “dark” (not “system”), then hard refresh:
   - The moving “second black” should be gone.
2) Repeat 5–10 reloads (the issue is timing-based).
3) Test on:
   - Desktop Chrome (normal window)
   - If possible, Safari (where paint timing issues often show up)
4) Confirm no new flashes on:
   - /pricing and /settings (fast routes)
   - initial / load and back/forward navigation

Edge cases / notes
- If you still see a faint band after this, it will almost certainly be caused by a specific component overlay (e.g., a gradient/halo spanning wider than intended). The above changes remove the most common root cause: the “behind layer” being different during the first paint + transition.

“Next ideas” (optional follow-ups after this fix)
- Add a “reduce motion” mode (prefers-reduced-motion) that disables initial translate animations to further reduce transient artifacts.
- Add a tiny debug mode flag that briefly outlines the layers (html/body/root) to visually confirm which element is showing a different background during load.

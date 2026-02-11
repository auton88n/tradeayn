

# Fix Telegram Formatting and Make Marketing Bot More Flexible

## Problem 1: Raw `****` showing in Telegram

The AI sometimes outputs markdown like `**bold**` or stray `****` that doesn't get cleaned up properly before sending to Telegram. The current `markdownToTelegramHtml` function misses edge cases like:
- Empty bold markers `****` (no text between them)
- Triple asterisks `***text***`
- Unmatched single `*` characters
- Bullet points using `*`

### Fix in `supabase/functions/_shared/telegramHelper.ts`:
- Strip empty bold/italic markers (`****`, `**`, stray `*`)
- Handle `***bold italic***` properly
- Clean up any remaining raw asterisks that aren't part of valid formatting
- Also strip raw markdown like `---`, `___` horizontal rules

## Problem 2: Too Rigid Brand Rules

The current persona has strict rules like "MAX 3-4 WORDS", "BLACK and WHITE only", "Blue accent for ONE word only". This makes the bot push back on the creator's ideas instead of following their direction.

### Fix in `MARKETING_PERSONA` (in `ayn-marketing-webhook/index.ts`):
- Remove the rigid brand color/style rules from being enforced
- Keep brand awareness but make it a suggestion, not a rule
- Add explicit instruction: "the creator is the boss — follow their creative direction"
- Remove lines that tell the bot to push back on ideas
- Make the bot collaborative instead of opinionated

## Problem 3: Not Friendly Enough

The current persona says things like "never say Great idea!" and "if a hook is weak, say that hook is weak". This makes the bot feel cold.

### Fix in `MARKETING_PERSONA`:
- Remove the "never say nice things" rules
- Add warmth — the bot should be supportive and encouraging
- Keep it casual and teammate-like but add genuine enthusiasm
- Make it feel like a friend who's good at marketing, not a strict creative director

## Files to Change

| File | What Changes |
|------|-------------|
| `supabase/functions/_shared/telegramHelper.ts` | Better markdown cleanup — strip `****`, stray `*`, handle edge cases |
| `supabase/functions/ayn-marketing-webhook/index.ts` | Rewrite `MARKETING_PERSONA` to be friendlier, less rigid, follow the creator's lead |

## Updated Persona Direction

The bot will shift from "opinionated creative director who pushes back" to "supportive marketing teammate who follows the creator's vision while offering smart suggestions when asked". Brand guidelines become soft suggestions, not enforced rules. The creator decides the style, colors, and direction.



# Scale Up History Chat to Match Real Messaging App Feel

## What's Wrong

Looking at the screenshots, the compact (history) mode feels cramped compared to a proper chat app. The differences:
- Text is 13px instead of 14px (text-sm)
- Avatars are 24px (w-6) instead of 32px (w-8)
- Padding and gaps are noticeably tighter
- Name/timestamp labels are too small

## Changes

### `src/components/transcript/TranscriptMessage.tsx`

Scale compact mode values up to nearly match non-compact mode:

| Element | Current (compact) | New (compact) |
|---------|-------------------|---------------|
| Row padding/gap | py-1.5 px-2 gap-2.5 | py-2 px-3 gap-3 |
| Avatar size | w-6 h-6 (24px) | w-7 h-7 (28px) |
| Avatar icon | w-3 h-3 | w-3.5 h-3.5 |
| Name label | text-xs (12px) | text-sm (14px) |
| Timestamp | text-[11px] | text-xs (12px) |
| Bubble padding | px-3 py-2 | px-4 py-2.5 |
| Message text | text-[13px] | text-sm (14px) |
| Name margin | mb-0.5 | mb-1 |

This makes the compact mode almost identical to the non-compact sizing, with only the width constraint (95% vs 80%) and block vs inline-block layout being the differentiator.

### `src/components/eye/ResponseCard.tsx`

Increase message spacing from `space-y-2` to `space-y-3` for more breathing room between messages, matching the feel of the larger screenshots.


# Add Position Size in Dollars to Open Positions Card

## What the User Wants

The "Size" field in the Open Positions card currently shows only the risk percentage (e.g., `2.5%`). The user wants to also see the actual dollar amount invested in the trade (e.g., `$250.00`) so they can clearly understand how much money is allocated to the position and how it relates to the $10,000 account balance.

## Current State

In `src/components/trading/PerformanceDashboard.tsx`, line 220:
```tsx
<div>
  <span className="text-muted-foreground">Size</span>
  <br />
  <span className="font-medium">{trade.position_size_percent}%</span>
</div>
```

The `position_size_dollars` value is already available in the component — it's in the `PaperTrade` type (line 50) and assigned to `positionSizeDollars` on line 141. It's just not being rendered.

## The Fix — One Line Change

Update the Size cell to show both values stacked:

```tsx
<div>
  <span className="text-muted-foreground">Size</span>
  <br />
  <span className="font-medium">${positionSizeDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  <br />
  <span className="text-[10px] text-muted-foreground">{trade.position_size_percent}%</span>
</div>
```

This shows:
- **Bold:** `$250.00` (the actual cash allocated)
- **Small gray below:** `2.5%` (the risk percentage)

## Why `positionSizeDollars` Is Already Correct

`position_size_dollars` is calculated by `ayn-open-trade` edge function as:
```
position_size_dollars = (balance × riskPercent%) / stopDistance × entryPrice
```

For the TAO_USDT trade:
- Balance: ~$10,000
- Risk: 2.5%
- This gives ~$250 in the position (the actual capital allocated)

This number is stored in the DB and reflects the real account balance at the time of trade entry — so it's always accurate.

## File to Change

| File | Line | Change |
|---|---|---|
| `src/components/trading/PerformanceDashboard.tsx` | 220 | Show `$positionSizeDollars` as primary, `%` as secondary label |

One line change, no edge function changes, no DB changes.

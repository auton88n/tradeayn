
# Pricing Page Updates: Engineering Limits, Apple Pay, Enterprise Styling & Performance

## Summary

This plan addresses five key requests:
1. **Engineering Calculation Limits**: Update to Free=1/month, Starter=10, Pro=50, Business=100
2. **Apple Pay Implementation**: Enable Apple Pay/Google Pay via Stripe Checkout
3. **Enterprise Card Color**: Differentiate from Business tier with new color scheme
4. **Remove "Dedicated account manager"**: From Enterprise features
5. **Performance Optimization**: Fix laggy scrolling and heavy page load

---

## 1. Engineering Calculation Limit Updates

### New Values

| Tier | Current Engineering | New Engineering |
|------|---------------------|-----------------|
| Free | 10/month | **1/month** |
| Starter | 50/month | **10/month** |
| Pro | 200/month | **50/month** |
| Business | 500/month | **100/month** |

### Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/SubscriptionContext.tsx` | Update `monthlyEngineering` values and feature text |
| `src/constants/tierLimits.ts` | Sync engineering limits |
| `supabase/functions/check-subscription/index.ts` | Update `TIER_LIMITS` backend config |

### Code Changes

```typescript
// SubscriptionContext.tsx - Updated limits
free: {
  limits: { monthlyCredits: 5, monthlyEngineering: 1, isDaily: true },
  features: ['5 credits/day', '1 engineering calc/month', 'Basic support'],
},
starter: {
  limits: { monthlyCredits: 500, monthlyEngineering: 10 },
  features: ['500 credits/month', '10 engineering calcs', 'PDF & Excel generation', 'Email support'],
},
pro: {
  limits: { monthlyCredits: 1000, monthlyEngineering: 50 },
  features: ['1,000 credits/month', '50 engineering calcs', 'PDF & Excel generation', 'Priority support'],
},
business: {
  limits: { monthlyCredits: 3000, monthlyEngineering: 100 },
  features: ['3,000 credits/month', '100 engineering calcs', 'PDF & Excel generation', 'Priority support'],
},
```

---

## 2. Apple Pay Implementation

Apple Pay and Google Pay are automatically available through Stripe Checkout when the `payment_method_types` parameter includes `'card'` **or is omitted entirely** (Stripe's default behavior enables wallets).

### Implementation

Update `create-checkout` edge function to explicitly enable payment method types:

```typescript
// supabase/functions/create-checkout/index.ts
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  customer_email: customerId ? undefined : user.email,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: "subscription",
  // Enable Apple Pay, Google Pay, and card payments
  payment_method_types: ['card'],  // Stripe automatically shows Apple/Google Pay when available
  success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/subscription-canceled`,
  metadata: { user_id: user.id },
});
```

**Important Notes:**
- Apple Pay appears automatically in Stripe Checkout on Safari (iOS/macOS) when the user has Apple Pay set up
- Google Pay appears automatically on Chrome/Android when the user has Google Pay set up
- No additional configuration needed - Stripe handles wallet detection automatically
- For testing: Use Stripe's test mode with real Apple Pay in Safari

---

## 3. Enterprise Card Color Change

### Current Styling (Too Similar to Business)
- Enterprise uses `from-yellow-400/20 to-amber-500/10` (gold tones)
- Business uses `from-amber-500/20 to-amber-600/10` (amber tones)
- Both appear similar in color

### New Enterprise Styling (Platinum/Silver)

Change Enterprise to a distinctive platinum/silver/cyan theme:

```typescript
// Pricing.tsx - Updated color maps
const tierAccentColors: Record<SubscriptionTier, string> = {
  // ... other tiers unchanged
  enterprise: 'from-slate-400/20 to-cyan-500/10',  // Platinum/Cyan gradient
};

const tierGlowColors: Record<SubscriptionTier, string> = {
  // ... other tiers unchanged
  enterprise: 'group-hover:shadow-[0_0_60px_-10px_rgba(148,163,184,0.4)]',  // Slate glow
};

const tierCheckColors: Record<SubscriptionTier, string> = {
  // ... other tiers unchanged
  enterprise: 'bg-cyan-500',  // Cyan checkmarks
};

const tierButtonStyles: Record<SubscriptionTier, string> = {
  // ... other tiers unchanged
  enterprise: 'bg-gradient-to-r from-slate-400 to-cyan-500 hover:from-slate-500 hover:to-cyan-600 text-white font-semibold',
};
```

Also update the icon background in the card:
```typescript
tier === 'enterprise' && 'bg-cyan-500/10'
```

And the border styling:
```typescript
isEnterprise && 'border-cyan-400/30 dark:border-cyan-400/20'
```

---

## 4. Remove "Dedicated account manager" from Enterprise

### Current Enterprise Features
```typescript
features: ['Custom credit allocation', 'Tailored AI solutions', 'Dedicated account manager', '24/7 priority support']
```

### Updated Enterprise Features
```typescript
features: ['Custom credit allocation', 'Tailored AI solutions', '24/7 priority support']
```

### Also Update FAQ
Update the Enterprise FAQ answer to remove mention of dedicated account manager:
```typescript
{
  question: 'What is included in Enterprise?',
  answer: 'Enterprise plans include custom credit limits, tailored AI solutions, and 24/7 priority support. Contact our sales team to discuss your needs.'
}
```

---

## 5. Performance Optimization

The page is laggy due to heavy framer-motion animations. Here are the optimizations:

### A. Remove Infinite Background Animations

The three animated background blobs use `repeat: Infinity` which causes continuous re-renders and GPU strain.

**Solution**: Change to static positioning or single-run animations:

```typescript
// Before: Infinite animations
<motion.div 
  animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
/>

// After: Static or reduced animation
<div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
```

### B. Reduce Feature List Animations

Each feature item has staggered animations which cause layout calculations:

```typescript
// Before: Individual item animations
<motion.li 
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: index * 0.1 + i * 0.05 + 0.5 }}
>

// After: Remove individual item animations, keep card-level only
<li className="flex items-start gap-2.5">
```

### C. Simplify Card Hover Effects

Remove `hover:scale-[1.02]` which triggers expensive layout recalculations:

```typescript
// Remove from card classes
'hover:scale-[1.02]'  // Remove this
```

### D. Add CSS Containment

Add `contain: content` to cards for rendering isolation:

```typescript
// Add to card wrapper
style={{ contain: 'content' }}
```

### E. Use `will-change` Sparingly

Remove or minimize `will-change` properties that consume GPU memory.

---

## Files Summary

| File | Changes |
|------|---------|
| `src/contexts/SubscriptionContext.tsx` | Update engineering limits and features for all tiers, remove "Dedicated account manager" from Enterprise |
| `src/constants/tierLimits.ts` | Sync engineering limits (1, 10, 50, 100) |
| `src/pages/Pricing.tsx` | New Enterprise colors (platinum/cyan), remove background infinite animations, reduce feature animations, update FAQ |
| `supabase/functions/create-checkout/index.ts` | Add `payment_method_types: ['card']` for Apple Pay |
| `supabase/functions/check-subscription/index.ts` | Update TIER_LIMITS engineering values |

---

## Visual Change Summary

### Enterprise Card (New Look)
- **Gradient**: Platinum/Cyan (`from-slate-400/20 to-cyan-500/10`)
- **Glow**: Slate gray (`rgba(148,163,184,0.4)`)
- **Checkmarks**: Cyan (`bg-cyan-500`)
- **Button**: Slate-to-cyan gradient with white text
- **Border**: Cyan accent (`border-cyan-400/30`)

### Performance Improvements
- Remove 3 infinite background animations
- Remove ~25 individual feature item animations (5 tiers × 4-5 features)
- Remove hover scale transforms on cards
- Add CSS containment for layout isolation

---

## Technical Notes

### Apple Pay Requirements
- Stripe automatically displays Apple Pay when:
  1. User is on Safari (iOS/macOS)
  2. User has Apple Pay configured on their device
  3. Session is over HTTPS (production)
- No domain verification needed for Stripe Checkout (only for Stripe Elements)
- Test with real Apple Pay in Stripe test mode on a real Apple device

### Backend Sync
Frontend and backend TIER_LIMITS must match:
```typescript
// check-subscription/index.ts
const TIER_LIMITS = {
  free: { monthlyCredits: 5, monthlyEngineering: 1, isDaily: true },
  starter: { monthlyCredits: 500, monthlyEngineering: 10 },
  pro: { monthlyCredits: 1000, monthlyEngineering: 50 },
  business: { monthlyCredits: 3000, monthlyEngineering: 100 },
};
```


# Platform Updates: Enterprise Tier, Tutorial & Services Refinement

## Summary

This plan covers three main updates:
1. **Enterprise Tier**: Add a new "Contact Sales" tier that submits to the existing `contact_messages` table (viewable in admin)
2. **Services Clarification**: Update what AYN can do vs what requires contacting the AYN team
3. **Identity Refinement**: AYN only explains the "eye" meaning when asked

---

## 1. Enterprise Tier Implementation

### New Tier Configuration

The Enterprise card will NOT have a Stripe integration - it submits a contact request to the `contact_messages` table with a special identifier.

| Tier | Price | Button | Action |
|------|-------|--------|--------|
| Free | $0 | Get Started | Current behavior |
| Starter | $9 | Upgrade | Stripe checkout |
| Pro | $29 | Upgrade | Stripe checkout |
| Business | $79 | Upgrade | Stripe checkout |
| **Enterprise** | Contact Us | Contact Sales | Opens modal, submits to `contact_messages` |

### Enterprise Features (Updated - No "Custom integrations")

```typescript
enterprise: {
  name: 'Enterprise',
  price: -1, // -1 indicates "Contact Us"
  priceId: null,
  productId: null,
  limits: { monthlyCredits: -1, monthlyEngineering: -1 },
  features: [
    'Custom credit allocation',
    'Tailored AI solutions',
    'Dedicated account manager',
    '24/7 priority support'
  ],
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/SubscriptionContext.tsx` | Add Enterprise tier to `SUBSCRIPTION_TIERS` |
| `src/pages/Pricing.tsx` | Add Enterprise card with contact modal, update grid to 5 columns |

### Enterprise Contact Modal

When user clicks "Contact Sales", open a modal with:
- Company Name (required)
- Contact Email (required)  
- Message/Requirements (optional)

On submit, insert into `contact_messages`:
```typescript
await supabase.from('contact_messages').insert({
  name: companyName,
  email: email,
  message: `[ENTERPRISE INQUIRY]\n\n${requirements || 'User requested Enterprise pricing'}`
});
```

The prefix `[ENTERPRISE INQUIRY]` allows easy filtering in admin support.

---

## 2. Admin Contact Messages View

Currently, `contact_messages` are NOT displayed in the admin panel. I need to create a simple viewer or add them to an existing tab.

### Option: Add to Support Management

Add a new tab/section in `SupportManagement.tsx` to show contact messages, OR create a separate component. The simplest approach is to add a "Contact Messages" section to the existing Support tab.

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/SupportManagement.tsx` | Add toggle between "Tickets" and "Contact Messages" views |

### Implementation

Add a simple toggle at the top:
```text
[Tickets] [Contact Messages]
```

When "Contact Messages" is selected, fetch from `contact_messages` table and display similar card layout.

---

## 3. Pricing Page Updates

### Updated Tier Features

```typescript
// SubscriptionContext.tsx updates
free: {
  features: ['5 credits/day', '10 engineering calcs', 'Basic support'],
},
starter: {
  limits: { monthlyCredits: 500, monthlyEngineering: 50 },
  features: ['500 credits/month', '50 engineering calcs', 'PDF & Excel generation', 'Email support'],
},
pro: {
  features: ['1,000 credits/month', '200 engineering calcs', 'PDF & Excel generation', 'Priority support'],
},
business: {
  limits: { monthlyCredits: 3000, monthlyEngineering: 500 },
  features: ['3,000 credits/month', '500 engineering calcs', 'PDF & Excel generation', 'Priority support'],
  // REMOVED: 'Team features', 'Unlimited engineering'
},
```

### Pricing Grid Layout

Change from 4-column to 5-column responsive grid:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
```

### Enterprise Card Styling

- Distinct gradient: Gold/platinum styling (`from-gradient-to-br from-amber-400/20 to-yellow-600/10`)
- "Contact Us" instead of price
- Tagline: "Tailored for your business"

---

## 4. Updated FAQ Items

```typescript
const faqItems = [
  {
    question: 'What are credits?',
    answer: 'Credits are used for AI interactions. Free users get 5 credits per day (resets daily). Paid users receive their full monthly allowance upfront.'
  },
  {
    question: 'What is PDF & Excel generation?',
    answer: 'Paid users can ask AYN to generate professional documents. PDF generation costs 30 credits and Excel costs 25 credits.'
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your billing cycle.'
  },
  {
    question: 'What happens if I run out of credits?',
    answer: 'Free users wait until the next day for credits to reset. Paid users need to wait until their monthly reset or upgrade to a higher plan.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Our Free tier gives you 5 credits per day to try AYN - no credit card required.'
  },
  {
    question: 'What is your refund policy?',
    answer: 'All payments are final and non-refundable. You can cancel anytime and keep access until the end of your billing period.'
  },
  {
    question: 'What is included in Enterprise?',
    answer: 'Enterprise plans include custom credit limits, dedicated account manager, tailored AI solutions, and 24/7 priority support. Contact our sales team to discuss your needs.'
  }
];
```

---

## 5. Tutorial Updates

### Updated TUTORIAL_STEPS

| Step | Title | Description |
|------|-------|-------------|
| meet-ayn | Meet AYN | "AYN is your intelligent AI companion. The eye responds emotionally to your conversations and helps with daily tasks, documents, and engineering calculations." |
| emotions | Emotional Intelligence | Full list of 11 emotions with colors (Calm=Blue, Comfort=Rose, Supportive=Beige, Happy=Gold, Excited=Coral, Thinking=Indigo, Curious=Magenta, Sad=Lavender, Frustrated=Orange, Mad=Crimson, Bored=Slate) |
| empathy | Empathetic Responses | Keep current |
| chat | Start a Conversation | Keep current |
| **documents** | **Generate Documents** | **NEW**: "Paid users can generate professional PDFs (30 credits) and Excel files (25 credits). Just ask AYN to create a document for you." |
| files | Upload & Analyze Files | Keep current |
| credits | Your Credits | "Free users get 5 credits per day (resets daily). Paid users receive their monthly allowance upfront." |
| engineering | Engineering Tools | "Access 7 professional calculators: Beam, Column, Slab, Foundation, Retaining Wall, AI Grading, and Parking Designer. All include 3D visualization and AI analysis." |
| navigation | Your Sidebar | Keep current |
| profile | Your Profile | Keep current |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/tutorial.types.ts` | Update TUTORIAL_STEPS with new content, add documents step |

---

## 6. AYN Identity Update (System Prompt)

### Current Behavior
AYN may explain "AYN means eye in Arabic" proactively.

### New Behavior
AYN only explains the meaning when directly asked. The system prompt should be updated to:

```
You are AYN, an AI assistant by the AYN Team.
- Only explain that "AYN" means "eye" in Arabic if the user asks about your name's meaning.
- Do not proactively mention the eye metaphor or meaning.
```

### Services AYN Can Provide Directly
- Chat assistance (general questions, analysis)
- Engineering tools (7 calculators)
- PDF generation (paid users, 30 credits)
- Excel generation (paid users, 25 credits)
- File analysis

### Services Requiring Contact with AYN Team
- AI Employees
- Custom AI Agents  
- Process Automation
- Content Creator Sites
- Smart Ticketing System

When users ask about these services, AYN should explain them but direct users to contact the AYN team to discuss and implement.

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ayn-unified/index.ts` | Update system prompt to not proactively explain "eye" meaning |

---

## Files Summary

| File | Type | Changes |
|------|------|---------|
| `src/contexts/SubscriptionContext.tsx` | Edit | Add Enterprise tier, update limits for all tiers |
| `src/pages/Pricing.tsx` | Edit | Add Enterprise card with contact modal, 5-column grid, updated FAQ |
| `src/types/tutorial.types.ts` | Edit | Update tutorial steps with new content |
| `src/components/admin/SupportManagement.tsx` | Edit | Add toggle for "Contact Messages" view |
| `supabase/functions/ayn-unified/index.ts` | Edit | Update system prompt regarding name explanation |
| `supabase/functions/check-subscription/index.ts` | Edit | Sync tier limits with frontend |

---

## Technical Notes

### Enterprise Contact Flow
```text
User clicks "Contact Sales"
    ↓
Modal opens with form (Company, Email, Message)
    ↓
Submit inserts to contact_messages with "[ENTERPRISE INQUIRY]" prefix
    ↓
Toast: "Thank you! Our team will contact you within 24 hours"
    ↓
Admin sees it in Support → Contact Messages tab
```

### Tier Limits Sync
Frontend (`SubscriptionContext.tsx`) and backend (`check-subscription/index.ts`) must have matching values:
- Free: 5 credits/day (special handling for daily reset)
- Starter: 500/month, 50 engineering
- Pro: 1000/month, 200 engineering
- Business: 3000/month, 500 engineering

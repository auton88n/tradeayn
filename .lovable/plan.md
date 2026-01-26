

# Tutorial Content Updates, Pricing Card Fixes & Color Swap

## Summary

This plan addresses three main issues:

1. **Tutorial Updates** - Shorten descriptions and update illustrations to match current UI
2. **Pro Card Badge Fix** - Fix "Most Popular" badge being clipped at the top  
3. **Pricing Color Swap** - Business becomes Emerald/Green, Enterprise gets Amber/Gold colors

---

## 1. Tutorial Description Updates

Shorten all tutorial step descriptions to be more concise:

| Step | Current Description | New (Shorter) Description |
|------|---------------------|---------------------------|
| **Meet AYN** | Long explanation about emotional response and tasks | "Your intelligent AI companion for conversations, documents, and engineering tools." |
| **Emotional Intelligence** | Full 11-emotion bulleted list | "AYN shows 11 emotions through eye color — from Calm (blue) to Curious (magenta)." |
| **Empathetic Responses** | Detailed explanation of ember particles | "When you share emotions, AYN responds with warmth and genuine care." |
| **Start a Conversation** | Explanation of modes | "Type your message below. Use the mode selector for specialized help." |
| **Generate Documents** | Mentions credit costs | "AYN creates stunning PDFs and Excel files. Just ask!" |
| **Upload & Analyze Files** | Detailed capability list | "Upload documents or images using the + button for analysis." |
| **Your Credits** | Explanation of reset logic | "Track usage in the sidebar. Free: 5/day, Paid: monthly allowance." |
| **Engineering Tools** | Full 7-tool bulleted list | "Access 7 professional calculators with 3D visualization and AI analysis." |
| **Your Sidebar** | Explanation of pinning/searching | "Access chat history, start new conversations, and search past chats." |
| **Your Profile** | List of settings | "Click your avatar to access settings, subscriptions, or sign out." |

---

## 2. Tutorial Illustration Updates

The current illustrations need updates to better match the actual UI design. Here are the specific changes:

### A. ChatIllustration (chat step)
Update to match current ChatInput design:
- Add the "Eng" and "New" buttons row below the input
- Update placeholder text style
- Match current rounded corners and padding

### B. NavigationIllustration (navigation step)
Update to match current Sidebar design:
- Add "Eng" button alongside "New Chat" 
- Update the header to show "AYN AI" with status dot
- Add proper search bar styling

### C. CreditsIllustration (credits step)
Update to match current CreditUpgradeCard:
- Show the circular progress indicator style
- Update layout to match compact card design

### D. ProfileIllustration (profile step)
Update to match current profile dropdown:
- Add "Upgrade Plan" option with purple gradient
- Add "Tutorial" and "Support" options
- Match current styling with icon backgrounds

### E. EngineeringIllustration (engineering step)
Update to show all 7 tools:
- Add more calculator options (Slab, Retaining Wall, Grading, Parking)
- Update styling to match current design

---

## 3. Pro Card Badge Fix

### Problem
The "Most Popular" badge on the Pro card is clipped at the top due to `contain: 'content'` CSS property being applied to all cards.

### Solution
Remove `contain: 'content'` from the Pro card so the badge can overflow properly:

```tsx
// Current (line 233-234):
style={{ 
  animationDelay: `${index * 100}ms`,
  contain: 'content'
}}

// Updated - Conditionally remove contain for popular card:
style={{ 
  animationDelay: `${index * 100}ms`,
  contain: isPopular ? undefined : 'content'
}}
```

Also add `overflow-visible` to the card wrapper:

```tsx
className={cn(
  "relative group animate-fade-in overflow-visible",
  isPopular && "mt-6"
)}
```

---

## 4. Pricing Card Color Swap

### Current vs New Colors

| Tier | Current | New |
|------|---------|-----|
| **Business** | Amber/Orange | **Emerald/Green** |
| **Enterprise** | Slate/Silver | **Amber/Orange** (current Business) |

### Specific Color Changes

```typescript
// tierAccentColors
business: 'from-emerald-500/20 to-green-600/10',   // Was amber
enterprise: 'from-amber-400/20 to-orange-500/10',  // Was slate

// tierGlowColors  
business: 'hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',   // Emerald glow
enterprise: 'hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.4)]', // Amber glow

// tierCheckColors
business: 'bg-emerald-500',   // Was amber
enterprise: 'bg-amber-500',   // Was slate

// tierButtonStyles
business: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white',
enterprise: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white',

// Icon backgrounds
tier === 'business' && 'bg-emerald-500/10',
tier === 'enterprise' && 'bg-amber-400/10',

// Border styling
isBusiness && 'border-emerald-400/30 dark:border-emerald-500/20'
// Remove special enterprise border, or add amber variant
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/tutorial.types.ts` | Shorten all tutorial step descriptions |
| `src/components/tutorial/TutorialIllustrations.tsx` | Update ChatIllustration, NavigationIllustration, CreditsIllustration, ProfileIllustration, EngineeringIllustration to match current UI |
| `src/pages/Pricing.tsx` | Fix Pro card overflow issue, swap Business/Enterprise colors |

---

## Visual Summary

### Tutorial Changes
- All 10 steps get shorter, punchier descriptions
- "Generate Documents" now says "AYN creates stunning PDFs and Excel files. Just ask!" (no credit costs)
- Illustrations updated to match current sidebar, chat input, and profile menu designs

### Pricing Page After Changes

| Tier | Color Theme |
|------|-------------|
| Free | Slate (unchanged) |
| Starter | Sky Blue (unchanged) |
| Pro | Violet/Purple (unchanged, badge fixed) |
| **Business** | **Emerald Green** (was amber) |
| **Enterprise** | **Amber/Gold** (was slate) |

### Pro Card Badge
- "Most Popular" badge will display fully without clipping
- Achieved by removing `contain: content` from Pro card specifically


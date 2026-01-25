
# Fix Password Reset UI and Beta Feedback Modal Arabic Text Issues

## Problem Summary

Based on your screenshots, there are two distinct issues:

### Issue 1: Password Reset Page - Eye Icon Too Prominent
The password visibility toggle icon (Eye/EyeOff) inside the password input field is currently too large and distracting. Looking at the first screenshot, the eye icon appears oversized relative to the input field.

### Issue 2: Beta Feedback Modal - Arabic Text Direction Broken
The second screenshot shows the Beta Feedback survey with text direction issues:
- Question marks appearing at the beginning: "?What could be improved" instead of "What could be improved?"
- Ellipsis at wrong position: "...Share your suggestions" instead of "Share your suggestions..."
- This happens because the modal content is inheriting RTL direction from Arabic language settings, but the content is still in English

## Root Cause Analysis

### Password Reset Eye Icon
In `src/pages/ResetPassword.tsx` lines 365-378, the Eye icon is rendered with `h-4 w-4` size inside a button that has padding `px-3 py-2`. While the icon itself is reasonably sized, the button container and positioning could be improved for better visual balance.

### Arabic Text Direction
The `BetaFeedbackModal.tsx` component:
1. Has hardcoded English strings (not using the `t()` translation function)
2. When the page is in RTL mode (Arabic), the English text gets reversed because the container inherits RTL direction
3. Labels like "What could be improved?" and placeholders like "Share your suggestions..." need:
   - Arabic translations added to `LanguageContext.tsx`
   - Use of `t()` function for all user-facing strings
   - Explicit `dir="ltr"` on English-only content OR proper Arabic translations

## Implementation Plan

### Part 1: Fix Password Reset Eye Icon

**File: `src/pages/ResetPassword.tsx`**

1. Reduce the eye icon size from `h-4 w-4` to `h-3.5 w-3.5` for better proportion
2. Adjust button styling to be less prominent:
   - Remove hover background effect to make it more subtle
   - Add `opacity-60 hover:opacity-100` for a softer appearance
3. Ensure the icon is properly aligned within the input field

### Part 2: Add Arabic Translations for Beta Feedback Modal

**File: `src/contexts/LanguageContext.tsx`**

Add new translation keys for all Beta Feedback Modal strings:

| English Key | English Value | Arabic Value |
|------------|---------------|--------------|
| `beta.title` | Share Your Beta Experience | شاركنا تجربتك التجريبية |
| `beta.earnCredits` | Complete this survey to earn | أكمل هذا الاستبيان لتربح |
| `beta.bonusCredits` | bonus credits | رصيد إضافي |
| `beta.overallExperience` | Overall Experience | التجربة العامة |
| `beta.featuresLove` | What features do you love? (select all that apply) | ما الميزات التي تحبها؟ (اختر كل ما ينطبق) |
| `beta.whatImproved` | What could be improved? | ما الذي يمكن تحسينه؟ |
| `beta.shareSuggestions` | Share your suggestions... | شاركنا اقتراحاتك... |
| `beta.anyBugs` | Any bugs encountered? | هل واجهت أي أخطاء؟ |
| `beta.describeBugs` | Describe any issues you've faced... | صف أي مشاكل واجهتها... |
| `beta.wouldRecommend` | Would you recommend AYN to others? | هل تنصح الآخرين بـ AYN؟ |
| `beta.yes` | Yes | نعم |
| `beta.notYet` | Not Yet | ليس بعد |
| `beta.maybeLater` | Maybe Later | ربما لاحقاً |
| `beta.submitEarn` | Submit & Earn Credits | أرسل واحصل على رصيد |
| `beta.thankYou` | Thank You! | شكراً لك! |
| `beta.feedbackHelps` | Your feedback helps us improve AYN | ملاحظاتك تساعدنا في تحسين AYN |
| `beta.creditsAdded` | Credits Added! | تمت إضافة الرصيد! |
| `beta.continueUsing` | Continue Using AYN | استمر في استخدام AYN |
| `beta.provideRating` | Please provide a rating | يرجى تقديم تقييم |

Also add translations for feature labels:
| English | Arabic |
|---------|--------|
| AI Chat | محادثة الذكاء الاصطناعي |
| Engineering Calculators | حاسبات الهندسة |
| Support System | نظام الدعم |
| Design Analysis | تحليل التصميم |
| File Upload | رفع الملفات |
| AI Modes | أوضاع الذكاء الاصطناعي |

### Part 3: Update BetaFeedbackModal to Use Translations

**File: `src/components/dashboard/BetaFeedbackModal.tsx`**

1. Update FEATURES array to use translation keys:
```typescript
const FEATURES = [
  { id: 'ai_chat', labelKey: 'beta.feature.aiChat' },
  { id: 'engineering', labelKey: 'beta.feature.engineering' },
  // ... etc
];
```

2. Replace all hardcoded strings with `t()` calls:
   - Line 162: `t('beta.title')` instead of "Share Your Beta Experience"
   - Line 165: `t('beta.earnCredits')` instead of "Complete this survey to earn"
   - Line 176: `t('beta.overallExperience')` instead of "Overall Experience *"
   - Line 202: `t('beta.featuresLove')` instead of "What features do you love?"
   - Line 226: `t('beta.whatImproved')` instead of "What could be improved?"
   - Line 231: `t('beta.shareSuggestions')` instead of "Share your suggestions..."
   - Line 239: `t('beta.anyBugs')` instead of "Any bugs encountered?"
   - Line 244: `t('beta.describeBugs')` instead of "Describe any issues you've faced..."
   - Line 252: `t('beta.wouldRecommend')` instead of "Would you recommend AYN?"
   - Line 264: `t('beta.yes')` instead of "Yes"
   - Line 277: `t('beta.notYet')` instead of "Not Yet"
   - Line 283: `t('beta.maybeLater')` instead of "Maybe Later"
   - Line 296: `t('beta.submitEarn')` instead of "Submit & Earn Credits"
   - Success screen strings similarly updated

3. Update feature label rendering:
```tsx
<span className="text-sm">{t(feature.labelKey)}</span>
```

## Files to be Modified

| File | Changes |
|------|---------|
| `src/pages/ResetPassword.tsx` | Reduce eye icon size and improve styling |
| `src/contexts/LanguageContext.tsx` | Add Arabic and French translations for beta feedback strings |
| `src/components/dashboard/BetaFeedbackModal.tsx` | Replace hardcoded strings with t() translation calls |

## Technical Notes

- The dialog component already has RTL-aware close button positioning via `[[dir=rtl]_&]:left-4`
- When proper translations are used, the text direction will automatically be correct based on the language
- Arabic question marks (؟) should be used in Arabic translations, not English question marks (?)
- French translations should also be added for completeness

## Expected Result

After these changes:
1. The password toggle eye icon will be smaller and less visually intrusive
2. The Beta Feedback modal will display properly in Arabic with correct text direction
3. Question marks and ellipsis will appear in the correct positions for each language
4. The same fixes will apply to French users as well

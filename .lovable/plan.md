

# Unified AYN-Branded Error Handling System

## Overview
Create a centralized, user-friendly error messaging system with consistent AYN branding across all error scenarios. No mentions of "Lovable", "Supabase", or any third-party technologies in user-facing messages.

---

## Problem Analysis

After reviewing the codebase, I found **67+ files** with hardcoded error messages that:
1. Expose technical details (e.g., "API error: 500", "Database error")
2. Sometimes mention third-party services (Supabase in admin strings)
3. Use inconsistent language and tone across components
4. Lack actionable guidance for users

---

## Solution Architecture

### 1. Create Central Error Message Library
**New File:** `src/lib/errorMessages.ts`

A single source of truth for all error messages, organized by category:

```text
Categories:
├── Auth (login, signup, password reset, session)
├── Network (offline, timeout, rate limit)
├── Upload (file type, size, processing)
├── AI/Chat (response errors, limits, generation)
├── Document (PDF/Excel generation, download)
├── Settings (profile, preferences, security)
├── Engineering (calculators, design tools)
├── Support (tickets, feedback)
└── Generic (fallbacks for unknown errors)
```

Each error includes:
- **title**: Short, clear heading
- **description**: User-friendly explanation with actionable guidance
- **icon** (optional): Suggested icon for visual feedback
- **actionLabel** (optional): CTA button text (e.g., "Try Again", "Contact Support")

### 2. Error Code Mapping
Map technical error codes to user-friendly messages:

| Technical Error | AYN Error Code | User Message |
|-----------------|----------------|--------------|
| 401 Unauthorized | `AUTH_SESSION_EXPIRED` | "Your session has ended. Please sign in again." |
| 403 Forbidden | `AUTH_ACCESS_DENIED` | "You don't have access to this feature." |
| 429 Rate Limit | `RATE_LIMIT_EXCEEDED` | "You're moving too fast! Please wait a moment." |
| 500 Server Error | `SERVICE_UNAVAILABLE` | "AYN is taking a short break. Please try again in a few moments." |
| Network Error | `NETWORK_OFFLINE` | "Looks like you're offline. Check your connection and try again." |
| Timeout | `REQUEST_TIMEOUT` | "This is taking longer than expected. Please try again." |

### 3. Humanized Error Personas
Errors maintain AYN's friendly, helpful personality:

```text
Instead of: "Failed to upload file"
Say: "Hmm, I couldn't receive your file. Let's try that again?"

Instead of: "Database error"
Say: "I'm having a moment here. Give me a second and try again!"

Instead of: "Authentication failed"
Say: "I didn't recognize those credentials. Double-check and try again?"
```

---

## Files to Modify

### New Files

#### `src/lib/errorMessages.ts`
Central error message definitions with:
- Error code constants
- Message objects with title/description/action
- Helper function: `getErrorMessage(code: string, context?: object)`
- Fallback messages for unknown errors

### Files to Update

#### 1. `src/contexts/LanguageContext.tsx`
**Add comprehensive error translation keys:**

```text
New keys to add:
- error.networkOffline / error.networkOfflineDesc
- error.sessionExpired / error.sessionExpiredDesc
- error.rateLimitChat / error.rateLimitChatDesc
- error.rateLimitAuth / error.rateLimitAuthDesc
- error.uploadFailed / error.uploadFailedDesc
- error.uploadTooLarge / error.uploadTooLargeDesc
- error.uploadInvalidType / error.uploadInvalidTypeDesc
- error.documentGenerationFailed / error.documentGenerationFailedDesc
- error.aiUnavailable / error.aiUnavailableDesc
- error.profileUpdateFailed / error.profileUpdateFailedDesc
- error.ticketCreationFailed / error.ticketCreationFailedDesc
- error.calculationFailed / error.calculationFailedDesc
- error.connectionLost / error.connectionLostDesc
- error.tryAgainLater / error.tryAgainLaterDesc
- error.contactSupport / error.contactSupportDesc
- error.invalidCredentials / error.invalidCredentialsDesc
- error.accountLocked / error.accountLockedDesc
- error.permissionDenied / error.permissionDeniedDesc
```

**Remove/replace Supabase mentions:**
- Line 421: `'admin.supabaseHosted'` → `'admin.cloudHosted': 'Cloud hosted'`
- Line 1004 (Arabic): Same change

#### 2. `src/hooks/useMessages.ts`
Replace hardcoded error messages with centralized versions:

| Line | Current | New |
|------|---------|-----|
| 152-154 | "Session Error" / "Please sign in again" | `t('error.sessionExpired')` / `t('error.sessionExpiredDesc')` |
| 163-167 | "Limit reached" / "Start a new chat" | `t('error.chatLimitReached')` / `t('error.chatLimitReachedDesc')` |
| 190-194 | "Usage Error" / "Unable to verify usage limits" | `t('error.usageVerification')` / `t('error.usageVerificationDesc')` |
| 213-217 | "System Error" / "Unable to process your request" | Already using `t()` ✓ |
| 329-331 | Daily limit message | Use translation key |
| 513-517 | "Save Warning" message | `t('error.saveWarning')` / `t('error.saveWarningDesc')` |

#### 3. `src/hooks/useFileUpload.ts`
Update file upload error messages:

| Line | Current | New |
|------|---------|-----|
| 48-52 | "Invalid File Type" | `t('error.uploadInvalidType')` |
| 57-61 | "File Too Large" | `t('error.uploadTooLarge')` with size info |
| 151-155 | "Upload Failed" | `t('error.uploadFailed')` |
| 255-260 | "Folders Not Supported" | `t('error.foldersNotSupported')` |
| 267-272 | "Multiple Files" | `t('error.multipleFilesNotSupported')` |

#### 4. `src/components/auth/AuthModal.tsx`
Improve authentication error handling:

| Line | Current | New |
|------|---------|-----|
| 125-128 | Shows raw `error.message` | Parse and show user-friendly message |
| 216-218 | Shows raw `error.message` | `t('error.invalidCredentials')` for login failures |
| 276-279 | Shows raw `error.message` | `t('error.registrationFailed')` |

**Add error parsing helper:**
```typescript
const parseAuthError = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('invalid login')) return t('error.invalidCredentials');
  if (message.includes('email not confirmed')) return t('error.emailNotVerified');
  if (message.includes('user already registered')) return t('error.emailAlreadyExists');
  if (message.includes('password')) return t('error.weakPassword');
  return t('error.authGeneric');
};
```

#### 5. `src/components/ErrorBoundary.tsx`
Improve the error boundary UI:

**Current:** "Something went wrong" with technical error message exposed
**New:**
- Friendly AYN-branded message
- Hide technical details (only show in dev mode)
- Add AYN brain icon instead of warning triangle
- Improved styling with gradient background

```text
Title: "Oops! AYN hit a snag"
Description: "Something unexpected happened, but don't worry - we've got this. 
             Let's get you back on track."
Button: "Let's Try Again"
```

#### 6. `src/components/settings/AccountPreferences.tsx`
Line 159-162: Replace "Failed to update profile" with `t('error.profileUpdateFailed')`

#### 7. `src/components/settings/SessionManagement.tsx`
Line 56-59: Replace "Failed to send password reset email" with `t('error.passwordResetFailed')`

#### 8. `src/components/support/TicketForm.tsx`
Line 118: Replace "Failed to create ticket" with `t('error.ticketCreationFailed')`

#### 9. `src/components/admin/GoogleAnalytics.tsx`
Lines 67-68: Replace "Failed to fetch Google Analytics data" with "Unable to load analytics. Please try again."

#### 10. `src/components/admin/SupportManagement.tsx`
Lines 95, 192: Replace "Failed to..." messages with branded versions

#### 11. `src/components/admin/CreditGiftHistory.tsx`
Line 66: Replace "Failed to load credit gift history" with branded version

#### 12. `src/components/engineering/EngineeringPortfolio.tsx`
Lines 89, 114: Replace "Failed to update/remove" with branded versions

#### 13. `src/components/dashboard/DashboardContainer.tsx`
Line 151: Replace "Failed to copy message" with `t('error.copyFailed')`

#### 14. `src/pages/ResetPassword.tsx`
Line 166: Replace "Failed to reset password" with `t('error.passwordResetFailed')`

---

## Translation Keys Structure

Add to all three languages (en/ar/fr):

```typescript
// Authentication Errors
'error.invalidCredentials': 'Invalid email or password. Please check and try again.',
'error.invalidCredentialsDesc': 'Make sure your email is correct and try re-entering your password.',
'error.emailNotVerified': 'Please verify your email first',
'error.emailNotVerifiedDesc': 'Check your inbox for a verification link. We can resend it if needed.',
'error.sessionExpired': 'Session Ended',
'error.sessionExpiredDesc': 'Your session has expired. Please sign in again to continue.',
'error.accountLocked': 'Account Temporarily Locked',
'error.accountLockedDesc': 'Too many failed attempts. Please try again in a few minutes.',

// Network & Connection Errors
'error.networkOffline': 'You\'re Offline',
'error.networkOfflineDesc': 'Check your internet connection and try again.',
'error.connectionLost': 'Connection Lost',
'error.connectionLostDesc': 'We lost connection to AYN. Reconnecting...',
'error.timeout': 'Request Timed Out',
'error.timeoutDesc': 'This is taking longer than usual. Please try again.',

// Rate Limit Errors
'error.rateLimitChat': 'Slow Down!',
'error.rateLimitChatDesc': 'You\'re sending messages too quickly. Wait a moment and try again.',
'error.rateLimitAuth': 'Too Many Attempts',
'error.rateLimitAuthDesc': 'Please wait {time} before trying again.',

// File Upload Errors
'error.uploadFailed': 'Upload Failed',
'error.uploadFailedDesc': 'We couldn\'t upload your file. Please try again.',
'error.uploadTooLarge': 'File Too Large',
'error.uploadTooLargeDesc': 'Please choose a file smaller than 10MB.',
'error.uploadInvalidType': 'Unsupported File Type',
'error.uploadInvalidTypeDesc': 'We support PDF, Excel, images, and text files.',
'error.foldersNotSupported': 'Folders Not Supported',
'error.foldersNotSupportedDesc': 'Please upload individual files instead of folders.',

// AI & Chat Errors
'error.aiUnavailable': 'AYN is Resting',
'error.aiUnavailableDesc': 'I\'m taking a quick break. Please try again in a moment.',
'error.chatLimitReached': 'Chat Limit Reached',
'error.chatLimitReachedDesc': 'This conversation has reached its limit. Start a new chat to continue.',
'error.usageVerification': 'Usage Check Failed',
'error.usageVerificationDesc': 'We couldn\'t verify your usage. Please try again.',

// Document Errors
'error.documentGenerationFailed': 'Document Creation Failed',
'error.documentGenerationFailedDesc': 'We couldn\'t create your document. Please try again.',
'error.downloadFailed': 'Download Failed',
'error.downloadFailedDesc': 'The download didn\'t complete. Please try again.',

// Settings & Profile Errors
'error.profileUpdateFailed': 'Couldn\'t Update Profile',
'error.profileUpdateFailedDesc': 'Your changes weren\'t saved. Please try again.',
'error.passwordResetFailed': 'Reset Email Failed',
'error.passwordResetFailedDesc': 'We couldn\'t send the reset email. Please try again.',
'error.settingsSaveFailed': 'Settings Not Saved',
'error.settingsSaveFailedDesc': 'Your changes weren\'t saved. Please try again.',

// Support Errors
'error.ticketCreationFailed': 'Couldn\'t Create Ticket',
'error.ticketCreationFailedDesc': 'We couldn\'t submit your request. Please try again.',

// Engineering Errors
'error.calculationFailed': 'Calculation Error',
'error.calculationFailedDesc': 'Something went wrong with the calculation. Please check your inputs.',
'error.designSaveFailed': 'Couldn\'t Save Design',
'error.designSaveFailedDesc': 'Your design wasn\'t saved. Please try again.',

// Generic/Fallback Errors
'error.generic': 'Something Went Wrong',
'error.genericDesc': 'An unexpected error occurred. Please try again.',
'error.tryAgain': 'Try Again',
'error.contactSupport': 'Contact Support',
'error.copyFailed': 'Copy Failed',
'error.copyFailedDesc': 'Couldn\'t copy to clipboard. Please try manually.',
'error.saveWarning': 'Save Warning',
'error.saveWarningDesc': 'Your message may not have been saved. Refresh if issues persist.'
```

---

## Error Response Tone Guidelines

All error messages should follow these principles:

1. **Be Human**: Use contractions, casual language
   - ❌ "Unable to process your request"
   - ✅ "We couldn't handle that right now"

2. **Be Helpful**: Always provide next steps
   - ❌ "Error occurred"
   - ✅ "Something went wrong. Try refreshing the page."

3. **Be Reassuring**: Don't blame the user
   - ❌ "Invalid input"
   - ✅ "That didn't work - let's try a different approach"

4. **Be Brief**: Short title, slightly longer description
   - Title: 3-5 words
   - Description: 1-2 sentences max

5. **Match AYN's Personality**: Friendly, capable, slightly playful
   - ❌ "Server error 500"
   - ✅ "AYN is taking a quick break. Back in a moment!"

---

## Summary of Changes

| Category | Files | Key Changes |
|----------|-------|-------------|
| New | 1 | `errorMessages.ts` - central library |
| Translations | 1 | `LanguageContext.tsx` - 50+ new keys in 3 languages |
| Auth | 1 | `AuthModal.tsx` - parse & humanize errors |
| Chat | 1 | `useMessages.ts` - use translation keys |
| Upload | 1 | `useFileUpload.ts` - use translation keys |
| UI | 1 | `ErrorBoundary.tsx` - AYN-branded design |
| Settings | 2 | Profile, Sessions - use translation keys |
| Support | 1 | TicketForm - use translation keys |
| Admin | 3 | Analytics, Support, Credits - branded messages |
| Engineering | 1 | Portfolio - branded messages |
| Dashboard | 1 | Container - use translation keys |
| Reset | 1 | Password reset - use translation keys |

**Total: ~15 files modified, 1 new file created**


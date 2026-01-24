

# Fix All Remaining Hardcoded Error Messages

## Overview
Update 15+ files across the codebase to use the centralized AYN-branded error system from `errorMessages.ts`. This will ensure consistent, user-friendly messaging throughout the entire platform with no mentions of technical infrastructure.

---

## Files to Update

### 1. User Support Components

#### `src/components/support/UserTicketDetail.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 99 | `toast.info('You have a new reply from the support team')` | Keep as info, but use: `'You have a new reply!'` |
| 103 | `toast.error('Failed to load ticket')` | `t('error.dataLoadFailed')` |
| 138 | `toast.success('Message sent')` | Keep as success |
| 141 | `toast.error('Failed to send message')` | `t('error.ticketUpdateFailed')` |
| 159 | `toast.success('Ticket deleted')` | Keep as success |
| 163 | `toast.error('Failed to delete ticket')` | `t('error.ticketUpdateFailed')` |

#### `src/hooks/useUserSettings.ts`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 90-94 | `title: 'Error', description: 'Failed to load settings'` | `title: t('error.settingsSaveFailed'), description: t('error.settingsSaveFailedDesc')` |
| 136-139 | `title: 'Success', description: 'Settings saved successfully'` | Keep success messages |
| 142-145 | `title: 'Error', description: 'Failed to update settings'` | Use translation keys |
| 162-165 | `title: 'Success', description: 'Session revoked successfully'` | Keep |
| 168-171 | `title: 'Error', description: 'Failed to revoke session'` | `t('error.sessionRevokeFailed')` |
| 189-191 | `title: 'Success', description: 'All devices signed out successfully'` | Keep |
| 195-198 | `title: 'Error', description: 'Failed to sign out all devices'` | `t('error.signOutAllFailed')` |

### 2. Subscription & Avatar Hooks

#### `src/contexts/SubscriptionContext.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 125 | `toast.info('Free tier does not require checkout')` | Keep as info |
| 131 | `toast.error('Invalid tier selected')` | `t('error.invalidTierSelected')` |
| 147 | `toast.error('Failed to start checkout. Please try again.')` | `t('error.checkoutFailed')` |
| 162 | `toast.error('Failed to open subscription management. Please try again.')` | `t('error.portalFailed')` |

#### `src/hooks/useAvatarUpload.ts`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 20 | `'Please upload a valid image (JPG, PNG, or WebP)'` | `t('error.uploadInvalidTypeDesc')` |
| 25 | `'Image size must be less than 5MB'` | `t('error.uploadTooLargeDesc')` |
| 54 | `'You must be logged in to upload an avatar'` | `t('error.sessionExpiredDesc')` |
| 90 | `'Failed to upload avatar'` | `t('error.uploadFailed')` |
| 110 | `'An error occurred while uploading'` | `t('error.uploadFailed')` |
| 119 | `'You must be logged in'` | `t('error.sessionExpiredDesc')` |
| 148 | `'An error occurred'` | `t('error.generic')` |

### 3. Engineering Calculators

All 5 calculators have the same pattern - validation errors and calculation errors need translation:

#### `src/components/engineering/BeamCalculator.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 74 | `'Please enter a valid span length'` | `t('error.invalidInput')` with context |
| 78 | `'Please enter a valid dead load'` | `t('error.invalidInput')` |
| 82 | `'Please enter a valid live load'` | `t('error.invalidInput')` |
| 124 | `'Calculation failed. Please try again.'` | `t('error.calculationFailedDesc')` |

#### `src/components/engineering/FoundationCalculator.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 87 | `'Please enter a valid column load'` | `t('error.invalidInput')` |
| 91 | `'Please enter a valid bearing capacity'` | `t('error.invalidInput')` |
| 135 | `'Calculation failed. Please try again.'` | `t('error.calculationFailedDesc')` |

#### `src/components/engineering/ColumnCalculator.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 80 | `'Calculation failed. Please try again.'` | `t('error.calculationFailedDesc')` |

#### `src/components/engineering/SlabCalculator.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 83-97 | Multiple `'Please enter a valid...'` | `t('error.invalidInput')` |
| 146 | `'Calculation failed. Please try again.'` | `t('error.calculationFailedDesc')` |

#### `src/components/engineering/RetainingWallCalculator.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 115 | `'Please enter a valid wall height'` | `t('error.invalidInput')` |
| 119 | `'Please enter a valid base width'` | `t('error.invalidInput')` |
| 174 | `'Calculation failed. Please try again.'` | `t('error.calculationFailedDesc')` |

#### `src/components/engineering/ParkingDesigner.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 197-200 | `title: "Invalid Boundary", description: ...` | Use translation keys |
| Various | Export/generation errors | Use translation keys |

### 4. Admin Components

#### `src/components/admin/LLMManagement.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 109 | `toast.error('Failed to load LLM models')` | `toast.error(t('error.dataLoadFailed'))` |
| 135 | `toast.error('Failed to update model')` | `toast.error(t('error.settingsSaveFailed'))` |

#### `src/components/admin/RateLimitMonitoring.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 62 | `toast.error('Failed to load rate limit stats')` | `toast.error(t('error.dataLoadFailed'))` |
| 85 | `toast.error('Failed to unblock user')` | `toast.error(t('error.generic'))` |

#### `src/components/admin/UserAILimits.tsx`
| Line | Current Message | New Message |
|------|-----------------|-------------|
| 87 | `toast.error('Failed to load user limits')` | `toast.error(t('error.dataLoadFailed'))` |
| 130 | `toast.error('Failed to update limits')` | `toast.error(t('error.settingsSaveFailed'))` |
| 155-156 | `toast.error('Update may have failed - please refresh')` | `toast.error(t('error.settingsSaveFailed'))` |
| 172 | `toast.error('Failed to update - please try again')` | `toast.error(t('error.settingsSaveFailed'))` |

---

## New Translation Keys to Add

Add these to `src/contexts/LanguageContext.tsx` for all 3 languages:

```typescript
// New error keys
'error.invalidInput': 'Invalid Input',
'error.invalidInputDesc': 'Please check your values and try again.',
'error.checkoutFailed': 'Checkout Unavailable',
'error.checkoutFailedDesc': "We couldn't start checkout. Please try again.",
'error.portalFailed': 'Portal Unavailable', 
'error.portalFailedDesc': "We couldn't open subscription management. Please try again.",
'error.invalidTierSelected': 'Invalid Tier',
'error.invalidTierSelectedDesc': 'Please select a valid subscription tier.',
'error.sessionRevokeFailed': "Couldn't Revoke Session",
'error.sessionRevokeFailedDesc': 'The session revocation failed. Please try again.',
'error.signOutAllFailed': "Couldn't Sign Out All Devices",
'error.signOutAllFailedDesc': 'Please try again or contact support.',
'error.dataLoadFailed': "Couldn't Load Data",
'error.dataLoadFailedDesc': 'Unable to load the requested data. Please try again.',
'error.ticketLoadFailed': "Couldn't Load Ticket",
'error.ticketLoadFailedDesc': 'Unable to load ticket details. Please try again.',
'error.ticketMessageFailed': "Couldn't Send Message",
'error.ticketMessageFailedDesc': 'Your message wasn\'t sent. Please try again.',
'error.ticketDeleteFailed': "Couldn't Delete Ticket",
'error.ticketDeleteFailedDesc': 'The ticket wasn\'t deleted. Please try again.',
'error.exportFailed': 'Export Failed',
'error.exportFailedDesc': "We couldn't export your data. Please try again.",
'error.boundaryInvalid': 'Invalid Boundary',
'error.boundaryInvalidDesc': 'Please define at least 3 boundary points.',
```

---

## Update errorMessages.ts

Add new error codes to the centralized library:

```typescript
// Add to ErrorCodes object
INVALID_INPUT: 'INVALID_INPUT',
CHECKOUT_FAILED: 'CHECKOUT_FAILED',
PORTAL_FAILED: 'PORTAL_FAILED',
INVALID_TIER: 'INVALID_TIER',
SESSION_REVOKE_FAILED: 'SESSION_REVOKE_FAILED',
SIGN_OUT_ALL_FAILED: 'SIGN_OUT_ALL_FAILED',
TICKET_LOAD_FAILED: 'TICKET_LOAD_FAILED',
TICKET_MESSAGE_FAILED: 'TICKET_MESSAGE_FAILED',
TICKET_DELETE_FAILED: 'TICKET_DELETE_FAILED',
EXPORT_FAILED: 'EXPORT_FAILED',
BOUNDARY_INVALID: 'BOUNDARY_INVALID',
```

---

## Implementation Approach

For each file, the pattern is:
1. Import `useLanguage` hook where not already imported
2. Get `t` function from the hook
3. Replace hardcoded strings with `t('error.keyName')` calls
4. For files that don't use React hooks (like utilities), use the `getErrorMessage(ErrorCodes.X).description` pattern

For admin components that don't have language context access, use simple branded messages directly without i18n (admin panel is English-only).

---

## Summary of Changes

| Category | Files | Changes |
|----------|-------|---------|
| User Support | 1 | `UserTicketDetail.tsx` - 6 error messages |
| User Settings | 1 | `useUserSettings.ts` - 6 error messages |
| Subscription | 1 | `SubscriptionContext.tsx` - 4 error messages |
| Avatar | 1 | `useAvatarUpload.ts` - 7 error messages |
| Engineering | 6 | All calculators - ~15 validation/error messages |
| Admin | 3 | LLM, RateLimit, UserAILimits - 6 error messages |
| Translations | 1 | LanguageContext - 20+ new keys |
| Error Library | 1 | errorMessages.ts - 10 new error codes |

**Total: ~15 files modified, 50+ error messages unified**


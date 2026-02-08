

# Fix acceptTerms: Don't Mark Accepted on DB Failure

## Problem

The `acceptTerms` function in `src/hooks/useAuth.ts` (lines 98-106) catches database errors and still sets `hasAcceptedTerms = true` and writes to localStorage. This means if the DB write fails, the server never records acceptance -- the user sees the modal again on a different device or after clearing storage. This is a compliance gap.

## Change

**File: `src/hooks/useAuth.ts`** -- Update the `catch` block in `acceptTerms` (lines 98-107) to show an error toast instead of silently accepting.

**Before (lines 98-107):**
```typescript
} catch {
  // Even if DB fails, save to localStorage so modal doesn't show again
  localStorage.setItem(`terms_accepted_${user.id}`, 'true');
  setHasAcceptedTerms(true);
  
  toast({
    title: 'Welcome to AYN',
    description: 'Your AI companion is ready to assist you.'
  });
}
```

**After:**
```typescript
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('Failed to save terms acceptance:', error);
  }
  toast({
    title: 'Error',
    description: 'Could not save your acceptance. Please try again.',
    variant: 'destructive',
  });
}
```

The happy path (lines 90-97) remains unchanged -- it already correctly sets state only after a successful DB write. The only change is making the catch block stop lying about success.


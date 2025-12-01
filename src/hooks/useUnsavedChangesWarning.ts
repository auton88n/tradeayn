import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

export const useUnsavedChangesWarning = (
  hasUnsavedChanges: boolean,
  onNavigationAttempt?: () => void
) => {
  // Block navigation in React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle browser tab close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Trigger callback when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked' && onNavigationAttempt) {
      onNavigationAttempt();
    }
  }, [blocker.state, onNavigationAttempt]);

  return blocker;
};

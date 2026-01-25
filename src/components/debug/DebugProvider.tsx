import { ReactNode } from 'react';
import { DebugContextProvider } from '@/contexts/DebugContext';
import { DebugOverlay } from './DebugOverlay';
import { useLayoutShiftObserver } from '@/hooks/useLayoutShiftObserver';

// Internal component that uses hooks after context is available
const DebugObservers = () => {
  useLayoutShiftObserver();
  return <DebugOverlay />;
};

interface DebugProviderProps {
  children: ReactNode;
}

export const DebugProvider = ({ children }: DebugProviderProps) => {
  return (
    <DebugContextProvider>
      {children}
      <DebugObservers />
    </DebugContextProvider>
  );
};

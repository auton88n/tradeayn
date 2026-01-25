import { ReactNode } from 'react';

interface DebugProviderProps {
  children: ReactNode;
}

// Debug mode removed - just pass through children
export const DebugProvider = ({ children }: DebugProviderProps) => {
  return <>{children}</>;
};

import { createContext, useContext, useState, ReactNode } from 'react';

interface MarketingContentContextType {
  marketingData: Record<string, unknown> | null;
  setMarketingData: (data: Record<string, unknown> | null) => void;
}

const MarketingContentContext = createContext<MarketingContentContextType | undefined>(undefined);

export const MarketingContentProvider = ({ children }: { children: ReactNode }) => {
  const [marketingData, setMarketingData] = useState<Record<string, unknown> | null>(null);

  return (
    <MarketingContentContext.Provider value={{ marketingData, setMarketingData }}>
      {children}
    </MarketingContentContext.Provider>
  );
};

export const useMarketingContent = () => {
  const context = useContext(MarketingContentContext);
  if (!context) {
    throw new Error('useMarketingContent must be used within a MarketingContentProvider');
  }
  return context;
};

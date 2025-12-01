import React, { createContext, useContext, useState, useCallback } from 'react';

interface SettingsContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  registerFormChange: (formId: string, hasChanges: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formStates, setFormStates] = useState<Record<string, boolean>>({});

  const registerFormChange = useCallback((formId: string, hasChanges: boolean) => {
    setFormStates(prev => ({ ...prev, [formId]: hasChanges }));
  }, []);

  const hasUnsavedChanges = Object.values(formStates).some(state => state);

  return (
    <SettingsContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        hasUnsavedChanges,
        setHasUnsavedChanges: (hasChanges: boolean) => {
          if (!hasChanges) {
            setFormStates({});
          }
        },
        registerFormChange,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

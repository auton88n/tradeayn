import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useActionTracker, TrackedAction } from '@/hooks/useActionTracker';

interface CalculatorState {
  inputs: Record<string, any>;
  outputs: Record<string, any> | null;
  lastCalculatedAt: Date | null;
}

interface EngineeringSessionContextValue {
  // Current state
  currentCalculator: string | null;
  currentInputs: Record<string, any>;
  currentOutputs: Record<string, any> | null;
  
  // All calculator states
  calculatorStates: Record<string, CalculatorState>;
  
  // Action history
  recentActions: TrackedAction[];
  
  // Session info
  sessionSummary: {
    sessionDuration: number;
    totalActions: number;
    actionCounts: Record<string, number>;
    calculatorsUsed: string[];
    calculationsRun: number;
    currentCalculator: string | null;
  };
  
  // Tracking functions
  trackCalculatorSwitch: (calculator: string) => void;
  trackInputChange: (field: string, value: any) => void;
  trackMultipleInputs: (inputs: Record<string, any>) => void;
  trackCalculation: (outputs: Record<string, any>) => void;
  trackExport: (format: 'pdf' | 'dxf') => void;
  trackSave: (designName: string) => void;
  trackAIInteraction: (message: string, actionsExecuted?: string[]) => void;
  trackReset: () => void;
  
  // Get context for AI
  getAIContext: () => AIContext;
}

export interface AIContext {
  currentCalculator: string | null;
  currentInputs: Record<string, any>;
  currentOutputs: Record<string, any> | null;
  allCalculatorStates: Record<string, CalculatorState>;
  recentActions: {
    type: string;
    timestamp: string;
    details: Record<string, any>;
    calculator?: string;
  }[];
  sessionInfo: {
    sessionDuration: number;
    calculatorsUsed: string[];
    calculationsRun: number;
  };
}

const EngineeringSessionContext = createContext<EngineeringSessionContextValue | null>(null);

interface EngineeringSessionProviderProps {
  children: ReactNode;
}

export const EngineeringSessionProvider: React.FC<EngineeringSessionProviderProps> = ({ children }) => {
  const actionTracker = useActionTracker();

  const getCurrentState = useCallback((): CalculatorState | null => {
    return actionTracker.getCurrentCalculatorState();
  }, [actionTracker]);

  const getAIContext = useCallback((): AIContext => {
    const currentState = getCurrentState();
    const summary = actionTracker.getSessionSummary();
    const recentActions = actionTracker.getRecentActions(20);

    return {
      currentCalculator: actionTracker.currentCalculator,
      currentInputs: currentState?.inputs || {},
      currentOutputs: currentState?.outputs || null,
      allCalculatorStates: actionTracker.calculatorStates,
      recentActions: recentActions.map(action => ({
        type: action.type,
        timestamp: action.timestamp.toISOString(),
        details: action.details,
        calculator: action.calculator,
      })),
      sessionInfo: {
        sessionDuration: summary.sessionDuration,
        calculatorsUsed: summary.calculatorsUsed,
        calculationsRun: summary.calculationsRun,
      },
    };
  }, [actionTracker, getCurrentState]);

  const value = useMemo<EngineeringSessionContextValue>(() => {
    const currentState = getCurrentState();
    
    return {
      // Current state
      currentCalculator: actionTracker.currentCalculator,
      currentInputs: currentState?.inputs || {},
      currentOutputs: currentState?.outputs || null,
      
      // All calculator states
      calculatorStates: actionTracker.calculatorStates,
      
      // Action history
      recentActions: actionTracker.getRecentActions(20),
      
      // Session info
      sessionSummary: actionTracker.getSessionSummary(),
      
      // Tracking functions
      trackCalculatorSwitch: actionTracker.trackCalculatorSwitch,
      trackInputChange: actionTracker.trackInputChange,
      trackMultipleInputs: actionTracker.trackMultipleInputs,
      trackCalculation: actionTracker.trackCalculation,
      trackExport: actionTracker.trackExport,
      trackSave: actionTracker.trackSave,
      trackAIInteraction: actionTracker.trackAIInteraction,
      trackReset: actionTracker.trackReset,
      
      // AI context
      getAIContext,
    };
  }, [actionTracker, getCurrentState, getAIContext]);

  return (
    <EngineeringSessionContext.Provider value={value}>
      {children}
    </EngineeringSessionContext.Provider>
  );
};

export const useEngineeringSession = (): EngineeringSessionContextValue => {
  const context = useContext(EngineeringSessionContext);
  if (!context) {
    throw new Error('useEngineeringSession must be used within EngineeringSessionProvider');
  }
  return context;
};

// Optional hook that returns null if outside provider (for components that may be used both inside and outside)
export const useEngineeringSessionOptional = (): EngineeringSessionContextValue | null => {
  return useContext(EngineeringSessionContext);
};

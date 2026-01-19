import { useState, useCallback, useRef } from 'react';

export interface TrackedAction {
  id: string;
  type: 
    | 'switch_calculator' 
    | 'set_input' 
    | 'set_multiple_inputs' 
    | 'calculate' 
    | 'view_results'
    | 'export_pdf' 
    | 'export_dxf' 
    | 'save_design' 
    | 'view_history' 
    | 'reset_form'
    | 'compare_designs'
    | 'ai_interaction'
    | 'load_calculation';
  timestamp: Date;
  details: Record<string, any>;
  calculator?: string;
}

export interface ActionTrackerState {
  actions: TrackedAction[];
  sessionStart: Date;
  currentCalculator: string | null;
  calculatorStates: Record<string, {
    inputs: Record<string, any>;
    outputs: Record<string, any> | null;
    lastCalculatedAt: Date | null;
  }>;
}

const generateActionId = () => `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useActionTracker = () => {
  const [state, setState] = useState<ActionTrackerState>({
    actions: [],
    sessionStart: new Date(),
    currentCalculator: null,
    calculatorStates: {},
  });
  
  const maxActions = useRef(50); // Keep last 50 actions

  const trackAction = useCallback((
    type: TrackedAction['type'],
    details: Record<string, any> = {},
    calculator?: string
  ) => {
    const action: TrackedAction = {
      id: generateActionId(),
      type,
      timestamp: new Date(),
      details,
      calculator: calculator || state.currentCalculator || undefined,
    };

    setState(prev => ({
      ...prev,
      actions: [...prev.actions.slice(-maxActions.current + 1), action],
    }));

    return action;
  }, [state.currentCalculator]);

  const trackCalculatorSwitch = useCallback((calculator: string) => {
    setState(prev => ({
      ...prev,
      currentCalculator: calculator,
      calculatorStates: {
        ...prev.calculatorStates,
        [calculator]: prev.calculatorStates[calculator] || {
          inputs: {},
          outputs: null,
          lastCalculatedAt: null,
        },
      },
    }));
    trackAction('switch_calculator', { calculator }, calculator);
  }, [trackAction]);

  const trackInputChange = useCallback((field: string, value: any, calculator?: string) => {
    const calc = calculator || state.currentCalculator;
    if (!calc) return;

    setState(prev => ({
      ...prev,
      calculatorStates: {
        ...prev.calculatorStates,
        [calc]: {
          ...prev.calculatorStates[calc],
          inputs: {
            ...(prev.calculatorStates[calc]?.inputs || {}),
            [field]: value,
          },
        },
      },
    }));
    trackAction('set_input', { field, value }, calc);
  }, [state.currentCalculator, trackAction]);

  const trackMultipleInputs = useCallback((inputs: Record<string, any>, calculator?: string) => {
    const calc = calculator || state.currentCalculator;
    if (!calc) return;

    setState(prev => ({
      ...prev,
      calculatorStates: {
        ...prev.calculatorStates,
        [calc]: {
          ...prev.calculatorStates[calc],
          inputs: {
            ...(prev.calculatorStates[calc]?.inputs || {}),
            ...inputs,
          },
        },
      },
    }));
    trackAction('set_multiple_inputs', { inputs, fieldCount: Object.keys(inputs).length }, calc);
  }, [state.currentCalculator, trackAction]);

  const trackCalculation = useCallback((outputs: Record<string, any>, calculator?: string) => {
    const calc = calculator || state.currentCalculator;
    if (!calc) return;

    setState(prev => ({
      ...prev,
      calculatorStates: {
        ...prev.calculatorStates,
        [calc]: {
          ...prev.calculatorStates[calc],
          outputs,
          lastCalculatedAt: new Date(),
        },
      },
    }));
    trackAction('calculate', { outputKeys: Object.keys(outputs) }, calc);
  }, [state.currentCalculator, trackAction]);

  const trackExport = useCallback((format: 'pdf' | 'dxf') => {
    trackAction(format === 'pdf' ? 'export_pdf' : 'export_dxf', { format });
  }, [trackAction]);

  const trackSave = useCallback((designName: string) => {
    trackAction('save_design', { name: designName });
  }, [trackAction]);

  const trackAIInteraction = useCallback((message: string, actionsExecuted?: string[]) => {
    trackAction('ai_interaction', { 
      messagePreview: message.slice(0, 100),
      actionsExecuted: actionsExecuted || [],
    });
  }, [trackAction]);

  const trackReset = useCallback(() => {
    const calc = state.currentCalculator;
    if (!calc) return;

    setState(prev => ({
      ...prev,
      calculatorStates: {
        ...prev.calculatorStates,
        [calc]: {
          inputs: {},
          outputs: null,
          lastCalculatedAt: null,
        },
      },
    }));
    trackAction('reset_form', {});
  }, [state.currentCalculator, trackAction]);

  const getRecentActions = useCallback((count: number = 20) => {
    return state.actions.slice(-count);
  }, [state.actions]);

  const getAllCalculatorStates = useCallback(() => {
    return state.calculatorStates;
  }, [state.calculatorStates]);

  const getCurrentCalculatorState = useCallback(() => {
    if (!state.currentCalculator) return null;
    return state.calculatorStates[state.currentCalculator] || null;
  }, [state.currentCalculator, state.calculatorStates]);

  const getSessionSummary = useCallback(() => {
    const actionCounts = state.actions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const calculatorsUsed = Object.keys(state.calculatorStates);
    const calculationsRun = state.actions.filter(a => a.type === 'calculate').length;

    return {
      sessionDuration: Math.floor((Date.now() - state.sessionStart.getTime()) / 1000),
      totalActions: state.actions.length,
      actionCounts,
      calculatorsUsed,
      calculationsRun,
      currentCalculator: state.currentCalculator,
    };
  }, [state]);

  return {
    // State
    actions: state.actions,
    currentCalculator: state.currentCalculator,
    calculatorStates: state.calculatorStates,
    
    // Tracking functions
    trackAction,
    trackCalculatorSwitch,
    trackInputChange,
    trackMultipleInputs,
    trackCalculation,
    trackExport,
    trackSave,
    trackAIInteraction,
    trackReset,
    
    // Query functions
    getRecentActions,
    getAllCalculatorStates,
    getCurrentCalculatorState,
    getSessionSummary,
  };
};

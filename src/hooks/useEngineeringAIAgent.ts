import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAction {
  tool: string;
  args: Record<string, any>;
  id: string;
  status: 'pending' | 'executing' | 'done' | 'error';
  result?: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

interface UseEngineeringAIAgentProps {
  calculatorType: string | null;
  currentInputs: Record<string, any>;
  currentOutputs: Record<string, any> | null;
  onSetInput: (field: string, value: any) => void;
  onSetMultipleInputs: (inputs: Record<string, any>) => void;
  onCalculate: () => void;
  onSwitchCalculator: (type: string) => void;
  onReset: () => void;
  onShowHistory: () => void;
  onSaveDesign?: (name: string, notes?: string) => Promise<void>;
  onExportFile?: (format: 'dxf' | 'pdf') => void;
  onCompareDesigns?: (alternativeInputs: Record<string, any>) => void;
}

export const useEngineeringAIAgent = ({
  calculatorType,
  currentInputs,
  currentOutputs,
  onSetInput,
  onSetMultipleInputs,
  onCalculate,
  onSwitchCalculator,
  onReset,
  onShowHistory,
  onSaveDesign,
  onExportFile,
  onCompareDesigns,
}: UseEngineeringAIAgentProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Execute a single AI action
  const executeAction = useCallback(async (action: AIAction): Promise<any> => {
    setCurrentAction(`Executing: ${action.tool}`);

    try {
      switch (action.tool) {
        case 'set_input':
          onSetInput(action.args.field, action.args.value);
          return { success: true, field: action.args.field, value: action.args.value };

        case 'set_multiple_inputs':
          onSetMultipleInputs(action.args.inputs);
          return { success: true, inputs: action.args.inputs };

        case 'calculate':
          onCalculate();
          return { success: true, message: 'Calculation triggered' };

        case 'switch_calculator':
          onSwitchCalculator(action.args.calculator);
          return { success: true, calculator: action.args.calculator };

        case 'save_design':
          if (onSaveDesign) {
            await onSaveDesign(action.args.name, action.args.notes);
            toast.success(`Design saved as "${action.args.name}"`);
            return { success: true, name: action.args.name };
          }
          return { success: false, message: 'Save not available' };

        case 'export_file':
          if (onExportFile) {
            onExportFile(action.args.format);
            return { success: true, format: action.args.format };
          }
          return { success: false, message: 'Export not available' };

        case 'compare_designs':
          if (onCompareDesigns) {
            onCompareDesigns(action.args.alternative_inputs);
            return { success: true };
          }
          return { success: false, message: 'Compare not available' };

        case 'reset_form':
          onReset();
          return { success: true, message: 'Form reset' };

        case 'show_history':
          onShowHistory();
          return { success: true, message: 'History opened' };

        default:
          console.warn('Unknown action:', action.tool);
          return { success: false, message: `Unknown action: ${action.tool}` };
      }
    } catch (err) {
      console.error('Action execution error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [onSetInput, onSetMultipleInputs, onCalculate, onSwitchCalculator, onReset, onShowHistory, onSaveDesign, onExportFile, onCompareDesigns]);

  // Execute all actions from AI response
  const executeActions = useCallback(async (actions: AIAction[]): Promise<AIAction[]> => {
    const results: AIAction[] = [];

    for (const action of actions) {
      const executingAction: AIAction = { ...action, status: 'executing' };
      
      const result = await executeAction(action);
      
      const completedAction: AIAction = {
        ...action,
        status: result.success ? 'done' : 'error',
        result
      };
      results.push(completedAction);

      // Small delay between actions for UI feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCurrentAction(null);
    return results;
  }, [executeAction]);

  // Send a message to the AI agent
  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get session context if available
      const sessionContext = (window as any).__engineeringSessionContext?.();

      const { data, error } = await supabase.functions.invoke('engineering-ai-agent', {
        body: {
          calculatorType,
          currentInputs,
          currentOutputs,
          question: question.trim(),
          messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          allCalculatorStates: sessionContext?.allCalculatorStates || {},
          recentActions: sessionContext?.recentActions || [],
          sessionInfo: sessionContext?.sessionInfo || {},
        },
      });

      if (error) throw error;

      // Execute any actions from the AI
      let executedActions: AIAction[] = [];
      if (data.actions && data.actions.length > 0) {
        executedActions = await executeActions(data.actions);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer || 'Done!',
        timestamp: new Date(),
        actions: executedActions,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('AI agent error:', err);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: err instanceof Error && err.message.includes('rate limit')
          ? 'Rate limit reached. Please wait a moment and try again.'
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  }, [calculatorType, currentInputs, currentOutputs, messages, isLoading, executeActions]);

  // Quick command shortcuts
  const executeQuickCommand = useCallback((command: string) => {
    switch (command) {
      case '/calc':
      case '/calculate':
        onCalculate();
        toast.success('Calculation triggered');
        break;
      case '/reset':
        onReset();
        toast.success('Form reset');
        break;
      case '/history':
        onShowHistory();
        break;
      case '/save':
        sendMessage('Save this design');
        break;
      case '/export':
        sendMessage('Export this design as PDF');
        break;
      default:
        return false;
    }
    return true;
  }, [onCalculate, onReset, onShowHistory, sendMessage]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setCurrentAction(null);
  }, []);

  return {
    messages,
    isLoading,
    currentAction,
    sendMessage,
    executeQuickCommand,
    clearConversation,
  };
};

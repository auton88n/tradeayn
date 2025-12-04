import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TUTORIAL_STEPS, TutorialState } from '@/types/tutorial.types';

const STORAGE_KEY = 'ayn_tutorial_completed';

export const useTutorial = (userId?: string) => {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    isCompleted: false,
    showWelcome: false,
  });

  // Check if tutorial should be shown
  useEffect(() => {
    const checkTutorialStatus = async () => {
      // Check localStorage first for quick response
      const localCompleted = localStorage.getItem(STORAGE_KEY);
      if (localCompleted === 'true') {
        setState(prev => ({ ...prev, isCompleted: true }));
        return;
      }

      // Check database if user is logged in
      if (userId) {
        const { data } = await supabase
          .from('user_settings')
          .select('has_completed_tutorial')
          .eq('user_id', userId)
          .single();

        if (data?.has_completed_tutorial) {
          localStorage.setItem(STORAGE_KEY, 'true');
          setState(prev => ({ ...prev, isCompleted: true }));
        } else {
          // Show welcome for new users
          setState(prev => ({ ...prev, showWelcome: true }));
        }
      }
    };

    checkTutorialStatus();
  }, [userId]);

  const startTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      showWelcome: false,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep >= TUTORIAL_STEPS.length - 1) {
        // Tutorial complete
        return { ...prev, isActive: false, isCompleted: true };
      }
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      showWelcome: false,
      isCompleted: true,
    }));
    completeTutorial();
  }, []);

  const completeTutorial = useCallback(async () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, 'true');
    
    setState(prev => ({ ...prev, isActive: false, isCompleted: true }));

    // Save to database if user is logged in
    if (userId) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          has_completed_tutorial: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }
  }, [userId]);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      isActive: false,
      currentStep: 0,
      isCompleted: false,
      showWelcome: true,
    });
  }, []);

  const dismissWelcome = useCallback(() => {
    setState(prev => ({ ...prev, showWelcome: false }));
    completeTutorial();
  }, [completeTutorial]);

  return {
    ...state,
    currentStepData: TUTORIAL_STEPS[state.currentStep],
    totalSteps: TUTORIAL_STEPS.length,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
    dismissWelcome,
  };
};

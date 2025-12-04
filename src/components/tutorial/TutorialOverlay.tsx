import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialStep } from './TutorialStep';
import { TutorialStep as TutorialStepType } from '@/types/tutorial.types';

interface TutorialOverlayProps {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TutorialStepType | undefined;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export const TutorialOverlay = ({
  isActive,
  currentStep,
  totalSteps,
  currentStepData,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TutorialOverlayProps) => {

  // Find and highlight target element
  const updateTargetHighlight = useCallback(() => {
    if (!currentStepData) return;
    
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    const target = document.querySelector(currentStepData.targetSelector);
    if (target) {
      target.classList.add('tutorial-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (target) {
        target.classList.remove('tutorial-highlight');
      }
    };
  }, [currentStepData]);

  useEffect(() => {
    if (!isActive) return;
    
    const cleanup = updateTargetHighlight();
    
    return () => {
      cleanup?.();
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [isActive, currentStep, updateTargetHighlight]);

  const handleNext = () => {
    if (currentStep >= totalSteps - 1) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!isActive || !currentStepData) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[200]"
      >
        {/* Simple dark overlay */}
        <div 
          className="absolute inset-0 bg-black/60"
          onClick={onSkip}
        />

        {/* Dynamic position based on step.position */}
        <div className={`fixed z-[201] w-[90%] max-w-md ${
          currentStepData.position === 'top' 
            ? 'top-20 left-1/2 -translate-x-1/2' 
            : currentStepData.position === 'bottom' 
            ? 'bottom-32 left-1/2 -translate-x-1/2'
            : currentStepData.position === 'left'
            ? 'top-1/2 -translate-y-1/2 left-4 md:left-72'
            : 'top-1/2 -translate-y-1/2 right-4 md:right-8'
        }`}>
          <AnimatePresence mode="wait">
            <TutorialStep
              key={currentStep}
              step={currentStepData}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNext}
              onPrev={onPrev}
              onSkip={onSkip}
              isLastStep={currentStep >= totalSteps - 1}
            />
          </AnimatePresence>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};

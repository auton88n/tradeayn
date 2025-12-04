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
        <div className={`fixed left-1/2 -translate-x-1/2 z-[201] w-[90%] max-w-md ${
          currentStepData.position === 'top' ? 'top-24' : 'bottom-8'
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

        {/* Progress dots - position opposite of card */}
        <div className={`fixed left-1/2 -translate-x-1/2 flex gap-2 z-[201] ${
          currentStepData.position === 'top' ? 'top-48' : 'bottom-32'
        }`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep 
                  ? "bg-primary w-6" 
                  : i < currentStep 
                    ? "bg-primary/60 w-2" 
                    : "bg-white/40 w-2"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

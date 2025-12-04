import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialStep } from './TutorialStep';
import { TUTORIAL_STEPS, TutorialStep as TutorialStepType } from '@/types/tutorial.types';
import { cn } from '@/lib/utils';

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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTargetVisible, setIsTargetVisible] = useState(false);

  // Find and highlight target element
  const updateTargetPosition = useCallback(() => {
    if (!currentStepData) return;
    
    const target = document.querySelector(currentStepData.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      setIsTargetVisible(true);
      
      // Add highlight class to target
      target.classList.add('tutorial-highlight');
      
      // Scroll into view if needed
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setIsTargetVisible(false);
    }

    return () => {
      if (target) {
        target.classList.remove('tutorial-highlight');
      }
    };
  }, [currentStepData]);

  useEffect(() => {
    if (!isActive) return;
    
    const cleanup = updateTargetPosition();
    
    // Update on resize/scroll
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    
    return () => {
      cleanup?.();
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
      
      // Remove all highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [isActive, currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep >= totalSteps - 1) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!isActive || !currentStepData) return null;

  // Calculate spotlight clip path
  const padding = 12;
  const borderRadius = 16;
  const spotlightPath = targetRect
    ? `polygon(
        0% 0%, 0% 100%, 
        ${targetRect.left - padding}px 100%, 
        ${targetRect.left - padding}px ${targetRect.top - padding}px, 
        ${targetRect.right + padding}px ${targetRect.top - padding}px, 
        ${targetRect.right + padding}px ${targetRect.bottom + padding}px, 
        ${targetRect.left - padding}px ${targetRect.bottom + padding}px, 
        ${targetRect.left - padding}px 100%, 
        100% 100%, 100% 0%
      )`
    : 'none';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] pointer-events-auto"
      >
        {/* Dark overlay with spotlight cutout */}
        <div
          className="absolute inset-0 bg-black/70 transition-all duration-300"
          style={{
            clipPath: spotlightPath,
          }}
          onClick={onSkip}
        />

        {/* Spotlight border/glow effect */}
        {targetRect && isTargetVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "absolute pointer-events-none",
              "border-2 border-primary/50",
              "rounded-2xl",
              "shadow-[0_0_30px_rgba(var(--primary),0.3)]"
            )}
            style={{
              left: targetRect.left - padding,
              top: targetRect.top - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
            }}
          >
            {/* Pulsing animation */}
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(var(--primary), 0.2)',
                  '0 0 40px rgba(var(--primary), 0.4)',
                  '0 0 20px rgba(var(--primary), 0.2)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl"
            />
          </motion.div>
        )}

        {/* Tutorial step card */}
        {targetRect && (
          <TutorialStep
            step={currentStepData}
            currentStep={currentStep}
            totalSteps={totalSteps}
            targetRect={targetRect}
            onNext={handleNext}
            onPrev={onPrev}
            onSkip={onSkip}
            isLastStep={currentStep >= totalSteps - 1}
          />
        )}

        {/* Progress dots */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[201]">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === currentStep 
                  ? "bg-primary w-6" 
                  : i < currentStep 
                    ? "bg-primary/60" 
                    : "bg-white/30"
              )}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

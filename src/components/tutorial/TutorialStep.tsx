import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { TutorialStep as TutorialStepType } from '@/types/tutorial.types';
import { cn } from '@/lib/utils';

interface TutorialStepProps {
  step: TutorialStepType;
  currentStep: number;
  totalSteps: number;
  targetRect: DOMRect;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

export const TutorialStep = ({
  step,
  currentStep,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  isLastStep,
}: TutorialStepProps) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  // Calculate optimal position for the step card
  const cardPosition = useMemo(() => {
    const cardWidth = 320;
    const cardHeight = 180;
    const margin = 20;
    const arrowSize = 12;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;
    let actualPosition = step.position;

    // Calculate position based on preferred position
    switch (step.position) {
      case 'top':
        x = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        y = targetRect.top - cardHeight - margin - arrowSize;
        if (y < margin) {
          actualPosition = 'bottom';
          y = targetRect.bottom + margin + arrowSize;
        }
        break;
      case 'bottom':
        x = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        y = targetRect.bottom + margin + arrowSize;
        if (y + cardHeight > viewportHeight - margin) {
          actualPosition = 'top';
          y = targetRect.top - cardHeight - margin - arrowSize;
        }
        break;
      case 'left':
        x = targetRect.left - cardWidth - margin - arrowSize;
        y = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        if (x < margin) {
          actualPosition = 'right';
          x = targetRect.right + margin + arrowSize;
        }
        break;
      case 'right':
        x = targetRect.right + margin + arrowSize;
        y = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        if (x + cardWidth > viewportWidth - margin) {
          actualPosition = 'left';
          x = targetRect.left - cardWidth - margin - arrowSize;
        }
        break;
    }

    // Clamp to viewport
    x = Math.max(margin, Math.min(x, viewportWidth - cardWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - cardHeight - margin));

    return { x, y, position: actualPosition };
  }, [targetRect, step.position]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(
        "fixed z-[202] w-80",
        "bg-background/95 backdrop-blur-xl",
        "border border-border/50",
        "rounded-2xl shadow-2xl",
        "p-5"
      )}
      style={{
        left: cardPosition.x,
        top: cardPosition.y,
      }}
    >
      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Step counter */}
      <div className="text-xs font-medium text-muted-foreground mb-2">
        {currentStep + 1} {t('tutorial.navigation.stepOf')} {totalSteps}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t(step.title)}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {t(step.description)}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onPrev}
          variant="ghost"
          size="sm"
          disabled={currentStep === 0}
          className="h-9 px-3 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('tutorial.navigation.previous')}
        </Button>

        <Button
          onClick={onNext}
          size="sm"
          className={cn(
            "h-9 px-4 rounded-lg",
            "bg-foreground text-background",
            "hover:bg-foreground/90"
          )}
        >
          {isLastStep ? t('tutorial.navigation.finish') : t('tutorial.navigation.next')}
          {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('tutorial.navigation.skip')}
      </button>
    </motion.div>
  );
};

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
    const cardWidth = 340;
    const cardHeight = 280;
    const margin = 24;
    const arrowSize = 16;
    const sidebarWidth = 280; // Account for sidebar

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center of target element
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    let x = 0;
    let y = 0;
    let actualPosition = step.position;
    let arrowX = 0;
    let arrowY = 0;

    // Calculate position based on preferred position
    switch (step.position) {
      case 'top':
        x = targetCenterX - cardWidth / 2;
        y = targetRect.top - cardHeight - margin;
        arrowX = cardWidth / 2 - arrowSize;
        arrowY = cardHeight;
        if (y < margin) {
          actualPosition = 'bottom';
          y = targetRect.bottom + margin;
          arrowY = -arrowSize * 2;
        }
        break;
      case 'bottom':
        x = targetCenterX - cardWidth / 2;
        y = targetRect.bottom + margin;
        arrowX = cardWidth / 2 - arrowSize;
        arrowY = -arrowSize * 2;
        if (y + cardHeight > viewportHeight - margin) {
          actualPosition = 'top';
          y = targetRect.top - cardHeight - margin;
          arrowY = cardHeight;
        }
        break;
      case 'left':
        x = targetRect.left - cardWidth - margin;
        y = targetCenterY - cardHeight / 2;
        arrowX = cardWidth;
        arrowY = cardHeight / 2 - arrowSize;
        if (x < sidebarWidth + margin) {
          actualPosition = 'right';
          x = targetRect.right + margin;
          arrowX = -arrowSize * 2;
        }
        break;
      case 'right':
        x = targetRect.right + margin;
        y = targetCenterY - cardHeight / 2;
        arrowX = -arrowSize * 2;
        arrowY = cardHeight / 2 - arrowSize;
        if (x + cardWidth > viewportWidth - margin) {
          actualPosition = 'left';
          x = targetRect.left - cardWidth - margin;
          arrowX = cardWidth;
        }
        break;
    }

    // Clamp to viewport with sidebar offset
    x = Math.max(sidebarWidth + margin, Math.min(x, viewportWidth - cardWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - cardHeight - margin - 60)); // 60 for progress dots

    return { x, y, position: actualPosition, arrowX, arrowY };
  }, [targetRect, step.position]);

  // Get arrow rotation based on position
  const getArrowStyles = () => {
    switch (cardPosition.position) {
      case 'top':
        return { transform: 'rotate(180deg)', bottom: '-12px', left: '50%', marginLeft: '-8px' };
      case 'bottom':
        return { transform: 'rotate(0deg)', top: '-12px', left: '50%', marginLeft: '-8px' };
      case 'left':
        return { transform: 'rotate(90deg)', right: '-12px', top: '50%', marginTop: '-8px' };
      case 'right':
        return { transform: 'rotate(-90deg)', left: '-12px', top: '50%', marginTop: '-8px' };
      default:
        return {};
    }
  };

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.32, 0.72, 0, 1]
      }}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(
        "fixed z-[202]",
        "bg-background/98 backdrop-blur-2xl",
        "border border-border/60",
        "rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
        "p-6 w-[340px]"
      )}
      style={{
        left: cardPosition.x,
        top: cardPosition.y,
      }}
    >
      {/* Arrow pointer */}
      <div
        className="absolute w-4 h-4 bg-background border-l border-t border-border/60"
        style={{
          ...getArrowStyles(),
        }}
      />

      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Step counter with progress */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-primary">
          {currentStep + 1} {t('tutorial.navigation.stepOf')} {totalSteps}
        </span>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-3 pr-8">
        {t(step.title)}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {t(step.description)}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={onPrev}
          variant="ghost"
          size="sm"
          disabled={currentStep === 0}
          className="h-10 px-4 rounded-xl transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('tutorial.navigation.previous')}
        </Button>

        <Button
          onClick={onNext}
          size="sm"
          className={cn(
            "h-10 px-5 rounded-xl",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "transition-all duration-200"
          )}
        >
          {isLastStep ? t('tutorial.navigation.finish') : t('tutorial.navigation.next')}
          {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('tutorial.navigation.skip')}
      </button>
    </motion.div>
  );
};

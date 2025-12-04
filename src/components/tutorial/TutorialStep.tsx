import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TutorialStep as TutorialStepType } from '@/types/tutorial.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface TutorialStepProps {
  step: TutorialStepType;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

export const TutorialStep = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isLastStep,
}: TutorialStepProps) => {
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative bg-card border border-border rounded-2xl shadow-xl p-6"
    >
      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Step counter */}
      <div className="text-xs text-muted-foreground mb-2">
        {currentStep + 1} / {totalSteps}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 pr-6">
        {t(step.title)}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {t(step.description)}
      </p>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={currentStep === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {language === 'ar' ? 'السابق' : 'Back'}
        </Button>

        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {language === 'ar' ? 'تخطي' : 'Skip'}
        </button>

        <Button
          size="sm"
          onClick={onNext}
          className="gap-1"
        >
          {isLastStep ? (
            <>
              <Check className="w-4 h-4" />
              {language === 'ar' ? 'إنهاء' : 'Finish'}
            </>
          ) : (
            <>
              {language === 'ar' ? 'التالي' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

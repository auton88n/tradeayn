import { TutorialPage } from './TutorialPage';
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
  if (!isActive || !currentStepData) return null;

  return (
    <TutorialPage
      isOpen={isActive}
      currentStep={currentStep}
      totalSteps={totalSteps}
      step={currentStepData}
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
      onComplete={onComplete}
    />
  );
};

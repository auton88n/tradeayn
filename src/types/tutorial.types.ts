export interface TutorialStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  showWelcome: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'eye',
    targetSelector: '[data-tutorial="eye"]',
    title: 'tutorial.steps.eye.title',
    description: 'tutorial.steps.eye.description',
    position: 'bottom',
  },
  {
    id: 'chat-input',
    targetSelector: '[data-tutorial="chat-input"]',
    title: 'tutorial.steps.chatInput.title',
    description: 'tutorial.steps.chatInput.description',
    position: 'top',
  },
  {
    id: 'attachment',
    targetSelector: '[data-tutorial="attachment"]',
    title: 'tutorial.steps.attachment.title',
    description: 'tutorial.steps.attachment.description',
    position: 'top',
  },
  {
    id: 'suggestions',
    targetSelector: '[data-tutorial="suggestions"]',
    title: 'tutorial.steps.suggestions.title',
    description: 'tutorial.steps.suggestions.description',
    position: 'right',
  },
  {
    id: 'sidebar',
    targetSelector: '[data-tutorial="sidebar"]',
    title: 'tutorial.steps.sidebar.title',
    description: 'tutorial.steps.sidebar.description',
    position: 'right',
  },
  {
    id: 'transcript',
    targetSelector: '[data-tutorial="transcript"]',
    title: 'tutorial.steps.transcript.title',
    description: 'tutorial.steps.transcript.description',
    position: 'left',
  },
  {
    id: 'profile',
    targetSelector: '[data-tutorial="profile"]',
    title: 'tutorial.steps.profile.title',
    description: 'tutorial.steps.profile.description',
    position: 'top',
  },
];

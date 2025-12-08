export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  showWelcome: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'meet-ayn',
    title: 'tutorial.steps.meetAyn.title',
    description: 'tutorial.steps.meetAyn.description',
    icon: 'Brain',
  },
  {
    id: 'emotions',
    title: 'tutorial.steps.emotions.title',
    description: 'tutorial.steps.emotions.description',
    icon: 'Palette',
  },
  {
    id: 'chat',
    title: 'tutorial.steps.chat.title',
    description: 'tutorial.steps.chat.description',
    icon: 'MessageSquare',
  },
  {
    id: 'files',
    title: 'tutorial.steps.files.title',
    description: 'tutorial.steps.files.description',
    icon: 'Paperclip',
  },
  {
    id: 'navigation',
    title: 'tutorial.steps.navigation.title',
    description: 'tutorial.steps.navigation.description',
    icon: 'Menu',
  },
  {
    id: 'history',
    title: 'tutorial.steps.history.title',
    description: 'tutorial.steps.history.description',
    icon: 'History',
  },
  {
    id: 'profile',
    title: 'tutorial.steps.profile.title',
    description: 'tutorial.steps.profile.description',
    icon: 'User',
  },
];

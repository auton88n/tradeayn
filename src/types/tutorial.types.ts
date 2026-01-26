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
    title: 'Meet AYN',
    description: 'Your intelligent AI companion for conversations, documents, and engineering tools.',
    icon: 'Brain',
  },
  {
    id: 'emotions',
    title: 'Emotional Intelligence',
    description: 'AYN shows 11 emotions through eye color — from Calm (blue) to Curious (magenta).',
    icon: 'Palette',
  },
  {
    id: 'empathy',
    title: 'Empathetic Responses',
    description: 'When you share emotions, AYN responds with warmth and genuine care.',
    icon: 'Heart',
  },
  {
    id: 'chat',
    title: 'Start a Conversation',
    description: 'Type your message below. Use the mode selector for specialized help.',
    icon: 'MessageSquare',
  },
  {
    id: 'documents',
    title: 'Generate Documents',
    description: 'AYN creates stunning PDFs and Excel files. Just ask!',
    icon: 'FileText',
  },
  {
    id: 'files',
    title: 'Upload & Analyze Files',
    description: 'Upload documents or images using the + button for analysis.',
    icon: 'Paperclip',
  },
  {
    id: 'credits',
    title: 'Your Credits',
    description: 'Track usage in the sidebar. Free: 5/day, Paid: monthly allowance.',
    icon: 'Zap',
  },
  {
    id: 'engineering',
    title: 'Engineering Tools',
    description: 'Access 7 professional calculators with 3D visualization and AI analysis.',
    icon: 'HardHat',
  },
  {
    id: 'navigation',
    title: 'Your Sidebar',
    description: 'Access chat history, start new conversations, and search past chats.',
    icon: 'Menu',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Click your avatar to access settings, subscriptions, or sign out.',
    icon: 'User',
  },
];

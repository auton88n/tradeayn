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
    description: 'AYN is your intelligent AI companion. The eye you see is not just decoration — it\'s how AYN expresses understanding and responds to you emotionally.',
    icon: 'Brain',
  },
  {
    id: 'emotions',
    title: 'Emotional Intelligence',
    description: 'AYN\'s eye color reflects its mood: Green when happy, Blue when thinking, Orange when excited, Red when frustrated, Purple when curious, and warm Amber when offering comfort.',
    icon: 'Palette',
  },
  {
    id: 'empathy',
    title: 'Empathetic Responses',
    description: 'When you share difficult emotions, AYN responds with warmth. The eye glows soft amber for comfort, or rose-pink for support. Watch for gentle floating ember particles — that\'s AYN offering care.',
    icon: 'Heart',
  },
  {
    id: 'micro-behaviors',
    title: 'Reading Your Mood',
    description: 'AYN\'s pupil dilates when deeply engaged with you. Notice slower, comforting blinks when you need support, or quick attentive blinks when you share exciting news.',
    icon: 'Eye',
  },
  {
    id: 'chat',
    title: 'Start a Conversation',
    description: 'Type your message in the input box below. Choose different AI modes for specialized help — from general assistance to document analysis and more.',
    icon: 'MessageSquare',
  },
  {
    id: 'files',
    title: 'Share Files',
    description: 'Upload documents, images, or PDFs by clicking the + button. AYN can analyze your files and help you extract insights from them.',
    icon: 'Paperclip',
  },
  {
    id: 'navigation',
    title: 'Your Sidebar',
    description: 'Access your chat history, start new conversations, and search through past chats using the left sidebar. Pin important conversations to keep them at the top.',
    icon: 'Menu',
  },
  {
    id: 'history',
    title: 'Conversation History',
    description: 'All your messages are saved in the right sidebar transcript. Copy individual messages or entire conversations, and clear history when needed.',
    icon: 'History',
  },
  {
    id: 'credits',
    title: 'Your Credits',
    description: 'Track your monthly credits in the sidebar. The progress bar shows how many messages you\'ve used. When it resets each month, your counter starts fresh.',
    icon: 'Zap',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Click your avatar to access settings, manage your account, replay this tutorial, or sign out. Customize AYN to work best for you.',
    icon: 'User',
  },
];

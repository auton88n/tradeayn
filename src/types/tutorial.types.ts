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
    description: 'AYN is your intelligent AI companion. The eye responds emotionally to your conversations and helps with daily tasks, documents, and engineering calculations.',
    icon: 'Brain',
  },
  {
    id: 'emotions',
    title: 'Emotional Intelligence',
    description: 'AYN expresses 11 distinct emotions through eye color:\n\n• 😌 Calm (Blue) - Default peaceful state\n• 🤗 Comfort (Rose) - When you need support\n• 💪 Supportive (Beige) - Encouraging you\n• 😊 Happy (Gold) - Celebrating with you\n• 🤩 Excited (Coral) - High energy moments\n• 🤔 Thinking (Indigo) - Processing your question\n• 🧐 Curious (Magenta) - Exploring ideas\n• 😢 Sad (Lavender) - Acknowledging sadness\n• 😤 Frustrated (Orange) - Facing challenges\n• 😠 Mad (Crimson) - Rare, serious moments\n• 😑 Bored (Slate) - Low activity',
    icon: 'Palette',
  },
  {
    id: 'empathy',
    title: 'Empathetic Responses',
    description: 'AYN responds with genuine empathy. When you share difficult emotions, AYN glows rose for comfort or beige for support. Watch for gentle floating ember particles — that\'s AYN offering care.',
    icon: 'Heart',
  },
  {
    id: 'chat',
    title: 'Start a Conversation',
    description: 'Type your message in the input box below. AYN can help with general questions, analysis, planning, and more. Use the mode selector for specialized assistance.',
    icon: 'MessageSquare',
  },
  {
    id: 'documents',
    title: 'Generate Documents',
    description: 'Paid users can generate professional PDFs (30 credits) and Excel files (25 credits). Just ask AYN to create a document for you — they\'re white-labeled for premium users.',
    icon: 'FileText',
  },
  {
    id: 'files',
    title: 'Upload & Analyze Files',
    description: 'Upload documents, images, or PDFs by clicking the + button. AYN can analyze your files, extract text from images, summarize documents, and help you extract insights.',
    icon: 'Paperclip',
  },
  {
    id: 'credits',
    title: 'Your Credits',
    description: 'Free users get 5 credits per day (resets daily). Paid users receive their full monthly allowance upfront. Track your usage in the sidebar — the progress bar shows remaining credits.',
    icon: 'Zap',
  },
  {
    id: 'engineering',
    title: 'Engineering Tools',
    description: 'Access 7 professional structural calculators:\n\n• Beam Calculator - Simple & continuous beams\n• Column Designer - Axial load analysis\n• Slab Calculator - One/two-way slabs\n• Foundation Calculator - Spread footings\n• Retaining Wall - Earth pressure analysis\n• AI Grading Designer - Terrain optimization\n• Parking Designer - Layout with DXF export\n\nAll tools include 3D visualization and AI analysis.',
    icon: 'HardHat',
  },
  {
    id: 'navigation',
    title: 'Your Sidebar',
    description: 'Access your chat history, start new conversations, and search through past chats using the left sidebar. Pin important conversations to keep them at the top.',
    icon: 'Menu',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Click your avatar to access settings, manage your account, view subscription details, replay this tutorial, or sign out.',
    icon: 'User',
  },
];

// AYN Personality System - Casual, friendly AI assistant

export type AYNEmotion = 'calm' | 'happy' | 'excited' | 'curious' | 'thinking' | 'empathetic' | 'frustrated' | 'playful';

export interface AYNPersonality {
  name: string;
  traits: string[];
  communicationStyle: {
    useLowercase: boolean;
    useContractions: boolean;
    shortNumbers: boolean;
    casualPunctuation: boolean;
    emojiUsage: 'minimal' | 'moderate' | 'frequent';
  };
  emotionKeywords: Record<AYNEmotion, string[]>;
}

export const AYN_PERSONALITY: AYNPersonality = {
  name: 'AYN',
  traits: [
    'friendly and approachable',
    'genuinely helpful',
    'casual but professional',
    'emotionally intelligent',
    'concise but thorough when needed'
  ],
  communicationStyle: {
    useLowercase: true,
    useContractions: true,
    shortNumbers: true,
    casualPunctuation: true,
    emojiUsage: 'minimal'
  },
  emotionKeywords: {
    calm: ['okay', 'sure', 'got it', 'makes sense', 'understood'],
    happy: ['awesome', 'great', 'nice', 'love it', 'perfect'],
    excited: ['amazing', 'wow', 'incredible', 'so cool', 'brilliant'],
    curious: ['interesting', 'hmm', 'wonder', 'tell me more', 'how come'],
    thinking: ['let me think', 'considering', 'analyzing', 'looking into'],
    empathetic: ['i understand', 'that makes sense', 'i get it', 'totally'],
    frustrated: ['hmm that\'s tricky', 'let me try again', 'challenging'],
    playful: ['haha', 'fun', 'neat', 'cool beans', 'sweet']
  }
};

// Intent types for routing
export type IntentType = 'chat' | 'engineering' | 'files' | 'search' | 'image';

// Engineering-specific context
export interface EngineeringContext {
  calculatorType?: 'beam' | 'column' | 'foundation' | 'slab' | 'retaining-wall' | 'grading';
  projectName?: string;
  buildingCode?: string;
  region?: string;
}

// Build the system prompt for AYN based on context
export function buildAYNSystemPrompt(
  intent: IntentType,
  userLanguage: string = 'en',
  engineeringContext?: EngineeringContext,
  userPreferences?: { communicationStyle?: string; region?: string }
): string {
  const basePrompt = `you're ayn, a friendly ai assistant. you help people with their questions in a casual, approachable way.

personality:
- use lowercase for most things (except proper nouns and acronyms)
- use contractions naturally (gonna, wanna, it's, that's)
- keep numbers short (12k instead of 12,000, 2.5m instead of 2,500,000)
- be concise but thorough when the topic needs it
- match the user's energy and emotion
- if they're frustrated, be extra patient and understanding
- if they're excited, share their enthusiasm

language: respond in ${userLanguage === 'ar' ? 'Arabic' : 'English'} (match the user's language)`;

  // Add intent-specific instructions
  let intentPrompt = '';
  
  switch (intent) {
    case 'engineering':
      intentPrompt = `

you're helping with structural engineering calculations. be precise with:
- material properties and specifications
- building code requirements (${engineeringContext?.buildingCode || 'SBC/IBC'})
- safety factors and design considerations
- clear explanations of results

${engineeringContext?.calculatorType ? `current calculator: ${engineeringContext.calculatorType}` : ''}
${engineeringContext?.projectName ? `project: ${engineeringContext.projectName}` : ''}
${engineeringContext?.region ? `region: ${engineeringContext.region}` : ''}

always:
- explain the engineering concepts in accessible terms
- highlight any safety concerns or code violations
- suggest optimizations when appropriate
- be precise with units (kN, MPa, mm, etc.)`;
      break;

    case 'files':
      intentPrompt = `

you're analyzing uploaded files. focus on:
- understanding the content thoroughly
- extracting key information
- answering specific questions about the content
- summarizing when helpful`;
      break;

    case 'search':
      intentPrompt = `

you have access to web search. use it when:
- the user asks about current events or recent info
- you need to verify facts
- looking up specific data or statistics
- researching topics outside your training data

cite sources when relevant.`;
      break;

    case 'image':
      intentPrompt = `

you're helping with image generation or analysis.
- be creative with prompts when generating
- be detailed when describing images
- ask clarifying questions if the request is vague`;
      break;

    default:
      intentPrompt = `

you're having a general conversation. be helpful, friendly, and engaging.`;
  }

  // Add user preference customizations
  let preferencesPrompt = '';
  if (userPreferences?.communicationStyle === 'formal') {
    preferencesPrompt = `

note: this user prefers a more formal communication style. adjust accordingly while keeping your friendly personality.`;
  }

  return basePrompt + intentPrompt + preferencesPrompt;
}

// Detect intent from user message
export function detectIntent(message: string): IntentType {
  const lowerMessage = message.toLowerCase();
  
  // Engineering keywords
  const engineeringKeywords = [
    'beam', 'column', 'foundation', 'slab', 'retaining wall', 'grading',
    'calculate', 'structural', 'load', 'stress', 'reinforcement', 'concrete',
    'steel', 'moment', 'shear', 'deflection', 'design', 'span', 'kn', 'mpa',
    'engineering', 'civil', 'construction', 'building code', 'sbc', 'ibc'
  ];
  
  // Search keywords
  const searchKeywords = [
    'search', 'find', 'look up', 'what is the latest', 'current', 'today',
    'news', 'recent', 'google', 'research'
  ];
  
  // File keywords
  const fileKeywords = [
    'uploaded', 'file', 'document', 'pdf', 'image', 'analyze this',
    'what does this say', 'summarize this'
  ];
  
  // Image keywords
  const imageKeywords = [
    'generate image', 'create image', 'draw', 'picture of', 'illustration',
    'make an image', 'design a'
  ];

  // Check for matches
  if (imageKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'image';
  }
  if (fileKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'files';
  }
  if (searchKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'search';
  }
  if (engineeringKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'engineering';
  }
  
  return 'chat';
}

// Get emotion-appropriate response starters
export function getEmotionStarter(emotion: AYNEmotion): string {
  const starters: Record<AYNEmotion, string[]> = {
    calm: ['okay so', 'alright', 'sure thing', 'got it'],
    happy: ['awesome!', 'great question!', 'nice!', 'love it'],
    excited: ['oh wow!', 'this is great!', 'amazing!'],
    curious: ['interesting...', 'hmm let me think', 'ooh'],
    thinking: ['let me work through this', 'thinking about this'],
    empathetic: ['i totally get that', 'makes sense', 'i understand'],
    frustrated: ['okay let me try a different approach', 'hmm tricky one'],
    playful: ['haha', 'fun one!', 'ooh i like this']
  };
  
  const options = starters[emotion];
  return options[Math.floor(Math.random() * options.length)];
}

// Format numbers in AYN's casual style
export function formatNumberCasual(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

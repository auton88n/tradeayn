import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

// Analyze response text to determine AYN's emotion
export const analyzeResponseEmotion = (response: string): AYNEmotion => {
  const lowerResponse = response.toLowerCase();
  
  // Happy indicators
  const happyPatterns = [
    'perfect!', 'great!', 'excellent!', 'wonderful!', 'awesome!',
    'happy to help', 'glad to', 'done!', 'completed', 'success',
    'رائع', 'ممتاز', 'تمام', 'مثالي'
  ];
  
  // Excited indicators
  const excitedPatterns = [
    'exciting!', 'amazing!', 'incredible!', 'wow!', 'fantastic!',
    'let\'s do this', 'can\'t wait', 'thrilled', 'ready to',
    'مذهل', 'حماسي', 'متحمس'
  ];
  
  // Curious/questioning indicators
  const curiousPatterns = [
    'interesting', 'tell me more', 'could you explain', 'i\'m curious',
    'what do you think', 'how about', 'have you considered',
    'مثير للاهتمام', 'أخبرني المزيد', 'ما رأيك'
  ];
  
  // Thinking/processing indicators
  const thinkingPatterns = [
    'analyzing', 'processing', 'calculating', 'let me think',
    'considering', 'evaluating', 'researching',
    'أحلل', 'أفكر', 'أدرس'
  ];
  
  // Frustrated/uncertain indicators
  const frustratedPatterns = [
    'unfortunately', 'i\'m not sure', 'i cannot', 'unable to',
    'error', 'failed', 'problem', 'issue',
    'للأسف', 'لا أستطيع', 'مشكلة'
  ];
  
  // Check patterns in order of specificity
  if (frustratedPatterns.some(p => lowerResponse.includes(p))) return 'frustrated';
  if (excitedPatterns.some(p => lowerResponse.includes(p))) return 'excited';
  if (happyPatterns.some(p => lowerResponse.includes(p))) return 'happy';
  if (curiousPatterns.some(p => lowerResponse.includes(p))) return 'curious';
  if (thinkingPatterns.some(p => lowerResponse.includes(p))) return 'thinking';
  
  // Default to calm for neutral responses
  return 'calm';
};

// Get emotion from message type
export const getEmotionFromMessageType = (type: 'thinking' | 'speaking' | 'question' | 'excited' | 'uncertain'): AYNEmotion => {
  const mapping: Record<string, AYNEmotion> = {
    thinking: 'thinking',
    speaking: 'calm',
    question: 'curious',
    excited: 'excited',
    uncertain: 'frustrated',
  };
  return mapping[type] || 'calm';
};

// Bubble type based on content
export type BubbleType = 'thinking' | 'speaking' | 'question' | 'excited' | 'uncertain';

export const getBubbleType = (content: string): BubbleType => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('?') || lowerContent.includes('tell me') || lowerContent.includes('could you')) {
    return 'question';
  }
  if (lowerContent.includes('!') && (lowerContent.includes('great') || lowerContent.includes('perfect') || lowerContent.includes('amazing'))) {
    return 'excited';
  }
  if (lowerContent.includes('thinking') || lowerContent.includes('analyzing') || lowerContent.includes('processing')) {
    return 'thinking';
  }
  if (lowerContent.includes('unfortunately') || lowerContent.includes('unable') || lowerContent.includes('error')) {
    return 'uncertain';
  }
  return 'speaking';
};

// Emotion color for inline styles
export const getEmotionColor = (emotion: AYNEmotion): string => {
  const colors: Record<AYNEmotion, string> = {
    calm: 'hsl(0, 0%, 50%)',
    happy: 'hsl(142, 71%, 45%)',
    excited: 'hsl(25, 95%, 53%)',
    thinking: 'hsl(217, 91%, 60%)',
    frustrated: 'hsl(0, 72%, 51%)',
    curious: 'hsl(270, 76%, 60%)',
  };
  return colors[emotion];
};

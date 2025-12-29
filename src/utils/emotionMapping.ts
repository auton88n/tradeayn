import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

// Analyze response text to determine AYN's emotion - all 11 emotions with Arabic support
export const analyzeResponseEmotion = (response: string): AYNEmotion => {
  const lowerResponse = response.toLowerCase();
  
  // Check patterns in order of specificity (most specific negative first)
  
  // Mad - strong anger (check first)
  if (/angry|furious|unacceptable|hate|outrageous|ridiculous|terrible|awful|worst|غاضب|مستفز|سيء جداً/.test(lowerResponse)) return 'mad';
  
  // Frustrated - moderate difficulty  
  if (/unfortunately|i'm not sure|i cannot|unable to|error|failed|problem|issue|frustrating|difficult|challenging|tricky|للأسف|لا أستطيع|مشكلة|صعب/.test(lowerResponse)) return 'frustrated';
  
  // Sad - apologetic
  if (/sorry to hear|sad|disappointed|miss you|regret|apologize|heartbroken|upset|حزين|أعتذر|آسف/.test(lowerResponse)) return 'sad';
  
  // Bored - low energy
  if (/whatever|i guess|if you say so|meh|boring|dull|same old|nothing new|ممل|عادي|كما تشاء/.test(lowerResponse)) return 'bored';
  
  // Excited - high energy positive (! helps distinguish from happy)
  if (/exciting!|amazing!|incredible!|wow!|fantastic!|let's do this|can't wait|thrilled|🎉|congratulations|مذهل|رائع جداً|متحمس/.test(lowerResponse)) return 'excited';
  
  // Happy - positive  
  if (/perfect|great!|excellent|wonderful|awesome|happy to help|glad to|done!|completed|success|love it|رائع|ممتاز|تمام|مثالي/.test(lowerResponse)) return 'happy';
  
  // Supportive - empathetic
  if (/here to help|support you|understand|i get it|you're not alone|أنا هنا|أفهمك|معك/.test(lowerResponse)) return 'supportive';
  
  // Comfort - reassuring  
  if (/don't worry|it's okay|no problem|take your time|you've got this|you can do|everything will|لا تقلق|لا مشكلة|خذ وقتك/.test(lowerResponse)) return 'comfort';
  
  // Curious - questioning
  if (/interesting|tell me more|could you explain|i'm curious|what do you think|how about|have you considered|مثير للاهتمام|أخبرني المزيد|ما رأيك/.test(lowerResponse)) return 'curious';
  
  // Thinking - processing
  if (/analyzing|processing|calculating|let me think|considering|evaluating|researching|looking into|أحلل|أفكر|أدرس/.test(lowerResponse)) return 'thinking';
  
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

// Emotion colors - psychology-based palette matching eye colors
export const getEmotionColor = (emotion: AYNEmotion): string => {
  const colors: Record<AYNEmotion, string> = {
    calm: 'hsl(195, 35%, 47%)',      // soft ocean blue #4A90A4
    happy: 'hsl(38, 100%, 65%)',     // warm peach-gold #FFB84D
    excited: 'hsl(0, 100%, 67%)',    // electric coral #FF5757
    thinking: 'hsl(239, 84%, 61%)',  // royal indigo #4B4DED
    curious: 'hsl(280, 50%, 62%)',   // bright magenta #B565D8
    frustrated: 'hsl(9, 78%, 56%)',  // hot orange-red #E74C3C
    sad: 'hsl(265, 10%, 63%)',       // muted lavender #9B8FA6
    mad: 'hsl(354, 80%, 43%)',       // deep crimson #C21626
    bored: 'hsl(200, 8%, 57%)',      // muted slate-blue #8A979C
    comfort: 'hsl(344, 58%, 65%)',   // deep warm rose #D98695
    supportive: 'hsl(15, 62%, 75%)', // soft rose-beige #E8A598
  };
  return colors[emotion];
};

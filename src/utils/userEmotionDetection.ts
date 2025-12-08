/**
 * User Emotion Detection - Analyzes user messages to understand their emotional state
 * Enables AYN to respond empathetically to how the user is feeling
 */

export type UserEmotion = 'happy' | 'sad' | 'frustrated' | 'excited' | 'anxious' | 'neutral' | 'confused';

interface EmotionAnalysis {
  emotion: UserEmotion;
  intensity: number; // 0-1
  indicators: string[];
}

// Emotion detection patterns
const EMOTION_PATTERNS: Record<UserEmotion, { keywords: string[]; patterns: RegExp[] }> = {
  happy: {
    keywords: [
      'thank', 'thanks', 'perfect', 'love', 'awesome', 'great', 'amazing', 'wonderful',
      'excellent', 'fantastic', 'brilliant', 'nice', 'good', 'cool', 'yay', 'yes',
      'شكرا', 'ممتاز', 'رائع', 'حلو', 'جميل', 'احبه'
    ],
    patterns: [/😊|😄|😃|🙂|😁|🎉|❤️|💚|👍|🙏|✨/g, /!{1,2}$/]
  },
  sad: {
    keywords: [
      'unfortunately', 'sad', 'disappointed', 'sorry', 'miss', 'lost', 'alone',
      'depressed', 'down', 'upset', 'heartbroken', 'sigh', 'crying',
      'حزين', 'مؤسف', 'خسارة', 'للأسف'
    ],
    patterns: [/😢|😔|😞|😿|💔|😭|🥺/g, /\.{3,}/]
  },
  frustrated: {
    keywords: [
      'ugh', 'frustrated', 'annoying', 'annoyed', 'angry', 'hate', 'stupid',
      'broken', 'useless', 'waste', 'terrible', 'worst', 'fail', 'failed',
      'doesn\'t work', 'not working', 'still not', 'again', 'why',
      'مزعج', 'غاضب', 'لا يعمل', 'مكسور'
    ],
    patterns: [
      /!{2,}/g,           // Multiple exclamation marks
      /\?{2,}/g,          // Multiple question marks
      /[A-Z]{3,}/g,       // CAPS LOCK text
      /😤|😠|😡|🤬|💢/g
    ]
  },
  excited: {
    keywords: [
      'wow', 'amazing', 'incredible', 'can\'t wait', 'excited', 'awesome',
      'omg', 'yes', 'finally', 'love it', 'best', 'unbelievable',
      'مذهل', 'رهيب', 'واو', 'لا يصدق'
    ],
    patterns: [/!{2,}/g, /🎉|🔥|⭐|💥|🚀|✨|😍|🤩/g, /^(YES|WOW|OMG)/i]
  },
  anxious: {
    keywords: [
      'worried', 'nervous', 'anxious', 'scared', 'afraid', 'hope', 'hopefully',
      'what if', 'urgent', 'asap', 'quickly', 'hurry', 'deadline', 'stress',
      'قلق', 'خائف', 'عاجل', 'سريع'
    ],
    patterns: [/😰|😨|😱|😬|🥶|😥/g, /\?{1,}$/]
  },
  confused: {
    keywords: [
      'confused', 'don\'t understand', 'doesn\'t make sense', 'what', 'how',
      'unclear', 'lost', 'huh', 'wait', 'explain', 'meaning', 'mean',
      'مرتبك', 'لا أفهم', 'كيف', 'ماذا'
    ],
    patterns: [/\?{2,}/g, /🤔|😕|❓|❔|🧐/g, /^(what|how|huh|wait)\??$/i]
  },
  neutral: {
    keywords: [],
    patterns: []
  }
};

// Intensity modifiers
const INTENSITY_BOOSTERS = [
  /!{2,}/,        // Multiple exclamation marks boost intensity
  /\?{2,}/,       // Multiple question marks
  /[A-Z]{4,}/,    // CAPS LOCK words
  /very|really|so|extremely|absolutely|totally|completely/i,
  /جدا|للغاية|كثير/
];

/**
 * Analyze user message to detect their emotional state
 */
export const analyzeUserEmotion = (message: string): EmotionAnalysis => {
  const lowerMessage = message.toLowerCase();
  const indicators: string[] = [];
  const scores: Record<UserEmotion, number> = {
    happy: 0,
    sad: 0,
    frustrated: 0,
    excited: 0,
    anxious: 0,
    confused: 0,
    neutral: 0.1 // Base score so neutral wins if nothing else matches
  };

  // Check each emotion's patterns
  for (const [emotion, { keywords, patterns }] of Object.entries(EMOTION_PATTERNS)) {
    if (emotion === 'neutral') continue;

    // Check keywords
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[emotion as UserEmotion] += 1;
        indicators.push(keyword);
      }
    }

    // Check regex patterns
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        scores[emotion as UserEmotion] += matches.length * 0.5;
        indicators.push(...matches);
      }
    }
  }

  // Find highest scoring emotion
  let maxScore = 0;
  let detectedEmotion: UserEmotion = 'neutral';
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion as UserEmotion;
    }
  }

  // Calculate intensity (0-1)
  let intensity = Math.min(maxScore / 3, 1); // Normalize to 0-1

  // Boost intensity for modifiers
  for (const booster of INTENSITY_BOOSTERS) {
    if (booster.test(message)) {
      intensity = Math.min(intensity + 0.2, 1);
    }
  }

  return {
    emotion: detectedEmotion,
    intensity,
    indicators: [...new Set(indicators)] // Remove duplicates
  };
};

/**
 * Get the appropriate AYN emotion response for a user's emotion
 */
export const getEmpathyResponse = (userEmotion: UserEmotion): {
  aynEmotion: 'calm' | 'happy' | 'excited' | 'thinking' | 'frustrated' | 'curious';
  hapticType: 'empathy' | 'comfort' | 'mirror-joy' | 'patience' | 'calm' | 'curious';
} => {
  switch (userEmotion) {
    case 'happy':
      return { aynEmotion: 'happy', hapticType: 'mirror-joy' };
    case 'excited':
      return { aynEmotion: 'excited', hapticType: 'mirror-joy' };
    case 'sad':
      return { aynEmotion: 'calm', hapticType: 'comfort' };
    case 'frustrated':
      return { aynEmotion: 'curious', hapticType: 'patience' };
    case 'anxious':
      return { aynEmotion: 'calm', hapticType: 'comfort' };
    case 'confused':
      return { aynEmotion: 'curious', hapticType: 'curious' };
    default:
      return { aynEmotion: 'calm', hapticType: 'calm' };
  }
};

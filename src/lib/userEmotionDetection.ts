/**
 * User Emotion Detection - Analyzes user messages to understand their emotional state
 * Enables AYN to respond empathetically to how the user is feeling
 */

export type UserEmotion = 'happy' | 'sad' | 'frustrated' | 'excited' | 'anxious' | 'neutral' | 'confused' | 'angry' | 'grieving' | 'overwhelmed';

// Import AYNEmotion from context for consistency
import type { AYNEmotion } from '@/stores/emotionStore';
export type { AYNEmotion };

export type AYNBehavior = 'supportive' | 'celebratory' | 'patient' | 'reassuring' | 'attentive' | 'playful';
export type HapticPattern = 'empathy' | 'comfort' | 'mirror-joy' | 'patience' | 'calm' | 'curious' | 'celebration' | 'reassurance';

interface EmotionAnalysis {
  emotion: UserEmotion;
  intensity: number; // 0-1
  indicators: string[];
}

export interface EmpathyResponse {
  aynEmotion: AYNEmotion;
  aynBehavior: AYNBehavior;
  hapticType: HapticPattern;
  pupilReaction: 'normal' | 'dilate-slightly' | 'dilate-more' | 'contract';
  blinkPattern: 'normal' | 'slow-comfort' | 'quick-attentive' | 'double-understanding';
  colorIntensity: number;
  description: string;
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
      'ugh', 'frustrated', 'annoying', 'annoyed', 'hate', 'stupid',
      'broken', 'useless', 'waste', 'terrible', 'worst', 'fail', 'failed',
      'doesn\'t work', 'not working', 'still not', 'again', 'why',
      'مزعج', 'لا يعمل', 'مكسور'
    ],
    patterns: [
      /!{2,}/g,
      /\?{2,}/g,
      /[A-Z]{3,}/g,
      /😤|😠|🤬|💢/g
    ]
  },
  angry: {
    keywords: [
      'angry', 'mad', 'furious', 'rage', 'pissed', 'hate', 'sick of',
      'غاضب', 'زعلان'
    ],
    patterns: [/😡|🤬|💢|👊/g, /!{3,}/g]
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
  grieving: {
    keywords: [
      'passed away', 'died', 'death', 'funeral', 'lost', 'grief', 'mourning',
      'gone', 'miss', 'never again', 'وفاة', 'توفي', 'رحل'
    ],
    patterns: [/🕯️|🖤|💔|😢|😭/g]
  },
  overwhelmed: {
    keywords: [
      'overwhelmed', 'too much', 'can\'t handle', 'drowning', 'exhausted',
      'burnt out', 'burnout', 'stressed', 'breaking down', 'منهك', 'تعبان'
    ],
    patterns: [/😫|😩|🥴|😵/g]
  },
  neutral: {
    keywords: [],
    patterns: []
  }
};

// Intensity modifiers
const INTENSITY_BOOSTERS = [
  /!{2,}/,
  /\?{2,}/,
  /[A-Z]{4,}/,
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
    angry: 0,
    excited: 0,
    anxious: 0,
    confused: 0,
    grieving: 0,
    overwhelmed: 0,
    neutral: 0.1
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
  let intensity = Math.min(maxScore / 3, 1);

  // Boost intensity for modifiers
  for (const booster of INTENSITY_BOOSTERS) {
    if (booster.test(message)) {
      intensity = Math.min(intensity + 0.2, 1);
    }
  }

  return {
    emotion: detectedEmotion,
    intensity,
    indicators: [...new Set(indicators)]
  };
};

/**
 * Get the appropriate empathetic AYN response for a user's emotion
 * AYN responds WITH empathy, not BY mirroring
 */
export const getEmpathyResponse = (userEmotion: UserEmotion): EmpathyResponse => {
  // Comprehensive empathy mapping - AYN responds supportively, not by mirroring negative emotions
  const empathyMap: Record<UserEmotion, EmpathyResponse> = {
    // Positive emotions - AYN mirrors and celebrates
    happy: {
      aynEmotion: 'happy',
      aynBehavior: 'celebratory',
      hapticType: 'mirror-joy',
      pupilReaction: 'dilate-slightly',
      blinkPattern: 'quick-attentive',
      colorIntensity: 0.8,
      description: 'Sharing in your happiness'
    },
    excited: {
      aynEmotion: 'excited',
      aynBehavior: 'celebratory',
      hapticType: 'celebration',
      pupilReaction: 'dilate-more',
      blinkPattern: 'quick-attentive',
      colorIntensity: 0.9,
      description: 'Matching your excitement'
    },
    
    // Negative emotions - AYN provides supportive counter-response
    sad: {
      aynEmotion: 'calm',
      aynBehavior: 'supportive',
      hapticType: 'comfort',
      pupilReaction: 'dilate-slightly',
      blinkPattern: 'slow-comfort',
      colorIntensity: 0.6,
      description: 'Offering warm comfort'
    },
    grieving: {
      aynEmotion: 'calm',
      aynBehavior: 'supportive',
      hapticType: 'comfort',
      pupilReaction: 'dilate-more',
      blinkPattern: 'slow-comfort',
      colorIntensity: 0.5,
      description: 'Deep empathy and gentle presence'
    },
    frustrated: {
      aynEmotion: 'curious',
      aynBehavior: 'patient',
      hapticType: 'patience',
      pupilReaction: 'normal',
      blinkPattern: 'double-understanding',
      colorIntensity: 0.7,
      description: 'Patient understanding, ready to help'
    },
    angry: {
      aynEmotion: 'calm',
      aynBehavior: 'patient',
      hapticType: 'calm',
      pupilReaction: 'contract',
      blinkPattern: 'slow-comfort',
      colorIntensity: 0.5,
      description: 'Calm, grounding presence'
    },
    anxious: {
      aynEmotion: 'calm',
      aynBehavior: 'reassuring',
      hapticType: 'reassurance',
      pupilReaction: 'dilate-slightly',
      blinkPattern: 'slow-comfort',
      colorIntensity: 0.6,
      description: 'Steady, reassuring calm'
    },
    overwhelmed: {
      aynEmotion: 'calm',
      aynBehavior: 'supportive',
      hapticType: 'comfort',
      pupilReaction: 'dilate-slightly',
      blinkPattern: 'slow-comfort',
      colorIntensity: 0.5,
      description: 'Gentle, organized support'
    },
    confused: {
      aynEmotion: 'curious',
      aynBehavior: 'attentive',
      hapticType: 'curious',
      pupilReaction: 'dilate-slightly',
      blinkPattern: 'quick-attentive',
      colorIntensity: 0.7,
      description: 'Engaged and ready to clarify'
    },
    
    // Neutral - AYN is attentive and ready
    neutral: {
      aynEmotion: 'calm',
      aynBehavior: 'attentive',
      hapticType: 'calm',
      pupilReaction: 'normal',
      blinkPattern: 'normal',
      colorIntensity: 0.5,
      description: 'Attentive and present'
    }
  };

  return empathyMap[userEmotion] || empathyMap.neutral;
};

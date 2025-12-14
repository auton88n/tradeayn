// Real-time emotion tracking during user typing
// Analyzes input as user types to create responsive eye behavior

import { useState, useEffect, useCallback, useRef } from 'react';
import { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface EmotionSignal {
  emotion: AYNEmotion;
  intensity: number; // 0-1
  trigger: string; // what word/pattern triggered it
}

interface RealtimeEmotionState {
  detectedEmotion: AYNEmotion | null;
  intensity: number;
  isTypingQuestion: boolean;
  isTypingEmotional: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  triggers: string[];
}

// Emotion patterns for real-time detection - EXPANDED with 50+ keywords each
const EMOTION_PATTERNS = {
  frustrated: {
    keywords: [
      // English - common frustration expressions
      'frustrated', 'annoying', 'broken', 'stuck', 'cant', "can't", 'error', 'bug', 
      'issue', 'problem', 'wrong', 'fail', 'failed', 'failing', 'ugh', 'damn', 'dammit',
      'hours', 'days', 'tried everything', 'nothing works', 'not working', 'doesnt work',
      "doesn't work", 'wtf', 'seriously', 'come on', 'are you kidding', 'impossible',
      'keeps happening', 'again', 'still broken', 'wasted time', 'giving up', 'fed up',
      'sick of', 'tired of', 'had enough', 'useless', 'pointless', 'why wont', "why won't",
      'so annoying', 'drives me crazy', 'losing patience', 'argh', 'grr', 'ffs',
      // Arabic
      'محبط', 'مشكلة', 'خطأ', 'لا يعمل', 'مزعج', 'عالق', 'فشل', 'صعب جداً', 'مستحيل'
    ],
    emotion: 'frustrated' as AYNEmotion, // Show frustrated (red) - FIXED from 'thinking'
    intensity: 0.7
  },
  excited: {
    keywords: [
      // English - excitement and enthusiasm
      'amazing', 'awesome', 'love', 'love it', 'great', 'perfect', 'excellent', 
      'fantastic', 'incredible', 'wow', 'yes', 'yay', 'finally', 'worked', 'success',
      'brilliant', 'wonderful', 'superb', 'outstanding', 'magnificent', 'epic',
      'so cool', 'so good', 'best ever', 'mind blown', 'blown away', 'impressed',
      'cant believe', "can't believe", 'no way', 'omg', 'oh my god', 'insane',
      'genius', 'legendary', 'lit', 'fire', 'sick', 'dope', 'hype', 'hyped',
      'pumped', 'stoked', 'thrilled', 'ecstatic', 'overjoyed', 'absolutely',
      // Arabic
      'رائع', 'ممتاز', 'مذهل', 'نجح', 'عظيم', 'خيالي', 'لا يصدق', 'مبهر', 'حلو'
    ],
    emotion: 'excited' as AYNEmotion,
    intensity: 0.8
  },
  curious: {
    keywords: [
      // English - questions and curiosity
      'how', 'what', 'why', 'when', 'where', 'which', 'could', 'would', 'should',
      'can you', 'tell me', 'explain', 'understand', 'curious', 'wonder', 'wondering',
      'interested', 'fascinating', 'intriguing', 'want to know', 'need to know',
      'show me', 'teach me', 'help me understand', 'what if', 'is it possible',
      'how does', 'how do', 'what does', 'what is', 'who is', 'whats', "what's",
      'elaborate', 'clarify', 'details', 'more info', 'more about', 'tell me about',
      // Arabic
      'كيف', 'ماذا', 'لماذا', 'متى', 'أين', 'من', 'هل', 'أريد أن أعرف', 'اشرح لي'
    ],
    emotion: 'curious' as AYNEmotion,
    intensity: 0.6
  },
  happy: {
    keywords: [
      // English - gratitude and happiness
      'thank', 'thanks', 'thx', 'ty', 'appreciate', 'grateful', 'thankful',
      'helpful', 'nice', 'good', 'glad', 'happy', 'pleased', 'satisfied',
      'wonderful', 'lovely', 'sweet', 'kind', 'awesome job', 'well done',
      'nice work', 'good job', 'made my day', 'you rock', 'youre the best',
      "you're the best", 'lifesaver', 'exactly what i needed', 'this is great',
      'so happy', 'feeling good', 'cheers', 'bless', 'much appreciated',
      'couldnt ask for more', "couldn't ask for more", 'perfect thank', 'thanks so much',
      // Arabic
      'شكرا', 'ممتن', 'سعيد', 'مبسوط', 'فرحان', 'شكراً جزيلاً', 'الله يعطيك العافية'
    ],
    emotion: 'happy' as AYNEmotion,
    intensity: 0.7
  },
  anxious: {
    keywords: [
      // English - worry and urgency
      'worried', 'nervous', 'anxious', 'scared', 'afraid', 'urgent', 'asap',
      'deadline', 'important', 'critical', 'emergency', 'help me', 'please help',
      'running out of time', 'need this now', 'panic', 'panicking', 'stressed',
      'stress', 'pressure', 'overwhelming', 'too much', 'freaking out', 'losing it',
      'cant handle', "can't handle", 'desperate', 'need help', 'sos', 'hurry',
      // Arabic
      'قلق', 'عاجل', 'مهم', 'خائف', 'متوتر', 'ضغط', 'محتاج مساعدة'
    ],
    emotion: 'thinking' as AYNEmotion, // Show calm thinking to reassure anxious users
    intensity: 0.6
  },
  sad: {
    keywords: [
      // English - sadness and disappointment
      'sad', 'sorry', 'disappointed', 'disappointing', 'miss', 'missing', 'regret',
      'apologize', 'heartbroken', 'upset', 'depressed', 'lonely', 'cry', 'crying',
      'tears', 'devastating', 'devastated', 'painful', 'hurts', 'hurt', 'grief',
      'grieving', 'loss', 'lost', 'alone', 'empty', 'hopeless', 'helpless',
      'unfortunate', 'tragically', 'sadly', 'i feel bad', 'feel terrible',
      'broke my heart', 'down', 'feeling down', 'not okay', 'struggling',
      // Arabic
      'حزين', 'آسف', 'أفتقدك', 'محزن', 'مؤلم', 'وحيد', 'يائس', 'بكاء'
    ],
    emotion: 'sad' as AYNEmotion,
    intensity: 0.75
  },
  mad: {
    keywords: [
      // English - anger expressions
      'angry', 'furious', 'unacceptable', 'hate', 'hate this', 'outrageous',
      'ridiculous', 'terrible', 'awful', 'worst', 'stupid', 'idiot', 'pissed',
      'pissed off', 'livid', 'enraged', 'fuming', 'raging', 'infuriated',
      'disgusted', 'disgraceful', 'shameful', 'pathetic', 'how dare', 'bullshit',
      'bs', 'scam', 'fraud', 'liar', 'lying', 'cheated', 'betrayed', 'unfair',
      'injustice', 'never again', 'done with', 'had it', 'enough is enough',
      // Arabic
      'غاضب', 'مستفز', 'سيء جداً', 'غضبان', 'زعلان', 'مقرف', 'فظيع'
    ],
    emotion: 'mad' as AYNEmotion,
    intensity: 0.8
  },
  bored: {
    keywords: [
      // English - boredom and disinterest
      'whatever', 'i guess', 'fine', 'if you say so', 'meh', 'boring', 'bored',
      'dull', 'same old', 'nothing new', 'yawn', 'so what', 'who cares',
      'doesnt matter', "doesn't matter", 'not interested', 'uninteresting',
      'blah', 'bland', 'monotonous', 'repetitive', 'tedious', 'drab',
      'uninspiring', 'stale', 'tired of this', 'over it', 'next', 'skip',
      // Arabic
      'ممل', 'عادي', 'كما تشاء', 'زهقان', 'مش مهتم', 'طيب', 'ماشي'
    ],
    emotion: 'bored' as AYNEmotion,
    intensity: 0.5
  }
};

// Question patterns
const QUESTION_PATTERNS = [
  /\?$/,
  /^(how|what|why|when|where|which|who|can|could|would|should|is|are|do|does|will)/i,
  /^(كيف|ماذا|لماذا|متى|أين|من|هل)/
];

export const useRealtimeEmotionTracking = (inputText: string, isTyping: boolean) => {
  const [emotionState, setEmotionState] = useState<RealtimeEmotionState>({
    detectedEmotion: null,
    intensity: 0,
    isTypingQuestion: false,
    isTypingEmotional: false,
    sentiment: 'neutral',
    triggers: []
  });
  
  const lastAnalyzedRef = useRef('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const analyzeText = useCallback((text: string) => {
    if (!text || text.length < 3) {
      setEmotionState({
        detectedEmotion: null,
        intensity: 0,
        isTypingQuestion: false,
        isTypingEmotional: false,
        sentiment: 'neutral',
        triggers: []
      });
      return;
    }

    const lowerText = text.toLowerCase();
    const triggers: string[] = [];
    let detectedEmotion: AYNEmotion | null = null;
    let maxIntensity = 0;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';

    // Check each emotion pattern
    for (const [emotionType, pattern] of Object.entries(EMOTION_PATTERNS)) {
      for (const keyword of pattern.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          triggers.push(keyword);
          if (pattern.intensity > maxIntensity) {
            maxIntensity = pattern.intensity;
            detectedEmotion = pattern.emotion;
          }
          
          // Determine sentiment
          if (emotionType === 'excited' || emotionType === 'happy') {
            sentiment = 'positive';
          } else if (emotionType === 'frustrated' || emotionType === 'anxious') {
            sentiment = 'negative';
          }
        }
      }
    }

    // Check if typing a question
    const isTypingQuestion = QUESTION_PATTERNS.some(pattern => pattern.test(text));
    if (isTypingQuestion && !detectedEmotion) {
      detectedEmotion = 'curious';
      maxIntensity = 0.5;
    }

    // Boost intensity if multiple triggers found
    if (triggers.length > 2) {
      maxIntensity = Math.min(1, maxIntensity + 0.2);
    }

    setEmotionState({
      detectedEmotion,
      intensity: maxIntensity,
      isTypingQuestion,
      isTypingEmotional: triggers.length > 0,
      sentiment,
      triggers
    });
  }, []);

  // Debounced analysis as user types
  useEffect(() => {
    if (!isTyping || inputText === lastAnalyzedRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Check for high-intensity keywords immediately (no debounce)
    const lowerText = inputText.toLowerCase();
    const highIntensityPatterns = [
      // Mad/angry - immediate red
      'angry', 'furious', 'hate', 'pissed', 'livid', 'enraged', 'غاضب',
      // Excited - immediate orange
      'amazing', 'awesome', 'incredible', 'wow', 'omg', 'مذهل',
      // Sad - immediate muted blue
      'sad', 'crying', 'heartbroken', 'devastated', 'حزين',
      // Happy - immediate green
      'thank you so much', 'youre the best', 'love it', 'شكرا جزيلا',
      // Frustrated - immediate red
      'wtf', 'so frustrated', 'fed up', 'had enough', 'محبط جداً'
    ];
    const hasHighIntensity = highIntensityPatterns.some(p => lowerText.includes(p));
    
    if (hasHighIntensity) {
      // Immediate analysis for strong emotions
      lastAnalyzedRef.current = inputText;
      analyzeText(inputText);
    } else {
      // Reduced debounce for faster response (was 300ms)
      debounceRef.current = setTimeout(() => {
        lastAnalyzedRef.current = inputText;
        analyzeText(inputText);
      }, 150);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputText, isTyping, analyzeText]);

  // Reset when not typing
  useEffect(() => {
    if (!isTyping && emotionState.detectedEmotion) {
      const timeout = setTimeout(() => {
        setEmotionState(prev => ({
          ...prev,
          detectedEmotion: null,
          intensity: 0
        }));
      }, 2000); // Keep emotion for 2s after stopping

      return () => clearTimeout(timeout);
    }
  }, [isTyping, emotionState.detectedEmotion]);

  return emotionState;
};

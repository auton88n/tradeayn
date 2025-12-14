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

// Emotion patterns for real-time detection
const EMOTION_PATTERNS = {
  frustrated: {
    keywords: ['frustrated', 'annoying', 'broken', 'stuck', 'help', 'cant', "can't", 'error', 'bug', 'issue', 'problem', 'wrong', 'fail', 'hate', 'ugh', 'damn', 'hours', 'days', 'tried everything', 'nothing works', 'محبط', 'مشكلة', 'خطأ', 'لا يعمل'],
    emotion: 'thinking' as AYNEmotion, // Show patient thinking, not frustration back
    intensity: 0.7
  },
  excited: {
    keywords: ['amazing', 'awesome', 'love', 'great', 'perfect', 'excellent', 'fantastic', 'incredible', 'wow', 'yes', 'finally', 'worked', 'success', 'رائع', 'ممتاز', 'مذهل', 'نجح'],
    emotion: 'excited' as AYNEmotion,
    intensity: 0.8
  },
  curious: {
    keywords: ['how', 'what', 'why', 'when', 'where', 'which', 'could', 'would', 'should', 'can you', 'tell me', 'explain', 'understand', 'curious', 'wonder', 'كيف', 'ماذا', 'لماذا', 'متى', 'أين'],
    emotion: 'curious' as AYNEmotion,
    intensity: 0.6
  },
  happy: {
    keywords: ['thank', 'thanks', 'appreciate', 'helpful', 'nice', 'good', 'glad', 'happy', 'pleased', 'شكرا', 'ممتن', 'سعيد'],
    emotion: 'happy' as AYNEmotion,
    intensity: 0.7
  },
  anxious: {
    keywords: ['worried', 'nervous', 'anxious', 'scared', 'afraid', 'urgent', 'asap', 'deadline', 'important', 'critical', 'قلق', 'عاجل', 'مهم'],
    emotion: 'thinking' as AYNEmotion, // Show calm thinking to reassure
    intensity: 0.6
  },
  sad: {
    keywords: ['sad', 'sorry', 'disappointed', 'miss', 'regret', 'apologize', 'heartbroken', 'upset', 'depressed', 'lonely', 'cry', 'crying', 'tears', 'حزين', 'آسف', 'أفتقدك', 'محبط'],
    emotion: 'sad' as AYNEmotion,
    intensity: 0.75
  },
  mad: {
    keywords: ['angry', 'furious', 'unacceptable', 'hate this', 'outrageous', 'ridiculous', 'terrible', 'awful', 'worst', 'stupid', 'idiot', 'غاضب', 'مستفز', 'سيء جداً'],
    emotion: 'mad' as AYNEmotion,
    intensity: 0.8
  },
  bored: {
    keywords: ['whatever', 'i guess', 'fine', 'if you say so', 'meh', 'boring', 'dull', 'same old', 'nothing new', 'yawn', 'ممل', 'عادي', 'كما تشاء'],
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
    const highIntensityPatterns = ['angry', 'furious', 'amazing', 'awesome', 'sad', 'sorry', 'hate'];
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

// Conversation flow awareness hook
// Tracks momentum, intent, and creates anticipation states

import { useState, useEffect, useCallback, useRef } from 'react';
import { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface ConversationFlowState {
  momentum: 'starting' | 'active' | 'slowing' | 'idle';
  userIntent: 'asking' | 'sharing' | 'thanking' | 'venting' | 'exploring' | null;
  anticipationLevel: number; // 0-1, how "ready" AYN should appear
  suggestedEyeBehavior: {
    emotion: AYNEmotion;
    blinkSpeed: 'slow' | 'normal' | 'attentive';
    gazeIntensity: number;
  };
  conversationTone: 'casual' | 'professional' | 'emotional' | 'urgent';
}

interface Message {
  sender: string;
  content: string;
  created_at?: string;
}

export const useConversationFlow = (
  messages: Message[],
  isTyping: boolean,
  typingContent: string
) => {
  const [flowState, setFlowState] = useState<ConversationFlowState>({
    momentum: 'idle',
    userIntent: null,
    anticipationLevel: 0,
    suggestedEyeBehavior: {
      emotion: 'calm',
      blinkSpeed: 'normal',
      gazeIntensity: 0.5
    },
    conversationTone: 'casual'
  });

  const lastMessageCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());

  // Analyze user intent from message content
  const analyzeIntent = useCallback((text: string): ConversationFlowState['userIntent'] => {
    const lower = text.toLowerCase();
    
    // Thanking patterns
    if (/thank|thanks|appreciate|helpful|شكرا|ممتن/.test(lower)) {
      return 'thanking';
    }
    
    // Asking patterns (questions)
    if (/\?|how|what|why|can you|could you|help me|كيف|ماذا|لماذا|ساعدني/.test(lower)) {
      return 'asking';
    }
    
    // Venting/frustration patterns
    if (/frustrated|stuck|broken|hate|ugh|tried everything|محبط|عالق/.test(lower)) {
      return 'venting';
    }
    
    // Exploring patterns
    if (/tell me about|curious|wonder|explain|interested|أخبرني|أريد أن أعرف/.test(lower)) {
      return 'exploring';
    }
    
    return 'sharing';
  }, []);

  // Determine conversation tone
  const analyzeTone = useCallback((messages: Message[]): ConversationFlowState['conversationTone'] => {
    const recentMessages = messages.slice(-5);
    const combinedText = recentMessages.map(m => m.content).join(' ').toLowerCase();
    
    if (/urgent|asap|deadline|critical|immediately|عاجل|فوري/.test(combinedText)) {
      return 'urgent';
    }
    if (/frustrated|angry|upset|worried|anxious|محبط|قلق/.test(combinedText)) {
      return 'emotional';
    }
    if (/business|meeting|report|client|project|عمل|اجتماع|مشروع/.test(combinedText)) {
      return 'professional';
    }
    return 'casual';
  }, []);

  // Calculate momentum based on message frequency
  const calculateMomentum = useCallback((): ConversationFlowState['momentum'] => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (isTyping) return 'active';
    if (timeSinceLastActivity < 5000) return 'active';
    if (timeSinceLastActivity < 15000) return 'slowing';
    if (messages.length === 0) return 'starting';
    return 'idle';
  }, [isTyping, messages.length]);

  // Get suggested eye behavior based on flow state
  const getSuggestedBehavior = useCallback((
    intent: ConversationFlowState['userIntent'],
    tone: ConversationFlowState['conversationTone'],
    momentum: ConversationFlowState['momentum']
  ): ConversationFlowState['suggestedEyeBehavior'] => {
    // Base behavior
    let emotion: AYNEmotion = 'calm';
    let blinkSpeed: 'slow' | 'normal' | 'attentive' = 'normal';
    let gazeIntensity = 0.5;

    // Adjust based on intent
    switch (intent) {
      case 'asking':
        emotion = 'curious';
        blinkSpeed = 'attentive';
        gazeIntensity = 0.7;
        break;
      case 'thanking':
        emotion = 'happy';
        blinkSpeed = 'slow';
        gazeIntensity = 0.6;
        break;
      case 'venting':
        emotion = 'thinking'; // Patient, understanding
        blinkSpeed = 'slow';
        gazeIntensity = 0.8; // Very attentive
        break;
      case 'exploring':
        emotion = 'curious';
        blinkSpeed = 'normal';
        gazeIntensity = 0.6;
        break;
    }

    // Adjust based on tone
    if (tone === 'urgent') {
      blinkSpeed = 'attentive';
      gazeIntensity = Math.min(1, gazeIntensity + 0.2);
    } else if (tone === 'emotional') {
      blinkSpeed = 'slow';
      emotion = emotion === 'calm' ? 'thinking' : emotion;
    }

    // Adjust based on momentum
    if (momentum === 'active') {
      gazeIntensity = Math.min(1, gazeIntensity + 0.1);
    } else if (momentum === 'idle') {
      blinkSpeed = 'slow';
      gazeIntensity = 0.3;
    }

    return { emotion, blinkSpeed, gazeIntensity };
  }, []);

  // Update flow state when messages or typing changes
  useEffect(() => {
    const momentum = calculateMomentum();
    const tone = analyzeTone(messages);
    
    // Analyze intent from current typing or last user message
    let intent: ConversationFlowState['userIntent'] = null;
    if (typingContent && typingContent.length > 5) {
      intent = analyzeIntent(typingContent);
    } else {
      const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
      if (lastUserMessage) {
        intent = analyzeIntent(lastUserMessage.content);
      }
    }

    const suggestedEyeBehavior = getSuggestedBehavior(intent, tone, momentum);
    
    // Calculate anticipation level
    let anticipationLevel = 0;
    if (isTyping) {
      anticipationLevel = Math.min(1, typingContent.length / 50); // Grows as user types more
    } else if (momentum === 'active') {
      anticipationLevel = 0.5;
    }

    setFlowState({
      momentum,
      userIntent: intent,
      anticipationLevel,
      suggestedEyeBehavior,
      conversationTone: tone
    });

    // Update last activity
    if (isTyping || messages.length !== lastMessageCountRef.current) {
      lastActivityRef.current = Date.now();
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, isTyping, typingContent, calculateMomentum, analyzeTone, analyzeIntent, getSuggestedBehavior]);

  return flowState;
};

import { useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalEye } from '@/components/eye/EmotionalEye';
import { UserMessageBubble } from '@/components/eye/UserMessageBubble';
import { MobileSuggestionChips } from '@/components/eye/MobileSuggestionChips';
import { ResponseCard } from '@/components/eye/ResponseCard';
import { FlyingSuggestionBubble } from '@/components/eye/FlyingSuggestionBubble';
import { ParticleBurst } from '@/components/eye/ParticleBurst';
import { ChatInput } from './ChatInput';
import { useBubbleAnimation } from '@/hooks/useBubbleAnimation';
import { useAYNEmotion, AYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';
import { analyzeResponseEmotion, getBubbleType } from '@/utils/emotionMapping';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/haptics';
import { analyzeUserEmotion, getEmpathyResponse, UserEmotion } from '@/utils/userEmotionDetection';
import { useRealtimeEmotionTracking } from '@/hooks/useRealtimeEmotionTracking';
import { useConversationFlow } from '@/hooks/useConversationFlow';
import { useEmotionOrchestrator } from '@/hooks/useEmotionOrchestrator';
import type { Message, AIMode, AIModeConfig } from '@/types/dashboard.types';

// Fallback suggestions when API fails
const DEFAULT_SUGGESTIONS = [
  { content: 'Tell me more', emoji: '💬' },
  { content: 'Explain simpler', emoji: '🔍' },
  { content: 'Give examples', emoji: '📝' },
];

interface CenterStageLayoutProps {
  messages: Message[];
  onSendMessage: (content: string, file?: File | null) => Promise<void>;
  isTyping: boolean;
  isDisabled: boolean;
  selectedMode: AIMode;
  selectedFile: File | null;
  isUploading: boolean;
  isDragOver: boolean;
  onFileSelect: (file: File | null) => void;
  onRemoveFile: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  sidebarOpen: boolean;
  transcriptOpen?: boolean;
  modes: AIModeConfig[];
  onModeChange: (mode: AIMode) => void;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
  onLanguageChange?: (language: { code: string; flag: string; name: string }) => void;
  // Message limit props
  hasReachedLimit?: boolean;
  messageCount?: number;
  maxMessages?: number;
  onStartNewChat?: () => void;
}

export const CenterStageLayout = ({
  messages,
  onSendMessage,
  isTyping,
  isDisabled,
  selectedMode,
  selectedFile,
  isUploading,
  isDragOver,
  onFileSelect,
  onRemoveFile,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  fileInputRef,
  sidebarOpen,
  transcriptOpen,
  modes,
  onModeChange,
  prefillValue,
  onPrefillConsumed,
  onLanguageChange,
  hasReachedLimit,
  messageCount,
  maxMessages,
  onStartNewChat,
}: CenterStageLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeStageRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { setEmotion, setEmotionWithSource, triggerAbsorption, triggerBlink, setIsResponding, detectExcitement, isUserTyping: contextIsTyping, triggerPulse } = useAYNEmotion();
  const soundContext = useSoundContextOptional();
  const playSound = soundContext?.playSound;
  const { orchestrateEmotionChange, resetToCalm } = useEmotionOrchestrator();
  const {
    flyingBubble,
    flyingSuggestion,
    responseBubbles,
    suggestionBubbles,
    startMessageAnimation,
    completeAbsorption,
    startSuggestionFlight,
    completeSuggestionAbsorption,
    emitResponseBubble,
    clearResponseBubbles,
    emitSuggestions,
    clearSuggestions,
  } = useBubbleAnimation();

  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [burstPosition, setBurstPosition] = useState({ x: 0, y: 0 });
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [currentGazeIndex, setCurrentGazeIndex] = useState<number | null>(null);
  const [realtimeInputText, setRealtimeInputText] = useState('');
  const [realtimeUserEmotion, setRealtimeUserEmotion] = useState<UserEmotion | null>(null);
  const lastEmotionSoundRef = useRef<string | null>(null);
  
  // AI empathy micro-behavior state
  const [aiPupilReaction, setAiPupilReaction] = useState<'normal' | 'dilate-slightly' | 'dilate-more' | 'contract'>('normal');
  const [aiBlinkPattern, setAiBlinkPattern] = useState<'normal' | 'slow-comfort' | 'quick-attentive' | 'double-understanding'>('normal');
  const [aiColorIntensity, setAiColorIntensity] = useState(0.5);

  // Reset all visual state when messages are cleared (new chat started)
  useEffect(() => {
    if (messages.length === 0) {
      clearResponseBubbles();
      clearSuggestions();
      setLastProcessedMessageId(null);
      setLastUserMessage('');
      setEmotion('calm');
      setIsResponding(false);
      // Reset AI micro-behaviors
      setAiPupilReaction('normal');
      setAiBlinkPattern('normal');
      setAiColorIntensity(0.5);
    }
  }, [messages.length, clearResponseBubbles, clearSuggestions, setEmotion, setIsResponding]);


  // Real-time emotion tracking for responsive eye behavior
  const realtimeEmotion = useRealtimeEmotionTracking(realtimeInputText, contextIsTyping);
  
  // Conversation flow awareness for anticipation states
  const conversationFlow = useConversationFlow(messages, contextIsTyping, realtimeInputText);

  // Real-time emotion response when user is typing emotional content
  // This makes AYN feel engaged and responsive to what the user is typing
  useEffect(() => {
    if (contextIsTyping && realtimeEmotion.detectedEmotion) {
      const detectedEmotion = realtimeEmotion.detectedEmotion;
      // Map detected user emotions to empathetic AYN responses
      const emotionMap: Record<string, AYNEmotion> = {
        'frustrated': 'supportive',
        'excited': 'happy',
        'curious': 'curious',
        'happy': 'happy',
        'confused': 'thinking',
        'anxious': 'comfort',
        'sad': 'comfort',
      };
      
      const aynEmotion = emotionMap[detectedEmotion] || 'curious';
      
      // Very low threshold (0.15) for maximum sensitivity - reacts to any emotional hint
      // Enable haptic feedback for tactile engagement during typing
      if (realtimeEmotion.intensity > 0.15) {
        orchestrateEmotionChange(aynEmotion as AYNEmotion, { skipSound: true, skipHaptic: false });
      }
    }
  }, [contextIsTyping, realtimeEmotion.detectedEmotion, realtimeEmotion.intensity, orchestrateEmotionChange]);

  // Use conversation flow to adjust anticipation
  useEffect(() => {
    if (conversationFlow.anticipationLevel > 0.6 && !isTyping) {
      // AYN appears ready and attentive when user is typing a lot
      if (conversationFlow.suggestedEyeBehavior.emotion !== 'calm') {
        // Don't override realtime emotion, just add subtle anticipation
        playSound?.('anticipation');
      }
    }
  }, [conversationFlow.anticipationLevel, isTyping, playSound]);

  // Handle emotion detected callback from ChatInput
  const handleEmotionDetected = useCallback((emotion: UserEmotion | null, inputText: string) => {
    setRealtimeInputText(inputText);
    setRealtimeUserEmotion(emotion);
  }, []);

  // Suggestion card Y positions for gaze targeting (matches SuggestionsCard desktopPositions)
  const suggestionGazeTargets = [
    { x: -15, y: -8 },   // Top card
    { x: -15, y: 0 },    // Middle card  
    { x: -15, y: 8 },    // Bottom card
  ];

  // Cycle through suggestion cards with glances - only when suggestions visible
  useEffect(() => {
    const visibleSuggestions = suggestionBubbles.filter(s => s.isVisible);
    
    // Stop cycling when no suggestions, typing, or on mobile
    if (visibleSuggestions.length === 0 || isTyping || isMobile || contextIsTyping) {
      setCurrentGazeIndex(null);
      return;
    }

    // Longer intervals to reduce CPU usage
    const cycleInterval = setInterval(() => {
      setCurrentGazeIndex(prev => {
        if (prev === null) return 0;
        const next = (prev + 1) % visibleSuggestions.length;
        if (Math.random() < 0.3) return null; // More frequent returns to center
        return next;
      });
    }, 3500); // Slower cycling (was 2500)

    return () => clearInterval(cycleInterval);
  }, [suggestionBubbles, isTyping, isMobile, contextIsTyping]);

  // Fetch dynamic suggestions based on conversation context
  const fetchDynamicSuggestions = useCallback(async (userMessage: string, aynResponse: string, mode: AIMode) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-suggestions', {
        body: { 
          lastUserMessage: userMessage,
          lastAynResponse: aynResponse,
          mode 
        }
      });
      
      if (error) {
        console.error('Failed to fetch suggestions:', error);
        return DEFAULT_SUGGESTIONS;
      }
      
      return data?.suggestions || DEFAULT_SUGGESTIONS;
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      return DEFAULT_SUGGESTIONS;
    }
  }, []);

  // Track visible cards for animations
  const hasVisibleResponses = responseBubbles.some(b => b.isVisible);
  const hasVisibleSuggestions = suggestionBubbles.some(s => s.isVisible);

  // AI gaze target - eye looks at individual suggestion cards
  const gazeTarget = hasVisibleSuggestions && !isTyping && !isMobile
    ? currentGazeIndex !== null 
      ? suggestionGazeTargets[currentGazeIndex] 
      : { x: -12, y: 0 } // Default center-left when not looking at specific card
    : null;

  // Get eye position for bubble animations - uses actual eye element ref for precise targeting
  const getEyePosition = useCallback(() => {
    // Use actual eye element for precise targeting
    if (eyeRef.current) {
      const eyeRect = eyeRef.current.getBoundingClientRect();
      return {
        x: eyeRect.left + eyeRect.width / 2,
        y: eyeRect.top + eyeRect.height / 2,
      };
    }
    
    // Fallback to stage center
    if (eyeStageRef.current) {
      const stageRect = eyeStageRef.current.getBoundingClientRect();
      return {
        x: stageRect.left + stageRect.width / 2,
        y: stageRect.top + stageRect.height / 2,
      };
    }
    
    return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  }, []);

  // Get input position for bubble start
  const getInputPosition = useCallback(() => {
    if (!inputRef.current) {
      return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
    }
    const inputRect = inputRef.current.getBoundingClientRect();
    return {
      x: inputRect.left + inputRect.width / 2,
      y: inputRect.top + 30, // Offset to start from textarea area
    };
  }, []);

  // Call AI emotion analysis for empathetic response
  const analyzeEmotionWithAI = useCallback(async (message: string, conversationContext?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-emotion', {
        body: { message, conversationContext }
      });
      
      if (error) {
        console.error('AI emotion analysis error:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Failed to analyze emotion:', err);
      return null;
    }
  }, []);

  // Handle sending message with bubble animation
  const handleSendWithAnimation = useCallback(
    async (content: string, file?: File | null) => {
      if (!content.trim() && !file) return;

      // Track the user's message for suggestion context
      setLastUserMessage(content);

      // Get recent conversation context for AI analysis
      const recentMessages = messages.slice(-5).map(m => 
        `${m.sender}: ${m.content.slice(0, 100)}`
      ).join('\n');

      // Start AI emotion analysis in background (non-blocking)
      analyzeEmotionWithAI(content, recentMessages).then(aiAnalysis => {
        if (aiAnalysis?.aynResponse) {
          // Use AI-determined empathetic emotion via orchestrator
          const aynEmotion = aiAnalysis.aynResponse.emotion || 'calm';
          orchestrateEmotionChange(aynEmotion);
          
          // Apply AI micro-behaviors to the eye
          if (aiAnalysis.aynResponse.pupilReaction) {
            setAiPupilReaction(aiAnalysis.aynResponse.pupilReaction);
          }
          if (aiAnalysis.aynResponse.blinkPattern) {
            setAiBlinkPattern(aiAnalysis.aynResponse.blinkPattern);
          }
          if (aiAnalysis.aynResponse.colorIntensity !== undefined) {
            setAiColorIntensity(aiAnalysis.aynResponse.colorIntensity);
          }
          
          // Extra empathy for high-intensity user emotions
          if (aiAnalysis.userEmotion?.intensity > 0.6) {
            triggerPulse();
          }
          
          console.log('AI Empathy:', aiAnalysis.empathyNote);
          
          // Reset micro-behaviors after 5 seconds
          setTimeout(() => {
            setAiPupilReaction('normal');
            setAiBlinkPattern('normal');
            setAiColorIntensity(0.5);
          }, 5000);
        }
      });

      // Fallback: Use local emotion analysis immediately for responsive UI
      const userEmotionAnalysis = analyzeUserEmotion(content);
      const empathyResponse = getEmpathyResponse(userEmotionAnalysis.emotion);
      
      // AYN shows empathetic response immediately via orchestrator (before AI completes)
      if (userEmotionAnalysis.emotion !== 'neutral' && userEmotionAnalysis.intensity > 0.3) {
        orchestrateEmotionChange(empathyResponse.aynEmotion);
        
        if (userEmotionAnalysis.intensity > 0.6) {
          triggerPulse();
        }
      }

      // Clear previous response bubbles and suggestions
      clearResponseBubbles();
      clearSuggestions();

      // Start flying animation
      const inputPos = getInputPosition();
      const eyePos = getEyePosition();
      startMessageAnimation(content, inputPos, eyePos);

      // After flight completes, trigger eye absorption and send message
      setTimeout(() => {
        triggerBlink();
        triggerAbsorption();
        playSound?.('message-absorb');
        // Use orchestrator for synchronized thinking state
        orchestrateEmotionChange('thinking');
        setIsResponding(true);
        
        // Trigger particle burst at fresh eye position
        const freshEyePos = getEyePosition();
        setBurstPosition(freshEyePos);
        setShowParticleBurst(true);
        setTimeout(() => setShowParticleBurst(false), 400);
        
        completeAbsorption();

        // Actually send the message immediately
        onSendMessage(content, file);
      }, 350);
    },
    [
      messages,
      analyzeEmotionWithAI,
      clearResponseBubbles,
      clearSuggestions,
      getInputPosition,
      getEyePosition,
      startMessageAnimation,
      triggerBlink,
      triggerAbsorption,
      setEmotion,
      setIsResponding,
      completeAbsorption,
      onSendMessage,
      triggerPulse,
    ]
  );

  // Handle suggestion click - animate flying to eye and send
  const handleSuggestionClick = useCallback((content: string, emoji: string, clickPosition: { x: number; y: number }) => {
    // Track the user's message for suggestion context
    setLastUserMessage(content);
    
    // Clear suggestions
    clearSuggestions();
    
    // Get eye position (exact center) and start flying animation
    const eyePos = getEyePosition();
    
    startSuggestionFlight(content, emoji, clickPosition, eyePos);

    // After flight completes, trigger absorption and send (reduced delays)
    setTimeout(() => {
      triggerBlink();
      triggerAbsorption();
      playSound?.('message-absorb');
      // Use orchestrator for synchronized thinking state
      orchestrateEmotionChange('thinking');
      setIsResponding(true);
      
      // Get fresh eye position for particle burst
      const freshEyePos = getEyePosition();
      setBurstPosition(freshEyePos);
      setShowParticleBurst(true);
      setTimeout(() => setShowParticleBurst(false), 400);
      
      completeSuggestionAbsorption();
      
      // Clear previous response bubbles
      clearResponseBubbles();
      
      // Send the message immediately
      onSendMessage(content, null);
    }, 300);
  }, [
    clearSuggestions,
    clearResponseBubbles,
    getEyePosition,
    startSuggestionFlight,
    completeSuggestionAbsorption,
    triggerBlink,
    triggerAbsorption,
    setEmotion,
    setIsResponding,
    onSendMessage,
  ]);

  // Process AYN responses and emit speech bubbles + suggestions
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only process new AYN messages
    if (lastMessage.sender === 'ayn' && lastMessage.id !== lastProcessedMessageId) {
      setLastProcessedMessageId(lastMessage.id);
      
      // Blink before responding (like landing page)
      triggerBlink();
      
      // After blink, analyze emotion and emit bubbles
      setTimeout(() => {
        const emotion = analyzeResponseEmotion(lastMessage.content);
        // Use orchestrator for synchronized response emotion
        orchestrateEmotionChange(emotion);
        playSound?.('response-received');
        setIsResponding(false);
        
        // Haptic feedback handled by orchestrator
        
        // Detect exciting keywords and trigger surprise enlargement
        detectExcitement(lastMessage.content);

        // Emit response bubble
        const bubbleType = getBubbleType(lastMessage.content);
      
        // Clean leading punctuation and whitespace, emit full response as single bubble
        // ResponseCard handles scrolling for long content - no splitting needed
        const response = lastMessage.content.replace(/^[!?\s]+/, '').trim();
        emitResponseBubble(response, bubbleType);
        
        // Show dynamic suggestions after response bubble appears (reduced delay)
        setTimeout(async () => {
          const suggestions = await fetchDynamicSuggestions(
            lastUserMessage || 'Hello',
            lastMessage.content,
            selectedMode
          );
          emitSuggestions(suggestions);
        }, 600);
      }, 50); // Minimal delay for blink
    }
  }, [messages, lastProcessedMessageId, setEmotion, setIsResponding, emitResponseBubble, emitSuggestions, triggerBlink, detectExcitement, fetchDynamicSuggestions, lastUserMessage, selectedMode]);

  // Update emotion when typing - only set thinking if not recently set from a response
  useEffect(() => {
    if (isTyping) {
      setIsResponding(true);
      // Don't override the emotion - let it persist from the last response
      // The emotion will naturally change when the next response comes in
    }
  }, [isTyping, setIsResponding]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="relative flex-1 flex flex-col items-center"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 pointer-events-none" />

      {/* Central Eye Stage - centered in available space above input */}
      <div 
        ref={eyeStageRef} 
        className={cn(
          "flex-1 flex relative",
          "items-center justify-center",
          "pb-28 md:pb-24", // Space for compact input
          "transition-all duration-300 ease-out"
        )}
      >
        {/* Unified layout for all screen sizes */}
        <motion.div 
          className={cn(
            "flex flex-col items-center gap-4 w-full px-4",
            // Dynamic max-width based on sidebar states
            sidebarOpen && transcriptOpen && "lg:max-w-[calc(100vw-42rem)]",
            sidebarOpen && !transcriptOpen && "lg:max-w-[calc(100vw-22rem)]",
            !sidebarOpen && transcriptOpen && "lg:max-w-[calc(100vw-22rem)]"
          )}
animate={{
            paddingTop: hasVisibleResponses ? '0' : isMobile ? '10vh' : '2vh',
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 25,
          }}
        >
          <motion.div 
            ref={eyeRef} 
            className="relative overflow-visible"
            data-tutorial="eye"
          >
            <EmotionalEye 
              size={isMobile ? "md" : "lg"} 
              gazeTarget={gazeTarget} 
              pupilReaction={aiPupilReaction}
              blinkPattern={aiBlinkPattern}
              colorIntensity={aiColorIntensity}
            />

            {/* Thinking indicator when typing - simplified animation */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 overflow-visible"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ayn-thinking/20 backdrop-blur-sm border border-ayn-thinking/30">
                    <div className="flex gap-1">
                      {/* CSS-based animation instead of framer-motion */}
                      <div className="w-1.5 h-1.5 rounded-full bg-ayn-thinking animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-ayn-thinking animate-bounce-dot" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-ayn-thinking animate-bounce-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-ayn-thinking whitespace-nowrap">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Response card directly below eye - constrained height prevents pushing input */}
          <div className="px-4 py-2 w-full flex justify-center max-h-[35vh] overflow-hidden">
            <ResponseCard 
              responses={responseBubbles} 
              isMobile={isMobile}
            />
          </div>
        </motion.div>
      </div>

      {/* Flying user message bubble */}
      {flyingBubble && (
        <UserMessageBubble
          content={flyingBubble.content}
          status={flyingBubble.status}
          startPosition={flyingBubble.startPosition}
          endPosition={flyingBubble.endPosition}
          onComplete={completeAbsorption}
        />
      )}

      {/* Flying suggestion bubble */}
      {flyingSuggestion && (
        <FlyingSuggestionBubble
          content={flyingSuggestion.content}
          emoji={flyingSuggestion.emoji}
          status={flyingSuggestion.status}
          startPosition={flyingSuggestion.startPosition}
          endPosition={flyingSuggestion.endPosition}
          onComplete={completeSuggestionAbsorption}
        />
      )}

      {/* Particle burst on absorption */}
      <ParticleBurst
        isActive={showParticleBurst}
        position={burstPosition}
        particleCount={16}
      />

      {/* Suggestion chips temporarily disabled
      <div className={cn(
        "fixed bottom-28 sm:bottom-32 z-40",
        "flex justify-center",
        "transition-all duration-300 ease-out",
        "left-4 right-4",
        sidebarOpen && "lg:left-[21rem]",
        transcriptOpen && "lg:right-[21rem]",
        "overflow-hidden"
      )}>
        <AnimatePresence>
          <MobileSuggestionChips
            suggestions={suggestionBubbles}
            onSuggestionClick={handleSuggestionClick}
          />
        </AnimatePresence>
      </div>
      */}

      {/* Input area - Fixed at bottom */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30",
          "transition-all duration-300",
          sidebarOpen && "md:left-[20rem]",
          transcriptOpen && "md:right-[20rem]"
        )}
      >
        <ChatInput
          ref={inputRef}
          onSend={handleSendWithAnimation}
          isDisabled={isDisabled}
          selectedMode={selectedMode}
          selectedFile={selectedFile}
          isUploading={isUploading}
          isDragOver={isDragOver}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fileInputRef={fileInputRef}
          hasMessages={messages.length > 0}
          sidebarOpen={sidebarOpen}
          transcriptOpen={transcriptOpen}
          modes={modes}
          onModeChange={onModeChange}
          prefillValue={prefillValue}
          onPrefillConsumed={onPrefillConsumed}
          onLanguageChange={onLanguageChange}
          onEmotionDetected={handleEmotionDetected}
          hasReachedLimit={hasReachedLimit}
          messageCount={messageCount}
          maxMessages={maxMessages}
          onStartNewChat={onStartNewChat}
        />
      </div>
    </div>
  );
};
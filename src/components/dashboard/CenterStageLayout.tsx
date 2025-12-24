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
import { SystemNotificationBanner } from './SystemNotificationBanner';
import { useBubbleAnimation } from '@/hooks/useBubbleAnimation';
import { useAYNEmotion, AYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';
import { getBubbleType } from '@/utils/emotionMapping';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/haptics';
import { useEmotionOrchestrator } from '@/hooks/useEmotionOrchestrator';
import type { Message, AIMode, AIModeConfig } from '@/types/dashboard.types';
import { LABDataViewer } from '@/components/lab/LABDataViewer';

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
  uploadProgress?: number;
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
  // Backend emotion from AI response
  lastSuggestedEmotion?: string | null;
  // Upload retry props
  uploadFailed?: boolean;
  onRetryUpload?: () => void;
  // Usage tracking props
  currentMonthUsage?: number;
  monthlyLimit?: number | null;
  usageResetDate?: string | null;
  // Flag to prevent auto-showing historical messages
  isLoadingFromHistory?: boolean;
  // Current session ID for clearing visual state on chat switch
  currentSessionId?: string;
  // Maintenance config
  maintenanceConfig?: {
    enabled?: boolean;
    message?: string;
    startTime?: string;
    endTime?: string;
    preMaintenanceNotice?: boolean;
    preMaintenanceMessage?: string;
  };
}

export const CenterStageLayout = ({
  messages,
  onSendMessage,
  isTyping,
  isDisabled,
  selectedMode,
  selectedFile,
  isUploading,
  uploadProgress,
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
  lastSuggestedEmotion,
  uploadFailed,
  onRetryUpload,
  currentMonthUsage,
  monthlyLimit,
  usageResetDate,
  isLoadingFromHistory,
  currentSessionId,
  maintenanceConfig,
}: CenterStageLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeStageRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  // Gate to only show ResponseCard for actively-sent messages
  // We store the last message id at the moment of sending, to avoid re-processing the previous
  // historical AYN response during the send animation re-renders.
  const awaitingLiveResponseRef = useRef<{ active: boolean; baselineLastMessageId: string | null }>({
    active: false,
    baselineLastMessageId: null,
  });
  const isMobile = useIsMobile();
  const { setEmotion, setEmotionWithSource, triggerAbsorption, triggerBlink, setIsResponding, detectExcitement, isUserTyping: contextIsTyping, triggerPulse, bumpActivity } = useAYNEmotion();
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

  const [lastProcessedMessageContent, setLastProcessedMessageContent] = useState<string | null>(null);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [burstPosition, setBurstPosition] = useState({ x: 0, y: 0 });
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  // Use ref for gaze index to prevent re-renders from gaze cycling
  const gazeIndexRef = useRef<number | null>(null);
  const [gazeForRender, setGazeForRender] = useState<number | null>(null);
  
  // AI empathy micro-behavior state (passed to EmotionalEye)
  const [aiPupilReaction] = useState<'normal' | 'dilate-slightly' | 'dilate-more' | 'contract'>('normal');
  const [aiBlinkPattern] = useState<'normal' | 'slow-comfort' | 'quick-attentive' | 'double-understanding'>('normal');
  const [aiColorIntensity] = useState(0.5);

  // Reset all visual state when messages are cleared (new chat started)
  useEffect(() => {
    if (messages.length === 0) {
      clearResponseBubbles();
      clearSuggestions();
      setLastProcessedMessageContent(null);
      setLastUserMessage('');
      setEmotion('calm');
      setIsResponding(false);
      awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
    }
  }, [messages.length, clearResponseBubbles, clearSuggestions, setEmotion, setIsResponding]);

  // Clear visual state when switching chat sessions
  useEffect(() => {
    if (currentSessionId) {
      clearResponseBubbles();
      clearSuggestions();
      setLastProcessedMessageContent(null);
      awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
    }
  }, [currentSessionId, clearResponseBubbles, clearSuggestions]);

  // Suggestion card Y positions for gaze targeting (matches SuggestionsCard desktopPositions)
  const suggestionGazeTargets = [
    { x: -15, y: -8 },   // Top card
    { x: -15, y: 0 },    // Middle card  
    { x: -15, y: 8 },    // Bottom card
  ];

  // Cycle through suggestion cards with glances - only when suggestions visible
  // Uses ref to track index internally, only updates render state occasionally
  useEffect(() => {
    const visibleSuggestions = suggestionBubbles.filter(s => s.isVisible);
    
    // Stop cycling when no suggestions, typing, or on mobile
    if (visibleSuggestions.length === 0 || isTyping || isMobile || contextIsTyping) {
      gazeIndexRef.current = null;
      setGazeForRender(null);
      return;
    }

    // Longer intervals to reduce CPU usage
    const cycleInterval = setInterval(() => {
      const prev = gazeIndexRef.current;
      let next: number | null;
      if (prev === null) {
        next = 0;
      } else {
        next = (prev + 1) % visibleSuggestions.length;
        if (Math.random() < 0.3) next = null; // More frequent returns to center
      }
      gazeIndexRef.current = next;
      setGazeForRender(next); // Only update render state here
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
    ? gazeForRender !== null 
      ? suggestionGazeTargets[gazeForRender] 
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

  // NOTE: analyzeEmotionWithAI removed - now using simpler hybrid approach:
  // Real-time detection while typing + backend emotion on response

  // Handle sending message with bubble animation - SIMPLIFIED
  const handleSendWithAnimation = useCallback(
    async (content: string, file?: File | null) => {
      // Block if file is still uploading
      if (isUploading) return;
      
      if (!content.trim() && !file) return;

      // Track the user's message for suggestion context
      setLastUserMessage(content);

      // Mark that we're awaiting a live response (enables ResponseCard display)
      // Capture current last message id to prevent immediately showing the previous AYN response.
      awaitingLiveResponseRef.current = {
        active: true,
        baselineLastMessageId: messages[messages.length - 1]?.id ?? null,
      };

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
        
        // SIMPLIFIED: Just show 'thinking' while waiting for backend response
        // Backend emotion (lastSuggestedEmotion) will take priority when response arrives
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
        
        // Clear file after send
        onRemoveFile();
      }, 350);
    },
    [
      isUploading,
      messages,
      clearResponseBubbles,
      clearSuggestions,
      getInputPosition,
      getEyePosition,
      startMessageAnimation,
      triggerBlink,
      triggerAbsorption,
      playSound,
      orchestrateEmotionChange,
      setIsResponding,
      completeAbsorption,
      onSendMessage,
      onRemoveFile,
      triggerPulse,
    ]
  );

  // Handle suggestion click - animate flying to eye and send
  const handleSuggestionClick = useCallback((content: string, emoji: string, clickPosition: { x: number; y: number }) => {
    // Track the user's message for suggestion context
    setLastUserMessage(content);
    
    // Mark that we're awaiting a live response (enables ResponseCard display)
    // Capture current last message id to prevent immediately showing the previous AYN response.
    awaitingLiveResponseRef.current = {
      active: true,
      baselineLastMessageId: messages[messages.length - 1]?.id ?? null,
    };
    
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
    messages,
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
  // Skip if loading from history OR not awaiting a live response
  useEffect(() => {
    if (messages.length === 0) return;

    // Skip processing historical messages - only process new responses
    if (isLoadingFromHistory) return;

    const gate = awaitingLiveResponseRef.current;

    // Skip if not awaiting a live response (prevents auto-show on chat switch / during send animation)
    if (!gate.active) return;

    const lastMessage = messages[messages.length - 1];

    // If the last message hasn't changed since we started the send, it's the old response — ignore it.
    if (gate.baselineLastMessageId && lastMessage.id === gate.baselineLastMessageId) return;

    // Only process new AYN messages
    if (lastMessage.sender === 'ayn' && lastMessage.content !== lastProcessedMessageContent) {
      // Reset the gate after processing
      awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
      setLastProcessedMessageContent(lastMessage.content);
      
      // Blink before responding (like landing page)
      triggerBlink();
      
      // After blink, use backend emotion and emit bubbles
      setTimeout(() => {
        // BACKEND-ONLY: Use backend-suggested emotion, fallback to 'calm'
        const validEmotions: AYNEmotion[] = ['calm', 'happy', 'excited', 'thinking', 'frustrated', 'curious', 'sad', 'mad', 'bored', 'comfort', 'supportive'];
        const emotion = lastSuggestedEmotion && validEmotions.includes(lastSuggestedEmotion as AYNEmotion) 
          ? lastSuggestedEmotion as AYNEmotion 
          : 'calm';
        // Use orchestrator for synchronized response emotion
        orchestrateEmotionChange(emotion);
        playSound?.('response-received');
        setIsResponding(false);
        bumpActivity(); // Increase activity on AI response
        
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
  }, [messages, lastProcessedMessageContent, lastSuggestedEmotion, setEmotion, setIsResponding, emitResponseBubble, emitSuggestions, triggerBlink, detectExcitement, fetchDynamicSuggestions, lastUserMessage, selectedMode]);

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
          <div className="px-4 py-2 w-full flex flex-col items-center max-h-[50vh] overflow-hidden">
            <ResponseCard 
              responses={responseBubbles} 
              isMobile={isMobile}
            />
            
            {/* LAB Data Viewer - Render marketing templates when structured data exists */}
            {selectedMode === 'LAB' && (() => {
              const latestAynMessage = [...messages].reverse().find(m => m.sender === 'ayn');
              const labData = latestAynMessage?.labData;
              const hasLABData = labData?.hasStructuredData && labData?.json;
              
              if (!hasLABData || !labData?.json) return null;
              
              return (
                <LABDataViewer 
                  data={labData.json} 
                  className="mt-4 w-full max-w-[560px]" 
                />
              );
            })()}
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
        {/* System notification banner - above chat input (maintenance OR usage warning) */}
        <SystemNotificationBanner
          maintenanceConfig={maintenanceConfig}
          currentUsage={currentMonthUsage ?? 0}
          monthlyLimit={monthlyLimit ?? null}
          usageResetDate={usageResetDate ?? null}
        />
        
        <ChatInput
          ref={inputRef}
          onSend={handleSendWithAnimation}
          isDisabled={isDisabled || maintenanceConfig?.enabled}
          selectedMode={selectedMode}
          selectedFile={selectedFile}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
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
          hasReachedLimit={hasReachedLimit}
          messageCount={messageCount}
          maxMessages={maxMessages}
          onStartNewChat={onStartNewChat}
          uploadFailed={uploadFailed}
          onRetryUpload={onRetryUpload}
          maintenanceActive={maintenanceConfig?.enabled}
        />
      </div>
    </div>
  );
};
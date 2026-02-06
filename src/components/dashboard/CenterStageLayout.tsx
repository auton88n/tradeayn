import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { cn, debounce } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalEye } from '@/components/eye/EmotionalEye';
import { UserMessageBubble } from '@/components/eye/UserMessageBubble';

import { ResponseCard } from '@/components/eye/ResponseCard';
import { FlyingSuggestionBubble } from '@/components/eye/FlyingSuggestionBubble';
import { ParticleBurst } from '@/components/eye/ParticleBurst';
import { ChatInput } from './ChatInput';
import { SystemNotificationBanner } from './SystemNotificationBanner';
import { BetaBadge } from '@/components/ui/BetaBadge';

import { BetaFeedbackModal } from './BetaFeedbackModal';
import { useBubbleAnimation } from '@/hooks/useBubbleAnimation';
import { useAYNEmotion, AYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';
import { getBubbleType } from '@/lib/emotionMapping';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/haptics';
import { useEmotionOrchestrator } from '@/hooks/useEmotionOrchestrator';
import { useEmpathyReaction } from '@/hooks/useEmpathyReaction';
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
  isGeneratingDocument?: boolean;
  documentType?: 'pdf' | 'excel' | null;
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
  onTranscriptToggle?: () => void;
  onTranscriptClear?: () => void;
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
  currentUsage?: number;
  limit?: number | null;
  bonusCredits?: number;
  isUnlimited?: boolean;
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
  // Beta mode
  betaMode?: boolean;
  betaFeedbackReward?: number;
  userId?: string;
  // Feedback modal state (controlled externally)
  showFeedbackModal?: boolean;
  setShowFeedbackModal?: (show: boolean) => void;
  // Credit refresh callback
  onCreditsUpdated?: () => void;
}

export const CenterStageLayout = ({
  messages,
  onSendMessage,
  isTyping,
  isGeneratingDocument = false,
  documentType = null,
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
  onTranscriptToggle,
  onTranscriptClear,
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
  currentUsage,
  limit,
  bonusCredits = 0,
  isUnlimited,
  usageResetDate,
  isLoadingFromHistory,
  currentSessionId,
  maintenanceConfig,
  betaMode,
  betaFeedbackReward,
  userId,
  showFeedbackModal: showFeedbackModalProp,
  setShowFeedbackModal: setShowFeedbackModalProp,
  onCreditsUpdated,
}: CenterStageLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeStageRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic footer height for bottom padding
  const [footerHeight, setFooterHeight] = useState(112); // Default ~28*4 = 112px
  
  // Floating feedback modal state - use external if provided, otherwise internal
  const [internalShowFeedback, setInternalShowFeedback] = useState(false);
  const showFeedbackModal = showFeedbackModalProp ?? internalShowFeedback;
  const setShowFeedbackModal = setShowFeedbackModalProp ?? setInternalShowFeedback;
  
  // Gate to only show ResponseCard for actively-sent messages
  // We store the last message id at the moment of sending, to avoid re-processing the previous
  // historical AYN response during the send animation re-renders.
  const awaitingLiveResponseRef = useRef<{ active: boolean; baselineLastMessageId: string | null }>({
    active: false,
    baselineLastMessageId: null,
  });
  
  // Ref to track if a response processing cycle is active (survives re-renders)
  const responseProcessingRef = useRef<{ active: boolean }>({ active: false });
  
  // Persistent timeout ref - prevents cleanup from canceling legitimate pending emissions
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isMobile = useIsMobile();
  
  // Calculate if credits are exhausted (user can't send more messages)
  const creditsExhausted = useMemo(() => {
    if (isUnlimited) return false;
    if (limit === null || limit === undefined) return false;
    const totalLimit = limit + bonusCredits;
    return (currentUsage ?? 0) >= totalLimit;
  }, [isUnlimited, limit, bonusCredits, currentUsage]);
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

  // Ref-based guard to track already-processed AYN message IDs (prevents re-render race condition)
  const lastProcessedAynMessageIdRef = useRef<string | null>(null);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [burstPosition, setBurstPosition] = useState({ x: 0, y: 0 });
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  // Use ref for gaze index to prevent re-renders from gaze cycling
  const gazeIndexRef = useRef<number | null>(null);
  const [gazeForRender, setGazeForRender] = useState<number | null>(null);
  
  // Empathy reaction hook - disabled for performance (emotion detection happens on message send via backend)
  const { 
    userEmotion,
    empathyResponse,
    pupilReaction: empathyPupilReaction,
    blinkPattern: empathyBlinkPattern,
    colorIntensity: empathyColorIntensity,
    resetEmpathy,
  } = useEmpathyReaction('', {
    debounceMs: 400,
    minTextLength: 3,
    enabled: false,
  });

  // Measure footer height dynamically for bottom padding
  useEffect(() => {
    if (!footerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setFooterHeight(entry.contentRect.height + 24); // Add 24px gap
      }
    });
    
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset all visual state when messages are cleared (new chat started)
  useEffect(() => {
    if (messages.length === 0) {
      // Clear any pending response timeout
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      clearResponseBubbles();
      clearSuggestions();
      lastProcessedAynMessageIdRef.current = null;
      setLastUserMessage('');
      setEmotion('calm');
      setIsResponding(false);
      awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
      responseProcessingRef.current.active = false;
    }
  }, [messages.length, clearResponseBubbles, clearSuggestions, setEmotion, setIsResponding]);

  // Clear visual state when switching chat sessions
  useEffect(() => {
    if (currentSessionId) {
      // Clear any pending response timeout
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      clearResponseBubbles();
      clearSuggestions();
      lastProcessedAynMessageIdRef.current = null;
      awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
      responseProcessingRef.current.active = false;
    }
  }, [currentSessionId, clearResponseBubbles, clearSuggestions]);

  // Suggestion card Y positions for gaze targeting (matches SuggestionsCard desktopPositions)
  const suggestionGazeTargets = [
    { x: -15, y: -8 },   // Top card
    { x: -15, y: 0 },    // Middle card  
    { x: -15, y: 8 },    // Bottom card
  ];

  // During document generation we intentionally keep ONLY the eye thinking UI
  // (no separate PDF/Excel indicator card).
  const showThinking = isTyping || isGeneratingDocument;

  // Cycle through suggestion cards with glances - only when suggestions visible
  // Uses ref to track index internally, only updates render state occasionally
  useEffect(() => {
    const visibleSuggestions = suggestionBubbles.filter(s => s.isVisible);
    
    // Stop cycling when no suggestions, thinking, or on mobile
    if (visibleSuggestions.length === 0 || showThinking || isMobile || contextIsTyping) {
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
  }, [suggestionBubbles, showThinking, isMobile, contextIsTyping]);

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
        if (import.meta.env.DEV) {
          console.error('Failed to fetch suggestions:', error);
        }
        return DEFAULT_SUGGESTIONS;
      }
      
      return data?.suggestions || DEFAULT_SUGGESTIONS;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching suggestions:', err);
      }
      return DEFAULT_SUGGESTIONS;
    }
  }, []);

  // Debounced suggestion fetcher with callback pattern (reduces API calls for rapid messages)
  const debouncedFetchAndEmitSuggestions = useMemo(
    () => debounce(async (userMessage: string, aynResponse: string, mode: AIMode) => {
      const suggestions = await fetchDynamicSuggestions(userMessage, aynResponse, mode);
      emitSuggestions(suggestions);
    }, 300),
    [fetchDynamicSuggestions, emitSuggestions]
  );

  // Track visible cards for animations
  const hasVisibleResponses = responseBubbles.some(b => b.isVisible);
  const hasVisibleSuggestions = suggestionBubbles.some(s => s.isVisible);

  // AI gaze target - eye looks at individual suggestion cards
  const gazeTarget = hasVisibleSuggestions && !showThinking && !isMobile
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

  // Handle sending message with bubble animation - FIXED: Send immediately, animate in parallel
  const handleSendWithAnimation = useCallback(
    async (content: string, file?: File | null) => {
      // Block if file is still uploading
      if (isUploading) return;
      
      if (!content.trim() && !file) return;

      if (import.meta.env.DEV) {
        console.log('[CenterStageLayout] handleSendWithAnimation called:', { content: content.substring(0, 30) });
      }

      // Track the user's message for suggestion context
      setLastUserMessage(content);

      // Mark that we're awaiting a live response (enables ResponseCard display)
      awaitingLiveResponseRef.current = {
        active: true,
        baselineLastMessageId: messages[messages.length - 1]?.id ?? null,
      };

      // Clear any pending response timeout from previous message
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      
      // Clear previous response bubbles, suggestions, and reset empathy state
      clearResponseBubbles();
      clearSuggestions();
      resetEmpathy();

      // On mobile, blur input first to dismiss keyboard before reading positions
      if (isMobile) {
        const activeEl = document.activeElement as HTMLElement;
        activeEl?.blur?.();
      }

      // CRITICAL FIX: Send message IMMEDIATELY - don't wait for animation
      // This prevents the 350ms delay from causing lost messages
      onSendMessage(content, file);

      // Small delay on mobile to let keyboard dismiss and layout settle
      const animationDelay = isMobile ? 60 : 0;

      setTimeout(() => {
        // Read positions AFTER keyboard dismissal on mobile
        const inputPos = getInputPosition();
        const eyePos = getEyePosition();
        startMessageAnimation(content, inputPos, eyePos);

        // Animation effects run in parallel (non-blocking) - synced with 400ms flying animation
        setTimeout(() => {
          triggerBlink();
          triggerAbsorption();
          playSound?.('message-absorb');
          orchestrateEmotionChange('thinking');
          setIsResponding(true);
          
          // Re-read eye position for particle burst (layout may have settled further)
          const freshEyePos = getEyePosition();
          setBurstPosition(freshEyePos);
          setShowParticleBurst(true);
          setTimeout(() => setShowParticleBurst(false), 400);
          
          completeAbsorption();

          // Clear file after animation completes
          onRemoveFile();
        }, 400);
      }, animationDelay);
    },
    [
      isUploading,
      messages,
      clearResponseBubbles,
      clearSuggestions,
      resetEmpathy,
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
    orchestrateEmotionChange,
    setIsResponding,
    onSendMessage,
    playSound,
  ]);

  // Process AYN responses and emit speech bubbles + suggestions
  // Skip if loading from history OR not awaiting a live response
  useEffect(() => {
    // Early returns - no cleanup needed since no async work started
    if (messages.length === 0) return;
    if (isLoadingFromHistory) return;

    const gate = awaitingLiveResponseRef.current;
    if (!gate.active) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.id) return;
    if (gate.baselineLastMessageId && lastMessage.id === gate.baselineLastMessageId) return;

    // Only process new AYN messages
    // IMPORTANT: ignore the streaming placeholder message (content may be empty while isTyping=true)
    if (lastMessage.sender === 'ayn') {
      if (lastMessage.isTyping) return;
      if (!lastMessage.content?.trim()) return;
    }

    // Use message ID for deduplication (ref-based to avoid re-render race condition)
    if (lastMessage.sender === 'ayn' && lastMessage.id !== lastProcessedAynMessageIdRef.current) {
      // Mark as processed IMMEDIATELY via ref (no state update = no effect restart)
      lastProcessedAynMessageIdRef.current = lastMessage.id;
      
      // Reset the gate after processing
      awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
      
      // Mark response processing as active (for nested suggestion timeout)
      responseProcessingRef.current.active = true;
      
      // Blink before responding (like landing page)
      triggerBlink();
      
      // Capture values for closure to prevent stale references
      const messageContent = lastMessage.content;
      const messageAttachment = lastMessage.attachment;
      
      // Store timeout in ref so it persists across effect re-runs (dependency changes won't cancel it)
      responseTimeoutRef.current = setTimeout(() => {
        try {
          // Safety check - ensure content still exists
          if (!messageContent?.trim()) return;
          
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
          
          // Mark processing complete AFTER emission succeeds
          responseProcessingRef.current.active = false;
          responseTimeoutRef.current = null;
          
          // Haptic feedback handled by orchestrator
          
          // Detect exciting keywords and trigger surprise enlargement
          detectExcitement(messageContent);

          // Emit response bubble with attachment if present
          const bubbleType = getBubbleType(messageContent);
        
          // Clean leading punctuation and whitespace, emit full response as single bubble
          // ResponseCard handles scrolling for long content - no splitting needed
          const response = (messageContent || '').replace(/^[!?\s]+/, '').trim();
          
          // Don't emit empty bubbles
          if (!response) return;
          
          // Pass attachment metadata to the bubble so ResponseCard can use it
          const attachment = messageAttachment ? {
            url: messageAttachment.url,
            name: messageAttachment.name,
            type: messageAttachment.type,
          } : undefined;
          
          // Only emit ResponseCard + suggestions when history is closed
          if (!transcriptOpen) {
            emitResponseBubble(response, bubbleType, attachment);
            
            // Show dynamic suggestions after response bubble appears (debounced to reduce API calls)
            setTimeout(() => {
              debouncedFetchAndEmitSuggestions(
                lastUserMessage || 'Hello',
                messageContent,
                selectedMode
              );
            }, 600);
          }
        } catch (error) {
          console.error('[CenterStageLayout] Error processing response:', error);
          responseProcessingRef.current.active = false;
          responseTimeoutRef.current = null;
        }
      }, 50); // Minimal delay for blink
      
      // NO cleanup that clears timeout - timeout is managed via ref and only cleared intentionally
      // (in handleSendWithAnimation, session change, or messages cleared)
    }
  }, [
    messages,
    isLoadingFromHistory,
    lastSuggestedEmotion,
    setEmotion,
    setIsResponding,
    emitResponseBubble,
    triggerBlink,
    detectExcitement,
    debouncedFetchAndEmitSuggestions,
    lastUserMessage,
    selectedMode,
    transcriptOpen,
  ]);

  // Clear ResponseCard and suggestions when history opens
  useEffect(() => {
    if (transcriptOpen) {
      clearResponseBubbles();
      clearSuggestions();
    }
  }, [transcriptOpen, clearResponseBubbles, clearSuggestions]);

  // Update emotion when typing - only set thinking if not recently set from a response
  useEffect(() => {
    if (showThinking) {
      setIsResponding(true);
      // Don't override the emotion - let it persist from the last response
      // The emotion will naturally change when the next response comes in
    }
  }, [showThinking, setIsResponding]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className={cn(
        "relative flex-1 flex flex-col items-center",
        "min-h-0 overflow-y-auto overscroll-contain",
        // Premium thin scrollbar
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[-webkit-overflow-scrolling:touch]"
      )}
      style={{ paddingBottom: footerHeight }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 pointer-events-none" />

      {/* Central Eye Stage - unified column layout for Eye + ResponseCard */}
      <div 
        ref={eyeStageRef} 
        className={cn(
          "flex-1 flex flex-col relative w-full",
          "items-center",
          (hasVisibleResponses || transcriptOpen) ? "justify-start pt-4" : "justify-center",
          "transition-all duration-300 ease-out"
        )}
      >
        {/* Unified layout - Eye and ResponseCard in same flex column */}
        <motion.div 
          className={cn(
            "flex flex-col items-center w-full px-4",
            // Dynamic max-width based on sidebar states
            sidebarOpen && transcriptOpen && "lg:max-w-[calc(100vw-42rem)]",
            sidebarOpen && !transcriptOpen && "lg:max-w-[calc(100vw-22rem)]",
            !sidebarOpen && transcriptOpen && "lg:max-w-[calc(100vw-22rem)]"
          )}
        >
          {/* Eye container - shrinks when response visible */}
          <motion.div 
            ref={eyeRef} 
            className="relative overflow-visible z-40"
            data-tutorial="eye"
            animate={{
              scale: (hasVisibleResponses || transcriptOpen) ? (isMobile ? 0.55 : 0.5) : 1,
              marginBottom: (hasVisibleResponses || transcriptOpen) ? -20 : 0,
            }}
            transition={{
              type: 'spring',
              duration: 0.5,
              bounce: 0.1,
            }}
          >
            <div className="relative inline-block">
              <EmotionalEye 
                size={isMobile ? "md" : "lg"} 
                gazeTarget={gazeTarget} 
                pupilReaction={empathyPupilReaction}
                blinkPattern={empathyBlinkPattern}
                colorIntensity={empathyColorIntensity}
              />
              {betaMode && <BetaBadge className={isMobile ? "scale-90" : ""} />}
            </div>

            {/* Thinking bubble removed per UX request */}
          </motion.div>

          {/* ResponseCard - flows directly below Eye in same column */}
          <AnimatePresence>
            {responseBubbles.length > 0 && (
              <motion.div
                className="w-full flex justify-center mt-2"
                style={{ 
                  maxHeight: `calc(100vh - ${footerHeight + 240}px)`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ResponseCard 
                  responses={responseBubbles} 
                  isMobile={isMobile}
                  onDismiss={clearResponseBubbles}
                  variant="inline"
                  showPointer={false}
                  sessionId={currentSessionId}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
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
        particleCount={isMobile ? 8 : 16}
      />


      {/* Input area - Fixed at bottom */}
      <div 
        ref={footerRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30",
          "pb-safe",
          "transition-all duration-300",
          sidebarOpen && "md:left-[20rem]",
          
        )}
      >
        {/* System notification banner - above chat input (maintenance OR usage warning) */}
        <SystemNotificationBanner
          maintenanceConfig={maintenanceConfig}
          currentUsage={currentUsage ?? 0}
          dailyLimit={limit ?? null}
          isUnlimited={isUnlimited ?? false}
          usageResetDate={usageResetDate ?? null}
        />

        <ChatInput
          ref={inputRef}
          onSend={handleSendWithAnimation}
          suggestions={suggestionBubbles}
          onSuggestionClick={handleSuggestionClick}
          isDisabled={isDisabled || isTyping || maintenanceConfig?.enabled || creditsExhausted}
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
          onTranscriptToggle={onTranscriptToggle}
          onTranscriptClear={onTranscriptClear}
          transcriptMessages={messages}
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
          creditsExhausted={creditsExhausted}
        />
      </div>

      {/* Floating Feedback Button removed - now in sidebar */}

      {/* Beta Feedback Modal */}
      {userId && (
        <BetaFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userId={userId}
          rewardAmount={betaFeedbackReward || 5}
          onCreditsUpdated={onCreditsUpdated}
        />
      )}
    </div>
  );
};
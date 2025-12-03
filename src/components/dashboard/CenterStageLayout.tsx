import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalEye } from '@/components/eye/EmotionalEye';
import { UserMessageBubble } from '@/components/eye/UserMessageBubble';
import { AYNSpeechBubble } from '@/components/eye/AYNSpeechBubble';
import { ParticleBurst } from '@/components/eye/ParticleBurst';
import { ChatInput } from './ChatInput';
import { useBubbleAnimation } from '@/hooks/useBubbleAnimation';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { analyzeResponseEmotion, getBubbleType } from '@/utils/emotionMapping';
import type { Message, AIMode, AIModeConfig } from '@/types/dashboard.types';

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
}: CenterStageLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const { setEmotion, triggerAbsorption, triggerBlink, setIsResponding, detectExcitement } = useAYNEmotion();
  const {
    flyingBubble,
    responseBubbles,
    startMessageAnimation,
    completeAbsorption,
    emitResponseBubble,
    clearResponseBubbles,
    dismissBubble,
  } = useBubbleAnimation();

  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [burstPosition, setBurstPosition] = useState({ x: 0, y: 0 });

  // Calculate if eye should shift left based on visible bubbles
  const visibleBubbles = responseBubbles.filter(b => b.isVisible);
  const hasLongBubbles = visibleBubbles.some(b => b.content.length > 100);
  const shouldShiftLeft = visibleBubbles.length > 0;
  const eyeShiftX = shouldShiftLeft ? (hasLongBubbles ? -120 : -80) : 0;

  // Get eye position for bubble animations
  const getEyePosition = useCallback(() => {
    if (!eyeRef.current || !containerRef.current) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    }
    const eyeRect = eyeRef.current.getBoundingClientRect();
    return {
      x: eyeRect.left + eyeRect.width / 2,
      y: eyeRect.top + eyeRect.height / 2,
    };
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

  // Handle sending message with bubble animation
  const handleSendWithAnimation = useCallback(
    async (content: string, file?: File | null) => {
      if (!content.trim() && !file) return;

      // Clear previous response bubbles
      clearResponseBubbles();

      // Start flying animation
      const inputPos = getInputPosition();
      const eyePos = getEyePosition();
      startMessageAnimation(content, inputPos, eyePos);

      // After flight completes, trigger eye absorption and send message
      setTimeout(() => {
        triggerBlink();
        setTimeout(() => {
          triggerAbsorption();
          setEmotion('thinking');
          setIsResponding(true);
          
          // Trigger particle burst at eye position
          const eyePos = getEyePosition();
          setBurstPosition(eyePos);
          setShowParticleBurst(true);
          setTimeout(() => setShowParticleBurst(false), 500);
          
          completeAbsorption();

          // Actually send the message
          onSendMessage(content, file);
        }, 150);
      }, 600);
    },
    [
      clearResponseBubbles,
      getInputPosition,
      getEyePosition,
      startMessageAnimation,
      triggerBlink,
      triggerAbsorption,
      setEmotion,
      setIsResponding,
      completeAbsorption,
      onSendMessage,
    ]
  );

  // Process AYN responses and emit speech bubbles
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
        setEmotion(emotion);
        setIsResponding(false);
        
        // Detect exciting keywords and trigger surprise enlargement
        detectExcitement(lastMessage.content);

        // Emit response bubble
        const bubbleType = getBubbleType(lastMessage.content);
      
      // Split long responses into multiple bubbles
      const maxLength = 200;
      const response = lastMessage.content;
      
      if (response.length > maxLength) {
        const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
        let currentBubble = '';
        let bubbleIndex = 0;
        
        sentences.forEach((sentence) => {
          if ((currentBubble + sentence).length <= maxLength) {
            currentBubble += sentence;
          } else {
            if (currentBubble) {
              const bubbleContent = currentBubble.trim();
              setTimeout(() => {
                emitResponseBubble(bubbleContent, bubbleType);
              }, bubbleIndex * 600);
              bubbleIndex++;
            }
            currentBubble = sentence;
          }
        });
        
        if (currentBubble) {
          setTimeout(() => {
            emitResponseBubble(currentBubble.trim(), bubbleType);
          }, bubbleIndex * 600);
        }
        } else {
          emitResponseBubble(response, bubbleType);
        }
      }, 150); // Delay for blink animation
    }
  }, [messages, lastProcessedMessageId, setEmotion, setIsResponding, emitResponseBubble, triggerBlink]);

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
      className="relative flex-1 flex flex-col items-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 pointer-events-none" />

      {/* Central Eye Stage - centered in available space above input */}
      <div className="flex-1 flex items-center justify-center pb-32">
        <motion.div 
          ref={eyeRef} 
          className="relative"
          animate={{ x: eyeShiftX }}
          transition={{ 
            type: 'spring', 
            stiffness: 150, 
            damping: 20, 
            mass: 0.8 
          }}
        >
          <EmotionalEye size="lg" />

          {/* Response bubbles emanating from eye - positioned to the right */}
          <div className={cn(
            "absolute top-1/2 left-full -translate-y-1/2 ml-6 flex flex-col items-start gap-3",
            shouldShiftLeft && hasLongBubbles ? "w-[400px]" : "w-[320px]"
          )}>
            <AnimatePresence mode="popLayout">
              {visibleBubbles.map((bubble) => (
                <AYNSpeechBubble
                  key={bubble.id}
                  id={bubble.id}
                  content={bubble.content}
                  type={bubble.type}
                  isVisible={bubble.isVisible}
                  onDismiss={() => dismissBubble(bubble.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Thinking indicator when typing */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-ayn-thinking/20 backdrop-blur-sm border border-ayn-thinking/30">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-ayn-thinking"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-ayn-thinking"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-ayn-thinking"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-ayn-thinking">Thinking...</span>
                </div>
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

      {/* Particle burst on absorption */}
      <ParticleBurst
        isActive={showParticleBurst}
        position={burstPosition}
        particleCount={16}
      />

      {/* Input area - ChatInput handles its own fixed positioning */}
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
      />
    </div>
  );
};
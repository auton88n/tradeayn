import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalEye } from '@/components/eye/EmotionalEye';
import { UserMessageBubble } from '@/components/eye/UserMessageBubble';
import { AYNSpeechBubble } from '@/components/eye/AYNSpeechBubble';
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
  modes: AIModeConfig[];
  onModeChange: (mode: AIMode) => void;
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
  modes,
  onModeChange,
}: CenterStageLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const { setEmotion, triggerAbsorption, triggerBlink, setIsResponding } = useAYNEmotion();
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
      y: inputRect.top,
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
          completeAbsorption();

          // Actually send the message
          onSendMessage(content, file);
        }, 150);
      }, 800);
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
      
      // Analyze emotion from response
      const emotion = analyzeResponseEmotion(lastMessage.content);
      setEmotion(emotion);
      setIsResponding(false);

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
    }
  }, [messages, lastProcessedMessageId, setEmotion, setIsResponding, emitResponseBubble]);

  // Update emotion when typing
  useEffect(() => {
    if (isTyping) {
      setEmotion('thinking');
      setIsResponding(true);
    }
  }, [isTyping, setEmotion, setIsResponding]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col items-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 pointer-events-none" />

      {/* Central Eye Stage - centered in available space above input */}
      <div className="flex-1 flex items-center justify-center pb-32">
        <div ref={eyeRef} className="relative">
          <EmotionalEye size="lg" />

          {/* Response bubbles emanating from eye */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 flex flex-col items-center gap-4 w-[400px] max-w-[90vw]">
            <AnimatePresence mode="popLayout">
              {responseBubbles.filter(b => b.isVisible).map((bubble) => (
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
        </div>
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

      {/* Input area fixed at bottom */}
      <div ref={inputRef} className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6">
        <ChatInput
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
          modes={modes}
          onModeChange={onModeChange}
        />
      </div>
    </div>
  );
};
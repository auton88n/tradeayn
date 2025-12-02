import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalEye } from '@/components/eye/EmotionalEye';
import { UserMessageBubble } from '@/components/eye/UserMessageBubble';
import { AYNSpeechBubble } from '@/components/eye/AYNSpeechBubble';
import { useBubbleAnimation } from '@/hooks/useBubbleAnimation';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { analyzeResponseEmotion, getBubbleType } from '@/utils/emotionMapping';
import type { Message } from '@/types/dashboard.types';

interface CenterStageLayoutProps {
  onSendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  latestResponse?: string;
  children?: React.ReactNode;
}

export const CenterStageLayout = ({
  onSendMessage,
  isTyping,
  latestResponse,
  children,
}: CenterStageLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const { setEmotion, triggerAbsorption, triggerBlink, setIsResponding } = useAYNEmotion();
  const {
    flyingBubble,
    responseBubbles,
    startMessageAnimation,
    completeAbsorption,
    emitResponseBubble,
    clearResponseBubbles,
  } = useBubbleAnimation();

  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

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

  // Handle sending message with bubble animation
  const handleSendWithAnimation = useCallback(
    async (content: string, inputPosition: { x: number; y: number }) => {
      // Clear previous response bubbles
      clearResponseBubbles();
      
      // Start flying animation
      const eyePos = getEyePosition();
      startMessageAnimation(content, inputPosition, eyePos);

      // Store pending message
      setPendingMessage(content);

      // After flight completes, trigger eye absorption and change emotion to thinking
      setTimeout(() => {
        triggerBlink();
        setTimeout(() => {
          triggerAbsorption();
          setEmotion('thinking');
          setIsResponding(true);
          completeAbsorption();
          
          // Actually send the message
          if (pendingMessage || content) {
            onSendMessage(content);
          }
        }, 150);
      }, 800);
    },
    [
      clearResponseBubbles,
      getEyePosition,
      startMessageAnimation,
      triggerBlink,
      triggerAbsorption,
      setEmotion,
      setIsResponding,
      completeAbsorption,
      onSendMessage,
      pendingMessage,
    ]
  );

  // Process response and emit speech bubbles
  const processResponse = useCallback(
    (response: string) => {
      // Analyze emotion from response
      const emotion = analyzeResponseEmotion(response);
      setEmotion(emotion);
      setIsResponding(false);

      // Emit response bubble
      const bubbleType = getBubbleType(response);
      
      // Split long responses into multiple bubbles
      const maxLength = 150;
      if (response.length > maxLength) {
        const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
        let currentBubble = '';
        
        sentences.forEach((sentence, i) => {
          if ((currentBubble + sentence).length <= maxLength) {
            currentBubble += sentence;
          } else {
            if (currentBubble) {
              setTimeout(() => {
                emitResponseBubble(currentBubble.trim(), bubbleType);
              }, i * 400);
            }
            currentBubble = sentence;
          }
        });
        
        if (currentBubble) {
          setTimeout(() => {
            emitResponseBubble(currentBubble.trim(), bubbleType);
          }, sentences.length * 400);
        }
      } else {
        emitResponseBubble(response, bubbleType);
      }
    },
    [setEmotion, setIsResponding, emitResponseBubble]
  );

  // Effect to process new responses
  // This would be called when latestResponse changes

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 pointer-events-none" />

      {/* Central Eye Stage */}
      <div ref={eyeRef} className="relative">
        <EmotionalEye size="lg" />

        {/* Response bubbles emanating from eye */}
        {responseBubbles.map((bubble) => (
          <AYNSpeechBubble
            key={bubble.id}
            id={bubble.id}
            content={bubble.content}
            type={bubble.type}
            isVisible={bubble.isVisible}
            position={bubble.position}
          />
        ))}

        {/* Thinking indicator when typing */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -bottom-20 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm text-blue-400">Thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Input area passed as children */}
      {children}
    </div>
  );
};

// Export the send handler for use in parent components
export const useCenterStageSend = () => {
  const containerRef = useRef<{
    handleSend: (content: string, position: { x: number; y: number }) => void;
  } | null>(null);

  return {
    containerRef,
    triggerSend: (content: string, position: { x: number; y: number }) => {
      containerRef.current?.handleSend(content, position);
    },
  };
};

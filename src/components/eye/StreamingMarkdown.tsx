import { useState, useEffect, useCallback, memo } from 'react';
import { MessageFormatter } from '@/components/MessageFormatter';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface StreamingMarkdownProps {
  content: string;
  speed?: number; // ms per word
  onComplete?: () => void;
  className?: string;
  enableHaptics?: boolean;
}

export const StreamingMarkdown = memo(({
  content,
  speed = 35,
  onComplete,
  className,
  enableHaptics = true,
}: StreamingMarkdownProps) => {
  const [displayedWordCount, setDisplayedWordCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // Split content preserving whitespace and markdown
  const words = content.split(/(\s+)/);
  const totalWords = words.filter(w => w.trim()).length;

  // Get visible content
  const visibleContent = isSkipped 
    ? content 
    : words.slice(0, displayedWordCount).join('');

  // Streaming animation
  useEffect(() => {
    if (isSkipped || isComplete) return;

    if (displayedWordCount < words.length) {
      const timer = setTimeout(() => {
        setDisplayedWordCount(prev => {
          const next = prev + 1;
          
          // Haptic pulse every 15 words (subtle feedback)
          if (enableHaptics && next % 15 === 0) {
            hapticFeedback('pulse');
          }
          
          return next;
        });
      }, speed);
      
      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayedWordCount, words.length, speed, isSkipped, isComplete, onComplete, enableHaptics]);

  // Initial haptic on mount
  useEffect(() => {
    if (enableHaptics) {
      hapticFeedback('notification');
    }
  }, [enableHaptics]);

  // Skip animation handler
  const handleSkip = useCallback(() => {
    if (!isComplete) {
      setIsSkipped(true);
      setIsComplete(true);
      hapticFeedback('light');
      onComplete?.();
    }
  }, [isComplete, onComplete]);

  // Progress percentage
  const progress = Math.round((displayedWordCount / words.length) * 100);

  return (
    <div 
      className={cn("relative", className)}
      onClick={handleSkip}
    >
      <MessageFormatter 
        content={visibleContent}
        className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
      />
      
      {/* Blinking cursor while streaming */}
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary/70 animate-pulse" />
      )}
      
      {/* Skip hint - shows after 1 second */}
      {!isComplete && progress > 10 && (
        <div className="absolute -bottom-6 left-0 text-[10px] text-muted-foreground/60 animate-fade-in">
          Click to skip
        </div>
      )}
    </div>
  );
});

StreamingMarkdown.displayName = 'StreamingMarkdown';

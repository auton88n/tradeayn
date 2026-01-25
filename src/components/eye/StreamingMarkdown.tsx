import { useState, useEffect, useCallback, memo } from 'react';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
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

  // Streaming animation - batch 3 words at a time for performance
  useEffect(() => {
    if (isSkipped || isComplete) return;

    if (displayedWordCount < words.length) {
      const timer = setTimeout(() => {
        setDisplayedWordCount(prev => {
          // Batch 3 words per update for smoother performance
          const next = Math.min(prev + 3, words.length);
          
          // Haptic pulse every 30 words (reduced frequency)
          if (enableHaptics && Math.floor(next / 30) > Math.floor(prev / 30)) {
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
      className={cn("cursor-pointer", className)}
      onClick={handleSkip}
    >
      <div className="inline">
        <MessageFormatter 
          content={visibleContent}
          className="text-sm text-foreground/90 leading-relaxed"
        />
        
        {/* Blinking cursor while streaming - inline with text */}
        {!isComplete && displayedWordCount > 0 && (
          <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-primary/60 animate-pulse" />
        )}
      </div>
      
      {/* Skip hint - inline below content */}
      {!isComplete && progress > 20 && (
        <div className="mt-3 text-[10px] text-muted-foreground/50 text-center animate-fade-in">
          Tap to skip
        </div>
      )}
    </div>
  );
});

StreamingMarkdown.displayName = 'StreamingMarkdown';

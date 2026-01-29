import { useState, useEffect, useCallback, memo, useMemo } from 'react';
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

// Detect if content contains Arabic/RTL text
const hasArabicText = (text: string): boolean => {
  // Arabic Unicode range: \u0600-\u06FF (Arabic), \u0750-\u077F (Arabic Supplement)
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
};

// Split content into words while preserving Arabic word integrity
const splitIntoWords = (content: string): string[] => {
  // Use Unicode-aware word boundary splitting
  // This keeps Arabic words together and preserves whitespace
  const segments: string[] = [];
  let currentWord = '';
  let currentWhitespace = '';
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (/\s/.test(char)) {
      // Whitespace character
      if (currentWord) {
        segments.push(currentWord);
        currentWord = '';
      }
      currentWhitespace += char;
    } else {
      // Non-whitespace character
      if (currentWhitespace) {
        segments.push(currentWhitespace);
        currentWhitespace = '';
      }
      currentWord += char;
    }
  }
  
  // Don't forget the last segment
  if (currentWord) segments.push(currentWord);
  if (currentWhitespace) segments.push(currentWhitespace);
  
  return segments;
};

export const StreamingMarkdown = memo(({
  content,
  speed = 15,
  onComplete,
  className,
  enableHaptics = true,
}: StreamingMarkdownProps) => {
  const [displayedWordCount, setDisplayedWordCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // Check if content has Arabic text for RTL handling
  const isRTL = useMemo(() => hasArabicText(content), [content]);

  // Split content preserving word integrity (important for Arabic)
  const words = useMemo(() => splitIntoWords(content), [content]);
  const totalWords = words.filter(w => w.trim()).length;

  // Get visible content - join complete words only
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
          const next = Math.min(prev + 5, words.length);
          
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
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div 
        className="inline"
        style={{ 
          fontFamily: isRTL ? "'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif" : undefined,
        }}
      >
        <MessageFormatter 
          content={visibleContent}
          className={cn(
            "text-sm text-foreground/90 leading-relaxed",
            isRTL && "text-right"
          )}
        />
        
        {/* Blinking cursor while streaming - inline with text */}
        {!isComplete && displayedWordCount > 0 && (
          <span 
            className={cn(
              "inline-block w-0.5 h-4 align-middle bg-primary/60 animate-pulse",
              isRTL ? "mr-0.5" : "ml-0.5"
            )} 
          />
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

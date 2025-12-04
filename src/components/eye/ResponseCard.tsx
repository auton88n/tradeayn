import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageFormatter } from '@/components/MessageFormatter';
import { 
  Copy, Check, ThumbsUp, ThumbsDown, Brain, 
  Volume2, VolumeX, RotateCcw, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface ResponseBubble {
  id: string;
  content: string;
  isVisible: boolean;
}

interface ResponseCardProps {
  responses: ResponseBubble[];
  isMobile?: boolean;
  mode?: string;
  emotion?: AYNEmotion;
  timestamp?: Date;
  onRegenerate?: () => void;
  onSave?: () => void;
  isLoading?: boolean;
}

// Emotion color mapping
const emotionColors: Record<AYNEmotion, string> = {
  happy: 'bg-green-500',
  thinking: 'bg-blue-500',
  excited: 'bg-orange-500',
  frustrated: 'bg-red-500',
  curious: 'bg-purple-500',
  calm: 'bg-gray-400',
};

// Mode icons mapping
const getModeIcon = (mode?: string): string => {
  const icons: Record<string, string> = {
    'Business': '🧠',
    'Medical': '⚕️',
    'Legal': '⚖️',
    'PDF Analysis': '📄',
    'Vision': '👁️',
    'Civil Engineering': '🏗️',
  };
  return icons[mode || ''] || '🧠';
};

// Format relative time
const formatRelativeTime = (date?: Date): string => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

// Action button component
const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  active = false,
  activeColor = 'text-primary'
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick?: () => void; 
  active?: boolean;
  activeColor?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium",
      "bg-gray-100/60 dark:bg-gray-800/60",
      "hover:bg-gray-200/70 dark:hover:bg-gray-700/70",
      "transition-all duration-200 active:scale-95",
      active ? activeColor : "text-muted-foreground hover:text-foreground"
    )}
    title={label}
  >
    <Icon size={12} />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export const ResponseCard = ({ 
  responses, 
  isMobile = false,
  mode,
  emotion = 'calm',
  timestamp,
  onRegenerate,
  onSave,
  isLoading = false,
}: ResponseCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNewContent, setIsNewContent] = useState(false);

  const visibleResponses = responses.filter(r => r.isVisible);

  // Combine all responses into single content
  const combinedContent = visibleResponses
    .map(r => r.content.replace(/^[!?\s]+/, '').trim())
    .join('\n\n');

  // Calculate word count and read time
  const wordCount = combinedContent.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Trigger pulse animation on new content
  useEffect(() => {
    if (combinedContent) {
      setIsNewContent(true);
      const timer = setTimeout(() => setIsNewContent(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [combinedContent]);

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(combinedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(prev => prev === type ? null : type);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(combinedContent);
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleSave = () => {
    setIsSaved(prev => !prev);
    onSave?.();
  };

  // Check if content is scrollable and track scroll position
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkScrollState = () => {
      const scrollable = el.scrollHeight > el.clientHeight;
      setIsScrollable(scrollable);
      
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setIsAtBottom(atBottom);
    };

    checkScrollState();
    el.addEventListener('scroll', checkScrollState);
    
    // Re-check when content changes
    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      resizeObserver.disconnect();
    };
  }, [combinedContent]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    const el = contentRef.current;
    if (el && isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [combinedContent, isAtBottom]);

  // Loading skeleton
  if (isLoading) {
    return (
      <motion.div
        className={cn(
          "relative overflow-hidden",
          "w-fit min-w-[280px] max-w-[calc(100vw-2rem)] sm:max-w-[560px] lg:max-w-[640px]",
          "bg-gradient-to-br from-white/90 via-white/85 to-gray-100/80",
          "dark:from-gray-900/90 dark:via-gray-800/85 dark:to-gray-900/80",
          "backdrop-blur-2xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]",
          "border border-gray-200/60 dark:border-gray-700/50",
          "px-5 py-4 rounded-2xl mb-4"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="space-y-3 pl-8">
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full animate-pulse w-1/2" />
          <div className="h-3 bg-gray-200/40 dark:bg-gray-700/40 rounded-full animate-pulse w-2/3" />
          <div className="h-3 bg-gray-200/30 dark:bg-gray-700/30 rounded-full animate-pulse w-1/3" />
        </div>
      </motion.div>
    );
  }

  if (visibleResponses.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "relative group overflow-hidden",
          // Responsive width and height constraints
          "w-fit min-w-[280px] max-w-[calc(100vw-2rem)] sm:max-w-[560px] lg:max-w-[640px]",
          isExpanded 
            ? "max-h-[80vh]" 
            : "max-h-[200px] sm:max-h-[240px] md:max-h-[280px] lg:max-h-[320px]",
          "mb-4",
          // Premium futuristic glassmorphism
          "bg-gradient-to-br from-white/90 via-white/85 to-gray-100/80",
          "dark:from-gray-900/90 dark:via-gray-800/85 dark:to-gray-900/80",
          "backdrop-blur-2xl",
          // Animated glow border effect
          "before:absolute before:inset-0 before:rounded-2xl before:p-[1px]",
          "before:bg-gradient-to-r before:from-primary/20 before:via-purple-500/15 before:to-primary/20",
          "before:-z-10 before:opacity-0 group-hover:before:opacity-100",
          "before:transition-opacity before:duration-500",
          // Layered shadows with color glow
          "shadow-[0_8px_40px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.4)]",
          "hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_40px_rgba(147,51,234,0.06),inset_0_1px_0_rgba(255,255,255,0.5)]",
          // Border with subtle glow on hover
          "border border-gray-200/60 dark:border-gray-700/50",
          "hover:border-primary/20 dark:hover:border-primary/30",
          // New content pulse animation
          isNewContent && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
          // Hover lift effect
          "hover:-translate-y-1",
          // Smooth transitions
          "transition-all duration-300 ease-out",
          // Padding and rounding
          "px-5 py-4 rounded-2xl"
        )}
        initial={{
          x: -20,
          scale: 0.95,
          opacity: 0,
        }}
        animate={{
          x: 0,
          scale: 1,
          opacity: 1,
        }}
        exit={{
          x: -15,
          scale: 0.97,
          opacity: 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 26,
        }}
      >
        {/* Animated accent line at top */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-2xl group-hover:via-primary/60 transition-all duration-500" />
        
        {/* Inner highlight shine */}
        <div className="absolute inset-x-4 top-0 h-[40%] bg-gradient-to-b from-white/30 to-transparent dark:from-white/10 rounded-t-xl pointer-events-none" />

        {/* Brain Logo - Top Left (subtle) */}
        <motion.div 
          className="absolute top-3 left-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Brain className="w-5 h-5 text-primary" />
        </motion.div>

        {/* Contextual Header Bar */}
        <div className="flex items-center justify-between mb-2 pl-8 pr-1">
          <div className="flex items-center gap-2">
            {/* Mode Badge */}
            {mode && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {getModeIcon(mode)} {mode}
              </span>
            )}
            {/* Emotion Dot */}
            <motion.span 
              className={cn("w-2 h-2 rounded-full", emotionColors[emotion])}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              title={`Feeling ${emotion}`}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {/* Read Time */}
            {wordCount > 50 && (
              <span className="hidden sm:inline">~{readTimeMinutes} min read</span>
            )}
            {/* Timestamp */}
            {timestamp && <span>{formatRelativeTime(timestamp)}</span>}
          </div>
        </div>

        {/* Content area with proper scrolling */}
        <div 
          ref={contentRef}
          className={cn(
            "speech-bubble-content",
            isExpanded 
              ? "max-h-[60vh]" 
              : "max-h-[120px] sm:max-h-[160px] md:max-h-[200px] lg:max-h-[240px]",
            "overflow-y-auto overflow-x-auto",
            "break-words",
            // Premium thin scrollbar
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/60",
            // iOS touch scrolling
            "[-webkit-overflow-scrolling:touch]",
            // Padding for brain logo on left
            "pl-8 pr-2 pt-1"
          )}
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        >
          <MessageFormatter 
            content={combinedContent} 
            className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed max-w-none break-words" 
          />
        </div>

        {/* Fade gradient indicator when scrollable and not at bottom */}
        {isScrollable && !isAtBottom && !isExpanded && (
          <div 
            className="absolute bottom-16 left-0 right-0 h-8 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Expand/Collapse Button for long content */}
        {isScrollable && (
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className={cn(
              "absolute left-1/2 -translate-x-1/2",
              isExpanded ? "bottom-16" : "bottom-14",
              "flex items-center gap-1 px-3 py-1 text-[10px] font-medium",
              "bg-primary/10 hover:bg-primary/20 text-primary rounded-full",
              "transition-all duration-200 active:scale-95"
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                <span>Show more</span>
              </>
            )}
          </button>
        )}

        {/* Enhanced Action Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-gray-700/40">
          {/* Left: Primary Actions */}
          <div className="flex items-center gap-1">
            <ActionButton 
              icon={copied ? Check : Copy} 
              label={copied ? "Copied!" : "Copy"} 
              onClick={copyContent}
              active={copied}
              activeColor="text-green-500"
            />
            <ActionButton 
              icon={isSpeaking ? VolumeX : Volume2} 
              label={isSpeaking ? "Stop" : "Listen"} 
              onClick={handleSpeak}
              active={isSpeaking}
              activeColor="text-blue-500"
            />
            {onRegenerate && (
              <ActionButton 
                icon={RotateCcw} 
                label="Regenerate" 
                onClick={onRegenerate}
              />
            )}
            <ActionButton 
              icon={isSaved ? BookmarkCheck : Bookmark} 
              label={isSaved ? "Saved" : "Save"} 
              onClick={handleSave}
              active={isSaved}
              activeColor="text-yellow-500"
            />
          </div>
          
          {/* Right: Feedback Buttons */}
          <div className="flex gap-1">
            <button 
              onClick={() => handleFeedback('up')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                feedback === 'up' 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                  : "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-green-500"
              )}
              title="Good response"
            >
              <ThumbsUp size={14} />
            </button>
            <button 
              onClick={() => handleFeedback('down')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                feedback === 'down' 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  : "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-red-500"
              )}
              title="Poor response"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

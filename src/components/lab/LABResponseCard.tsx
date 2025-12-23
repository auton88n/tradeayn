import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';
import { MessageFormatter } from '@/components/MessageFormatter';
import { LABDataViewer } from './LABDataViewer';
import { hapticFeedback } from '@/lib/haptics';
import { Copy, Check, ThumbsUp, ThumbsDown, FlaskConical, Sparkles } from 'lucide-react';
import type { LABResponse } from '@/types/dashboard.types';

interface LABResponseCardProps {
  content: string;
  labData?: LABResponse;
  isMobile?: boolean;
}

const LABResponseCardComponent = ({ content, labData, isMobile = false }: LABResponseCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);

  const displayContent = labData?.text || content;
  const hasStructuredData = labData?.hasStructuredData && labData.json;

  const handleStreamComplete = useCallback(() => {
    setIsStreaming(false);
    hapticFeedback('light');
  }, []);

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      hapticFeedback('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('heavy');
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    hapticFeedback('light');
    setFeedback(prev => prev === type ? null : type);
  };

  // Check if content is scrollable
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkScrollState = () => {
      setIsScrollable(el.scrollHeight > el.clientHeight);
      setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 10);
    };

    checkScrollState();
    el.addEventListener('scroll', checkScrollState);
    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      resizeObserver.disconnect();
    };
  }, [displayContent]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = contentRef.current;
    if (el && isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [displayContent, isAtBottom]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout={false}
        className={cn(
          "relative group flex flex-col",
          "w-fit min-w-[280px] max-w-[calc(100vw-2rem)] sm:max-w-[560px] lg:max-w-[640px]",
          "max-h-[min(400px,50vh)] mb-4",
          // LAB-specific gradient background
          "bg-gradient-to-br from-purple-50/90 to-indigo-50/90",
          "dark:from-purple-950/40 dark:to-indigo-950/40",
          "shadow-lg shadow-purple-500/5",
          "border border-purple-200/50 dark:border-purple-700/30",
          "px-5 py-4 rounded-2xl",
          "contain-layout contain-paint"
        )}
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Purple accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-400 rounded-t-2xl" />
        
        {/* Inner highlight */}
        <div className="absolute inset-x-4 top-0 h-[30%] bg-gradient-to-b from-white/30 to-transparent dark:from-white/10 rounded-t-xl pointer-events-none" />

        {/* LAB Logo - Top Left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          {hasStructuredData && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                Data
              </span>
            </div>
          )}
        </div>

        {/* Content area */}
        <div 
          ref={contentRef}
          className={cn(
            "speech-bubble-content",
            "flex-1 min-h-0 overflow-y-auto overflow-x-auto",
            "break-words max-w-full",
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-purple-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-purple-600/50",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[-webkit-overflow-scrolling:touch]",
            "pl-10 pr-2 pt-1"
          )}
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {isStreaming ? (
                <StreamingMarkdown 
                  content={displayContent}
                  speed={50}
                  onComplete={handleStreamComplete}
                  enableHaptics={isMobile}
                  className="max-w-full break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto"
                />
              ) : (
                <MessageFormatter 
                  content={displayContent} 
                  className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed max-w-full break-words" 
                />
              )}

              {/* Structured Data Viewer */}
              {hasStructuredData && labData?.json && (
                <LABDataViewer data={labData.json} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Scroll indicator */}
        {isScrollable && !isAtBottom && (
          <div 
            className="absolute bottom-14 left-0 right-0 h-6 bg-gradient-to-t from-purple-50/80 dark:from-purple-950/80 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Action Footer */}
        <div className="flex-shrink-0 flex items-center justify-between mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-700/40">
          <button
            onClick={copyContent}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
              "bg-purple-100/60 dark:bg-purple-900/40",
              "hover:bg-purple-200/70 dark:hover:bg-purple-800/50",
              "text-purple-700 dark:text-purple-300",
              "transition-all duration-200 active:scale-95"
            )}
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-500" />
                <span className="text-green-600 dark:text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
          
          <div className="flex gap-1">
            <button 
              onClick={() => handleFeedback('up')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                feedback === 'up' 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                  : "hover:bg-purple-100/60 dark:hover:bg-purple-800/40 text-muted-foreground hover:text-green-500"
              )}
            >
              <ThumbsUp size={14} />
            </button>
            <button 
              onClick={() => handleFeedback('down')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                feedback === 'down' 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  : "hover:bg-purple-100/60 dark:hover:bg-purple-800/40 text-muted-foreground hover:text-red-500"
              )}
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const LABResponseCard = memo(LABResponseCardComponent);

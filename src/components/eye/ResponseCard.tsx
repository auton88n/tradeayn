import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';
import { MessageFormatter } from '@/components/MessageFormatter';

interface ResponseBubble {
  id: string;
  content: string;
  isVisible: boolean;
}

interface ResponseCardProps {
  responses: ResponseBubble[];
}

export const ResponseCard = ({ responses }: ResponseCardProps) => {
  const visibleResponses = responses.filter(r => r.isVisible);

  if (visibleResponses.length === 0) return null;

  // Combine all responses into single content
  const combinedContent = visibleResponses
    .map(r => r.content.replace(/^[!?\s]+/, '').trim())
    .join('\n\n');

  // Check if content is very long for two-column layout
  const isVeryLong = combinedContent.length > 600;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "relative",
          "w-[480px] min-w-[420px]",
          isVeryLong && "w-[560px]",
          "bg-white/98 dark:bg-gray-900/95",
          "backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]",
          "border border-gray-200/60 dark:border-gray-800/50",
          "px-6 py-5 rounded-2xl rounded-bl-md"
        )}
        initial={{
          x: -30,
          scale: 0.9,
          opacity: 0,
          filter: 'blur(8px)',
        }}
        animate={{
          x: 0,
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)',
        }}
        exit={{
          x: -20,
          scale: 0.95,
          opacity: 0,
          filter: 'blur(4px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 24,
          mass: 0.8,
        }}
      >
        {/* AYN badge */}
        <div className="absolute -left-2 -top-2 w-7 h-7 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Content area */}
        <div className={cn(
          "max-h-[350px] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
        )}>
          <MessageFormatter 
            content={combinedContent} 
            className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs" 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

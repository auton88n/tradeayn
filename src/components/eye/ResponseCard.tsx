import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "relative",
          "w-[360px] min-w-[300px]",
          "bg-white/95 dark:bg-gray-900/90",
          "backdrop-blur-md",
          "shadow-sm",
          "border border-gray-100/60 dark:border-gray-800/40",
          "px-4 py-3 rounded-xl"
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
        {/* Content area */}
        <div className={cn(
          "max-h-[300px] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
        )}>
          <MessageFormatter 
            content={combinedContent} 
            className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed" 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

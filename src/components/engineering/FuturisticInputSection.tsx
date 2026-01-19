import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FuturisticInputSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const FuturisticInputSection = ({
  title,
  icon,
  children,
  defaultOpen = true,
  className,
}: FuturisticInputSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      "rounded-xl overflow-hidden",
      "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
      "border border-slate-700/50",
      "transition-all duration-300",
      isOpen && "border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]",
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3",
          "hover:bg-cyan-500/5 transition-colors duration-200",
          "group"
        )}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <div className={cn(
              "p-1.5 rounded-lg transition-all duration-300",
              isOpen 
                ? "bg-cyan-500/20 text-cyan-400" 
                : "bg-slate-700/50 text-slate-400 group-hover:text-cyan-400"
            )}>
              {icon}
            </div>
          )}
          <span className={cn(
            "text-xs font-semibold uppercase tracking-wider transition-colors",
            isOpen ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-300"
          )}>
            {title}
          </span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "text-slate-500 transition-colors",
            isOpen && "text-cyan-400"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FuturisticInputSection;

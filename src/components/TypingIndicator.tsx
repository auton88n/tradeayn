interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = ({ className = "" }: TypingIndicatorProps) => {
  return (
    <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-fit transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border/50 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-[pulse_1s_ease-in-out_infinite]" 
          />
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-[pulse_1s_ease-in-out_infinite]" 
            style={{ animationDelay: '150ms' }} 
          />
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-[pulse_1s_ease-in-out_infinite]" 
            style={{ animationDelay: '300ms' }} 
          />
        </div>
        <span className="text-sm text-muted-foreground ml-1">AYN is typing...</span>
      </div>
    </div>
  );
};

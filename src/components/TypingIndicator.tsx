interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = ({ className = "" }: TypingIndicatorProps) => {
  return (
    <div className={`bg-muted rounded-2xl px-4 py-3 max-w-fit transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce-dot" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce-dot" style={{ animationDelay: '0.3s' }} />
        </div>
        <span className="text-sm text-muted-foreground ml-1">AYN is typing...</span>
      </div>
    </div>
  );
};
interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = ({ className = "" }: TypingIndicatorProps) => {
  return (
    <div className={`bg-muted rounded-2xl px-4 py-3 max-w-fit ${className}`}>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:0.2s]" />
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:0.4s]" />
      </div>
    </div>
  );
};
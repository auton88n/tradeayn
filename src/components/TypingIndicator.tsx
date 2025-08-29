import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = ({ className = "" }: TypingIndicatorProps) => {
  const [currentDot, setCurrentDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 3);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-2xl max-w-fit ${className}`}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`w-2 h-2 bg-muted-foreground/60 rounded-full transition-all duration-300 ${
              currentDot === index ? 'animate-bounce' : ''
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground font-medium">
        AYN is analyzing
      </span>
    </div>
  );
};
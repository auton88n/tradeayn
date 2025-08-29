import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onSkip?: () => void;
  showCursor?: boolean;
  className?: string;
}

export const TypewriterText = ({ 
  text, 
  speed = 5,
  onComplete, 
  onSkip,
  showCursor = false,
  className = "" 
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);

  useEffect(() => {
    // Show skip option after 1 second of typing
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 1000);

    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    if (currentIndex < text.length && !isComplete) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex >= text.length && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  const handleSkip = () => {
    setDisplayedText(text);
    setIsComplete(true);
    setCurrentIndex(text.length);
    onSkip?.();
    onComplete?.();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isComplete) {
      handleSkip();
    }
  };

  return (
    <div className="relative group">
      <div 
        className={`${className} cursor-pointer transition-all duration-200 ${!isComplete ? 'hover:opacity-80' : ''}`}
        onClick={handleClick}
      >
        <span className="whitespace-pre-wrap break-words">
          {displayedText}
        </span>
        {showCursor && !isComplete && (
          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
      
      {/* Skip indicator */}
      {showSkipButton && !isComplete && (
        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
            Click to skip
          </div>
        </div>
      )}
    </div>
  );
};
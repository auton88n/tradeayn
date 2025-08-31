interface TypewriterTextProps {
  text: string;
  className?: string;
}

export const TypewriterText = ({ 
  text, 
  className = "" 
}: TypewriterTextProps) => {
  return (
    <div className={className}>
      <span className="whitespace-pre-wrap break-words">
        {text}
      </span>
    </div>
  );
};
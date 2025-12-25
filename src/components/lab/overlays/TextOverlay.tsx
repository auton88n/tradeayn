import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TextElement } from '@/hooks/useDesignCanvas';

interface TextOverlayProps {
  element: TextElement;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextElement>) => void;
  onDelete: () => void;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  element,
  isSelected,
  containerRef,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - element.x, y: e.clientY - element.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    // Keep within bounds (percentage-based)
    const xPercent = (newX / containerRect.width) * 100;
    const yPercent = (newY / containerRect.height) * 100;
    
    onUpdate({ 
      x: Math.max(0, Math.min(90, xPercent)), 
      y: Math.max(0, Math.min(90, yPercent)) 
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      const newContent = textRef.current.innerText.trim();
      if (newContent !== element.content) {
        onUpdate({ content: newContent || 'Add your text' });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!isEditing && isSelected) {
        onDelete();
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const textStyle: React.CSSProperties = {
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily,
    color: element.color,
    fontWeight: element.fontWeight,
    textAlign: element.textAlign,
    textShadow: element.shadow ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none',
    transform: `rotate(${element.rotation}deg)`,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.2,
  };

  return (
    <motion.div
      className={cn(
        "absolute cursor-move select-none",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-transparent",
        isDragging && "cursor-grabbing z-50"
      )}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        transform: 'translate(0, 0)',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <div
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        className={cn(
          "outline-none px-2 py-1 min-w-[50px]",
          isEditing && "bg-black/20 rounded"
        )}
        style={textStyle}
      >
        {element.content}
      </div>
      
      {/* Selection handles */}
      {isSelected && !isEditing && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
        </>
      )}
    </motion.div>
  );
};

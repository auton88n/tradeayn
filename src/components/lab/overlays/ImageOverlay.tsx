import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ImageElement } from '@/hooks/useDesignCanvas';

interface ImageOverlayProps {
  element: ImageElement;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageElement>) => void;
  onDelete: () => void;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  element,
  isSelected,
  containerRef,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - element.x, y: e.clientY - element.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width: element.width,
      height: element.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    
    if (isDragging) {
      const containerRect = containerRef.current.getBoundingClientRect();
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;
      
      const xPercent = (newX / containerRect.width) * 100;
      const yPercent = (newY / containerRect.height) * 100;
      
      onUpdate({ 
        x: Math.max(0, Math.min(90, xPercent)), 
        y: Math.max(0, Math.min(90, yPercent)) 
      });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const delta = Math.max(deltaX, deltaY);
      
      // Maintain aspect ratio
      const aspectRatio = resizeStart.width / resizeStart.height;
      const newWidth = Math.max(50, resizeStart.width + delta);
      const newHeight = newWidth / aspectRatio;
      
      onUpdate({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
      onDelete();
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

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
        width: element.width,
        height: element.height,
        opacity: element.opacity,
        transform: `rotate(${element.rotation}deg)`,
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: element.opacity }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <img
        src={element.src}
        alt="Overlay"
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      
      {/* Selection handles */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </motion.div>
  );
};

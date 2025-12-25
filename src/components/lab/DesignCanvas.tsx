import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TextOverlay } from './overlays/TextOverlay';
import { ImageOverlay } from './overlays/ImageOverlay';
import type { CanvasState, CanvasElement, TextElement, ImageElement } from '@/hooks/useDesignCanvas';

interface DesignCanvasProps {
  canvasState: CanvasState;
  canvasRef: React.RefObject<HTMLDivElement>;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
}

const aspectRatioStyles: Record<string, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
};

export const DesignCanvas: React.FC<DesignCanvasProps> = ({
  canvasState,
  canvasRef,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}) => {
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'canvas-background') {
      onSelectElement(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-muted/30 overflow-auto">
      <motion.div
        ref={canvasRef}
        id="design-canvas"
        className={cn(
          "relative bg-background shadow-2xl rounded-lg overflow-hidden",
          "max-w-full max-h-[80vh]",
          aspectRatioStyles[canvasState.aspectRatio]
        )}
        style={{
          width: canvasState.aspectRatio === '9:16' ? '360px' : 
                 canvasState.aspectRatio === '16:9' ? '640px' : '400px',
          backgroundColor: canvasState.backgroundColor,
        }}
        onClick={handleCanvasClick}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Image */}
        {canvasState.backgroundImage && (
          <img
            id="canvas-background"
            src={canvasState.backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}
        
        {/* Dark overlay for better text visibility if there's a background */}
        {canvasState.backgroundImage && (
          <div 
            id="canvas-background"
            className="absolute inset-0 bg-black/20 pointer-events-none" 
          />
        )}
        
        {/* Canvas Elements */}
        <AnimatePresence>
          {canvasState.elements.map((element) => {
            if (element.type === 'text') {
              return (
                <TextOverlay
                  key={element.id}
                  element={element as TextElement}
                  isSelected={canvasState.selectedElementId === element.id}
                  containerRef={canvasRef}
                  onSelect={() => onSelectElement(element.id)}
                  onUpdate={(updates) => onUpdateElement(element.id, updates)}
                  onDelete={() => onDeleteElement(element.id)}
                />
              );
            }
            if (element.type === 'image') {
              return (
                <ImageOverlay
                  key={element.id}
                  element={element as ImageElement}
                  isSelected={canvasState.selectedElementId === element.id}
                  containerRef={canvasRef}
                  onSelect={() => onSelectElement(element.id)}
                  onUpdate={(updates) => onUpdateElement(element.id, updates)}
                  onDelete={() => onDeleteElement(element.id)}
                />
              );
            }
            return null;
          })}
        </AnimatePresence>
        
        {/* Empty state */}
        {!canvasState.backgroundImage && canvasState.elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground/50">
              <p className="text-lg font-medium">Upload an image to start</p>
              <p className="text-sm mt-1">or add text elements</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TextOverlay } from './overlays/TextOverlay';
import { ImageOverlay } from './overlays/ImageOverlay';
import { Loader2, ImageOff, ImagePlus } from 'lucide-react';
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
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'canvas-background') {
      onSelectElement(null);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-muted/20 overflow-auto relative">
      {/* Subtle grid pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      <motion.div
        ref={canvasRef}
        id="design-canvas"
        className={cn(
          "relative bg-background rounded-lg overflow-hidden",
          "ring-1 ring-border/50 shadow-xl",
          "max-w-full max-h-[80vh]",
          aspectRatioStyles[canvasState.aspectRatio]
        )}
        style={{
          width: canvasState.aspectRatio === '9:16' ? '360px' : 
                 canvasState.aspectRatio === '16:9' ? '640px' : '420px',
          backgroundColor: canvasState.backgroundColor,
        }}
        onClick={handleCanvasClick}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Background Image Loading State */}
        {canvasState.backgroundImage && imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {/* Background Image Error State */}
        {canvasState.backgroundImage && imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center text-muted-foreground">
              <ImageOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Failed to load</p>
            </div>
          </div>
        )}

        {/* Background Image */}
        {canvasState.backgroundImage && (
          <img
            id="canvas-background"
            src={canvasState.backgroundImage}
            alt="Background"
            className={cn(
              "absolute inset-0 w-full h-full object-cover",
              imageLoading && "opacity-0"
            )}
            draggable={false}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {/* Dark overlay for better text visibility if there's a background */}
        {canvasState.backgroundImage && !imageError && !imageLoading && (
          <div 
            id="canvas-background"
            className="absolute inset-0 bg-black/15 pointer-events-none" 
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
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <ImagePlus className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/70">Upload an image</p>
              <p className="text-xs text-muted-foreground/50 mt-1">or add text elements</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
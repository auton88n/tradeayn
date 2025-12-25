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
  onUploadClick?: () => void;
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
  onUploadClick,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
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
        
        {/* Empty state - Clickable upload zone */}
        {!canvasState.backgroundImage && canvasState.elements.length === 0 && (
          <motion.div 
            onClick={onUploadClick}
            onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const dataUrl = ev.target?.result as string;
                  // We'll handle this via parent - for now trigger upload click
                  onUploadClick?.();
                };
              }
            }}
            className={cn(
              "absolute inset-4 border-2 border-dashed rounded-2xl",
              "flex flex-col items-center justify-center cursor-pointer",
              "transition-all duration-300 group",
              isDragOver 
                ? "border-primary bg-primary/10 scale-[1.02]" 
                : "border-muted-foreground/20 hover:border-primary/50",
              !isDragOver && "bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5",
              !isDragOver && "hover:from-primary/10 hover:to-purple-500/10"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Animated glow ring */}
            <div className={cn(
              "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              "bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 blur-xl"
            )} />
            
            {/* Icon container with gradient */}
            <motion.div 
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative z-10",
                "bg-gradient-to-br from-primary/20 to-purple-500/20",
                "group-hover:from-primary/30 group-hover:to-purple-500/30",
                "transition-all duration-300 group-hover:scale-110",
                "ring-1 ring-primary/10 group-hover:ring-primary/30"
              )}
              animate={isDragOver ? { scale: 1.1 } : {}}
            >
              <ImagePlus className={cn(
                "w-7 h-7 transition-colors duration-300",
                isDragOver ? "text-primary" : "text-primary/60 group-hover:text-primary"
              )} />
            </motion.div>
            
            {/* Text */}
            <p className={cn(
              "text-sm font-medium mb-1 relative z-10 transition-colors",
              isDragOver ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
            )}>
              {isDragOver ? "Drop to upload" : "Click to upload"}
            </p>
            <p className="text-xs text-muted-foreground/60 relative z-10">
              or drag and drop an image
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-3 relative z-10">
              PNG, JPG, WEBP up to 10MB
            </p>
            
            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/20 rounded-tl-lg group-hover:border-primary/40 transition-colors" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/20 rounded-tr-lg group-hover:border-primary/40 transition-colors" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/20 rounded-bl-lg group-hover:border-primary/40 transition-colors" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/20 rounded-br-lg group-hover:border-primary/40 transition-colors" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesignElement {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontFamily: string;
  color: string;
  x: number;
  y: number;
  shadow?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  textStroke?: { width: number; color: string } | null;
  gradient?: { from: string; to: string; angle: number } | null;
  opacity?: number;
  effect?: string;
}

interface DesignVariation {
  headline?: DesignElement;
  subtitle?: DesignElement;
  hashtags?: DesignElement;
  cta?: DesignElement;
  mood: string;
  colorPalette: string[];
}

interface AIDesignVariationsProps {
  variations: DesignVariation[];
  backgroundImage: string | null;
  isLoading: boolean;
  onSelectVariation: (variation: DesignVariation) => void;
  onClose: () => void;
}

const moodIcons: Record<string, string> = {
  professional: '💼',
  playful: '🎉',
  bold: '💪',
  elegant: '✨',
  energetic: '⚡',
  calm: '🌿',
};

const VariationPreview: React.FC<{
  variation: DesignVariation;
  backgroundImage: string | null;
  index: number;
  onSelect: () => void;
}> = ({ variation, backgroundImage, index, onSelect }) => {
  const renderTextElement = (element: DesignElement | undefined) => {
    if (!element) return null;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}%`,
      top: `${element.y}%`,
      transform: 'translate(-50%, -50%)',
      fontSize: `${element.fontSize * 0.25}px`, // Scale down for preview
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      color: element.color,
      textShadow: element.shadow ? '1px 1px 4px rgba(0,0,0,0.8)' : 'none',
      letterSpacing: element.letterSpacing ? `${element.letterSpacing * 0.25}px` : undefined,
      lineHeight: element.lineHeight,
      opacity: element.opacity,
      textAlign: 'center',
      maxWidth: '90%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    return (
      <span style={style}>
        {element.text}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="group relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
      onClick={onSelect}
    >
      {/* Preview Canvas */}
      <div 
        className="relative aspect-square bg-muted"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Text elements */}
        {renderTextElement(variation.headline)}
        {renderTextElement(variation.subtitle)}
        {renderTextElement(variation.cta)}
        {renderTextElement(variation.hashtags)}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Button
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 h-7 text-xs"
          >
            <Check className="w-3 h-3" />
            Apply
          </Button>
        </div>
      </div>
      
      {/* Mood & Colors */}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between px-1">
        <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
          {moodIcons[variation.mood] || '🎨'} {variation.mood}
        </span>
        <div className="flex gap-0.5">
          {variation.colorPalette?.slice(0, 3).map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border border-white/30"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const AIDesignVariations: React.FC<AIDesignVariationsProps> = ({
  variations,
  backgroundImage,
  isLoading,
  onSelectVariation,
  onClose,
}) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm font-medium">AI is creating 4 unique designs...</p>
          <p className="text-xs text-muted-foreground mt-1">Analyzing image, colors & composition</p>
        </div>
      </motion.div>
    );
  }

  if (!variations || variations.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                ✨ AI Generated Designs
              </h3>
              <p className="text-xs text-muted-foreground">
                Pick your favorite to apply it to the canvas
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 2x2 Grid of Variations */}
          <div className="grid grid-cols-2 gap-3">
            {variations.slice(0, 4).map((variation, index) => (
              <VariationPreview
                key={index}
                variation={variation}
                backgroundImage={backgroundImage}
                index={index}
                onSelect={() => onSelectVariation(variation)}
              />
            ))}
          </div>

          {/* Footer hint */}
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Click on any design to apply it • You can edit after applying
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIDesignVariations;

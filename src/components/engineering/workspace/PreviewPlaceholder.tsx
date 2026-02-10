import React from 'react';
import { motion } from 'framer-motion';
import { Box, Layers3, MousePointerClick } from 'lucide-react';

interface PreviewPlaceholderProps {
  calculatorType?: string;
}

export const PreviewPlaceholder: React.FC<PreviewPlaceholderProps> = ({ calculatorType }) => {
  const getMessage = () => {
    switch (calculatorType) {
      case 'grading':
        return 'Upload survey data to see terrain visualization';
      default:
        return 'Enter values to see 3D preview';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/50"
    >
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          rotateY: [0, 180, 360]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-4"
      >
        <Box className="w-12 h-12 opacity-30" />
      </motion.div>
      <p className="text-sm font-medium mb-1">3D Preview</p>
      <p className="text-xs text-center max-w-[200px]">{getMessage()}</p>
      <div className="flex items-center gap-1 mt-4 text-xs opacity-50">
        <MousePointerClick className="w-3 h-3" />
        <span>Interactive model</span>
      </div>
    </motion.div>
  );
};

export default PreviewPlaceholder;

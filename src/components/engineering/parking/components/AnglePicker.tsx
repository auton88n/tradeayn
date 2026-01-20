import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AngleOption {
  value: number;
  label: string;
  description: string;
}

interface AnglePickerProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const ANGLE_OPTIONS: AngleOption[] = [
  { value: 90, label: '90°', description: 'Perpendicular' },
  { value: 60, label: '60°', description: 'Angled' },
  { value: 45, label: '45°', description: 'Easy entry' },
  { value: 30, label: '30°', description: 'One-way' },
  { value: 0, label: '0°', description: 'Parallel' },
];

// Mini visualization of parking pattern
const AnglePreview: React.FC<{ angle: number }> = ({ angle }) => {
  const getLines = () => {
    if (angle === 90) {
      // Perpendicular
      return (
        <g>
          {[0, 1, 2, 3].map(i => (
            <rect key={i} x={8 + i * 10} y={12} width={8} height={20} fill="currentColor" opacity={0.6} rx={1} />
          ))}
        </g>
      );
    } else if (angle === 0) {
      // Parallel
      return (
        <g>
          {[0, 1].map(i => (
            <rect key={i} x={8} y={10 + i * 16} width={32} height={8} fill="currentColor" opacity={0.6} rx={1} />
          ))}
        </g>
      );
    } else {
      // Angled
      const skew = (90 - angle) * 0.8;
      return (
        <g transform={`skewX(${-skew})`}>
          {[0, 1, 2, 3].map(i => (
            <rect key={i} x={12 + i * 10} y={12} width={7} height={18} fill="currentColor" opacity={0.6} rx={1} />
          ))}
        </g>
      );
    }
  };

  return (
    <svg viewBox="0 0 48 44" className="w-12 h-11">
      {getLines()}
      {/* Aisle indicator */}
      <line x1="4" y1="38" x2="44" y2="38" stroke="currentColor" strokeWidth="1" opacity={0.3} strokeDasharray="2 2" />
    </svg>
  );
};

export const AnglePicker: React.FC<AnglePickerProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {ANGLE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200",
                "min-w-[72px]",
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50 text-muted-foreground"
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="angle-selector"
                  className="absolute inset-0 rounded-xl border-2 border-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Preview visualization */}
              <AnglePreview angle={option.value} />

              {/* Label */}
              <span className={cn(
                "text-sm font-semibold",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {option.label}
              </span>

              {/* Description */}
              <span className={cn(
                "text-[10px] leading-tight",
                isSelected ? "text-primary/80" : "text-muted-foreground"
              )}>
                {option.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected angle efficiency hint */}
      <div className="text-xs text-muted-foreground flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-primary/60" />
        {value === 90 && "Highest capacity - Best for large lots"}
        {value === 60 && "Good balance of capacity and flow"}
        {value === 45 && "Easy maneuvering - Good for high turnover"}
        {value === 30 && "One-way traffic only - Quick access"}
        {value === 0 && "Street-style parking - Lowest capacity"}
      </div>
    </div>
  );
};

export default AnglePicker;

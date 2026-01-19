import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FuturisticInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string;
}

export const FuturisticInput = forwardRef<HTMLInputElement, FuturisticInputProps>(
  ({ label, unit, error, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="space-y-1.5">
        <Label 
          htmlFor={inputId}
          className="text-[11px] text-slate-400 font-medium uppercase tracking-wider"
        >
          {label}
        </Label>
        <div className="relative group">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-9 px-3 rounded-lg",
              "bg-slate-800/60 border border-slate-700/60",
              "text-sm text-slate-100 placeholder:text-slate-500",
              "transition-all duration-200",
              "focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80",
              "focus:shadow-[0_0_0_2px_rgba(6,182,212,0.1),0_0_15px_rgba(6,182,212,0.1)]",
              "hover:border-slate-600",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              error && "border-red-500/50 focus:border-red-500/50",
              unit && "pr-12",
              className
            )}
            {...props}
          />
          {unit && (
            <div className="absolute right-0 top-0 h-full flex items-center pr-3 pointer-events-none">
              <span className="text-[10px] text-slate-500 font-medium uppercase">
                {unit}
              </span>
            </div>
          )}
          {/* Focus glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-lg pointer-events-none opacity-0",
            "bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0",
            "group-focus-within:opacity-100 transition-opacity duration-300"
          )} />
        </div>
        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

FuturisticInput.displayName = 'FuturisticInput';

export default FuturisticInput;

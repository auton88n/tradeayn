import React, { memo } from 'react';
import { FileDown } from 'lucide-react';

interface Building3DShowcaseProps {
  variant?: 'structural' | 'blueprint';
  showStressIndicators?: boolean;
  showLoadArrows?: boolean;
  showExportButtons?: boolean;
  className?: string;
}

// Static CSS-based building visualization - no 3D rendering for performance
const Building3DShowcase: React.FC<Building3DShowcaseProps> = memo(({
  variant = 'structural',
  showStressIndicators = false,
  showLoadArrows = false,
  showExportButtons = false,
  className = ''
}) => {
  const isBlueprint = variant === 'blueprint';
  
  return (
    <div 
      className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{ 
        aspectRatio: className.includes('aspect-') ? undefined : '4/3',
        background: isBlueprint 
          ? 'linear-gradient(135deg, rgba(6, 78, 99, 0.3) 0%, rgba(8, 51, 68, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(63, 63, 70, 0.5)'
      }}
    >
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="buildingGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-500/50"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#buildingGrid)" />
        </svg>
      </div>

      {/* Static Building Visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative"
          style={{ 
            transform: 'perspective(800px) rotateX(10deg) rotateY(-15deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Building shadow */}
          <div 
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-6 rounded-full blur-xl"
            style={{ background: 'rgba(6, 182, 212, 0.2)' }}
          />
          
          {/* Foundation */}
          <div 
            className={`w-44 h-4 rounded-sm mx-auto ${
              isBlueprint 
                ? 'border border-cyan-500/60 bg-transparent' 
                : 'bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700'
            }`}
          />
          
          {/* Building floors */}
          <div className="relative mx-auto" style={{ width: '160px' }}>
            {[0, 1, 2, 3, 4].map((floor) => (
              <div 
                key={floor} 
                className={`relative h-12 ${
                  isBlueprint 
                    ? 'border border-cyan-500/50 bg-transparent' 
                    : 'border-l-2 border-r-2 border-t border-cyan-500/40 bg-gradient-to-b from-neutral-900/90 to-neutral-800/90'
                }`}
                style={{
                  width: `${160 - floor * 4}px`,
                  marginLeft: `${floor * 2}px`,
                }}
              >
                {/* Windows */}
                <div className="flex justify-around items-center h-full px-2">
                  {[0, 1, 2, 3].map((w) => (
                    <div
                      key={w}
                      className={`w-4 h-7 rounded-sm ${
                        isBlueprint 
                          ? 'border border-cyan-400/60 bg-transparent' 
                          : 'bg-gradient-to-b from-cyan-400/70 to-blue-500/60'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Floor separator */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-cyan-500/20" />
              </div>
            ))}
            
            {/* Roof */}
            <div
              className={`relative mx-auto h-6 rounded-t-sm ${
                isBlueprint 
                  ? 'border border-cyan-500/60 bg-transparent' 
                  : 'bg-gradient-to-b from-cyan-600/30 to-neutral-800 border-t-2 border-cyan-500/50'
              }`}
              style={{ width: '140px', marginLeft: '10px' }}
            >
              <div 
                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-3 rounded-t-lg ${
                  isBlueprint 
                    ? 'border border-cyan-500/50 bg-transparent' 
                    : 'bg-gradient-to-b from-cyan-500/40 to-cyan-600/20'
                }`}
              />
            </div>
          </div>
          
          {/* Load arrows */}
          {showLoadArrows && !isBlueprint && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center" style={{ opacity: 0.5 + i * 0.2 }}>
                  <div className="w-px h-4 bg-orange-500" />
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-orange-500" />
                </div>
              ))}
            </div>
          )}
          
          {/* Stress indicators */}
          {showStressIndicators && !isBlueprint && (
            <>
              <div className="absolute right-[-10px] top-1/4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              </div>
              <div className="absolute left-[-10px] top-1/2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              </div>
            </>
          )}
          
          {/* Dimension annotations */}
          {!isBlueprint && (
            <>
              <div className="absolute -left-14 top-1/2 -translate-y-1/2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-px bg-cyan-500" />
                  <span className="text-[10px] font-mono text-cyan-400 whitespace-nowrap">h = 12.5m</span>
                </div>
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                <span className="text-[9px] font-mono text-neutral-500 whitespace-nowrap">Base: 8.0m × 5.0m</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export buttons */}
      {showExportButtons && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-400 text-sm font-mono flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" />
            .DXF
          </div>
          <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 text-sm font-mono flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" />
            .PDF
          </div>
        </div>
      )}
      
      {/* Corner accent - static instead of pulsing */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400" />
    </div>
  );
});

Building3DShowcase.displayName = 'Building3DShowcase';

export default Building3DShowcase;

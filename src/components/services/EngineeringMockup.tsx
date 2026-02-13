import { memo } from 'react';

const EngineeringMockup = memo(() => {
  return (
    <div className="overflow-hidden w-full h-full">
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-500"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 3D Building Visualization - Fully static for performance */}
      <div className="relative z-10">
        <div
          className="relative"
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
          {/* Building shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-cyan-500/20 rounded-full blur-xl" />
          
          {/* Building base */}
          <div className="relative">
            {/* Foundation */}
            <div className="w-56 h-4 bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 rounded-sm mx-auto" />
            
            {/* Main structure - Static floors */}
            <div className="relative mx-auto" style={{ width: '200px' }}>
              {[0, 1, 2, 3, 4].map((floor) => (
                <div key={floor} className="relative">
                  <div 
                    className="h-14 border-l-2 border-r-2 border-t border-cyan-500/40 bg-gradient-to-b from-neutral-900/90 to-neutral-800/90"
                    style={{
                      width: `${200 - floor * 6}px`,
                      marginLeft: `${floor * 3}px`,
                    }}
                  >
                    {/* Windows - always 4 per floor */}
                    <div className="flex justify-around items-center h-full px-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-5 h-8 bg-gradient-to-b from-cyan-400/70 to-blue-500/60 rounded-sm"
                          style={{ opacity: 0.7 + (i % 2) * 0.2 }}
                        />
                      ))}
                    </div>
                    
                    {/* Floor separator */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-cyan-500/20" />
                  </div>
                </div>
              ))}
              
              {/* Roof */}
              <div
                className="relative mx-auto"
                style={{ width: '168px', marginLeft: '16px' }}
              >
                <div className="h-8 bg-gradient-to-b from-cyan-600/30 to-neutral-800 border-t-2 border-cyan-500/50" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-gradient-to-b from-cyan-500/40 to-cyan-600/20 rounded-t-lg" />
              </div>
            </div>
          </div>
          
          {/* Structural annotations - hidden on mobile to prevent overflow */}
          <div className="absolute -left-16 top-1/2 -translate-y-1/2 hidden md:block">
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-cyan-600 dark:bg-cyan-400" />
              <div className="text-[12px] font-mono text-cyan-600 dark:text-cyan-300 whitespace-nowrap font-medium">
                h = 15.2m
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <div className="text-[11px] font-mono text-cyan-600/80 dark:text-cyan-300/80 font-medium whitespace-nowrap">
              Base: 12.0m × 8.0m
            </div>
          </div>
        </div>
        
        {/* Stress indicator - static, hidden on mobile to prevent overflow */}
        <div className="absolute -right-4 top-1/4 hidden md:block">
          <div className="w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-lg shadow-emerald-500/60 dark:shadow-emerald-400/60" />
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300 mt-1 whitespace-nowrap font-medium">OK</div>
        </div>
        
        {/* Load arrows - static */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ opacity: 0.5 + i * 0.2 }}
            >
              <div className="w-px h-4 bg-orange-500" />
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-orange-500" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating calculation result - static */}
      <div
        className="absolute top-4 right-4 z-30 px-4 py-3 rounded-xl bg-card border border-cyan-600/50 dark:border-cyan-400/50"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 0 24px rgba(34,211,238,0.1)' }}
      >
        <div className="text-[13px] font-mono text-cyan-700 dark:text-cyan-200 font-semibold">
          Mu = 245.8 kN·m
        </div>
        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5 mt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/50 dark:shadow-emerald-400/50" />
          Safe Design
        </div>
      </div>
    </div>
    </div>
  );
});

EngineeringMockup.displayName = 'EngineeringMockup';

export default EngineeringMockup;

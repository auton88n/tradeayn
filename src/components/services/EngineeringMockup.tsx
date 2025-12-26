import { motion } from 'framer-motion';

const EngineeringMockup = () => {
  return (
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

      {/* 3D Building Visualization */}
      <div className="relative z-10">
        {/* Main building structure */}
        <motion.div
          className="relative"
          animate={{ rotateY: [0, 5, 0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
          {/* Building shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-cyan-500/20 rounded-full blur-xl" />
          
          {/* Building base */}
          <div className="relative">
            {/* Foundation */}
            <div className="w-56 h-4 bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 rounded-sm mx-auto" />
            
            {/* Main structure - 3D effect */}
            <div className="relative mx-auto" style={{ width: '200px' }}>
              {/* Building floors */}
              {[0, 1, 2, 3, 4].map((floor) => (
                <motion.div
                  key={floor}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: floor * 0.1 + 0.5 }}
                  className="relative"
                >
                  <div 
                    className="h-16 border-l-2 border-r-2 border-t border-cyan-500/30 bg-gradient-to-b from-neutral-900/80 to-neutral-800/80 backdrop-blur-sm"
                    style={{
                      width: `${200 - floor * 8}px`,
                      marginLeft: `${floor * 4}px`,
                    }}
                  >
                    {/* Windows */}
                    <div className="flex justify-around items-center h-full px-4">
                      {[...Array(4 - Math.floor(floor / 2))].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-6 h-10 bg-gradient-to-b from-cyan-400/40 to-blue-500/30 rounded-sm"
                          animate={{ 
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{ 
                            duration: 2 + i * 0.5, 
                            repeat: Infinity,
                            delay: i * 0.3 + floor * 0.2
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Floor separator */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-cyan-500/20" />
                  </div>
                </motion.div>
              ))}
              
              {/* Roof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="relative mx-auto"
                style={{ width: '168px', marginLeft: '16px' }}
              >
                <div className="h-8 bg-gradient-to-b from-cyan-600/30 to-neutral-800 border-t-2 border-cyan-500/50" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-gradient-to-b from-cyan-500/40 to-cyan-600/20 rounded-t-lg" />
              </motion.div>
            </div>
          </div>
          
          {/* Structural annotations */}
          <motion.div
            className="absolute -left-16 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-cyan-500" />
              <div className="text-[10px] font-mono text-cyan-400 whitespace-nowrap">
                h = 15.2m
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="h-4 w-px bg-cyan-500" />
              <div className="text-[10px] font-mono text-cyan-400">
                Base: 12.0m × 8.0m
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Stress indicators */}
        <motion.div
          className="absolute -right-4 top-1/4"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          <div className="text-[8px] font-mono text-emerald-400 mt-1 whitespace-nowrap">OK</div>
        </motion.div>
        
        {/* Load arrows */}
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-4"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            >
              <div className="w-px h-4 bg-orange-500" />
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-orange-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Floating calculation result */}
      <motion.div
        className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-neutral-900/90 border border-cyan-500/30 backdrop-blur-sm shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
      >
        <div className="text-[10px] font-mono text-cyan-400">
          Mu = 245.8 kN·m
        </div>
        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Safe Design
        </div>
      </motion.div>
    </div>
  );
};

export default EngineeringMockup;

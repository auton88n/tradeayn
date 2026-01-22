import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Ticket, Zap, Shield } from 'lucide-react';

const TicketingMockup = () => {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'valid'>('idle');

  useEffect(() => {
    const runCycle = () => {
      setPhase('idle');
      
      setTimeout(() => setPhase('scanning'), 500);
      setTimeout(() => setPhase('valid'), 2000);
      setTimeout(() => setPhase('idle'), 4000);
    };

    runCycle();
    const interval = setInterval(runCycle, 4500);
    return () => clearInterval(interval);
  }, []);

  const isScanning = phase === 'scanning';
  const isValid = phase === 'valid';

  // Generate particles for burst effect
  const particles = useMemo(() => 
    Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      angle: (i * 22.5) * Math.PI / 180,
      distance: 60 + Math.random() * 40,
      size: 4 + Math.random() * 4,
      delay: Math.random() * 0.2
    })), []
  );

  // QR code pattern
  const qrPattern = useMemo(() => {
    const pattern = [];
    for (let row = 0; row < 8; row++) {
      const rowData = [];
      for (let col = 0; col < 8; col++) {
        // Create recognizable QR corners and random center
        const isCorner = (row < 3 && col < 3) || (row < 3 && col > 4) || (row > 4 && col < 3);
        const isFilled = isCorner || Math.random() > 0.4;
        rowData.push(isFilled);
      }
      pattern.push(rowData);
    }
    return pattern;
  }, []);

  return (
    <div className="relative w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isValid 
            ? 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)'
            : isScanning
            ? 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 70%)'
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Main Phone - Customer Device */}
      <motion.div 
        className="relative z-10"
        animate={{ 
          rotateY: isScanning ? 8 : 0,
          rotateZ: isScanning ? -2 : 0,
          scale: isValid ? 1.02 : 1
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Phone Frame */}
        <div className="relative w-36 h-64 bg-gradient-to-b from-zinc-800 via-zinc-850 to-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-700/50 overflow-hidden">
          {/* Phone shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20" />
          
          {/* Screen */}
          <div className="absolute inset-[3px] rounded-[1.75rem] overflow-hidden">
            {/* Ticket Background - Premium gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-32 h-32 border border-white/30 rounded-full"
                    style={{
                      top: `${-20 + i * 30}%`,
                      left: `${-30 + i * 20}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Ticket Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-3 pt-8">
              {/* Event Label */}
              <motion.div 
                className="text-[8px] font-bold text-white/90 tracking-[0.2em] uppercase mb-2"
                animate={{ opacity: isValid ? 0.5 : 1 }}
              >
                ★ VIP ACCESS ★
              </motion.div>
              
              {/* QR Code Container */}
              <motion.div 
                className="relative bg-white rounded-xl p-2.5 shadow-lg"
                animate={{
                  boxShadow: isValid 
                    ? '0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3)'
                    : isScanning
                    ? '0 0 20px rgba(168, 85, 247, 0.5)'
                    : '0 4px 20px rgba(0,0,0,0.3)'
                }}
                transition={{ duration: 0.3 }}
              >
                {/* QR Code Grid */}
                <div className="w-20 h-20 grid grid-cols-8 grid-rows-8 gap-[2px] relative">
                  {qrPattern.map((row, rowIdx) => 
                    row.map((filled, colIdx) => (
                      <motion.div
                        key={`${rowIdx}-${colIdx}`}
                        className="rounded-[1px]"
                        animate={{
                          backgroundColor: isValid 
                            ? '#22c55e' 
                            : isScanning && rowIdx <= Math.floor((Date.now() % 1500) / 187)
                            ? '#8b5cf6'
                            : filled ? '#1a1a1a' : '#ffffff'
                        }}
                        transition={{ duration: 0.1 }}
                      />
                    ))
                  )}
                  
                  {/* Scanning Line */}
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div 
                        className="absolute left-0 right-0 h-1 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)',
                          boxShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(6, 182, 212, 0.5)'
                        }}
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'linear', repeat: 1 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Valid Overlay */}
                <AnimatePresence>
                  {isValid && (
                    <motion.div 
                      className="absolute inset-0 bg-green-500 rounded-xl flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Particle Burst */}
                <AnimatePresence>
                  {isValid && particles.map((p) => (
                    <motion.div
                      key={p.id}
                      className="absolute rounded-full bg-green-400"
                      style={{ 
                        width: p.size, 
                        height: p.size,
                        left: '50%',
                        top: '50%',
                        marginLeft: -p.size / 2,
                        marginTop: -p.size / 2,
                      }}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 1.5, 0],
                        x: Math.cos(p.angle) * p.distance,
                        y: Math.sin(p.angle) * p.distance,
                        opacity: [1, 1, 0]
                      }}
                      transition={{ 
                        duration: 0.8, 
                        delay: p.delay,
                        ease: 'easeOut' 
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {/* Ticket Info */}
              <motion.div 
                className="mt-3 text-center"
                animate={{ y: isValid ? -5 : 0 }}
              >
                <AnimatePresence mode="wait">
                  {isValid ? (
                    <motion.div
                      key="valid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-white font-bold text-sm"
                    >
                      ✓ ENTRY GRANTED
                    </motion.div>
                  ) : (
                    <motion.div
                      key="info"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-white font-bold text-xs">SUMMER FEST 2026</div>
                      <div className="text-white/70 text-[9px] mt-0.5">SECTION A • ROW 12 • SEAT 5</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/40 rounded-full" />
        </div>

        {/* Holographic Valid Badge */}
        <AnimatePresence>
          {isValid && (
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95))',
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.6), 0 4px 20px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)'
              }}
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
              <span className="text-white font-bold text-sm tracking-wide">VALID</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Feature Badges */}
      <motion.div
        className="absolute top-2 right-2 px-2.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center gap-1.5"
        animate={{ 
          y: [0, -4, 0],
          boxShadow: isScanning 
            ? '0 0 15px rgba(168, 85, 247, 0.4)' 
            : '0 0 0px transparent'
        }}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <Zap className="w-3 h-3 text-purple-400" />
        <span className="text-[10px] font-semibold text-purple-300">500ms</span>
      </motion.div>
      
      <motion.div
        className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center gap-1.5"
        animate={{ 
          y: [0, 4, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Shield className="w-3 h-3 text-green-400" />
        <span className="text-[10px] font-semibold text-green-300">Secure</span>
      </motion.div>

      <motion.div
        className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center gap-1.5"
        animate={{ 
          y: [0, 3, 0],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Ticket className="w-3 h-3 text-pink-400" />
        <span className="text-[10px] font-semibold text-pink-300">Digital</span>
      </motion.div>

      {/* Ambient glow rings */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        animate={{ opacity: isValid ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-green-500/30"
            style={{
              width: 100 + ring * 60,
              height: 100 + ring * 60,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isValid ? {
              scale: [0.8, 1.2, 1.4],
              opacity: [0.6, 0.3, 0],
            } : {}}
            transition={{
              duration: 1.2,
              delay: ring * 0.15,
              ease: 'easeOut'
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default TicketingMockup;

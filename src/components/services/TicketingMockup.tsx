import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Ticket, Shield, Wifi, Users, TrendingUp } from 'lucide-react';

// Ticket row data type
interface TicketRow {
  name: string;
  type: string;
  time: string;
  scanned: boolean;
}

// Compact Admin Laptop Dashboard
const AdminLaptop = ({ isValid, isScanning }: { isValid: boolean; isScanning: boolean }) => {
  const existingTickets: TicketRow[] = [
    { name: 'Sarah M.', type: 'VIP', time: '2m', scanned: true },
    { name: 'Mike R.', type: 'Gen', time: '5m', scanned: true },
    { name: 'Emma L.', type: 'Std', time: '8m', scanned: false },
  ];

  return (
    <div className="relative">
      {/* Laptop Frame */}
      <div className="w-36 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-t-lg p-0.5 shadow-xl border border-zinc-500/30">
        {/* Camera notch */}
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-800" />
        
        {/* Screen */}
        <div className="bg-zinc-950 rounded-sm p-1.5 h-20 overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-0.5">
              <Ticket className="w-2 h-2 text-purple-400" />
              <span className="text-[6px] font-bold text-white">TicketHub</span>
            </div>
            <div className="flex items-center gap-0.5">
              <motion.div 
                className={`w-1 h-1 rounded-full ${isScanning ? 'bg-yellow-400' : 'bg-green-400'}`}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[5px] text-green-400">LIVE</span>
            </div>
          </div>
          
          {/* Ticket List */}
          <div className="space-y-0.5">
            <AnimatePresence>
              {isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -6, backgroundColor: 'rgba(34, 197, 94, 0.4)' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-0.5 px-0.5 py-0.5 rounded text-[5px] border border-green-500/40"
                >
                  <Check className="w-1.5 h-1.5 text-green-400" />
                  <span className="text-white font-medium">John S.</span>
                  <span className="text-purple-300 bg-purple-500/30 px-0.5 rounded text-[4px]">VIP</span>
                  <span className="text-green-400 ml-auto">now</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {existingTickets.slice(0, 2).map((ticket, i) => (
              <div key={i} className="flex items-center gap-0.5 px-0.5 py-0.5 text-[5px] bg-zinc-900/50 rounded">
                {ticket.scanned ? (
                  <Check className="w-1.5 h-1.5 text-green-500/60" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full border border-zinc-600" />
                )}
                <span className="text-zinc-300">{ticket.name}</span>
                <span className="text-zinc-500 ml-auto">{ticket.time}</span>
              </div>
            ))}
            
            {/* Scanning indicator */}
            <AnimatePresence>
              {isScanning && !isValid && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-0.5 px-0.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30"
                >
                  <motion.div 
                    className="w-1.5 h-1.5 border-t border-purple-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-[5px] text-purple-400">Scanning...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1 py-0.5 bg-zinc-900/90 border-t border-zinc-800">
            <div className="flex items-center gap-0.5">
              <Users className="w-1.5 h-1.5 text-purple-400" />
              <span className="text-[5px] text-zinc-400">{isValid ? '248' : '247'}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <TrendingUp className="w-1.5 h-1.5 text-green-400" />
              <span className="text-[5px] text-zinc-400">{isValid ? '90' : '89'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Laptop Base */}
      <div className="w-40 h-1 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-b-sm mx-auto" 
           style={{ marginLeft: '-8px' }} />
      <div className="w-8 h-0.5 bg-zinc-500/50 rounded-full mx-auto mt-0.5" />
    </div>
  );
};

const TicketingMockup = () => {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'valid'>('idle');

  useEffect(() => {
    const runCycle = () => {
      setPhase('idle');
      setTimeout(() => setPhase('scanning'), 800);
      setTimeout(() => setPhase('valid'), 2200);
      setTimeout(() => setPhase('idle'), 4200);
    };

    runCycle();
    const interval = setInterval(runCycle, 4500);
    return () => clearInterval(interval);
  }, []);

  const isScanning = phase === 'scanning';
  const isValid = phase === 'valid';

  // Generate particles for burst effect
  const particles = useMemo(() => 
    Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      angle: (i * 36) * Math.PI / 180,
      distance: 35 + Math.random() * 20,
      size: 2 + Math.random() * 2,
      delay: Math.random() * 0.1
    })), []
  );

  // QR code pattern
  const qrPattern = useMemo(() => {
    const pattern = [];
    for (let row = 0; row < 7; row++) {
      const rowData = [];
      for (let col = 0; col < 7; col++) {
        const isCorner = (row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3);
        const isFilled = isCorner || Math.random() > 0.4;
        rowData.push(isFilled);
      }
      pattern.push(rowData);
    }
    return pattern;
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isValid 
            ? 'radial-gradient(circle at 65% 55%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)'
            : isScanning
            ? 'radial-gradient(circle at 65% 55%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 65% 55%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)'
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Laptop - Positioned behind/left with perspective */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute left-3 top-6 z-10"
        style={{ 
          transform: 'perspective(500px) rotateY(-8deg) rotateX(3deg)',
          transformOrigin: 'center center'
        }}
      >
        <AdminLaptop isValid={isValid} isScanning={isScanning} />
      </motion.div>

      {/* Customer Phone - Positioned front/right */}
      <motion.div 
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute right-3 bottom-6 z-20"
      >
        <motion.div
          animate={{ 
            rotateZ: isScanning ? -2 : 0,
            scale: isValid ? 1.02 : 1
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {/* Phone Frame */}
          <div className="relative w-24 h-44 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[1.25rem] shadow-2xl border border-zinc-700/50 overflow-hidden">
            {/* Phone shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
            
            {/* Dynamic Island */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-2.5 bg-black rounded-full z-20" />
            
            {/* Screen */}
            <div className="absolute inset-[2px] rounded-[1.1rem] overflow-hidden">
              {/* Ticket Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-16 h-16 border border-white/30 rounded-full"
                      style={{ top: `${-10 + i * 30}%`, left: `${-20 + i * 20}%` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Ticket Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-2 pt-5">
                {/* Event Label */}
                <motion.div 
                  className="text-[5px] font-bold text-white/90 tracking-[0.12em] uppercase mb-1"
                  animate={{ opacity: isValid ? 0.5 : 1 }}
                >
                  ★ VIP ACCESS ★
                </motion.div>
                
                {/* QR Code Container */}
                <motion.div 
                  className="relative bg-white rounded-md p-1.5 shadow-lg"
                  animate={{
                    boxShadow: isValid 
                      ? '0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)'
                      : isScanning
                      ? '0 0 12px rgba(168, 85, 247, 0.5)'
                      : '0 3px 12px rgba(0,0,0,0.3)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* QR Code Grid */}
                  <div className="w-12 h-12 grid grid-cols-7 grid-rows-7 gap-[1px] relative">
                    {qrPattern.map((row, rowIdx) => 
                      row.map((filled, colIdx) => (
                        <motion.div
                          key={`${rowIdx}-${colIdx}`}
                          className="rounded-[0.5px]"
                          animate={{
                            backgroundColor: isValid 
                              ? '#22c55e' 
                              : filled ? '#1a1a1a' : '#ffffff'
                          }}
                          transition={{ duration: 0.15 }}
                        />
                      ))
                    )}
                    
                    {/* Scanning Line */}
                    <AnimatePresence>
                      {isScanning && (
                        <motion.div 
                          className="absolute left-0 right-0 h-0.5 rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)',
                            boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)'
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
                        className="absolute inset-0 bg-green-500 rounded-md flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.2, 1] }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          <Check className="w-6 h-6 text-white" strokeWidth={3} />
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
                          scale: [0, 1.2, 0],
                          x: Math.cos(p.angle) * p.distance,
                          y: Math.sin(p.angle) * p.distance,
                          opacity: [1, 1, 0]
                        }}
                        transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
                
                {/* Ticket Info */}
                <motion.div className="mt-2 text-center" animate={{ y: isValid ? -2 : 0 }}>
                  <AnimatePresence mode="wait">
                    {isValid ? (
                      <motion.div
                        key="valid"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="text-[9px] font-bold text-white drop-shadow-lg">VALID ✓</div>
                        <div className="text-[6px] text-white/80">Welcome!</div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="text-[8px] font-bold text-white drop-shadow-lg">EVENT 2026</div>
                        <div className="text-[5px] text-white/70">Scan to enter</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Phone Glow */}
          <motion.div
            animate={{
              opacity: isValid ? 0.5 : 0.15,
              scale: isValid ? 1.1 : 1
            }}
            className="absolute -inset-3 bg-gradient-to-r from-purple-500/30 to-green-500/30 rounded-3xl blur-xl -z-10"
          />
        </motion.div>
      </motion.div>

      {/* Data Flow Particles */}
      <AnimatePresence>
        {(isScanning || isValid) && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 60, y: 40 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [60, 140],
                  y: [40, 100]
                }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 0.4
                }}
                className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 z-15"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Feature Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-2 left-2 z-30"
      >
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-purple-500/30">
          <Wifi className="w-2 h-2 text-purple-400" />
          <span className="text-[6px] text-zinc-300">Realtime</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-2 right-2 z-30"
      >
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-green-500/30">
          <Shield className="w-2 h-2 text-green-400" />
          <span className="text-[6px] text-zinc-300">Secure</span>
        </div>
      </motion.div>
    </div>
  );
};

export default TicketingMockup;

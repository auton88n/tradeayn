import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Ticket, Users, TrendingUp } from 'lucide-react';

interface TicketRow {
  name: string;
  type: string;
  typeColor: string;
  time: string;
  scanned: boolean;
}

const AdminLaptop = ({ isValid, isScanning }: { isValid: boolean; isScanning: boolean }) => {
  const existingTickets: TicketRow[] = [
    { name: 'Sarah M.', type: 'VIP', typeColor: 'bg-purple-500/30 text-purple-300', time: '2m', scanned: true },
    { name: 'Mike R.', type: 'General', typeColor: 'bg-blue-500/30 text-blue-300', time: '5m', scanned: true },
    { name: 'Emma L.', type: 'Student', typeColor: 'bg-green-500/30 text-green-300', time: '8m', scanned: false },
  ];

  return (
    <div className="relative">
      {/* Laptop Frame - MacBook style */}
      <div className="w-72 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-xl p-1 shadow-2xl border border-zinc-600/50">
        {/* Camera notch */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
        
        {/* Screen */}
        <div className="bg-zinc-950 rounded-lg p-3 h-40 overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">TicketHub Admin</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.div 
                className={`w-2 h-2 rounded-full ${isScanning ? 'bg-yellow-400' : 'bg-green-400'}`}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[10px] text-green-400 font-medium">LIVE</span>
            </div>
          </div>
          
          {/* Ticket List */}
          <div className="space-y-1.5">
            <AnimatePresence>
              {isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(34, 197, 94, 0.4)' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] border border-green-500/40"
                >
                  <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span className="text-white font-medium">John S.</span>
                  <span className="text-purple-300 bg-purple-500/30 px-1.5 py-0.5 rounded text-[10px]">VIP</span>
                  <span className="text-green-400 ml-auto text-[10px]">Just now</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {existingTickets.map((ticket, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-[11px] bg-zinc-900/50 rounded-md">
                {ticket.scanned ? (
                  <Check className="w-3 h-3 text-green-500/60 flex-shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-zinc-600 flex-shrink-0" />
                )}
                <span className="text-zinc-300">{ticket.name}</span>
                <span className={`${ticket.typeColor} px-1.5 py-0.5 rounded text-[10px]`}>{ticket.type}</span>
                <span className="text-zinc-500 ml-auto text-[10px]">{ticket.time}</span>
              </div>
            ))}
            
            {/* Scanning indicator */}
            <AnimatePresence>
              {isScanning && !isValid && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-purple-500/20 border border-purple-500/30"
                >
                  <motion.div 
                    className="w-3 h-3 border-t-2 border-purple-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-[11px] text-purple-400">Scanning ticket...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-zinc-900/95 border-t border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-zinc-300">{isValid ? '248' : '247'} Sold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[11px] text-zinc-300">{isValid ? '90' : '89'} Scanned</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Laptop Base */}
      <div className="w-80 h-2 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-b-sm mx-auto shadow-lg" 
           style={{ marginLeft: '-16px' }} />
      <div className="w-16 h-1 bg-zinc-600/50 rounded-full mx-auto mt-0.5" />
    </div>
  );
};

const CustomerPhone = ({ isValid, isScanning, particles, qrPattern }: { 
  isValid: boolean; 
  isScanning: boolean;
  particles: Array<{ id: number; angle: number; distance: number; size: number; delay: number }>;
  qrPattern: boolean[][];
}) => {
  return (
    <motion.div
      animate={{ 
        rotateZ: isScanning ? -2 : 0,
        scale: isValid ? 1.02 : 1
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {/* Phone Frame */}
      <div className="relative w-40 h-72 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-700/50 overflow-hidden">
        {/* Phone shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20" />
        
        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[1.8rem] overflow-hidden">
          {/* Ticket Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-24 h-24 border border-white/30 rounded-full"
                  style={{ top: `${-15 + i * 25}%`, left: `${-25 + i * 18}%` }}
                />
              ))}
            </div>
          </div>
          
          {/* Ticket Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4 pt-8">
            {/* Event Label */}
            <motion.div 
              className="text-[9px] font-bold text-white/90 tracking-[0.15em] uppercase mb-2"
              animate={{ opacity: isValid ? 0.5 : 1 }}
            >
              ★ VIP ACCESS ★
            </motion.div>
            
            {/* QR Code Container */}
            <motion.div 
              className="relative bg-white rounded-xl p-3 shadow-xl"
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
              <div className="w-20 h-20 grid grid-cols-7 grid-rows-7 gap-[2px] relative">
                {qrPattern.map((row, rowIdx) => 
                  row.map((filled, colIdx) => (
                    <motion.div
                      key={`${rowIdx}-${colIdx}`}
                      className="rounded-[1px]"
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
                      className="absolute left-0 right-0 h-1 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)',
                        boxShadow: '0 0 12px rgba(168, 85, 247, 0.8)'
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
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.1, duration: 0.3 }}
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
            <motion.div className="mt-4 text-center" animate={{ y: isValid ? -2 : 0 }}>
              <AnimatePresence mode="wait">
                {isValid ? (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-base font-bold text-white drop-shadow-lg">VALID ✓</div>
                    <div className="text-xs text-white/80">Welcome!</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-sm font-bold text-white drop-shadow-lg">SUMMER FEST 2026</div>
                    <div className="text-[10px] text-white/70 mt-1">Section A • Row 12 • Seat 5</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
      
      {/* Phone Glow */}
      <motion.div
        animate={{
          opacity: isValid ? 0.6 : 0.2,
          scale: isValid ? 1.15 : 1
        }}
        className="absolute -inset-4 bg-gradient-to-r from-purple-500/40 to-green-500/40 rounded-[2.5rem] blur-2xl -z-10"
      />
    </motion.div>
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

  const particles = useMemo(() => 
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      angle: (i * 30) * Math.PI / 180,
      distance: 50 + Math.random() * 30,
      size: 3 + Math.random() * 3,
      delay: Math.random() * 0.1
    })), []
  );

  // Static QR code pattern with proper finder patterns in corners
  const qrPattern = useMemo(() => [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, false, true, false, false],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
  ], []);

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Subtle ambient glow - no box */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isValid 
            ? 'radial-gradient(circle at 55% 50%, rgba(34, 197, 94, 0.08) 0%, transparent 60%)'
            : isScanning
            ? 'radial-gradient(circle at 55% 50%, rgba(168, 85, 247, 0.06) 0%, transparent 60%)'
            : 'transparent'
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Centered overlapping layout - scaled down on mobile */}
      <div className="flex items-center justify-center scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 origin-center">
        {/* Laptop - Left/Back with 3D tilt */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10"
          style={{ 
            transform: 'perspective(800px) rotateY(-10deg) rotateX(4deg)',
            marginRight: '-50px'
          }}
        >
          <AdminLaptop isValid={isValid} isScanning={isScanning} />
        </motion.div>

        {/* Phone - Right/Front, overlapping laptop */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-20"
        >
          <CustomerPhone 
            isValid={isValid} 
            isScanning={isScanning}
            particles={particles}
            qrPattern={qrPattern}
          />
        </motion.div>
      </div>

      {/* Data Flow Particles */}
      <AnimatePresence>
        {(isScanning || isValid) && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -80, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [-80, 60],
                  y: [0, -20 + i * 15]
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.12,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="absolute w-2 h-2 rounded-full bg-purple-400/80 blur-[1px]"
                style={{ top: '45%' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketingMockup;

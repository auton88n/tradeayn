import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Ticket, Shield, Wifi, Users, TrendingUp, Zap } from 'lucide-react';

// Ticket row data type
interface TicketRow {
  name: string;
  type: 'VIP' | 'General' | 'Student';
  time: string;
  scanned: boolean;
}

// Type colors
const typeColors = {
  VIP: { bg: 'bg-purple-500/30', text: 'text-purple-300', border: 'border-purple-500/40' },
  General: { bg: 'bg-blue-500/30', text: 'text-blue-300', border: 'border-blue-500/40' },
  Student: { bg: 'bg-emerald-500/30', text: 'text-emerald-300', border: 'border-emerald-500/40' }
};

// Large Admin Laptop Dashboard with readable purchase feed
const AdminLaptop = ({ isValid, isScanning }: { isValid: boolean; isScanning: boolean }) => {
  const existingTickets: TicketRow[] = [
    { name: 'Sarah Mitchell', type: 'VIP', time: '2m ago', scanned: true },
    { name: 'Mike Roberts', type: 'General', time: '5m ago', scanned: true },
    { name: 'Emma Lopez', type: 'Student', time: '8m ago', scanned: true },
    { name: 'David Chen', type: 'VIP', time: '12m ago', scanned: false },
  ];

  return (
    <div className="relative">
      {/* Laptop Frame - Much bigger */}
      <div className="w-[280px] bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-t-xl p-1 shadow-2xl border border-zinc-500/30">
        {/* Camera notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-600">
          <div className="absolute inset-0.5 rounded-full bg-zinc-950" />
        </div>
        
        {/* Screen */}
        <div className="bg-zinc-950 rounded-lg p-3 h-[160px] overflow-hidden relative mt-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Ticket className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-bold text-white">TicketHub</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2 py-0.5 rounded-full">
              <motion.div 
                className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-yellow-400' : 'bg-green-400'}`}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[9px] font-medium text-green-400">LIVE</span>
            </div>
          </div>
          
          {/* Purchase Feed List */}
          <div className="space-y-1.5">
            <AnimatePresence>
              {isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1, backgroundColor: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)'] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-green-500/50"
                >
                  <div className="w-4 h-4 rounded-full bg-green-500/30 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  <span className="text-[10px] text-white font-semibold flex-1">John Smith</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${typeColors.VIP.bg} ${typeColors.VIP.text} font-medium`}>VIP</span>
                  <span className="text-[9px] text-green-400 font-medium">Just now</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {existingTickets.slice(0, 3).map((ticket, i) => (
              <motion.div 
                key={i} 
                className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900/60 rounded-lg"
                initial={false}
                animate={{ y: isValid ? 0 : 0 }}
              >
                {ticket.scanned ? (
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-green-500/70" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-600 bg-zinc-800" />
                )}
                <span className="text-[10px] text-zinc-300 flex-1">{ticket.name}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${typeColors[ticket.type].bg} ${typeColors[ticket.type].text} font-medium`}>
                  {ticket.type}
                </span>
                <span className="text-[9px] text-zinc-500">{ticket.time}</span>
              </motion.div>
            ))}
            
            {/* Scanning indicator */}
            <AnimatePresence>
              {isScanning && !isValid && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40"
                >
                  <motion.div 
                    className="w-4 h-4 border-2 border-t-purple-400 border-r-purple-400/30 border-b-purple-400/30 border-l-purple-400/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-[10px] text-purple-300 font-medium">Scanning ticket...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-zinc-900 to-zinc-900/90 border-t border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] text-zinc-300 font-medium">{isValid ? '248' : '247'} Sold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] text-zinc-300 font-medium">{isValid ? '90' : '89'} Scanned</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Laptop Base */}
      <div className="w-[300px] h-2 bg-gradient-to-b from-zinc-600 to-zinc-500 rounded-b-xl mx-auto shadow-lg" 
           style={{ marginLeft: '-10px' }} />
      <div className="w-20 h-1 bg-zinc-400/30 rounded-full mx-auto mt-0.5" />
    </div>
  );
};

// Large Customer Phone with ticket
const CustomerPhone = ({ phase }: { phase: 'idle' | 'scanning' | 'valid' }) => {
  const isScanning = phase === 'scanning';
  const isValid = phase === 'valid';

  // Generate particles for burst effect
  const particles = useMemo(() => 
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      angle: (i * 25.7) * Math.PI / 180,
      distance: 50 + Math.random() * 30,
      size: 3 + Math.random() * 3,
      delay: Math.random() * 0.15
    })), []
  );

  // QR code pattern - larger
  const qrPattern = useMemo(() => {
    const pattern = [];
    for (let row = 0; row < 9; row++) {
      const rowData = [];
      for (let col = 0; col < 9; col++) {
        const isCorner = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
        const isFilled = isCorner || Math.random() > 0.4;
        rowData.push(isFilled);
      }
      pattern.push(rowData);
    }
    return pattern;
  }, []);

  return (
    <motion.div
      animate={{ 
        rotateZ: isScanning ? -1 : 0,
        scale: isValid ? 1.02 : 1
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {/* Phone Frame - Much bigger: 160x280 */}
      <div className="relative w-40 h-[280px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-700/50 overflow-hidden">
        {/* Phone shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-zinc-800" />
        </div>
        
        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[1.8rem] overflow-hidden">
          {/* Ticket Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-24 h-24 border border-white/30 rounded-full"
                  style={{ top: `${-15 + i * 25}%`, left: `${-25 + (i % 3) * 35}%` }}
                />
              ))}
            </div>
          </div>
          
          {/* Ticket Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4 pt-8">
            {/* Event Label */}
            <motion.div 
              className="text-[10px] font-bold text-white/90 tracking-[0.2em] uppercase mb-2"
              animate={{ opacity: isValid ? 0.5 : 1 }}
            >
              ★ VIP ACCESS ★
            </motion.div>
            
            {/* QR Code Container */}
            <motion.div 
              className="relative bg-white rounded-xl p-3 shadow-xl"
              animate={{
                boxShadow: isValid 
                  ? '0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)'
                  : isScanning
                  ? '0 0 20px rgba(168, 85, 247, 0.6)'
                  : '0 5px 20px rgba(0,0,0,0.4)'
              }}
              transition={{ duration: 0.3 }}
            >
              {/* QR Code Grid - 80x80 */}
              <div className="w-20 h-20 grid grid-cols-9 grid-rows-9 gap-[1.5px] relative">
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
                      transition={{ duration: 0.15, delay: isValid ? (rowIdx + colIdx) * 0.01 : 0 }}
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
                        boxShadow: '0 0 12px rgba(168, 85, 247, 0.9), 0 0 24px rgba(168, 85, 247, 0.5)'
                      }}
                      initial={{ top: 0, opacity: 0 }}
                      animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.3, ease: 'linear', repeat: 1 }}
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
                      transition={{ delay: 0.1, duration: 0.35 }}
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
                    className="absolute rounded-full"
                    style={{ 
                      width: p.size, 
                      height: p.size,
                      left: '50%',
                      top: '50%',
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                      background: 'linear-gradient(135deg, #22c55e, #4ade80)'
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.3, 0],
                      x: Math.cos(p.angle) * p.distance,
                      y: Math.sin(p.angle) * p.distance,
                      opacity: [1, 1, 0]
                    }}
                    transition={{ duration: 0.7, delay: p.delay, ease: 'easeOut' }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
            
            {/* Ticket Info */}
            <motion.div className="mt-4 text-center" animate={{ y: isValid ? -3 : 0 }}>
              <AnimatePresence mode="wait">
                {isValid ? (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-base font-bold text-white drop-shadow-lg">VALID ✓</div>
                    <div className="text-[11px] text-white/80">Welcome to the event!</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-sm font-bold text-white drop-shadow-lg tracking-wide">SUMMER FEST 2026</div>
                    <div className="text-[10px] text-white/70 mt-1">SECTION A • ROW 12 • SEAT 8</div>
                    <div className="text-[9px] text-white/50 mt-0.5">Scan to validate entry</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full" />
      </div>
      
      {/* Phone Glow */}
      <motion.div
        animate={{
          opacity: isValid ? 0.6 : 0.2,
          scale: isValid ? 1.15 : 1
        }}
        className="absolute -inset-4 bg-gradient-to-r from-purple-500/40 via-pink-500/30 to-green-500/40 rounded-[3rem] blur-2xl -z-10"
      />
    </motion.div>
  );
};

const TicketingMockup = () => {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'valid'>('idle');

  useEffect(() => {
    const runCycle = () => {
      setPhase('idle');
      setTimeout(() => setPhase('scanning'), 1000);
      setTimeout(() => setPhase('valid'), 2800);
      setTimeout(() => setPhase('idle'), 5000);
    };

    runCycle();
    const interval = setInterval(runCycle, 5500);
    return () => clearInterval(interval);
  }, []);

  const isScanning = phase === 'scanning';
  const isValid = phase === 'valid';

  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center overflow-visible">
      {/* Background glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isValid 
            ? 'radial-gradient(ellipse at 60% 50%, rgba(34, 197, 94, 0.2) 0%, transparent 60%)'
            : isScanning
            ? 'radial-gradient(ellipse at 60% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 60% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)'
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Laptop - Positioned behind/left with 3D perspective */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute left-0 top-4 z-10"
        style={{ 
          transform: 'perspective(800px) rotateY(-12deg) rotateX(5deg)',
          transformOrigin: 'center center',
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
        }}
      >
        <AdminLaptop isValid={isValid} isScanning={isScanning} />
      </motion.div>

      {/* Customer Phone - Positioned front/right as hero */}
      <motion.div 
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute right-0 bottom-4 z-20"
        style={{
          filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))'
        }}
      >
        <CustomerPhone phase={phase} />
      </motion.div>

      {/* Data Flow Connection */}
      <AnimatePresence>
        {(isScanning || isValid) && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 180, y: 220 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  x: [180, 80],
                  y: [220, 100]
                }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.18,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="absolute w-2 h-2 rounded-full z-15"
                style={{
                  background: isValid 
                    ? 'linear-gradient(135deg, #22c55e, #4ade80)' 
                    : 'linear-gradient(135deg, #a855f7, #ec4899)'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Feature Badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-0 left-0 z-30"
      >
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-purple-500/40">
          <Wifi className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-medium text-zinc-200">Real-time Sync</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute top-0 right-0 z-30"
      >
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-green-500/40">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] font-medium text-zinc-200">Secure</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-cyan-500/40">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-medium text-zinc-200">500ms</span>
        </div>
      </motion.div>
    </div>
  );
};

export default TicketingMockup;

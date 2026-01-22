import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Ticket, Zap, Shield, Monitor, Users, TrendingUp } from 'lucide-react';

// Ticket row data type
interface TicketRow {
  name: string;
  type: string;
  time: string;
  scanned: boolean;
}

// Admin Laptop Component
const AdminLaptop = ({ isValid, isScanning }: { isValid: boolean; isScanning: boolean }) => {
  const existingTickets: TicketRow[] = [
    { name: 'Sarah M.', type: 'VIP', time: '2m ago', scanned: true },
    { name: 'Mike R.', type: 'General', time: '5m ago', scanned: true },
    { name: 'Emma L.', type: 'Student', time: '8m ago', scanned: false },
  ];

  return (
    <motion.div 
      className="relative hidden sm:block"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Laptop Frame */}
      <div className="relative">
        {/* Screen */}
        <div className="w-48 h-32 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-lg p-1 shadow-2xl border border-zinc-600">
          {/* Camera notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-900 border border-zinc-600" />
          
          {/* Screen content */}
          <div className="w-full h-full bg-zinc-950 rounded-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1 bg-zinc-900/80 border-b border-zinc-800">
              <div className="flex items-center gap-1">
                <Ticket className="w-2.5 h-2.5 text-purple-400" />
                <span className="text-[7px] font-bold text-white">TicketHub</span>
              </div>
              <div className="flex items-center gap-1">
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-[6px] text-green-400">LIVE</span>
              </div>
            </div>
            
            {/* Dashboard content */}
            <div className="p-1.5 space-y-1">
              {/* Title */}
              <div className="text-[6px] text-zinc-400 font-medium">Recent Scans</div>
              
              {/* New entry animation */}
              <AnimatePresence>
                {isValid && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1 px-1 py-0.5 rounded border border-green-500/30"
                  >
                    <Check className="w-2 h-2 text-green-400" />
                    <span className="text-[6px] text-white font-medium">John S.</span>
                    <span className="text-[5px] text-purple-400 bg-purple-500/20 px-1 rounded">VIP</span>
                    <span className="text-[5px] text-green-400 ml-auto">Just now</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Existing tickets */}
              <div className="space-y-0.5">
                {existingTickets.slice(0, isValid ? 2 : 3).map((ticket, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-900/50"
                    animate={{ y: isValid ? 0 : 0 }}
                  >
                    {ticket.scanned ? (
                      <Check className="w-2 h-2 text-green-500/70" />
                    ) : (
                      <div className="w-2 h-2 rounded-full border border-zinc-600" />
                    )}
                    <span className="text-[6px] text-zinc-300">{ticket.name}</span>
                    <span className={`text-[5px] px-1 rounded ${
                      ticket.type === 'VIP' ? 'text-purple-400 bg-purple-500/20' :
                      ticket.type === 'Student' ? 'text-blue-400 bg-blue-500/20' :
                      'text-zinc-400 bg-zinc-700'
                    }`}>{ticket.type}</span>
                    <span className="text-[5px] text-zinc-500 ml-auto">{ticket.time}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Scanning indicator */}
              <AnimatePresence>
                {isScanning && !isValid && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 px-1 py-0.5 rounded bg-purple-500/10 border border-purple-500/30"
                  >
                    <motion.div 
                      className="w-2 h-2 border-t border-purple-400 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="text-[6px] text-purple-400">Scanning...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Stats bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2 py-1 bg-zinc-900/90 border-t border-zinc-800">
              <div className="flex items-center gap-1">
                <Users className="w-2 h-2 text-purple-400" />
                <motion.span 
                  className="text-[6px] text-zinc-300 font-mono"
                  key={isValid ? 'updated' : 'initial'}
                >
                  {isValid ? '248' : '247'} Sold
                </motion.span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-2 h-2 text-green-400" />
                <motion.span 
                  className="text-[6px] text-zinc-300 font-mono"
                  key={isValid ? 'updated2' : 'initial2'}
                >
                  {isValid ? '90' : '89'} Scanned
                </motion.span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Laptop base */}
        <div className="w-52 h-2 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-b-lg -mt-px mx-auto shadow-lg" />
        <div className="w-56 h-1 bg-zinc-800 rounded-b-sm mx-auto" />
      </div>
      
      {/* Floating badge */}
      <motion.div
        className="absolute -top-3 -left-2 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center gap-1"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Monitor className="w-2.5 h-2.5 text-purple-400" />
        <span className="text-[8px] font-semibold text-purple-300">Admin</span>
      </motion.div>
    </motion.div>
  );
};

// Connection Line Component
const ConnectionLine = ({ active }: { active: boolean }) => (
  <div className="hidden sm:flex items-center justify-center w-12">
    <svg className="w-full h-16" viewBox="0 0 48 64">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,32 Q24,20 48,32"
        stroke="url(#lineGradient)"
        strokeWidth="2"
        strokeDasharray="4 4"
        fill="none"
        animate={{
          strokeDashoffset: active ? [0, -16] : 0,
          opacity: active ? 1 : 0.3
        }}
        transition={{ 
          strokeDashoffset: { duration: 0.5, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 0.3 }
        }}
      />
      {/* Data packet */}
      <AnimatePresence>
        {active && (
          <motion.circle
            r="3"
            fill="#22C55E"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              cx: [0, 24, 48],
              cy: [32, 22, 32]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  </div>
);

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
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      angle: (i * 30) * Math.PI / 180,
      distance: 50 + Math.random() * 30,
      size: 3 + Math.random() * 3,
      delay: Math.random() * 0.15
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
    <div className="relative w-full h-full min-h-[320px] flex items-center justify-center gap-2 sm:gap-4 overflow-hidden px-2">
      {/* Background glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isValid 
            ? 'radial-gradient(circle at 60% 50%, rgba(34, 197, 94, 0.12) 0%, transparent 60%)'
            : isScanning
            ? 'radial-gradient(circle at 60% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)'
            : 'radial-gradient(circle at 60% 50%, rgba(168, 85, 247, 0.04) 0%, transparent 60%)'
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Admin Laptop */}
      <AdminLaptop isValid={isValid} isScanning={isScanning} />
      
      {/* Connection Line */}
      <ConnectionLine active={isScanning || isValid} />

      {/* Customer Phone */}
      <motion.div 
        className="relative z-10"
        animate={{ 
          rotateY: isScanning ? 6 : 0,
          rotateZ: isScanning ? -1.5 : 0,
          scale: isValid ? 1.02 : 1
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Phone Frame */}
        <div className="relative w-28 h-52 sm:w-32 sm:h-56 bg-gradient-to-b from-zinc-800 via-zinc-850 to-zinc-900 rounded-[1.75rem] shadow-2xl border border-zinc-700/50 overflow-hidden">
          {/* Phone shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full z-20" />
          
          {/* Screen */}
          <div className="absolute inset-[3px] rounded-[1.5rem] overflow-hidden">
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
            <div className="relative h-full flex flex-col items-center justify-center p-2.5 pt-7">
              {/* Event Label */}
              <motion.div 
                className="text-[6px] font-bold text-white/90 tracking-[0.15em] uppercase mb-1.5"
                animate={{ opacity: isValid ? 0.5 : 1 }}
              >
                ★ VIP ACCESS ★
              </motion.div>
              
              {/* QR Code Container */}
              <motion.div 
                className="relative bg-white rounded-lg p-2 shadow-lg"
                animate={{
                  boxShadow: isValid 
                    ? '0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.3)'
                    : isScanning
                    ? '0 0 15px rgba(168, 85, 247, 0.5)'
                    : '0 4px 15px rgba(0,0,0,0.3)'
                }}
                transition={{ duration: 0.3 }}
              >
                {/* QR Code Grid */}
                <div className="w-16 h-16 grid grid-cols-7 grid-rows-7 gap-[1.5px] relative">
                  {qrPattern.map((row, rowIdx) => 
                    row.map((filled, colIdx) => (
                      <motion.div
                        key={`${rowIdx}-${colIdx}`}
                        className="rounded-[1px]"
                        animate={{
                          backgroundColor: isValid 
                            ? '#22c55e' 
                            : isScanning && rowIdx <= Math.floor((Date.now() % 1200) / 170)
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
                        className="absolute left-0 right-0 h-0.5 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)',
                          boxShadow: '0 0 12px rgba(168, 85, 247, 0.8)'
                        }}
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: 'linear', repeat: 1 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Valid Overlay */}
                <AnimatePresence>
                  {isValid && (
                    <motion.div 
                      className="absolute inset-0 bg-green-500 rounded-lg flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.1, duration: 0.35 }}
                      >
                        <Check className="w-8 h-8 text-white" strokeWidth={3} />
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
              <motion.div className="mt-2.5 text-center" animate={{ y: isValid ? -3 : 0 }}>
                <AnimatePresence mode="wait">
                  {isValid ? (
                    <motion.div
                      key="valid"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-white font-bold text-xs"
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
                      <div className="text-white font-bold text-[9px]">SUMMER FEST 2026</div>
                      <div className="text-white/70 text-[7px] mt-0.5">SECTION A • ROW 12</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/40 rounded-full" />
        </div>

        {/* Valid Badge */}
        <AnimatePresence>
          {isValid && (
            <motion.div
              className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95))',
                boxShadow: '0 0 25px rgba(34, 197, 94, 0.6), 0 4px 15px rgba(0,0,0,0.3)',
              }}
              initial={{ y: 15, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
              <span className="text-white font-bold text-xs tracking-wide">VALID</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Feature Badges */}
      <motion.div
        className="absolute top-2 right-2 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center gap-1"
        animate={{ 
          y: [0, -3, 0],
          boxShadow: isScanning ? '0 0 12px rgba(168, 85, 247, 0.4)' : '0 0 0px transparent'
        }}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <Zap className="w-2.5 h-2.5 text-purple-400" />
        <span className="text-[8px] font-semibold text-purple-300">500ms</span>
      </motion.div>
      
      <motion.div
        className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40 flex items-center gap-1"
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Shield className="w-2.5 h-2.5 text-green-400" />
        <span className="text-[8px] font-semibold text-green-300">Secure</span>
      </motion.div>

      <motion.div
        className="absolute bottom-2 left-2 sm:left-auto sm:bottom-10 sm:right-2 px-2 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center gap-1"
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Ticket className="w-2.5 h-2.5 text-pink-400" />
        <span className="text-[8px] font-semibold text-pink-300">Digital</span>
      </motion.div>

      {/* Ambient glow rings */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ left: '15%' }}
        animate={{ opacity: isValid ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {[1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-green-500/20"
            style={{ width: 80 + ring * 50, height: 80 + ring * 50 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isValid ? { scale: [0.8, 1.3, 1.5], opacity: [0.5, 0.2, 0] } : {}}
            transition={{ duration: 1, delay: ring * 0.12, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default TicketingMockup;

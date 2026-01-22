import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, QrCode, Smartphone } from 'lucide-react';

const TicketingMockup = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true);
      setIsValid(false);
      
      setTimeout(() => {
        setIsValid(true);
        setIsScanning(false);
      }, 1500);
      
      setTimeout(() => {
        setIsValid(false);
      }, 3500);
    }, 4000);

    // Initial animation
    setTimeout(() => {
      setIsScanning(true);
      setTimeout(() => {
        setIsValid(true);
        setIsScanning(false);
      }, 1500);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[180px] flex items-center justify-center">
      {/* Phone Frame */}
      <motion.div 
        className="relative w-24 h-44 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl border border-zinc-700/50 overflow-hidden"
        animate={{ 
          rotateY: isScanning ? 5 : 0,
          rotateX: isScanning ? -3 : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Screen */}
        <div className="absolute inset-1 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl overflow-hidden">
          {/* Status Bar */}
          <div className="h-4 bg-black/30 flex items-center justify-center">
            <div className="w-8 h-1 bg-zinc-600 rounded-full" />
          </div>
          
          {/* Content */}
          <div className="flex flex-col items-center justify-center h-[calc(100%-16px)] p-2">
            {/* QR Code Container */}
            <div className="relative w-14 h-14 bg-white rounded-lg p-1 shadow-lg">
              {/* QR Pattern */}
              <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-0.5">
                {[...Array(36)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-[1px] ${
                      [0,1,2,5,6,11,12,17,18,23,24,29,30,31,32,35,
                       3,4,9,10,14,15,20,21,25,26,33,34].includes(i) 
                        ? 'bg-zinc-900' 
                        : 'bg-white'
                    }`}
                  />
                ))}
              </div>
              
              {/* Scanning Line */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'linear' }}
                  />
                )}
              </AnimatePresence>
              
              {/* Valid Overlay */}
              <AnimatePresence>
                {isValid && (
                  <motion.div 
                    className="absolute inset-0 bg-green-500/90 rounded-lg flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Ticket Info */}
            <div className="mt-2 text-center">
              <AnimatePresence mode="wait">
                {isValid ? (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[8px] font-medium text-green-400"
                  >
                    ✓ VALID
                  </motion.div>
                ) : (
                  <motion.div
                    key="ticket"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[8px] font-medium text-white/80"
                  >
                    VIP PASS
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="text-[6px] text-white/50 mt-0.5">
                Concert 2026
              </div>
            </div>
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full" />
      </motion.div>
      
      {/* Floating Icons */}
      <motion.div
        className="absolute -right-2 top-4 w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center"
        animate={{ 
          y: [0, -5, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <QrCode className="w-4 h-4 text-purple-400" />
      </motion.div>
      
      <motion.div
        className="absolute -left-2 bottom-6 w-8 h-8 bg-pink-500/20 border border-pink-500/30 rounded-lg flex items-center justify-center"
        animate={{ 
          y: [0, 5, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Smartphone className="w-4 h-4 text-pink-400" />
      </motion.div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default TicketingMockup;

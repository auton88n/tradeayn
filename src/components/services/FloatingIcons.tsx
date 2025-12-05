import { motion } from 'framer-motion';

const icons = [
  { emoji: '📊', color: 'bg-blue-500/20' },
  { emoji: '⚡', color: 'bg-yellow-500/20' },
  { emoji: '🔄', color: 'bg-green-500/20' },
  { emoji: '📧', color: 'bg-red-500/20' },
  { emoji: '📁', color: 'bg-purple-500/20' },
  { emoji: '🔗', color: 'bg-cyan-500/20' },
];

const FloatingIcons = () => {
  const radius = 70;

  return (
    <div className="relative h-[160px] flex items-center justify-center">
      {/* Central Hub */}
      <motion.div 
        className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        animate={{ rotate: 360 }}
        transition={{ 
          scale: { duration: 0.5 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
        viewport={{ once: true }}
      >
        <span className="text-2xl">⚙️</span>
      </motion.div>
      
      {/* Orbiting Container */}
      <motion.div 
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {icons.map((icon, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={i}
              className={`absolute w-10 h-10 rounded-xl ${icon.color} flex items-center justify-center shadow-md border border-border/30`}
              style={{ 
                left: `calc(50% + ${x}px - 20px)`, 
                top: `calc(50% + ${y}px - 20px)` 
              }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              viewport={{ once: true }}
            >
              {/* Counter-rotate to keep icons upright */}
              <motion.span 
                className="text-lg"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                {icon.emoji}
              </motion.span>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Dashed orbit ring */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-border/50"
        />
      </svg>
    </div>
  );
};

export default FloatingIcons;

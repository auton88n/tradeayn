import { motion } from 'framer-motion';

const icons = [
  { emoji: '📊', color: 'bg-blue-500/20', delay: 0 },
  { emoji: '⚡', color: 'bg-yellow-500/20', delay: 0.1 },
  { emoji: '🔄', color: 'bg-green-500/20', delay: 0.2 },
  { emoji: '📧', color: 'bg-red-500/20', delay: 0.3 },
  { emoji: '📁', color: 'bg-purple-500/20', delay: 0.4 },
  { emoji: '🔗', color: 'bg-cyan-500/20', delay: 0.5 },
];

const FloatingIcons = () => {
  return (
    <div className="relative h-[160px] flex items-center justify-center">
      {/* Central Hub */}
      <motion.div 
        className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <span className="text-2xl">⚙️</span>
      </motion.div>
      
      {/* Orbiting Icons */}
      {icons.map((icon, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const radius = 70;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={i}
            className={`absolute w-10 h-10 rounded-xl ${icon.color} flex items-center justify-center shadow-md border border-border/30`}
            style={{ left: `calc(50% + ${x}px - 20px)`, top: `calc(50% + ${y}px - 20px)` }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + icon.delay, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            viewport={{ once: true }}
          >
            <span className="text-lg">{icon.emoji}</span>
          </motion.div>
        );
      })}
      
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        {icons.map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const radius = 70;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.line
              key={i}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${x}px)`}
              y2={`calc(50% + ${y}px)`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
              viewport={{ once: true }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default FloatingIcons;

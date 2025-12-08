import { motion } from 'framer-motion';
import { Users, Headphones, TrendingUp, Calculator, FileText, MessageCircle } from 'lucide-react';

const AIEmployeeMockup = () => {
  const roles = [
    { icon: Users, label: 'HR', color: 'bg-blue-500' },
    { icon: Headphones, label: 'Support', color: 'bg-green-500' },
    { icon: TrendingUp, label: 'Sales', color: 'bg-purple-500' },
    { icon: Calculator, label: 'Finance', color: 'bg-yellow-500' },
    { icon: FileText, label: 'Admin', color: 'bg-orange-500' },
    { icon: MessageCircle, label: 'Social', color: 'bg-pink-500' },
  ];

  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center" dir="ltr">
      {/* Central Brain/AI Icon */}
      <motion.div
        className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 z-10"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-2xl font-bold text-white">AI</span>
      </motion.div>

      {/* Orbiting Role Icons */}
      {roles.map((role, index) => {
        const angle = (index * 60) - 90; // Start from top, 60 degrees apart
        const radius = 100;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <motion.div
            key={role.label}
            className={`absolute w-12 h-12 rounded-xl ${role.color} flex items-center justify-center shadow-lg`}
            initial={{ x, y, opacity: 0, scale: 0 }}
            animate={{
              x,
              y,
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: index * 0.1,
              duration: 0.5,
              ease: 'backOut',
            }}
            whileHover={{ scale: 1.1 }}
          >
            <role.icon className="w-5 h-5 text-white" />
          </motion.div>
        );
      })}

      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {roles.map((_, index) => {
          const angle = (index * 60) - 90;
          const radius = 100;
          const centerX = 50; // percentage
          const centerY = 50;
          const endX = centerX + (Math.cos((angle * Math.PI) / 180) * 35);
          const endY = centerY + (Math.sin((angle * Math.PI) / 180) * 35);
          
          return (
            <motion.line
              key={index}
              x1={`${centerX}%`}
              y1={`${centerY}%`}
              x2={`${endX}%`}
              y2={`${endY}%`}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Floating Labels */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-neutral-800/80 backdrop-blur-sm rounded-full px-4 py-1.5 border border-neutral-700"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <span className="text-xs font-medium text-cyan-400">6 AI Roles Available</span>
      </motion.div>
    </div>
  );
};

export default AIEmployeeMockup;

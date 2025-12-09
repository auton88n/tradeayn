import { motion } from 'framer-motion';
import { Users, Headphones, TrendingUp, Calculator, FileText, MessageCircle, Brain } from 'lucide-react';
const AIEmployeeMockup = () => {
  const roles = [{
    icon: Users,
    label: 'HR',
    gradient: 'from-blue-400 to-blue-600',
    iconColor: 'text-blue-500'
  }, {
    icon: Headphones,
    label: 'Support',
    gradient: 'from-emerald-400 to-emerald-600',
    iconColor: 'text-emerald-500'
  }, {
    icon: TrendingUp,
    label: 'Sales',
    gradient: 'from-violet-400 to-violet-600',
    iconColor: 'text-violet-500'
  }, {
    icon: Calculator,
    label: 'Finance',
    gradient: 'from-amber-400 to-amber-600',
    iconColor: 'text-amber-500'
  }, {
    icon: FileText,
    label: 'Admin',
    gradient: 'from-orange-400 to-orange-600',
    iconColor: 'text-orange-500'
  }, {
    icon: MessageCircle,
    label: 'Social',
    gradient: 'from-pink-400 to-pink-600',
    iconColor: 'text-pink-500'
  }];
  const orbitRadius = 120;
  return <div className="relative w-full h-full min-h-[320px] flex items-center justify-center" dir="ltr">
      {/* Background ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Orbital path ring */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{
      zIndex: 0
    }}>
        <defs>
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <circle cx="50%" cy="50%" r={orbitRadius} fill="none" stroke="url(#orbitGradient)" strokeWidth="1" strokeDasharray="4 8" className="opacity-60" />
      </svg>


      {/* Central Brain Hub */}
      <div className="absolute z-20 flex items-center justify-center">
        {/* Outer rotating ring */}
        <motion.div className="absolute w-28 h-28 rounded-full border border-cyan-400/20" animate={{
        rotate: 360
      }} transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }} style={{
        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
      }} />
        
        {/* Inner glow ring */}
        <motion.div className="absolute w-24 h-24 rounded-full" animate={{
        scale: [1, 1.05, 1]
      }} transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }} style={{
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
        boxShadow: '0 0 40px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)'
      }} />

        {/* Brain container */}
        <motion.div className="relative w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-xl" animate={{
        scale: [1, 1.02, 1]
      }} transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }} style={{
        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        boxShadow: '0 8px 32px rgba(34, 211, 238, 0.2), 0 0 60px rgba(34, 211, 238, 0.1)'
      }}>
          <Brain className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* Orbiting Role Cards */}
      <motion.div className="absolute w-full h-full" animate={{
      rotate: 360
    }} transition={{
      duration: 60,
      repeat: Infinity,
      ease: "linear"
    }} style={{
      zIndex: 10
    }}>
        {roles.map((role, index) => {
        const angle = index * 60 - 90;
        const x = Math.cos(angle * Math.PI / 180) * orbitRadius;
        const y = Math.sin(angle * Math.PI / 180) * orbitRadius;
        return <motion.div key={role.label} className="absolute left-1/2 top-1/2" style={{
          x,
          y,
          marginLeft: -28,
          marginTop: -28
        }} initial={{
          opacity: 0,
          scale: 0
        }} animate={{
          opacity: 1,
          scale: 1,
          rotate: -360
        }} transition={{
          opacity: {
            delay: index * 0.1,
            duration: 0.5
          },
          scale: {
            delay: index * 0.1,
            duration: 0.5,
            type: "spring",
            stiffness: 200
          },
          rotate: {
            duration: 60,
            repeat: Infinity,
            ease: "linear"
          }
        }}>
              {/* Card with glassmorphism */}
              <motion.div className="relative w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer group" animate={{
            y: [0, -4, 0]
          }} transition={{
            duration: 2 + index * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2
          }} whileHover={{
            scale: 1.15
          }} style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
                {/* Gradient accent line */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r ${role.gradient} opacity-80`} />
                
                {/* Icon */}
                <role.icon className={`w-6 h-6 ${role.iconColor}`} strokeWidth={1.5} />

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${role.gradient}`} style={{
              filter: 'blur(12px)',
              zIndex: -1
            }} />

                {/* Label tooltip on hover */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] font-medium text-white/70 whitespace-nowrap">{role.label}</span>
                </div>
              </motion.div>
            </motion.div>;
      })}
      </motion.div>

      {/* Premium Glass Pill Badge */}
      <motion.div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30" initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 1.2,
      duration: 0.5
    }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
      }}>
          {/* Animated dot */}
          <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400" animate={{
          opacity: [1, 0.4, 1]
        }} transition={{
          duration: 2,
          repeat: Infinity
        }} />
          <span className="text-xs font-medium text-cyan-400">+6 AI Roles Available</span>
        </div>
      </motion.div>
    </div>;
};
export default AIEmployeeMockup;
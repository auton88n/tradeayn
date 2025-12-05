import { motion } from 'framer-motion';
import { Mail, Instagram } from 'lucide-react';

const MobileMockup = () => {
  const stats = [
    { value: '3.2M', label: 'Followers' },
    { value: '8.5%', label: 'Engagement' },
    { value: '50+', label: 'Brand Deals' },
  ];

  const navDots = [0, 1, 2, 3, 4];

  return (
    <div className="relative flex justify-center items-center py-8">
      {/* iPhone Frame */}
      <motion.div 
        className="relative w-[220px] h-[440px] bg-neutral-900 rounded-[40px] p-2 shadow-2xl"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        viewport={{ once: true }}
      >
        {/* Screen */}
        <div className="w-full h-full bg-neutral-950 rounded-[32px] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-neutral-900 rounded-b-2xl z-10" />
          
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 pt-2 text-[10px] text-neutral-500">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-neutral-700 rounded-sm" />
              <div className="w-4 h-2 bg-neutral-700 rounded-sm" />
              <div className="w-6 h-2 bg-neutral-700 rounded-sm" />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex flex-col items-center justify-center h-full px-4 pb-6 pt-4 -mt-4">
            {/* Name Section */}
            <motion.div 
              className="text-center mb-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif italic text-[22px] leading-tight">
                <span className="text-rose-400">SARAH</span>
              </h2>
              <h2 className="font-serif italic text-[22px] leading-tight text-white -mt-1">
                JOHNSON
              </h2>
            </motion.div>

            {/* Subtitle */}
            <motion.p 
              className="text-rose-400/80 text-[9px] tracking-wider uppercase mb-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
            >
              Fashion & Lifestyle Influencer
            </motion.p>

            {/* Bio */}
            <motion.p 
              className="text-neutral-500 text-[7px] text-center leading-relaxed mb-4 px-2 max-w-[160px]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              viewport={{ once: true }}
            >
              Creating authentic content that inspires millions worldwide. Let's collaborate and build something amazing together.
            </motion.p>

            {/* Stats Row */}
            <div className="flex gap-2 mb-4 w-full px-1">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  className="flex-1 bg-neutral-800/60 backdrop-blur-sm rounded-lg py-2 px-1 text-center border border-neutral-700/30"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <p className="text-white font-serif text-[11px] font-medium">{stat.value}</p>
                  <p className="text-neutral-500 text-[6px] uppercase tracking-wide">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button 
              className="flex items-center gap-1.5 bg-white text-neutral-900 rounded-full px-4 py-1.5 text-[9px] font-medium shadow-lg mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <Mail className="w-3 h-3" />
              Work With Me
            </motion.button>

            {/* Social Icons */}
            <motion.div 
              className="flex gap-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                <Instagram className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Navigation Dots - Right Side */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {navDots.map((_, i) => (
              <motion.div
                key={i}
                className={`rounded-full transition-all ${
                  i === 0 
                    ? 'w-1.5 h-1.5 bg-rose-400' 
                    : 'w-1 h-1 bg-neutral-600'
                }`}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.05, duration: 0.3 }}
                viewport={{ once: true }}
              />
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Floating Elements */}
      <motion.div 
        className="absolute -right-4 top-16 bg-neutral-900 shadow-lg rounded-xl p-3 border border-neutral-800"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
            <span className="text-rose-400 text-xs">↑</span>
          </div>
          <div>
            <p className="text-[10px] text-neutral-500">Engagement</p>
            <p className="text-xs font-bold text-rose-400">+24%</p>
          </div>
        </div>
      </motion.div>

      {/* Additional Floating Card - Left Side */}
      <motion.div 
        className="absolute -left-4 bottom-24 bg-neutral-900 shadow-lg rounded-xl p-2.5 border border-neutral-800"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 text-[10px]">💰</span>
          </div>
          <div>
            <p className="text-[9px] text-neutral-500">Revenue</p>
            <p className="text-[11px] font-bold text-emerald-400">+$2.3K</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MobileMockup;

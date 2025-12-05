import { motion } from 'framer-motion';
import { Mail, Instagram, TrendingUp, Users, Heart, Eye } from 'lucide-react';
import influencerBg from '@/assets/influencer-woman-bg.jpg';
const MobileMockup = () => {
  const stats = [{
    value: '3.2M',
    label: 'Followers'
  }, {
    value: '8.5%',
    label: 'Engagement'
  }, {
    value: '50+',
    label: 'Brand Deals'
  }];
  const navDots = [0, 1, 2, 3, 4];
  return <div className="relative flex justify-center items-center py-16 lg:py-8">
      {/* Phone-Centric Layout Container */}
      <div className="relative">
        {/* iPhone Frame - Center */}
        <div className="relative w-[280px] h-[560px] bg-neutral-900 rounded-[50px] p-2.5 shadow-2xl z-10">
          {/* Screen */}
          <div className="w-full h-full bg-neutral-950 rounded-[40px] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-neutral-900 rounded-b-2xl z-10" />
            
            {/* Status Bar */}
            <div className="flex justify-between items-center px-8 pt-2.5 text-[11px] text-neutral-500 relative z-20">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-neutral-700 rounded-sm" />
                <div className="w-4 h-2 bg-neutral-700 rounded-sm" />
                <div className="w-6 h-2 bg-neutral-700 rounded-sm" />
              </div>
            </div>
            
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
              style={{ backgroundImage: `url(${influencerBg})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
            
            {/* Main Content */}
            <div className="flex flex-col items-center justify-center h-full px-6 pb-8 pt-6 -mt-4 relative z-10">
              {/* Name Section */}
              <motion.div className="text-center mb-3" initial={{
                opacity: 0,
                y: 10
              }} whileInView={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: 0.3,
                duration: 0.5
              }} viewport={{
                once: true
              }}>
                <h2 className="font-serif italic text-[28px] leading-tight">
                  <span className="text-rose-400">SARAH</span>
                </h2>
                <h2 className="font-serif italic text-[28px] leading-tight text-white -mt-1">
                  JOHNSON
                </h2>
              </motion.div>

              {/* Subtitle */}
              <motion.p className="text-rose-400/80 text-[10px] tracking-wider uppercase mb-3" initial={{
                opacity: 0
              }} whileInView={{
                opacity: 1
              }} transition={{
                delay: 0.4,
                duration: 0.5
              }} viewport={{
                once: true
              }}>
                Fashion & Lifestyle Influencer
              </motion.p>

              {/* Bio */}
              <motion.p className="text-neutral-400 text-[9px] text-center leading-relaxed mb-5 px-4 max-w-[200px]" initial={{
                opacity: 0
              }} whileInView={{
                opacity: 1
              }} transition={{
                delay: 0.5,
                duration: 0.5
              }} viewport={{
                once: true
              }}>
                Creating authentic content that inspires millions worldwide. Let's collaborate and build something amazing together.
              </motion.p>

              {/* Stats Row */}
              <div className="flex gap-2.5 mb-5 w-full px-2">
                {stats.map((stat, i) => <motion.div key={i} className="flex-1 bg-neutral-800/70 backdrop-blur-sm rounded-xl py-3 px-2 text-center border border-neutral-700/40" initial={{
                  opacity: 0,
                  y: 10
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.5 + i * 0.1,
                  duration: 0.4
                }} viewport={{
                  once: true
                }}>
                  <p className="text-white font-serif text-[14px] font-medium">{stat.value}</p>
                  <p className="text-neutral-500 text-[7px] uppercase tracking-wide">{stat.label}</p>
                </motion.div>)}
              </div>

              {/* CTA Button */}
              <motion.button className="flex items-center gap-2 bg-white text-neutral-900 rounded-full px-6 py-2 text-[11px] font-medium shadow-lg mb-5" initial={{
                opacity: 0,
                scale: 0.9
              }} whileInView={{
                opacity: 1,
                scale: 1
              }} transition={{
                delay: 0.7,
                duration: 0.4
              }} viewport={{
                once: true
              }}>
                <Mail className="w-4 h-4" />
                Work With Me
              </motion.button>

              {/* Social Icons */}
              <motion.div className="flex gap-4" initial={{
                opacity: 0
              }} whileInView={{
                opacity: 1
              }} transition={{
                delay: 0.8,
                duration: 0.4
              }} viewport={{
                once: true
              }}>
                <div className="w-9 h-9 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <Instagram className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="w-9 h-9 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </div>
                <div className="w-9 h-9 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Navigation Dots - Right Side */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
              {navDots.map((_, i) => <motion.div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-2 h-2 bg-rose-400' : 'w-1.5 h-1.5 bg-neutral-600'}`} initial={{
                opacity: 0,
                x: 10
              }} whileInView={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.9 + i * 0.05,
                duration: 0.3
              }} viewport={{
                once: true
              }} />)}
            </div>
          </div>
        </div>

        {/* Instagram Card - Top Right */}
        <motion.div 
          className="absolute top-8 -right-28 lg:-right-48 bg-neutral-900/95 backdrop-blur-sm shadow-2xl rounded-2xl p-3 lg:p-4 border border-neutral-800 z-20 cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, x: 20 }}
          whileInView={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
            <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs lg:text-sm">Instagram</p>
              <p className="text-neutral-500 text-[9px] lg:text-[10px]">Social Platform</p>
            </div>
          </div>
          <div className="flex gap-3 lg:gap-4">
            <div>
              <p className="text-[#E1306C] font-bold text-lg lg:text-xl">1.1M</p>
              <p className="text-neutral-500 text-[8px] lg:text-[9px] flex items-center gap-1"><Users className="w-3 h-3" /> Followers</p>
            </div>
            <div>
              <p className="text-[#E1306C] font-bold text-lg lg:text-xl">6.8%</p>
              <p className="text-neutral-500 text-[8px] lg:text-[9px] flex items-center gap-1"><Heart className="w-3 h-3" /> Engagement</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg lg:text-xl">150K</p>
              <p className="text-neutral-500 text-[8px] lg:text-[9px] flex items-center gap-1"><Eye className="w-3 h-3" /> Avg Views</p>
            </div>
          </div>
        </motion.div>

        {/* Engagement Card - Bottom Right */}
        <motion.div 
          className="absolute bottom-32 -right-16 lg:-right-28 bg-neutral-900/95 backdrop-blur-sm shadow-xl rounded-xl p-2.5 lg:p-3 border border-neutral-800 z-20 cursor-pointer"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
          transition={{ delay: 0.7, duration: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] lg:text-[11px] text-neutral-500">Engagement</p>
              <p className="text-sm lg:text-base font-bold text-emerald-400">+24%</p>
            </div>
          </div>
        </motion.div>

        {/* Top Engagement Badge - Bottom Center */}
        <motion.div 
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-neutral-900/95 backdrop-blur-sm shadow-xl rounded-full px-4 lg:px-5 py-2 lg:py-2.5 border border-neutral-800 flex items-center gap-2 z-20 cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          whileInView={{ scale: 1, opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.9, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
          <p className="text-[10px] lg:text-[11px] text-neutral-300 whitespace-nowrap">Top 5% Engagement Rate in Fashion</p>
        </motion.div>

        {/* TikTok Card - Top Left */}
        <motion.div 
          className="absolute -top-12 -left-28 lg:-left-48 bg-neutral-900/95 backdrop-blur-sm shadow-2xl rounded-2xl p-3 lg:p-4 border border-neutral-800 z-20 hidden md:block cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, x: -20 }}
          whileInView={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.6, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
            <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-neutral-800 flex items-center justify-center">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-xs lg:text-sm">TikTok</p>
              <p className="text-neutral-500 text-[9px] lg:text-[10px]">Social Platform</p>
            </div>
          </div>
          <div className="flex gap-3 lg:gap-4">
            <div>
              <p className="text-[#00f2ea] font-bold text-lg lg:text-xl">2.1M</p>
              <p className="text-neutral-500 text-[8px] lg:text-[9px] flex items-center gap-1"><Users className="w-3 h-3" /> Followers</p>
            </div>
            <div>
              <p className="text-[#00f2ea] font-bold text-lg lg:text-xl">12.3%</p>
              <p className="text-neutral-500 text-[8px] lg:text-[9px] flex items-center gap-1"><Heart className="w-3 h-3" /> Engagement</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg lg:text-xl">500K</p>
              <p className="text-neutral-500 text-[8px] lg:text-[9px] flex items-center gap-1"><Eye className="w-3 h-3" /> Avg Views</p>
            </div>
          </div>
        </motion.div>

        {/* Demographics Card - Bottom Left */}
        <motion.div 
          className="absolute bottom-8 -left-24 lg:-left-40 bg-neutral-900/95 backdrop-blur-sm shadow-xl rounded-2xl p-3 lg:p-4 border border-neutral-800 z-20 hidden lg:block cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, x: -20 }}
          whileInView={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.8, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-white font-semibold text-[10px] lg:text-xs mb-2 lg:mb-3">Audience Demographics</p>
          <div className="flex gap-2 lg:gap-3">
            <div className="bg-neutral-800/70 rounded-xl px-2.5 lg:px-3 py-1.5 lg:py-2 text-center">
              <p className="text-white font-bold text-base lg:text-lg">68%</p>
              <p className="text-[#E1306C] text-[7px] lg:text-[8px]">Female</p>
            </div>
            <div className="bg-neutral-800/70 rounded-xl px-2.5 lg:px-3 py-1.5 lg:py-2 text-center">
              <p className="text-white font-bold text-base lg:text-lg">82%</p>
              <p className="text-neutral-400 text-[7px] lg:text-[8px]">Age 18-34</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>;
};
export default MobileMockup;
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
  
  return (
    <div className="relative flex justify-center items-center py-4 px-4 md:px-8 lg:px-16">
      {/* Phone-Centric Layout Container */}
      <div className="relative mx-auto">
        {/* iPhone Frame - Center (Smaller) */}
        <div className="relative w-[200px] h-[400px] md:w-[220px] md:h-[440px] bg-neutral-900 rounded-[40px] md:rounded-[45px] p-2 md:p-2.5 shadow-2xl z-10">
          {/* Screen */}
          <div className="w-full h-full bg-neutral-950 rounded-[32px] md:rounded-[36px] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-neutral-900 rounded-b-xl md:rounded-b-2xl z-10" />
            
            {/* Status Bar */}
            <div className="flex justify-between items-center px-6 pt-2 text-[9px] text-neutral-500 relative z-20">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-3 h-1.5 bg-neutral-700 rounded-sm" />
                <div className="w-3 h-1.5 bg-neutral-700 rounded-sm" />
                <div className="w-4 h-1.5 bg-neutral-700 rounded-sm" />
              </div>
            </div>
            
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
              style={{ backgroundImage: `url(${influencerBg})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
            
            {/* Main Content */}
            <div className="flex flex-col items-center justify-center h-full px-4 pb-6 pt-4 -mt-3 relative z-10">
              {/* Name Section */}
              <motion.div className="text-center mb-2" initial={{
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
                <h2 className="font-serif italic text-[20px] md:text-[22px] leading-tight">
                  <span className="text-rose-400">SARAH</span>
                </h2>
                <h2 className="font-serif italic text-[20px] md:text-[22px] leading-tight text-white -mt-0.5">
                  JOHNSON
                </h2>
              </motion.div>

              {/* Subtitle */}
              <motion.p className="text-rose-400/80 text-[8px] tracking-wider uppercase mb-2" initial={{
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
              <motion.p className="text-neutral-400 text-[7px] text-center leading-relaxed mb-3 px-2 max-w-[160px]" initial={{
                opacity: 0
              }} whileInView={{
                opacity: 1
              }} transition={{
                delay: 0.5,
                duration: 0.5
              }} viewport={{
                once: true
              }}>
                Creating authentic content that inspires millions worldwide.
              </motion.p>

              {/* Stats Row */}
              <div className="flex gap-1.5 mb-3 w-full px-1">
                {stats.map((stat, i) => (
                  <motion.div key={i} className="flex-1 bg-neutral-800/70 backdrop-blur-sm rounded-lg py-2 px-1.5 text-center border border-neutral-700/40" initial={{
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
                    <p className="text-white font-serif text-[11px] font-medium">{stat.value}</p>
                    <p className="text-neutral-500 text-[5px] uppercase tracking-wide">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button className="flex items-center gap-1.5 bg-white text-neutral-900 rounded-full px-4 py-1.5 text-[9px] font-medium shadow-lg mb-3" initial={{
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
                <Mail className="w-3 h-3" />
                Work With Me
              </motion.button>

              {/* Social Icons */}
              <motion.div className="flex gap-2.5" initial={{
                opacity: 0
              }} whileInView={{
                opacity: 1
              }} transition={{
                delay: 0.8,
                duration: 0.4
              }} viewport={{
                once: true
              }}>
                <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-neutral-400" />
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <motion.div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-1.5 h-1.5 bg-rose-400' : 'w-1 h-1 bg-neutral-600'}`} initial={{
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
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Instagram Card - Top Right */}
        <motion.div 
          className="absolute top-4 right-[-60px] md:right-[-90px] lg:right-[-110px] bg-neutral-900/95 backdrop-blur-sm shadow-xl rounded-lg p-1.5 md:p-2 border border-neutral-800 z-20 cursor-pointer hidden sm:block"
          initial={{ scale: 0.8, opacity: 0, x: 20 }}
          whileInView={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-1 mb-1">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-[8px] md:text-[9px]">Instagram</p>
              <p className="text-neutral-500 text-[6px]">Social Platform</p>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <div>
              <p className="text-[#E1306C] font-bold text-[10px] md:text-xs">1.1M</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Users className="w-1.5 h-1.5" /> Followers</p>
            </div>
            <div>
              <p className="text-[#E1306C] font-bold text-[10px] md:text-xs">6.8%</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Heart className="w-1.5 h-1.5" /> Engage</p>
            </div>
            <div>
              <p className="text-white font-bold text-[10px] md:text-xs">150K</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Eye className="w-1.5 h-1.5" /> Views</p>
            </div>
          </div>
        </motion.div>

        {/* Engagement Card - Bottom Right */}
        <motion.div 
          className="absolute bottom-20 right-[-50px] md:right-[-70px] lg:right-[-90px] bg-neutral-900/95 backdrop-blur-sm shadow-lg rounded-md p-1 md:p-1.5 border border-neutral-800 z-20 cursor-pointer hidden sm:block"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
          transition={{ delay: 0.7, duration: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[6px] md:text-[7px] text-neutral-500">Engagement</p>
              <p className="text-[8px] md:text-[10px] font-bold text-emerald-400">+24%</p>
            </div>
          </div>
        </motion.div>

        {/* Top Engagement Badge - Bottom Center */}
        <motion.div 
          className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 bg-neutral-900/95 backdrop-blur-sm shadow-lg rounded-full px-2 md:px-2.5 py-0.5 md:py-1 border border-neutral-800 flex items-center gap-1 z-20 cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          whileInView={{ scale: 1, opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.9, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-400" />
          <p className="text-[7px] md:text-[8px] text-neutral-300 whitespace-nowrap">Top 5% Engagement</p>
        </motion.div>

        {/* TikTok Card - Top Left */}
        <motion.div 
          className="absolute top-[-8px] left-[-60px] md:left-[-90px] lg:left-[-110px] bg-neutral-900/95 backdrop-blur-sm shadow-xl rounded-lg p-1.5 md:p-2 border border-neutral-800 z-20 hidden md:block cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, x: -20 }}
          whileInView={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.6, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-1 mb-1">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-neutral-800 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-[8px] md:text-[9px]">TikTok</p>
              <p className="text-neutral-500 text-[6px]">Social Platform</p>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <div>
              <p className="text-[#00f2ea] font-bold text-[10px] md:text-xs">2.1M</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Users className="w-1.5 h-1.5" /> Followers</p>
            </div>
            <div>
              <p className="text-[#00f2ea] font-bold text-[10px] md:text-xs">12.3%</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Heart className="w-1.5 h-1.5" /> Engage</p>
            </div>
            <div>
              <p className="text-white font-bold text-[10px] md:text-xs">500K</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Eye className="w-1.5 h-1.5" /> Views</p>
            </div>
          </div>
        </motion.div>

        {/* Demographics Card - Bottom Left */}
        <motion.div 
          className="absolute bottom-14 left-[-55px] md:left-[-75px] lg:left-[-95px] bg-neutral-900/95 backdrop-blur-sm shadow-lg rounded-lg p-1.5 md:p-2 border border-neutral-800 z-20 hidden lg:block cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, x: -20 }}
          whileInView={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          transition={{ delay: 0.8, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-white font-semibold text-[7px] md:text-[8px] mb-1">Audience Demographics</p>
          <div className="flex gap-1">
            <div className="bg-neutral-800/70 rounded-md px-1 md:px-1.5 py-0.5 text-center">
              <p className="text-white font-bold text-[10px] md:text-xs">68%</p>
              <p className="text-[#E1306C] text-[5px]">Female</p>
            </div>
            <div className="bg-neutral-800/70 rounded-md px-1 md:px-1.5 py-0.5 text-center">
              <p className="text-white font-bold text-[10px] md:text-xs">82%</p>
              <p className="text-neutral-400 text-[5px]">Age 18-34</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileMockup;

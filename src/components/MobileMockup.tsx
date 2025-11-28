import { useState, useEffect } from 'react';
import { Mail, Instagram, Music2, Edit3 } from 'lucide-react';

export const MobileMockup = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const navigateToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchStartTime(Date.now());
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.targetTouches[0].clientY;
    let offset = currentY - touchStartY;
    
    // Add boundary resistance at edges
    if (currentSlide === 0 && offset > 0) {
      offset = offset * 0.3; // Rubber band effect when at first slide
    } else if (currentSlide === totalSlides - 1 && offset < 0) {
      offset = offset * 0.3; // Rubber band effect when at last slide
    }
    
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const touchEndTime = Date.now();
    const timeDiff = touchEndTime - touchStartTime;
    const velocity = Math.abs(dragOffset) / timeDiff; // pixels per millisecond
    
    const containerHeight = 600; // Approximate height
    const dragPercentage = Math.abs(dragOffset) / containerHeight;
    
    // Fast swipe (velocity > 0.5 px/ms) or drag > 20% triggers navigation
    const shouldNavigate = velocity > 0.5 || dragPercentage > 0.2;
    
    if (shouldNavigate && Math.abs(dragOffset) > 20) {
      if (dragOffset < 0 && currentSlide < totalSlides - 1) {
        // Swiped up - go to next slide
        setCurrentSlide(prev => prev + 1);
      } else if (dragOffset > 0 && currentSlide > 0) {
        // Swiped down - go to previous slide
        setCurrentSlide(prev => prev - 1);
      }
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    setTouchStartY(0);
    setTouchStartTime(0);
  };

  return (
    <div className="relative w-full flex justify-center">
      {/* Phone Frame */}
      <div className="relative group">
        {/* Enhanced Multi-layer Glow Effect */}
        <div className="absolute -inset-8 bg-gradient-to-br from-[#B76E79]/40 via-[#D4A5A5]/30 to-transparent rounded-[4rem] blur-[80px] opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute -inset-4 bg-gradient-to-t from-[#D4A5A5]/30 to-transparent rounded-[4rem] blur-[60px] animate-pulse" />
        
        {/* Phone container with enhanced metallic frame */}
        <div className="relative w-[300px] h-[620px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-[3.5rem] p-[3px] shadow-[0_20px_80px_-20px_rgba(183,110,121,0.6)] ring-1 ring-white/10">
          {/* Inner frame */}
          <div className="w-full h-full bg-gradient-to-br from-black via-slate-950 to-black rounded-[3.3rem] p-[12px] shadow-inner">
            {/* Screen with subtle gradient background */}
            <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative shadow-2xl">
              {/* Enhanced Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-[1.75rem] z-50 flex items-center justify-center shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                  <div className="w-14 h-1.5 bg-slate-800 rounded-full" />
                </div>
              </div>
              
              {/* Enhanced Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-black/20 via-black/10 to-transparent z-40 flex items-center justify-between px-6 pt-2">
                <span className="text-xs font-bold text-white drop-shadow-md">9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-2.5 bg-white/90 rounded-full" />
                    <div className="w-0.5 h-3 bg-white/90 rounded-full" />
                    <div className="w-0.5 h-3.5 bg-white/90 rounded-full" />
                    <div className="w-0.5 h-4 bg-white/90 rounded-full" />
                  </div>
                  <div className="w-5 h-2.5 bg-white/90 rounded-sm relative">
                    <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-white/90 rounded-r-sm" />
                  </div>
                </div>
              </div>

              {/* Content - Sliding Screens */}
              <div 
                className="w-full h-full overflow-hidden pt-10 bg-black relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Slide Container */}
                <div 
                  className="absolute inset-0 ease-out" 
                  style={{ 
                    transform: `translateY(calc(-${currentSlide * 100}% + ${dragOffset}px))`,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                  <div className="flex flex-col h-full">
                    {/* Slide 1: Hero - Enhanced */}
                    <div className="w-full h-full flex-shrink-0">
                      <div className="relative h-[45%] bg-gradient-to-b from-zinc-900 via-black to-black overflow-hidden">
                        {/* Ambient glow background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-[#B76E79]/30 via-[#D4A5A5]/10 to-transparent blur-3xl" />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            {/* Outer glow ring */}
                            <div className="absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#B76E79]/40 to-[#D4A5A5]/40 blur-xl animate-pulse" />
                            {/* Main avatar */}
                            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-[#B76E79] via-[#C48A94] to-[#D4A5A5] border-[3px] border-[#D4A5A5]/50 shadow-[0_0_60px_rgba(183,110,121,0.6)] animate-fade-in" />
                          </div>
                        </div>
                      </div>

                      <div className="relative px-6 pt-8 pb-6 bg-black text-center space-y-5">
                        <div className="space-y-2 animate-fade-up">
                          <h1 className="text-2xl font-serif italic text-[#d4a5a5] tracking-wide drop-shadow-lg">SARAH</h1>
                          <h2 className="text-5xl font-serif font-bold text-white tracking-wide drop-shadow-2xl">JOHNSON</h2>
                          <p className="text-xs text-[#d4a5a5] font-light tracking-[0.25em] uppercase">Fashion & Lifestyle Influencer</p>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[240px] mx-auto animate-fade-in animation-delay-200">
                          Creating content that inspires. Sharing my journey in fashion, beauty, and lifestyle.
                        </p>

                        <div className="flex gap-2 justify-center pt-2">
                          {[
                            { value: '3.2M', label: 'Total Followers' },
                            { value: '8.5%', label: 'Engagement' },
                            { value: '50+', label: 'Brand Deals' }
                          ].map((stat, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:border-[#B76E79]/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(183,110,121,0.3)] animate-scale-in"
                              style={{ animationDelay: `${300 + i * 100}ms` }}
                            >
                              <div className="text-xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                              <div className="text-[9px] text-zinc-400 font-medium mt-0.5">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <button className="group w-full max-w-[200px] mx-auto px-6 py-3 bg-gradient-to-r from-white to-zinc-100 text-black rounded-full text-xs font-bold shadow-[0_8px_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 hover:scale-110 hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)] transition-all duration-300 animate-fade-in animation-delay-600">
                          <Mail className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          Work With Me
                        </button>

                        <div className="flex justify-center gap-4 pt-2 animate-fade-in animation-delay-700">
                          {[Instagram, Music2, Edit3].map((Icon, i) => (
                            <div 
                              key={i} 
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 flex items-center justify-center hover:border-[#B76E79] hover:shadow-[0_0_15px_rgba(183,110,121,0.4)] transition-all duration-300 hover:scale-110 cursor-pointer"
                              style={{ animationDelay: `${800 + i * 100}ms` }}
                            >
                              <Icon className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slide 2: Stats - Enhanced */}
                    <div className="w-full h-full flex-shrink-0 bg-gradient-to-b from-black via-zinc-950 to-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-3 animate-fade-up">
                          <h2 className="text-4xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">Platform Stats</h2>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B76E79]/20 border border-[#B76E79]/30 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#d4a5a5] animate-pulse" />
                            <p className="text-[10px] text-[#d4a5a5] font-medium tracking-wide">Live Updates</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="group bg-gradient-to-br from-[#B76E79]/25 via-[#B76E79]/15 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-[#B76E79]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(183,110,121,0.3)] animate-slide-in-right animation-delay-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B76E79] to-[#D4A5A5] flex items-center justify-center shadow-lg">
                                  <Instagram className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-base font-bold text-white">Instagram</span>
                              </div>
                              <span className="text-2xl font-bold text-white drop-shadow-lg">2.1M</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400 font-medium">Engagement Rate</span>
                                <span className="text-[#d4a5a5] font-bold">9.2%</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-900/50 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className="h-full w-[92%] bg-gradient-to-r from-[#B76E79] via-[#C48A94] to-[#D4A5A5] rounded-full shadow-[0_0_10px_rgba(183,110,121,0.5)] animate-slide-in-right animation-delay-400" />
                              </div>
                            </div>
                          </div>

                          <div className="group bg-gradient-to-br from-[#B76E79]/25 via-[#B76E79]/15 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-[#B76E79]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(183,110,121,0.3)] animate-slide-in-right animation-delay-400">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B76E79] to-[#D4A5A5] flex items-center justify-center shadow-lg">
                                  <Music2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-base font-bold text-white">TikTok</span>
                              </div>
                              <span className="text-2xl font-bold text-white drop-shadow-lg">1.1M</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400 font-medium">Avg. Views</span>
                                <span className="text-[#d4a5a5] font-bold">450K</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-900/50 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className="h-full w-[75%] bg-gradient-to-r from-[#B76E79] via-[#C48A94] to-[#D4A5A5] rounded-full shadow-[0_0_10px_rgba(183,110,121,0.5)] animate-slide-in-right animation-delay-600" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-white/30 transition-all duration-300 animate-fade-in animation-delay-600">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div className="space-y-1">
                                <div className="text-2xl font-bold text-white drop-shadow-lg">72%</div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Female</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-2xl font-bold text-white drop-shadow-lg">18-34</div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Age Range</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 3: Brands - Enhanced */}
                    <div className="w-full h-full flex-shrink-0 bg-gradient-to-b from-black via-zinc-950 to-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-7">
                        <div className="text-center space-y-3 animate-fade-up">
                          <h2 className="text-4xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">Brand Partners</h2>
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#B76E79]/20 to-[#D4A5A5]/20 border border-[#B76E79]/30 rounded-full">
                            <p className="text-[11px] text-[#d4a5a5] font-bold tracking-wide">50+ Premium Collaborations</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {['Dior', 'Chanel', 'Gucci', 'Prada', 'Versace', 'Fendi'].map((brand, i) => (
                            <div 
                              key={brand}
                              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex items-center justify-center hover:border-[#B76E79]/60 hover:shadow-[0_0_25px_rgba(183,110,121,0.3)] transition-all duration-300 hover:scale-105 cursor-pointer animate-scale-in overflow-hidden"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              {/* Shine effect on hover */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-slide-in-right" />
                              <span className="relative text-base font-serif font-bold text-white tracking-[0.15em] drop-shadow-lg">{brand}</span>
                            </div>
                          ))}
                        </div>

                        <div className="relative text-center bg-gradient-to-br from-[#B76E79]/25 via-[#B76E79]/15 to-[#D4A5A5]/20 backdrop-blur-xl border border-[#B76E79]/40 rounded-2xl p-5 animate-fade-in animation-delay-600 overflow-hidden">
                          {/* Subtle animated background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B76E79]/10 to-transparent animate-pulse" />
                          <p className="relative text-[11px] text-zinc-300 leading-relaxed font-medium">
                            Trusted by luxury brands worldwide for authentic fashion storytelling and premium content creation
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Slide 4: Contact - Enhanced */}
                    <div className="w-full h-full flex-shrink-0 bg-gradient-to-b from-black via-zinc-950 to-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-3 animate-fade-up">
                          <h2 className="text-4xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">Let's Collaborate</h2>
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <p className="text-[11px] text-green-300 font-bold tracking-wide">Available Now</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="animate-fade-in animation-delay-200">
                            <input 
                              type="text" 
                              placeholder="Brand Name"
                              className="w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#B76E79]/60 focus:shadow-[0_0_20px_rgba(183,110,121,0.2)] outline-none transition-all duration-300"
                            />
                          </div>
                          <div className="animate-fade-in animation-delay-300">
                            <input 
                              type="email" 
                              placeholder="Email Address"
                              className="w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#B76E79]/60 focus:shadow-[0_0_20px_rgba(183,110,121,0.2)] outline-none transition-all duration-300"
                            />
                          </div>
                          <div className="animate-fade-in animation-delay-400">
                            <textarea 
                              placeholder="Campaign Details & Budget"
                              rows={4}
                              className="w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#B76E79]/60 focus:shadow-[0_0_20px_rgba(183,110,121,0.2)] outline-none transition-all duration-300 resize-none"
                            />
                          </div>
                          <button className="group w-full py-4 bg-gradient-to-r from-[#B76E79] via-[#C48A94] to-[#D4A5A5] text-white rounded-xl text-sm font-bold hover:scale-105 hover:shadow-[0_8px_30px_rgba(183,110,121,0.5)] transition-all duration-300 shadow-[0_4px_20px_rgba(183,110,121,0.4)] animate-fade-in animation-delay-600 relative overflow-hidden">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <Mail className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                              Send Inquiry
                            </span>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-slide-in-right" />
                          </button>
                        </div>

                        <div className="flex justify-center gap-6 pt-3 animate-fade-in animation-delay-700">
                          {[Instagram, Music2, Mail].map((Icon, i) => (
                            <div 
                              key={i}
                              className="w-11 h-11 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center hover:border-[#B76E79] hover:shadow-[0_0_20px_rgba(183,110,121,0.4)] transition-all duration-300 hover:scale-110 cursor-pointer"
                            >
                              <Icon className="w-5 h-5 text-[#d4a5a5] hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Navigation Dots with Progress */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
                  {[...Array(totalSlides)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => navigateToSlide(i)}
                      className="group relative flex items-center justify-center"
                      aria-label={`Go to slide ${i + 1}`}
                    >
                      {/* Outer glow ring for active */}
                      {i === currentSlide && (
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#B76E79]/40 blur-sm animate-pulse" />
                      )}
                      
                      {/* Main dot */}
                      <div className={`relative rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentSlide 
                          ? 'w-2.5 h-2.5 bg-gradient-to-br from-[#B76E79] to-[#D4A5A5] shadow-[0_0_12px_rgba(183,110,121,0.8)] scale-100' 
                          : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500 hover:scale-125 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                      }`} />
                      
                      {/* Slide number tooltip on hover */}
                      <div className="absolute right-full mr-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[9px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Slide {i + 1}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Swipe Hint Indicator (shows on first load) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-[8px] font-medium">Swipe</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
};

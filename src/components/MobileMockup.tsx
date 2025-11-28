import { useState, useEffect } from 'react';
import { Mail, Instagram, Music2, Edit3 } from 'lucide-react';

export const MobileMockup = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  return (
    <div className="relative w-full flex justify-center">
      {/* Phone Frame */}
      <div className="relative">
        {/* Rose-Gold Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#B76E79]/30 to-[#D4A5A5]/20 rounded-[3.5rem] blur-3xl animate-pulse" />
        
        {/* Phone container */}
        <div className="relative w-[300px] h-[620px] bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[3.5rem] p-[3px] shadow-2xl">
          {/* Inner frame */}
          <div className="w-full h-full bg-black rounded-[3.3rem] p-[12px]">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-3xl z-50 flex items-center justify-center">
                <div className="w-14 h-1 bg-slate-800 rounded-full" />
              </div>
              
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/10 to-transparent z-40 flex items-center justify-between px-6 pt-1">
                <span className="text-xs font-semibold text-gray-900">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 bg-gray-900 rounded-sm" />
                </div>
              </div>

              {/* Content - Sliding Screens */}
              <div className="w-full h-full overflow-hidden pt-10 bg-black relative">
                {/* Slide Container */}
                <div className="absolute inset-0 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  <div className="flex h-full">
                    {/* Slide 1: Hero */}
                    <div className="w-full h-full flex-shrink-0">
                      <div className="relative h-[45%] bg-gradient-to-b from-zinc-900 to-black">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#B76E79] to-[#D4A5A5] border-2 border-[#D4A5A5] animate-pulse shadow-[0_0_40px_rgba(183,110,121,0.4)]" />
                        </div>
                      </div>

                      <div className="relative px-6 pt-8 pb-6 bg-black text-center space-y-5">
                        <div className="space-y-1 animate-fade-up">
                          <h1 className="text-2xl font-serif italic text-[#d4a5a5]">SARAH</h1>
                          <h2 className="text-4xl font-serif font-bold text-white tracking-wide">JOHNSON</h2>
                          <p className="text-xs text-[#d4a5a5] font-light tracking-widest">Fashion & Lifestyle Influencer</p>
                        </div>

                        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[240px] mx-auto animate-fade-in animation-delay-200">
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
                              className="flex-1 bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 hover:border-[#B76E79]/30 transition-colors animate-slide-in-right"
                              style={{ animationDelay: `${300 + i * 100}ms` }}
                            >
                              <div className="text-lg font-bold text-white">{stat.value}</div>
                              <div className="text-[9px] text-zinc-500">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <button className="w-full max-w-[200px] mx-auto px-5 py-2.5 bg-white text-black rounded-full text-xs font-semibold shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform animate-fade-in animation-delay-600">
                          <Mail className="w-3.5 h-3.5" />
                          Work With Me
                        </button>

                        <div className="flex justify-center gap-4 pt-2 animate-fade-in animation-delay-700">
                          {[Instagram, Music2, Edit3].map((Icon, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-[#B76E79]/50 transition-colors">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slide 2: Stats */}
                    <div className="w-full h-full flex-shrink-0 bg-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-2 animate-fade-up">
                          <h2 className="text-3xl font-serif font-bold text-white">Platform Stats</h2>
                          <p className="text-xs text-[#d4a5a5]">Updated Daily</p>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-[#B76E79]/20 to-transparent backdrop-blur-md border border-white/10 rounded-xl p-5 animate-slide-in-right animation-delay-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Instagram className="w-6 h-6 text-[#d4a5a5]" />
                                <span className="text-sm font-semibold text-white">Instagram</span>
                              </div>
                              <span className="text-xl font-bold text-white">2.1M</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">Engagement</span>
                                <span className="text-[#d4a5a5] font-semibold">9.2%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full w-[92%] bg-gradient-to-r from-[#B76E79] to-[#D4A5A5] rounded-full" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-[#B76E79]/20 to-transparent backdrop-blur-md border border-white/10 rounded-xl p-5 animate-slide-in-right animation-delay-400">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Music2 className="w-6 h-6 text-[#d4a5a5]" />
                                <span className="text-sm font-semibold text-white">TikTok</span>
                              </div>
                              <span className="text-xl font-bold text-white">1.1M</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">Avg Views</span>
                                <span className="text-[#d4a5a5] font-semibold">450K</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full w-[75%] bg-gradient-to-r from-[#B76E79] to-[#D4A5A5] rounded-full" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 animate-fade-in animation-delay-600">
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div>
                                <div className="text-lg font-bold text-white">72%</div>
                                <div className="text-[9px] text-zinc-500">Female</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-white">18-34</div>
                                <div className="text-[9px] text-zinc-500">Age Range</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 3: Brands */}
                    <div className="w-full h-full flex-shrink-0 bg-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-2 animate-fade-up">
                          <h2 className="text-3xl font-serif font-bold text-white">Brand Partners</h2>
                          <p className="text-xs text-[#d4a5a5]">50+ Collaborations</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {['Dior', 'Chanel', 'Gucci', 'Prada', 'Versace', 'Fendi'].map((brand, i) => (
                            <div 
                              key={brand}
                              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 flex items-center justify-center hover:border-[#B76E79]/50 transition-colors animate-scale-in"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              <span className="text-sm font-serif font-bold text-white tracking-wider">{brand}</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-center bg-gradient-to-r from-[#B76E79]/20 to-[#D4A5A5]/20 backdrop-blur-md border border-[#B76E79]/30 rounded-xl p-4 animate-fade-in animation-delay-600">
                          <p className="text-[10px] text-zinc-400">
                            Trusted by luxury brands worldwide for authentic fashion storytelling
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Slide 4: Contact */}
                    <div className="w-full h-full flex-shrink-0 bg-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-2 animate-fade-up">
                          <h2 className="text-3xl font-serif font-bold text-white">Let's Collaborate</h2>
                          <p className="text-xs text-[#d4a5a5]">Response within 24h</p>
                        </div>

                        <div className="space-y-3">
                          <div className="animate-fade-in animation-delay-200">
                            <input 
                              type="text" 
                              placeholder="Brand Name"
                              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-[#B76E79]/50 outline-none transition-colors"
                            />
                          </div>
                          <div className="animate-fade-in animation-delay-300">
                            <input 
                              type="email" 
                              placeholder="Email Address"
                              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-[#B76E79]/50 outline-none transition-colors"
                            />
                          </div>
                          <div className="animate-fade-in animation-delay-400">
                            <textarea 
                              placeholder="Campaign Details"
                              rows={4}
                              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-[#B76E79]/50 outline-none transition-colors resize-none"
                            />
                          </div>
                          <button className="w-full py-3 bg-gradient-to-r from-[#B76E79] to-[#D4A5A5] text-white rounded-lg text-xs font-semibold hover:scale-105 transition-transform shadow-lg shadow-[#B76E79]/30 animate-fade-in animation-delay-600">
                            Send Inquiry
                          </button>
                        </div>

                        <div className="flex justify-center gap-6 pt-2 animate-fade-in animation-delay-700">
                          {[Instagram, Music2, Mail].map((Icon, i) => (
                            <Icon key={i} className="w-5 h-5 text-[#d4a5a5] hover:text-white transition-colors cursor-pointer" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                  {[...Array(totalSlides)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => navigateToSlide(i)}
                      className={`rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
                        i === currentSlide 
                          ? 'w-2 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                          : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
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

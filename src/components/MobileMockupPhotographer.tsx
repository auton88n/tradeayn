import { useState, useEffect } from 'react';
import { Camera, Award, MapPin, Mail, Instagram, Linkedin, Globe } from 'lucide-react';

export const MobileMockupPhotographer = () => {
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
    
    if (currentSlide === 0 && offset > 0) {
      offset = offset * 0.3;
    } else if (currentSlide === totalSlides - 1 && offset < 0) {
      offset = offset * 0.3;
    }
    
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const touchEndTime = Date.now();
    const timeDiff = touchEndTime - touchStartTime;
    const velocity = Math.abs(dragOffset) / timeDiff;
    
    const containerHeight = 600;
    const dragPercentage = Math.abs(dragOffset) / containerHeight;
    
    const shouldNavigate = velocity > 0.5 || dragPercentage > 0.2;
    
    if (shouldNavigate && Math.abs(dragOffset) > 20) {
      if (dragOffset < 0 && currentSlide < totalSlides - 1) {
        setCurrentSlide(prev => prev + 1);
      } else if (dragOffset > 0 && currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setTouchStartY(0);
    setTouchStartTime(0);
  };

  return (
    <div className="relative w-full flex justify-center">
      {/* Phone Frame */}
      <div className="relative group">
        {/* Blue/Teal Glow Effect */}
        <div className="absolute -inset-8 bg-gradient-to-br from-cyan-500/40 via-blue-500/30 to-transparent rounded-[4rem] blur-[80px] opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute -inset-4 bg-gradient-to-t from-blue-500/30 to-transparent rounded-[4rem] blur-[60px] animate-pulse" />
        
        {/* Phone container */}
        <div className="relative w-[300px] h-[620px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-[3.5rem] p-[3px] shadow-[0_20px_80px_-20px_rgba(6,182,212,0.6)] ring-1 ring-white/10">
          {/* Inner frame */}
          <div className="w-full h-full bg-gradient-to-br from-black via-slate-950 to-black rounded-[3.3rem] p-[12px] shadow-inner">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-[1.75rem] z-50 flex items-center justify-center shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                  <div className="w-14 h-1.5 bg-slate-800 rounded-full" />
                </div>
              </div>
              
              {/* Status Bar */}
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
                    {/* Slide 1: Hero */}
                    <div className="w-full h-full flex-shrink-0">
                      <div className="relative h-[45%] bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-hidden">
                        {/* Ambient blue glow background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-cyan-500/30 via-blue-500/10 to-transparent blur-3xl" />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            {/* Outer glow ring */}
                            <div className="absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-500/40 blur-xl animate-pulse" />
                            {/* Camera icon container */}
                            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 border-[3px] border-cyan-400/50 shadow-[0_0_60px_rgba(6,182,212,0.6)] animate-fade-in flex items-center justify-center">
                              <Camera className="w-20 h-20 text-white drop-shadow-2xl" strokeWidth={1.5} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative px-6 pt-8 pb-6 bg-black text-center space-y-5">
                        <div className="space-y-2 animate-fade-up">
                          <h1 className="text-2xl font-serif italic text-cyan-400 tracking-wide drop-shadow-lg">ALEX</h1>
                          <h2 className="text-5xl font-serif font-bold text-white tracking-wide drop-shadow-2xl">MARTINEZ</h2>
                          <p className="text-xs text-cyan-400 font-light tracking-[0.25em] uppercase">Commercial Photographer</p>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[240px] mx-auto animate-fade-in animation-delay-200">
                          Capturing moments that tell stories. Specializing in editorial, product, and lifestyle photography.
                        </p>

                        <div className="flex gap-2 justify-center pt-2">
                          {[
                            { value: '500+', label: 'Projects' },
                            { value: '10yrs', label: 'Experience' },
                            { value: '50+', label: 'Clients' }
                          ].map((stat, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-scale-in"
                              style={{ animationDelay: `${300 + i * 100}ms` }}
                            >
                              <div className="text-xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                              <div className="text-[9px] text-zinc-400 font-medium mt-0.5">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <button className="group w-full max-w-[200px] mx-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-xs font-bold shadow-[0_8px_30px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 hover:scale-110 hover:shadow-[0_12px_40px_rgba(6,182,212,0.4)] transition-all duration-300 animate-fade-in animation-delay-600">
                          <Mail className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          Book a Session
                        </button>

                        <div className="flex justify-center gap-4 pt-2 animate-fade-in animation-delay-700">
                          {[Instagram, Linkedin, Globe].map((Icon, i) => (
                            <div 
                              key={i} 
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-900 to-black border border-slate-700 flex items-center justify-center hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-110 cursor-pointer"
                              style={{ animationDelay: `${800 + i * 100}ms` }}
                            >
                              <Icon className="w-4 h-4 text-zinc-400 hover:text-cyan-400 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slide 2: Portfolio Stats */}
                    <div className="w-full h-full flex-shrink-0 bg-gradient-to-b from-black via-slate-950 to-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-3 animate-fade-up">
                          <h2 className="text-4xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">Specialties</h2>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                            <Camera className="w-3 h-3 text-cyan-400" />
                            <p className="text-[10px] text-cyan-400 font-medium tracking-wide">Multiple Styles</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="group bg-gradient-to-br from-cyan-500/25 via-cyan-500/15 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-slide-in-right animation-delay-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                                  <Camera className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-base font-bold text-white">Editorial</span>
                              </div>
                              <span className="text-2xl font-bold text-white drop-shadow-lg">150+</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400 font-medium">Featured Publications</span>
                                <span className="text-cyan-400 font-bold">25</span>
                              </div>
                              <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className="h-full w-[85%] bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-slide-in-right animation-delay-400" />
                              </div>
                            </div>
                          </div>

                          <div className="group bg-gradient-to-br from-blue-500/25 via-blue-500/15 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-slide-in-right animation-delay-400">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                  <Award className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-base font-bold text-white">Product</span>
                              </div>
                              <span className="text-2xl font-bold text-white drop-shadow-lg">200+</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400 font-medium">E-commerce Shoots</span>
                                <span className="text-blue-400 font-bold">180</span>
                              </div>
                              <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className="h-full w-[90%] bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-slide-in-right animation-delay-600" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-white/30 transition-all duration-300 animate-fade-in animation-delay-600">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div className="space-y-1">
                                <div className="text-2xl font-bold text-white drop-shadow-lg">4.9</div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Rating</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-2xl font-bold text-white drop-shadow-lg">98%</div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Satisfaction</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 3: Services & Rates */}
                    <div className="w-full h-full flex-shrink-0 bg-gradient-to-b from-black via-slate-950 to-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-7">
                        <div className="text-center space-y-3 animate-fade-up">
                          <h2 className="text-4xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">Services</h2>
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full">
                            <p className="text-[11px] text-cyan-400 font-bold tracking-wide">Professional Packages</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {[
                            { name: 'Portrait Session', price: '$350', features: ['1-2 hours', '20 edited photos', 'Digital delivery'] },
                            { name: 'Product Shoot', price: '$500', features: ['Up to 15 products', '40+ photos', 'White background'] },
                            { name: 'Editorial Package', price: '$800', features: ['Full day', '50+ photos', 'Location included'] }
                          ].map((service, i) => (
                            <div 
                              key={service.name}
                              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-105 cursor-pointer animate-scale-in overflow-hidden"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-slide-in-right" />
                              <div className="relative flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-base font-bold text-white mb-1">{service.name}</h3>
                                  <div className="flex flex-wrap gap-1">
                                    {service.features.map((feature, idx) => (
                                      <span key={idx} className="text-[9px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">{feature}</span>
                                    ))}
                                  </div>
                                </div>
                                <span className="text-xl font-bold text-cyan-400 drop-shadow-lg">{service.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="relative text-center bg-gradient-to-br from-cyan-500/25 via-cyan-500/15 to-blue-500/20 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-5 animate-fade-in animation-delay-600 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse" />
                          <p className="relative text-[11px] text-zinc-300 leading-relaxed font-medium">
                            Custom packages available. Contact for weddings, events, and commercial projects.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Slide 4: Contact */}
                    <div className="w-full h-full flex-shrink-0 bg-gradient-to-b from-black via-slate-950 to-black">
                      <div className="h-full flex flex-col justify-center px-6 space-y-6">
                        <div className="text-center space-y-3 animate-fade-up">
                          <h2 className="text-4xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">Let's Create</h2>
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <p className="text-[11px] text-green-300 font-bold tracking-wide">Booking Now</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="animate-fade-in animation-delay-200">
                            <input 
                              type="text" 
                              placeholder="Your Name"
                              className="w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500/60 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all duration-300"
                            />
                          </div>
                          <div className="animate-fade-in animation-delay-300">
                            <input 
                              type="email" 
                              placeholder="Email Address"
                              className="w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500/60 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all duration-300"
                            />
                          </div>
                          <div className="animate-fade-in animation-delay-400">
                            <textarea 
                              placeholder="Project Details & Preferred Date"
                              rows={4}
                              className="w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500/60 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all duration-300 resize-none"
                            />
                          </div>
                          <button className="group w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:scale-105 hover:shadow-[0_8px_30px_rgba(6,182,212,0.5)] transition-all duration-300 shadow-[0_4px_20px_rgba(6,182,212,0.4)] animate-fade-in animation-delay-600 relative overflow-hidden">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <Mail className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                              Send Inquiry
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-slide-in-right" />
                          </button>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-center gap-2 text-zinc-400 text-[10px] animate-fade-in animation-delay-700">
                            <MapPin className="w-3 h-3" />
                            <span>Los Angeles, CA</span>
                          </div>
                          <div className="flex justify-center gap-6 animate-fade-in animation-delay-700">
                            {[Instagram, Linkedin, Mail].map((Icon, i) => (
                              <div 
                                key={i}
                                className="w-11 h-11 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-110 cursor-pointer"
                              >
                                <Icon className="w-5 h-5 text-cyan-400 hover:text-white transition-colors" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
                  {[...Array(totalSlides)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => navigateToSlide(i)}
                      className="group relative flex items-center justify-center"
                      aria-label={`Go to slide ${i + 1}`}
                    >
                      {i === currentSlide && (
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-500/40 blur-sm animate-pulse" />
                      )}
                      
                      <div className={`relative rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentSlide 
                          ? 'w-2.5 h-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-100' 
                          : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500 hover:scale-125 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                      }`} />
                      
                      <div className="absolute right-full mr-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[9px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Slide {i + 1}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Swipe Hint */}
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

export const DesktopMockup = () => {
  return (
    <div className="relative w-full">
      {/* MacBook Frame */}
      <div className="relative mx-auto group" style={{ maxWidth: '1100px' }}>
        {/* Glow effect */}
        <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Screen Container */}
        <div className="relative">
          {/* Screen bezel with notch */}
          <div className="relative bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-2xl p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            {/* Inner bezel */}
            <div className="relative bg-black rounded-xl p-1.5 overflow-hidden">
              {/* Subtle screen reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Browser Window */}
              <div className="relative bg-white rounded-lg overflow-hidden shadow-inner">
                {/* Browser Chrome - Minimalist Safari Style */}
                <div className="h-9 bg-slate-100 flex items-center justify-between px-3 border-b border-slate-200">
                  {/* Traffic lights */}
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  
                  {/* URL bar - clean and minimal */}
                  <div className="flex-1 mx-6 h-6 bg-white rounded-md flex items-center px-3 gap-2 shadow-sm border border-slate-200">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-slate-600 font-medium">ghazi.today</span>
                  </div>
                  
                  {/* Browser icons */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-slate-200" />
                    <div className="w-5 h-5 rounded bg-slate-200" />
                  </div>
                </div>

                {/* Website Content - Compact & Scrollable */}
                <div className="bg-white overflow-y-auto scrollbar-hide" style={{ height: '450px' }}>
                  {/* Hero Section - Compact */}
                  <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 text-white px-8 py-12">
                    {/* Animated background orbs */}
                    <div className="absolute top-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 right-10 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <div className="relative z-10 max-w-5xl mx-auto">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left: Text */}
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-semibold">Available for Projects</span>
                          </div>
                          
                          <h1 className="text-4xl font-black leading-tight">
                            Ghazi Al-Mutairi
                          </h1>
                          
                          <p className="text-lg text-purple-200">
                            Entrepreneur • Content Creator • Tech Innovator
                          </p>
                          
                          <p className="text-sm text-purple-100 leading-relaxed max-w-md">
                            Building the future of AI-powered business solutions with AYN. Helping businesses scale with intelligent automation.
                          </p>
                          
                          {/* Stats - Compact */}
                          <div className="flex gap-6 pt-2">
                            <div>
                              <div className="text-2xl font-bold">50K+</div>
                              <div className="text-xs text-purple-200">Followers</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold">1M+</div>
                              <div className="text-xs text-purple-200">Total Views</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold">500+</div>
                              <div className="text-xs text-purple-200">Content Posts</div>
                            </div>
                          </div>
                          
                          {/* CTA Buttons - Compact */}
                          <div className="flex gap-3 pt-3">
                            <button className="px-5 py-2.5 bg-white text-purple-700 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                              Let's Connect
                            </button>
                            <button className="px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
                              View Portfolio
                            </button>
                          </div>
                        </div>
                        
                        {/* Right: Profile Avatar - Smaller */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full blur-2xl opacity-40" />
                            <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-7xl font-bold shadow-xl border-4 border-white/20">
                              G
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Section - More Compact */}
                  <div className="px-8 py-12 bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                      <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">What I Offer</h2>
                        <p className="text-base text-gray-600">Comprehensive solutions for your digital success</p>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-5">
                        {[
                          { icon: '🎨', title: 'Portfolio Design', desc: 'Custom websites that showcase your brand professionally', color: 'from-purple-500 to-pink-500' },
                          { icon: '🤖', title: 'AI Solutions', desc: 'Smart automation and intelligent business tools', color: 'from-blue-500 to-cyan-500' },
                          { icon: '💼', title: 'Business Consulting', desc: 'Strategy and growth advisory for scaling businesses', color: 'from-emerald-500 to-green-500' }
                        ].map((service, i) => (
                          <div key={i} className="group p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                              {service.icon}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{service.desc}</p>
                            <button className="mt-4 text-purple-600 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                              Learn More
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Grid - Compact */}
                  <div className="px-8 py-12 bg-white">
                    <div className="max-w-5xl mx-auto">
                      <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Recent Work</h2>
                        <p className="text-base text-gray-600">Showcasing innovative projects and solutions</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="group relative aspect-video bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                            <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-purple-700 opacity-20">
                              {i}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                              <div className="text-white">
                                <h4 className="text-lg font-bold mb-1">Project {i}</h4>
                                <p className="text-sm text-white/80">Amazing work description here</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Section - Compact */}
                  <div className="px-8 py-12 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 text-white">
                    <div className="max-w-3xl mx-auto">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-black mb-2">Let's Work Together</h2>
                        <p className="text-base text-purple-200">Have a project in mind? Let's build something amazing!</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <input className="px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm placeholder-purple-200 focus:border-white/50 focus:outline-none" placeholder="Your Name" />
                        <input className="px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm placeholder-purple-200 focus:border-white/50 focus:outline-none" placeholder="Your Email" />
                        <textarea className="md:col-span-2 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm placeholder-purple-200 focus:border-white/50 focus:outline-none min-h-[100px]" placeholder="Your Message" />
                        <button className="md:col-span-2 px-6 py-3 bg-white text-purple-700 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                          Send Message 🚀
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer - Compact */}
                  <div className="px-8 py-8 bg-gray-900 text-white">
                    <div className="max-w-5xl mx-auto">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold">
                            G
                          </div>
                          <div>
                            <div className="font-bold text-sm">Ghazi Al-Mutairi</div>
                            <div className="text-xs text-gray-400">Powered by AYN AI ✨</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>© 2024 Ghazi</span>
                          <span>•</span>
                          <span>All Rights Reserved</span>
                        </div>
                        
                        <div className="flex gap-3">
                          {['Twitter', 'LinkedIn', 'Instagram'].map((social, i) => (
                            <div key={i} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors">
                              <span className="text-xs font-bold">{social[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Laptop base - More realistic */}
          <div className="h-1.5 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-2xl shadow-lg" />
          <div className="h-2 bg-gradient-to-b from-slate-800 to-slate-900 mx-12 rounded-b-lg shadow-xl" />
        </div>
      </div>
    </div>
  );
};

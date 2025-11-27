export const DesktopMockup = () => {
  return (
    <div className="relative w-full">
      {/* MacBook Frame */}
      <div className="relative mx-auto group" style={{ maxWidth: '1200px' }}>
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Laptop base */}
        <div className="relative">
          {/* Screen */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-t-2xl p-3 shadow-2xl">
            {/* Bezel */}
            <div className="relative bg-black rounded-t-xl p-2">
              {/* Browser chrome */}
              <div className="bg-slate-900 rounded-t-lg overflow-hidden">
                {/* Browser top bar */}
                <div className="h-10 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
                  {/* Traffic lights */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  
                  {/* URL bar */}
                  <div className="flex-1 mx-8 h-7 bg-slate-700 rounded-md flex items-center px-4 gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm text-slate-300">ghazi.today</span>
                  </div>
                  
                  {/* Browser actions */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-slate-700" />
                    <div className="w-6 h-6 rounded bg-slate-700" />
                  </div>
                </div>

                {/* Website content - scrollable */}
                <div className="bg-white overflow-y-auto scrollbar-hide" style={{ height: '600px' }}>
                  {/* Hero Section */}
                  <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 text-white px-12 py-20">
                    {/* Animated background circles */}
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <div className="relative z-10 max-w-6xl mx-auto">
                      <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left: Text */}
                        <div className="space-y-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-sm font-semibold">Available for Projects</span>
                          </div>
                          
                          <h1 className="text-6xl font-black leading-tight">
                            Ghazi Al-Mutairi
                          </h1>
                          
                          <p className="text-2xl text-purple-200">
                            Entrepreneur • Content Creator • Tech Innovator
                          </p>
                          
                          <p className="text-lg text-purple-100 leading-relaxed max-w-xl">
                            Building the future of AI-powered business solutions with AYN. Passionate about technology, innovation, and helping businesses scale with intelligent automation.
                          </p>
                          
                          {/* Stats */}
                          <div className="flex gap-8 pt-4">
                            <div>
                              <div className="text-4xl font-bold">50K+</div>
                              <div className="text-purple-200">Followers</div>
                            </div>
                            <div>
                              <div className="text-4xl font-bold">1M+</div>
                              <div className="text-purple-200">Total Views</div>
                            </div>
                            <div>
                              <div className="text-4xl font-bold">500+</div>
                              <div className="text-purple-200">Content Posts</div>
                            </div>
                          </div>
                          
                          {/* CTA Buttons */}
                          <div className="flex gap-4 pt-4">
                            <button className="px-8 py-4 bg-white text-purple-700 rounded-xl font-bold shadow-2xl hover:scale-105 transition-transform">
                              Let's Connect
                            </button>
                            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/20 transition-colors">
                              View Portfolio
                            </button>
                          </div>
                        </div>
                        
                        {/* Right: Profile Image */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full blur-3xl opacity-50" />
                            <div className="relative w-80 h-80 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-9xl font-bold shadow-2xl border-8 border-white/20">
                              G
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="px-12 py-20 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-5xl font-black text-gray-900 mb-4">What I Offer</h2>
                        <p className="text-xl text-gray-600">Comprehensive solutions for your digital success</p>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-8">
                        {[
                          { icon: '🎨', title: 'Portfolio Design', desc: 'Custom websites that showcase your brand professionally', color: 'from-purple-500 to-pink-500' },
                          { icon: '🤖', title: 'AI Solutions', desc: 'Smart automation and intelligent business tools', color: 'from-blue-500 to-cyan-500' },
                          { icon: '💼', title: 'Business Consulting', desc: 'Strategy and growth advisory for scaling businesses', color: 'from-emerald-500 to-green-500' }
                        ].map((service, i) => (
                          <div key={i} className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                              {service.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{service.desc}</p>
                            <button className="mt-6 text-purple-600 font-semibold flex items-center gap-2 group-hover:gap-4 transition-all">
                              Learn More
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Grid */}
                  <div className="px-12 py-20 bg-white">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-5xl font-black text-gray-900 mb-4">Recent Work</h2>
                        <p className="text-xl text-gray-600">Showcasing innovative projects and solutions</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="group relative aspect-video bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                            <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-purple-700 opacity-20">
                              {i}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                              <div className="text-white">
                                <h4 className="text-2xl font-bold mb-2">Project {i}</h4>
                                <p className="text-white/80">Amazing work description here</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="px-12 py-20 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 text-white">
                    <div className="max-w-4xl mx-auto">
                      <div className="text-center mb-12">
                        <h2 className="text-5xl font-black mb-4">Let's Work Together</h2>
                        <p className="text-xl text-purple-200">Have a project in mind? Let's build something amazing!</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <input className="px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-purple-200 focus:border-white/50 focus:outline-none" placeholder="Your Name" />
                        <input className="px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-purple-200 focus:border-white/50 focus:outline-none" placeholder="Your Email" />
                        <textarea className="md:col-span-2 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-purple-200 focus:border-white/50 focus:outline-none min-h-[150px]" placeholder="Your Message" />
                        <button className="md:col-span-2 px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg shadow-2xl hover:scale-105 transition-transform">
                          Send Message 🚀
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-12 py-12 bg-gray-900 text-white">
                    <div className="max-w-6xl mx-auto">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                            G
                          </div>
                          <div>
                            <div className="font-bold text-lg">Ghazi Al-Mutairi</div>
                            <div className="text-sm text-gray-400">Powered by AYN AI ✨</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-6 text-sm text-gray-400">
                          <span>© 2024 Ghazi</span>
                          <span>•</span>
                          <span>All Rights Reserved</span>
                        </div>
                        
                        <div className="flex gap-4">
                          {['Twitter', 'LinkedIn', 'Instagram'].map((social, i) => (
                            <div key={i} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors">
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
          
          {/* Laptop bottom */}
          <div className="h-2 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-2xl" />
          <div className="h-3 bg-gradient-to-b from-slate-800 to-slate-900 mx-8 rounded-b-xl" />
        </div>
      </div>
    </div>
  );
};

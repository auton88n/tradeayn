export const MobileMockup = () => {
  return (
    <div className="relative w-full flex justify-center">
      {/* Phone Frame */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-[3.5rem] blur-3xl" />
        
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

              {/* Content - Ghazi.Today Preview */}
              <div className="w-full h-full overflow-y-auto pt-10 scrollbar-hide">
                {/* Hero Section */}
                <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 text-white p-6 pb-10">
                  <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-8 right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
                  
                  <div className="relative z-10 text-center space-y-3">
                    {/* Avatar */}
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-3xl font-bold shadow-xl">
                      G
                    </div>
                    
                    <h1 className="text-2xl font-black">Ghazi Al-Mutairi</h1>
                    <p className="text-purple-200 text-xs">
                      Entrepreneur • Tech Innovator
                    </p>
                    
                    {/* Social Stats */}
                    <div className="flex justify-center gap-5 pt-3">
                      <div className="text-center">
                        <div className="text-xl font-bold">50K+</div>
                        <div className="text-[10px] text-purple-200">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">1M+</div>
                        <div className="text-[10px] text-purple-200">Views</div>
                      </div>
                    </div>

                    <button className="mt-4 px-6 py-2 bg-white text-purple-700 rounded-full text-sm font-bold shadow-lg">
                      Let's Connect
                    </button>
                  </div>
                </div>

                {/* About Section */}
                <div className="p-5 bg-white">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">About Me</h2>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Building AI-powered business solutions with AYN. Passionate about technology and innovation.
                  </p>
                </div>

                {/* Services */}
                <div className="p-5 bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Services</h2>
                  <div className="space-y-2">
                    {[
                      { icon: '🎨', title: 'Portfolio Design' },
                      { icon: '🤖', title: 'AI Solutions' },
                      { icon: '💼', title: 'Consulting' }
                    ].map((service, i) => (
                      <div key={i} className="p-3 bg-white rounded-xl shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-lg">
                          {service.icon}
                        </div>
                        <span className="font-bold text-sm text-gray-900">{service.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Grid */}
                <div className="p-5 bg-white">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Portfolio</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl flex items-center justify-center text-2xl font-bold text-purple-700">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact CTA */}
                <div className="p-5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-center">
                  <h2 className="text-lg font-bold mb-2">Get In Touch</h2>
                  <p className="text-xs text-purple-200 mb-4">
                    Let's build something amazing!
                  </p>
                  <button className="w-full px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-bold shadow-lg">
                    Send Message 🚀
                  </button>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-900 text-white text-center">
                  <p className="text-[10px] text-gray-400">
                    Powered by AYN AI ✨
                  </p>
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
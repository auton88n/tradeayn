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
              <div className="w-full h-full overflow-hidden pt-10 bg-black">
                {/* Portrait Section */}
                <div className="relative h-[45%] bg-gradient-to-b from-zinc-900 to-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700" />
                  </div>
                </div>

                {/* Content Section */}
                <div className="relative px-6 pt-8 pb-6 bg-black text-center space-y-5">
                  {/* Name */}
                  <div className="space-y-1">
                    <h1 className="text-2xl font-serif italic text-[#d4a5a5]">SARAH</h1>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-wide">JOHNSON</h2>
                    <p className="text-xs text-[#d4a5a5] font-light tracking-widest">Fashion & Lifestyle Influencer</p>
                  </div>

                  {/* Bio */}
                  <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[240px] mx-auto">
                    Creating content that inspires. Sharing my journey in fashion, beauty, and lifestyle.
                  </p>

                  {/* Stats Cards */}
                  <div className="flex gap-2 justify-center pt-2">
                    <div className="flex-1 bg-zinc-900/50 backdrop-blur rounded-lg p-3 border border-zinc-800">
                      <div className="text-lg font-bold text-white">3.2M</div>
                      <div className="text-[9px] text-zinc-500">Total Followers</div>
                    </div>
                    <div className="flex-1 bg-zinc-900/50 backdrop-blur rounded-lg p-3 border border-zinc-800">
                      <div className="text-lg font-bold text-white">8.5%</div>
                      <div className="text-[9px] text-zinc-500">Engagement</div>
                    </div>
                    <div className="flex-1 bg-zinc-900/50 backdrop-blur rounded-lg p-3 border border-zinc-800">
                      <div className="text-lg font-bold text-white">50+</div>
                      <div className="text-[9px] text-zinc-500">Brand Deals</div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full max-w-[200px] mx-auto px-5 py-2.5 bg-white text-black rounded-full text-xs font-semibold shadow-lg flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Work With Me
                  </button>

                  {/* Social Icons */}
                  <div className="flex justify-center gap-4 pt-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
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
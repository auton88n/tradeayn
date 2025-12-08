import { Link } from 'react-router-dom';
import influencerWomanBg from '@/assets/influencer-woman-bg.jpg';
import { Brain, ArrowLeft, Palette, Smartphone, Zap, Layout, TrendingUp, Globe, Instagram, Play, Heart, Eye, BarChart3, Users, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
const InfluencerSites = () => {
  const features = [{
    icon: Palette,
    title: 'Custom Luxury Design',
    description: 'Unique design that reflects your personal brand and sets you apart from competitors'
  }, {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Perfect experience across all devices, from mobile to desktop'
  }, {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Fast loading keeps visitors engaged and improves your search rankings'
  }, {
    icon: Layout,
    title: 'Interactive Portfolio',
    description: 'Showcase your work professionally to attract brand partnerships'
  }, {
    icon: TrendingUp,
    title: 'Conversion Optimized',
    description: 'Pages designed to convert visitors into clients and partnerships'
  }, {
    icon: Globe,
    title: 'Multi-language Support',
    description: 'Reach a global audience with multi-language content support'
  }];
  const process = [{
    step: '01',
    title: 'Discovery',
    description: 'We understand your brand and goals'
  }, {
    step: '02',
    title: 'Design',
    description: 'We craft a unique experience for you'
  }, {
    step: '03',
    title: 'Development',
    description: 'We build with cutting-edge tech'
  }, {
    step: '04',
    title: 'Launch',
    description: 'We launch your site to the world'
  }];
  return <div className="min-h-screen bg-neutral-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-4 md:top-6 left-4 md:left-6 z-50">
        <Link to="/">
          <Button variant="ghost" className="gap-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-full px-4 py-2 hover:bg-neutral-800 text-white">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="text-center">
            <span className="text-sm font-mono text-neutral-500 tracking-wider uppercase mb-4 block">
              01 — Our Services
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Premium Content Creator
              <br />
              <span className="text-rose-400">Sites</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
              Luxury websites custom-built for content creators. Attract more partnerships and elevate your personal brand.
            </p>
            <Link to="/services/influencer-sites/apply">
              <Button size="lg" className="rounded-full px-8 bg-white text-neutral-950 hover:bg-neutral-200">
                Start Your Project
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What You'll Get - Hero Section Showcase */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <span className="text-sm font-mono text-rose-400 tracking-wider uppercase mb-4 block">
              What You'll Get
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
              Stunning <span className="text-rose-400">Hero Section</span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Make a powerful first impression with a captivating hero that showcases your brand
            </p>
          </motion.div>

          {/* Hero Preview Mockup */}
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.2
        }} className="relative max-w-4xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-neutral-800 rounded-full px-4 py-1.5 text-xs text-neutral-400 text-center">
                    sarahjohnason.aynn.io
                  </div>
                </div>
              </div>
              
              {/* Hero Content Preview */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 overflow-hidden">
                {/* Woman Background Image */}
                <img src={influencerWomanBg} alt="Content creator" className="absolute inset-0 w-full h-full object-cover object-center opacity-50" />
                {/* Background Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent z-10" />
                
                {/* Content */}
                <div className="relative z-20 flex items-center h-full p-8 md:p-12">
                  <div className="max-w-md">
                    <p className="text-rose-400 text-sm font-medium mb-2">Fashion & Lifestyle Content Creator</p>
                    <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">SARAH JOHNSON</h3>
                    <p className="text-neutral-400 text-sm mb-6">
                      Creating inspiring content that blends high fashion with everyday lifestyle. Join 3M+ followers on this journey of style and authenticity.
                    </p>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">3.2M</div>
                        <div className="text-xs text-neutral-500">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">8.5%</div>
                        <div className="text-xs text-neutral-500">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">50+</div>
                        <div className="text-xs text-neutral-500">Brand Deals</div>
                      </div>
                    </div>
                    <Button className="mt-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full px-6">
                      Collaborate
                    </Button>
                  </div>
                </div>

                {/* Floating Social Icons */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
                  <div className="w-10 h-10 rounded-full bg-neutral-800/80 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-neutral-800/80 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-neutral-800/80 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Feature Cards */}
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.4
          }} className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 hidden md:block">
              
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.5
          }} className="absolute -right-4 md:-right-16 top-1/3 hidden md:block">
              
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Section Showcase */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <span className="text-sm font-mono text-rose-400 tracking-wider uppercase mb-4 block">
                Analytics Dashboard
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Platform <span className="text-rose-400">Stats</span>
              </h2>
              <p className="text-neutral-400 mb-6">
                Show brands exactly why they should work with you. Your analytics dashboard displays real-time follower counts, engagement rates, and audience demographics across all platforms.
              </p>
              <ul className="space-y-3">
                {['Cross-platform analytics', 'Real-time engagement tracking', 'Audience demographics breakdown', 'Achievement badges'].map((item, i) => <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="w-5 h-5 text-rose-400" />
                    {item}
                  </li>)}
              </ul>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="relative">
              {/* Stats Preview */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <div className="text-sm font-mono text-neutral-500 uppercase tracking-wider">Analytics</div>
                <h3 className="text-2xl font-bold text-white">Platform Stats</h3>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {/* TikTok Card */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-white font-medium">TikTok</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Followers</span>
                        <span className="text-cyan-400 font-bold">1.5M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Engagement</span>
                        <span className="text-cyan-400 font-bold">12.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Avg Views</span>
                        <span className="text-cyan-400 font-bold">850K</span>
                      </div>
                    </div>
                  </div>

                  {/* Instagram Card */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-pink-400" />
                      </div>
                      <span className="text-white font-medium">Instagram</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Followers</span>
                        <span className="text-pink-400 font-bold">2.8M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Engagement</span>
                        <span className="text-pink-400 font-bold">8.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Avg Likes</span>
                        <span className="text-pink-400 font-bold">125K</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700 mt-4">
                  <div className="text-sm text-neutral-500 mb-3">Audience Demographics</div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">68%</div>
                      <div className="text-xs text-neutral-500">Female</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">72%</div>
                      <div className="text-xs text-neutral-500">Age 18-34</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">45%</div>
                      <div className="text-xs text-neutral-500">USA</div>
                    </div>
                  </div>
                </div>

                {/* Achievement Badge */}
                <div className="flex justify-center mt-4">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Top 5% Engagement Rate
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brand Partnerships Showcase */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="order-2 lg:order-1">
              {/* Brands Preview */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="text-sm font-mono text-neutral-500 uppercase tracking-wider mb-2">Collaborations</div>
                <h3 className="text-2xl font-bold text-white mb-6">Brand Partnerships</h3>
                
                <div className="space-y-4">
                  {/* Brand Card 1 */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-black text-lg">N</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Nike</div>
                      <div className="text-neutral-500 text-sm">Summer Collection 2024</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-400">2.1M views</div>
                      <div className="inline-block bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded-full">Sponsored</div>
                    </div>
                  </div>

                  {/* Brand Card 2 */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-black text-lg">S</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Sephora</div>
                      <div className="text-neutral-500 text-sm">Beauty Essentials</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-400">1.8M views</div>
                      <div className="inline-block bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full">Review</div>
                    </div>
                  </div>

                  {/* Brand Card 3 */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-black text-lg">Z</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Zara</div>
                      <div className="text-neutral-500 text-sm">Fall Fashion Line</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-400">1.5M views</div>
                      <div className="inline-block bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">Collab</div>
                    </div>
                  </div>
                </div>

                {/* Brand Logos */}
                <div className="mt-6 pt-4 border-t border-neutral-800">
                  <div className="text-xs text-neutral-500 mb-3">Trusted by leading brands</div>
                  <div className="flex gap-6 items-center justify-center opacity-50">
                    {['NIKE', 'CHANEL', 'GUCCI', 'PRADA'].map((brand, i) => <div key={i} className="text-white font-bold text-sm tracking-wider">{brand}</div>)}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="order-1 lg:order-2">
              <span className="text-sm font-mono text-rose-400 tracking-wider uppercase mb-4 block">
                Partnerships Section
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Brand <span className="text-rose-400">Collaborations</span>
              </h2>
              <p className="text-neutral-400 mb-6">
                Showcase your brand partnerships to attract new collaborations. Display campaign results, view counts, and partnership types to demonstrate your value to potential brand partners.
              </p>
              <ul className="space-y-3">
                {['Campaign performance metrics', 'Partnership type badges', 'Brand logo showcase', 'Results-driven display'].map((item, i) => <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="w-5 h-5 text-rose-400" />
                    {item}
                  </li>)}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <span className="text-sm font-mono text-rose-400 tracking-wider uppercase mb-4 block">
              What's Included
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              Everything You Need to <span className="text-rose-400">Stand Out</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="p-6 rounded-2xl bg-neutral-800/30 border border-neutral-800 hover:bg-neutral-800/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 group-hover:bg-rose-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <span className="text-sm font-mono text-rose-400 tracking-wider uppercase mb-4 block">
              Our Process
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              From Idea to <span className="text-rose-400">Launch</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {process.map((step, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.15
          }} className="text-center md:text-left">
                <div className="text-5xl font-bold font-mono text-neutral-800 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                <p className="text-sm text-neutral-400">{step.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-neutral-900/50 to-neutral-950">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-white">
              Ready to Elevate Your <span className="text-rose-400">Brand</span>?
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
              Let's create a website that reflects your uniqueness and attracts the opportunities you deserve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services/influencer-sites/apply">
                <Button size="lg" className="rounded-full px-8 w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white">
                  Start Your Project
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="rounded-full px-8 w-full sm:w-auto border-neutral-700 text-white hover:bg-neutral-800">
                  View All Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-800">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-neutral-950" />
              </div>
              <span className="text-2xl font-bold text-white">AYN</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>;
};
export default InfluencerSites;
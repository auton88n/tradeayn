import { Link } from 'react-router-dom';
import { Brain, ArrowLeft, CheckCircle, Sparkles, Palette, Smartphone, Zap, Users, TrendingUp, Layout, Globe, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const InfluencerSites = () => {
  const { language } = useLanguage();

  const stats = [
    { number: '50+', label: language === 'ar' ? 'مشروع منجز' : 'Projects Delivered' },
    { number: '95%', label: language === 'ar' ? 'معدل رضا العملاء' : 'Client Retention' },
    { number: '2x', label: language === 'ar' ? 'زيادة الحجوزات' : 'Booking Increase' },
    { number: '48h', label: language === 'ar' ? 'وقت التسليم' : 'Turnaround Time' },
  ];

  const features = [
    {
      icon: Palette,
      title: language === 'ar' ? 'تصميم حصري' : 'Custom Luxury Design',
      description: language === 'ar' ? 'تصميم فريد يعكس هويتك الشخصية ويميزك عن المنافسين' : 'Unique design that reflects your personal brand and sets you apart from competitors'
    },
    {
      icon: Smartphone,
      title: language === 'ar' ? 'متجاوب مع الجوال' : 'Mobile First',
      description: language === 'ar' ? 'تجربة مثالية على جميع الأجهزة، من الهاتف للحاسوب' : 'Perfect experience across all devices, from mobile to desktop'
    },
    {
      icon: Zap,
      title: language === 'ar' ? 'سرعة فائقة' : 'Lightning Fast',
      description: language === 'ar' ? 'تحميل سريع يحافظ على زوارك ويحسن ترتيبك في محركات البحث' : 'Fast loading keeps visitors engaged and improves your search rankings'
    },
    {
      icon: Layout,
      title: language === 'ar' ? 'معرض أعمال تفاعلي' : 'Interactive Portfolio',
      description: language === 'ar' ? 'اعرض أعمالك بطريقة احترافية تجذب العلامات التجارية' : 'Showcase your work professionally to attract brand partnerships'
    },
    {
      icon: TrendingUp,
      title: language === 'ar' ? 'محسّن للتحويل' : 'Conversion Optimized',
      description: language === 'ar' ? 'صفحات مصممة لتحويل الزوار إلى عملاء وشراكات' : 'Pages designed to convert visitors into clients and partnerships'
    },
    {
      icon: Globe,
      title: language === 'ar' ? 'دعم متعدد اللغات' : 'Multi-language Support',
      description: language === 'ar' ? 'وصول جمهور عالمي بمحتوى متعدد اللغات' : 'Reach a global audience with multi-language content support'
    },
  ];

  const process = [
    { step: '01', title: language === 'ar' ? 'الاكتشاف' : 'Discovery', description: language === 'ar' ? 'نفهم علامتك وأهدافك' : 'We understand your brand and goals' },
    { step: '02', title: language === 'ar' ? 'التصميم' : 'Design', description: language === 'ar' ? 'نصمم تجربة فريدة لك' : 'We craft a unique experience for you' },
    { step: '03', title: language === 'ar' ? 'التطوير' : 'Development', description: language === 'ar' ? 'نبني موقعك بأحدث التقنيات' : 'We build with cutting-edge tech' },
    { step: '04', title: language === 'ar' ? 'الإطلاق' : 'Launch', description: language === 'ar' ? 'نطلق موقعك للعالم' : 'We launch your site to the world' },
  ];

  const portfolio = [
    { title: language === 'ar' ? 'مشروع ١' : 'Project 1', category: language === 'ar' ? 'مؤثر أزياء' : 'Fashion Influencer' },
    { title: language === 'ar' ? 'مشروع ٢' : 'Project 2', category: language === 'ar' ? 'مدون سفر' : 'Travel Blogger' },
    { title: language === 'ar' ? 'مشروع ٣' : 'Project 3', category: language === 'ar' ? 'مؤثر لياقة' : 'Fitness Influencer' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-4 md:top-6 left-4 md:left-6 z-50">
        <Link to="/">
          <Button variant="ghost" className="gap-2 bg-card/80 backdrop-blur-xl border border-border rounded-full px-4 py-2 hover:bg-card">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'ar' ? 'الرئيسية' : 'Back'}</span>
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-center"
          >
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              01 — {language === 'ar' ? 'خدماتنا' : 'Our Services'}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              {language === 'ar' ? 'مواقع فاخرة' : 'Premium Influencer'}
              <br />
              <span className="text-muted-foreground">{language === 'ar' ? 'للمؤثرين' : 'Sites'}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {language === 'ar' 
                ? 'مواقع إلكترونية احترافية مصممة خصيصاً للمؤثرين وصناع المحتوى. اجذب المزيد من الشراكات وارتقِ بعلامتك الشخصية.'
                : 'Luxury websites custom-built for influencers and content creators. Attract more partnerships and elevate your personal brand.'}
            </p>
            <Link to="/#contact">
              <Button size="lg" className="rounded-full px-8">
                {language === 'ar' ? 'ابدأ مشروعك' : 'Start Your Project'}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'ما نقدمه' : "What's Included"}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              {language === 'ar' ? 'كل ما تحتاجه للتميز' : 'Everything You Need to Stand Out'}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 md:p-8 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-16 md:py-32 px-4 md:px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'أعمالنا' : 'Our Work'}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              {language === 'ar' ? 'مشاريع مميزة' : 'Featured Projects'}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {portfolio.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="aspect-[4/5] rounded-2xl bg-muted/50 border border-border overflow-hidden group cursor-pointer relative"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-16 h-16 text-muted-foreground/20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.category}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'كيف نعمل' : 'Our Process'}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              {language === 'ar' ? 'من الفكرة إلى الإطلاق' : 'From Idea to Launch'}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="text-center md:text-left"
              >
                <div className="text-4xl md:text-5xl font-bold font-mono text-muted-foreground/30 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 border-y border-border bg-muted/10">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-foreground text-foreground" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl lg:text-3xl font-serif mb-6 leading-relaxed">
              {language === 'ar' 
                ? '"موقعي الجديد غيّر طريقة تعامل العلامات التجارية معي. زادت طلبات التعاون بشكل ملحوظ!"'
                : '"My new website completely changed how brands approach me. Partnership requests have increased dramatically!"'}
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold">{language === 'ar' ? 'سارة أحمد' : 'Sarah Ahmed'}</div>
                <div className="text-sm text-muted-foreground">{language === 'ar' ? 'مؤثرة أزياء' : 'Fashion Influencer'}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {language === 'ar' ? 'مستعد للارتقاء بعلامتك؟' : 'Ready to Elevate Your Brand?'}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {language === 'ar' 
                ? 'دعنا نصمم لك موقعاً يعكس تميزك ويجذب الفرص التي تستحقها.'
                : "Let's create a website that reflects your uniqueness and attracts the opportunities you deserve."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/#contact">
                <Button size="lg" className="rounded-full px-8 w-full sm:w-auto">
                  {language === 'ar' ? 'ابدأ مشروعك' : 'Start Your Project'}
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="rounded-full px-8 w-full sm:w-auto">
                  {language === 'ar' ? 'تصفح خدماتنا' : 'View All Services'}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-border">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Brain className="w-5 h-5 text-background" />
              </div>
              <span className="text-2xl font-bold">AYN</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InfluencerSites;

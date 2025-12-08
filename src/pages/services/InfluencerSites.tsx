import { useState } from 'react';
import { Link } from 'react-router-dom';
import influencerWomanBg from '@/assets/influencer-woman-bg.jpg';
import { Brain, ArrowLeft, ArrowRight, Palette, Smartphone, Zap, Layout, TrendingUp, Globe, Instagram, Play, Heart, Eye, BarChart3, Users, Star, CheckCircle, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const InfluencerSites = () => {
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  // Translations
  const t = {
    back: language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back',
    heroTitle: language === 'ar' ? 'مواقع فاخرة لصنّاع المحتوى' : language === 'fr' ? 'Sites Premium pour Créateurs de Contenu' : 'Premium Content Creator Sites',
    heroSubtitle: language === 'ar' ? 'مواقع فاخرة مصممة خصيصًا لصنّاع المحتوى. اجذب المزيد من الشراكات وارفع من مستوى علامتك التجارية.' : language === 'fr' ? 'Sites web de luxe conçus pour les créateurs de contenu. Attirez plus de partenariats et élevez votre marque personnelle.' : 'Luxury websites custom-built for content creators. Attract more partnerships and elevate your personal brand.',
    startProject: language === 'ar' ? 'ابدأ مشروعك' : language === 'fr' ? 'Démarrer Votre Projet' : 'Start Your Project',
    whatYoullGet: language === 'ar' ? 'ما ستحصل عليه' : language === 'fr' ? 'Ce Que Vous Obtiendrez' : "What You'll Get",
    stunningHero: language === 'ar' ? 'قسم رئيسي مذهل' : language === 'fr' ? 'Section Hero Époustouflante' : 'Stunning Hero Section',
    heroDesc: language === 'ar' ? 'اترك انطباعًا قويًا مع قسم رئيسي يعرض علامتك التجارية' : language === 'fr' ? 'Faites une première impression puissante avec un hero captivant' : 'Make a powerful first impression with a captivating hero that showcases your brand',
    analytics: language === 'ar' ? 'لوحة التحليلات' : language === 'fr' ? 'Tableau de Bord Analytique' : 'Analytics Dashboard',
    platformStats: language === 'ar' ? 'إحصائيات المنصات' : language === 'fr' ? 'Statistiques Plateformes' : 'Platform Stats',
    analyticsDesc: language === 'ar' ? 'أظهر للعلامات التجارية لماذا يجب أن تتعاون معك. لوحة التحليلات تعرض عدد المتابعين ومعدلات التفاعل والديموغرافيا في الوقت الفعلي.' : language === 'fr' ? 'Montrez aux marques pourquoi elles devraient travailler avec vous. Votre tableau de bord affiche les statistiques en temps réel.' : 'Show brands exactly why they should work with you. Your analytics dashboard displays real-time follower counts, engagement rates, and audience demographics across all platforms.',
    features: language === 'ar' ? 'المميزات' : language === 'fr' ? 'Fonctionnalités' : 'Features',
    premiumFeatures: language === 'ar' ? 'مميزات متميزة' : language === 'fr' ? 'Fonctionnalités Premium' : 'Premium Features',
    everythingYouNeed: language === 'ar' ? 'كل ما تحتاجه للتميز في العالم الرقمي' : language === 'fr' ? 'Tout ce dont vous avez besoin pour briller dans le monde digital' : 'Everything you need to stand out in the digital world',
    howItWorks: language === 'ar' ? 'كيف يعمل' : language === 'fr' ? 'Comment Ça Marche' : 'How It Works',
    ourProcess: language === 'ar' ? 'عمليتنا' : language === 'fr' ? 'Notre Processus' : 'Our Process',
    fromConceptToLaunch: language === 'ar' ? 'من الفكرة إلى الإطلاق في أربع خطوات بسيطة' : language === 'fr' ? 'Du concept au lancement en quatre étapes simples' : 'From concept to launch in four simple steps',
    readyToStandOut: language === 'ar' ? 'مستعد للتميز؟' : language === 'fr' ? 'Prêt à Vous Démarquer?' : 'Ready to Stand Out?',
    ctaDesc: language === 'ar' ? 'انضم إلى أفضل صنّاع المحتوى الذين يثقون بنا لتقديم مواقعهم الاحترافية' : language === 'fr' ? 'Rejoignez les créateurs de contenu d\'élite qui nous font confiance pour leur présence web premium' : 'Join elite content creators who trust us with their premium web presence',
    startYourProject: language === 'ar' ? 'ابدأ مشروعك' : language === 'fr' ? 'Démarrer Votre Projet' : 'Start Your Project',
    formTitle: language === 'ar' ? 'ابدأ مشروعك' : language === 'fr' ? 'Démarrer Votre Projet' : 'Start Your Project',
    formDesc: language === 'ar' ? 'أخبرنا عن مشروعك وسنتواصل معك قريبًا.' : language === 'fr' ? 'Parlez-nous de votre projet et nous vous contacterons.' : 'Tell us about your project and we\'ll get back to you.',
    fullName: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom Complet' : 'Full Name',
    email: language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email',
    phone: language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone',
    message: language === 'ar' ? 'الرسالة' : language === 'fr' ? 'Message' : 'Message',
    optional: language === 'ar' ? 'اختياري' : language === 'fr' ? 'Optionnel' : 'Optional',
    submit: language === 'ar' ? 'إرسال الطلب' : language === 'fr' ? 'Soumettre la Demande' : 'Submit Application',
    submitting: language === 'ar' ? 'جارٍ الإرسال...' : language === 'fr' ? 'Envoi...' : 'Submitting...',
    successTitle: language === 'ar' ? 'تم الإرسال بنجاح!' : language === 'fr' ? 'Soumission Réussie!' : 'Application Submitted!',
    successDesc: language === 'ar' ? 'شكرًا لاهتمامك! سنتواصل معك خلال 24-48 ساعة.' : language === 'fr' ? 'Merci pour votre intérêt! Nous vous contacterons dans 24-48 heures.' : 'Thank you for your interest! We\'ll be in touch within 24-48 hours.',
    close: language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast({ title: language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : language === 'fr' ? 'Veuillez remplir les champs requis' : 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to database
      const { error: dbError } = await supabase.from('service_applications').insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message || null,
        service_type: 'content_creator',
        status: 'new'
      });

      if (dbError) throw dbError;

      // Send email notification
      await supabase.functions.invoke('send-application-email', {
        body: {
          applicantName: formData.fullName,
          applicantEmail: formData.email,
          applicantPhone: formData.phone,
          message: formData.message,
          serviceType: 'Content Creator Sites'
        }
      });

      setIsSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : language === 'fr' ? 'Une erreur s\'est produite. Veuillez réessayer.' : 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSuccess(false);
  };
  
  const features = [{
    icon: Palette,
    title: language === 'ar' ? 'تصميم فاخر مخصص' : language === 'fr' ? 'Design Luxueux Personnalisé' : 'Custom Luxury Design',
    description: language === 'ar' ? 'تصميم فريد يعكس علامتك التجارية ويميزك عن المنافسين' : language === 'fr' ? 'Design unique qui reflète votre marque personnelle' : 'Unique design that reflects your personal brand and sets you apart from competitors'
  }, {
    icon: Smartphone,
    title: language === 'ar' ? 'متوافق مع الموبايل' : language === 'fr' ? 'Mobile First' : 'Mobile First',
    description: language === 'ar' ? 'تجربة مثالية على جميع الأجهزة' : language === 'fr' ? 'Expérience parfaite sur tous les appareils' : 'Perfect experience across all devices, from mobile to desktop'
  }, {
    icon: Zap,
    title: language === 'ar' ? 'سرعة فائقة' : language === 'fr' ? 'Ultra Rapide' : 'Lightning Fast',
    description: language === 'ar' ? 'تحميل سريع يبقي الزوار متفاعلين' : language === 'fr' ? 'Chargement rapide pour garder les visiteurs engagés' : 'Fast loading keeps visitors engaged and improves your search rankings'
  }, {
    icon: Layout,
    title: language === 'ar' ? 'معرض أعمال تفاعلي' : language === 'fr' ? 'Portfolio Interactif' : 'Interactive Portfolio',
    description: language === 'ar' ? 'اعرض أعمالك باحترافية لجذب الشراكات' : language === 'fr' ? 'Présentez votre travail professionnellement' : 'Showcase your work professionally to attract brand partnerships'
  }, {
    icon: TrendingUp,
    title: language === 'ar' ? 'محسّن للتحويل' : language === 'fr' ? 'Optimisé Conversion' : 'Conversion Optimized',
    description: language === 'ar' ? 'صفحات مصممة لتحويل الزوار إلى عملاء' : language === 'fr' ? 'Pages conçues pour convertir les visiteurs' : 'Pages designed to convert visitors into clients and partnerships'
  }, {
    icon: Globe,
    title: language === 'ar' ? 'دعم متعدد اللغات' : language === 'fr' ? 'Support Multilingue' : 'Multi-language Support',
    description: language === 'ar' ? 'وصول عالمي مع دعم محتوى متعدد اللغات' : language === 'fr' ? 'Touchez une audience mondiale' : 'Reach a global audience with multi-language content support'
  }];
  
  const process = [{
    step: '01',
    title: language === 'ar' ? 'الاكتشاف' : language === 'fr' ? 'Découverte' : 'Discovery',
    description: language === 'ar' ? 'نفهم علامتك التجارية وأهدافك' : language === 'fr' ? 'Nous comprenons votre marque et vos objectifs' : 'We understand your brand and goals'
  }, {
    step: '02',
    title: language === 'ar' ? 'التصميم' : language === 'fr' ? 'Design' : 'Design',
    description: language === 'ar' ? 'نصمم تجربة فريدة لك' : language === 'fr' ? 'Nous créons une expérience unique pour vous' : 'We craft a unique experience for you'
  }, {
    step: '03',
    title: language === 'ar' ? 'التطوير' : language === 'fr' ? 'Développement' : 'Development',
    description: language === 'ar' ? 'نبني بأحدث التقنيات' : language === 'fr' ? 'Nous construisons avec les dernières technologies' : 'We build with cutting-edge tech'
  }, {
    step: '04',
    title: language === 'ar' ? 'الإطلاق' : language === 'fr' ? 'Lancement' : 'Launch',
    description: language === 'ar' ? 'نطلق موقعك للعالم' : language === 'fr' ? 'Nous lançons votre site au monde' : 'We launch your site to the world'
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
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Premium Content Creator
              <br />
              <span className="text-rose-400">Sites</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
              Luxury websites custom-built for content creators. Attract more partnerships and elevate your personal brand.
            </p>
            <Button 
              size="lg" 
              className="rounded-full px-8 bg-white text-neutral-950 hover:bg-neutral-200"
              onClick={() => setIsModalOpen(true)}
            >
              Start Your Project
            </Button>
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
                <img src={influencerWomanBg} alt="Content creator" className="absolute inset-0 w-full h-full object-cover object-[center_30%] opacity-50" />
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

      {/* Recent Content Section */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <span className="text-sm font-mono tracking-wider text-neutral-500 uppercase mb-4 block">Portfolio</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Recent Content</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              A glimpse into the viral moments and engaging content that drives real results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* TikTok Video 1 */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.1
          }} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer">
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop" alt="Fashion styling content" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* TikTok Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-5 h-5 bg-[#00f2ea] rounded flex items-center justify-center">
                  <Play className="w-3 h-3 text-black fill-black" />
                </div>
                <span className="text-white text-sm font-medium">TikTok</span>
              </div>

              {/* Stats */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium mb-2">Summer outfit styling tips ✨</p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> 2.1M views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" /> 156K
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Instagram Reel */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer">
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1000&fit=crop" alt="Beauty skincare routine" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Instagram Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-5 h-5 bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] rounded flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Instagram</span>
              </div>

              {/* Stats */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium mb-2">Morning skincare routine 💫</p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> 1.8M views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" /> 98K
                  </span>
                </div>
              </div>
            </motion.div>

            {/* TikTok Video 2 */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.3
          }} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer">
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop" alt="Lifestyle vlog content" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* TikTok Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-5 h-5 bg-[#00f2ea] rounded flex items-center justify-center">
                  <Play className="w-3 h-3 text-black fill-black" />
                </div>
                <span className="text-white text-sm font-medium">TikTok</span>
              </div>

              {/* Stats */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium mb-2">Day in my life vlog 🎬</p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> 1.2M views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" /> 89K
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Instagram Post */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.4
          }} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer">
              <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop" alt="New collection fashion" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Instagram Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-5 h-5 bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] rounded flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Instagram</span>
              </div>

              {/* Stats */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium mb-2">New collection drop! 🔥</p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" /> 950K
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" /> 12K
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="text-center">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8">
              View All Content <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
              <Button 
                size="lg" 
                className="rounded-full px-8 w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white"
                onClick={() => setIsModalOpen(true)}
              >
                Start Your Project
              </Button>
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

      {/* Application Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">
              {isSuccess ? 'Thank You!' : 'Start Your Project'}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {isSuccess 
                ? "We've received your request and will be in touch within 24 hours."
                : "Tell us about yourself and we'll reach out to discuss your vision."
              }
            </DialogDescription>
          </DialogHeader>
          
          {isSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <Button 
                onClick={handleCloseModal}
                className="rounded-full bg-white text-neutral-950 hover:bg-neutral-200"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-neutral-300">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Your name"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-neutral-300">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message" className="text-neutral-300">Brief Message (optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell us briefly about your project..."
                  rows={3}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
                <Link 
                  to="/services/content-creator-sites/apply" 
                  className="text-sm text-neutral-400 hover:text-white text-center transition-colors"
                >
                  Need to tell us more? Use our detailed form →
                </Link>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>;
};
export default InfluencerSites;
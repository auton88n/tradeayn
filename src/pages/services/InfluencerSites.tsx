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
  const {
    language
  } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  // Translations - Improved Arabic with natural, commonly-used phrases
  const t = {
    back: language === 'ar' ? 'عودة' : language === 'fr' ? 'Retour' : 'Back',
    heroTitle: language === 'ar' ? 'مواقع احترافية لصناع المحتوى' : language === 'fr' ? 'Sites Premium pour Créateurs de Contenu' : 'Premium Content Creator Sites',
    heroSubtitle: language === 'ar' ? 'مواقع احترافية مصممة خصيصاً لصناع المحتوى. احصل على شراكات أكثر وطوّر علامتك التجارية.' : language === 'fr' ? 'Sites web de luxe conçus pour les créateurs de contenu. Attirez plus de partenariats et élevez votre marque personnelle.' : 'Luxury websites custom-built for content creators. Attract more partnerships and elevate your personal brand.',
    startProject: language === 'ar' ? 'ابدأ الآن' : language === 'fr' ? 'Démarrer Votre Projet' : 'Start Your Project',
    whatYoullGet: language === 'ar' ? 'ماذا ستحصل' : language === 'fr' ? 'Ce Que Vous Obtiendrez' : "What You'll Get",
    stunningHero: language === 'ar' ? 'واجهة رئيسية مميزة' : language === 'fr' ? 'Section Hero Époustouflante' : 'Stunning Hero Section',
    heroDesc: language === 'ar' ? 'اترك انطباعاً أولياً قوياً بواجهة تعكس هويتك' : language === 'fr' ? 'Faites une première impression puissante avec un hero captivant' : 'Make a powerful first impression with a captivating hero that showcases your brand',
    analytics: language === 'ar' ? 'لوحة الإحصائيات' : language === 'fr' ? 'Tableau de Bord Analytique' : 'Analytics Dashboard',
    platformStats: language === 'ar' ? 'إحصائيات المنصات' : language === 'fr' ? 'Statistiques Plateformes' : 'Platform Stats',
    analyticsDesc: language === 'ar' ? 'أظهر للعلامات التجارية لماذا يجب التعاون معك. لوحة الإحصائيات تعرض عدد المتابعين ونسب التفاعل مباشرة.' : language === 'fr' ? 'Montrez aux marques pourquoi elles devraient travailler avec vous. Votre tableau de bord affiche les statistiques en temps réel.' : 'Show brands exactly why they should work with you. Your analytics dashboard displays real-time follower counts, engagement rates, and audience demographics across all platforms.',
    features: language === 'ar' ? 'المميزات' : language === 'fr' ? 'Fonctionnalités' : 'Features',
    premiumFeatures: language === 'ar' ? 'مميزات حصرية' : language === 'fr' ? 'Fonctionnalités Premium' : 'Premium Features',
    everythingYouNeed: language === 'ar' ? 'كل ما تحتاجه للتميز على الإنترنت' : language === 'fr' ? 'Tout ce dont vous avez besoin pour briller dans le monde digital' : 'Everything you need to stand out in the digital world',
    howItWorks: language === 'ar' ? 'طريقة العمل' : language === 'fr' ? 'Comment Ça Marche' : 'How It Works',
    ourProcess: language === 'ar' ? 'خطوات العمل' : language === 'fr' ? 'Notre Processus' : 'Our Process',
    fromConceptToLaunch: language === 'ar' ? 'من الفكرة إلى الإطلاق في أربع خطوات' : language === 'fr' ? 'Du concept au lancement en quatre étapes simples' : 'From concept to launch in four simple steps',
    readyToStandOut: language === 'ar' ? 'جاهز للبداية؟' : language === 'fr' ? 'Prêt à Vous Démarquer?' : 'Ready to Stand Out?',
    ctaDesc: language === 'ar' ? 'انضم لأفضل صناع المحتوى الذين يثقون بنا لبناء مواقعهم' : language === 'fr' ? 'Rejoignez les créateurs de contenu d\'élite qui nous font confiance pour leur présence web premium' : 'Join elite content creators who trust us with their premium web presence',
    startYourProject: language === 'ar' ? 'ابدأ مشروعك' : language === 'fr' ? 'Démarrer Votre Projet' : 'Start Your Project',
    viewAllServices: language === 'ar' ? 'عرض كل الخدمات' : language === 'fr' ? 'Voir Tous les Services' : 'View All Services',
    formTitle: language === 'ar' ? 'ابدأ مشروعك' : language === 'fr' ? 'Démarrer Votre Projet' : 'Start Your Project',
    formDesc: language === 'ar' ? 'أخبرنا عن مشروعك وسنتواصل معك قريباً.' : language === 'fr' ? 'Parlez-nous de votre projet et nous vous contacterons.' : 'Tell us about your project and we\'ll get back to you.',
    fullName: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom Complet' : 'Full Name',
    email: language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email',
    phone: language === 'ar' ? 'رقم الجوال' : language === 'fr' ? 'Téléphone' : 'Phone',
    message: language === 'ar' ? 'رسالتك' : language === 'fr' ? 'Message' : 'Message',
    optional: language === 'ar' ? 'اختياري' : language === 'fr' ? 'Optionnel' : 'Optional',
    submit: language === 'ar' ? 'إرسال الطلب' : language === 'fr' ? 'Soumettre la Demande' : 'Submit Application',
    submitting: language === 'ar' ? 'جاري الإرسال...' : language === 'fr' ? 'Envoi...' : 'Submitting...',
    successTitle: language === 'ar' ? 'تم الإرسال!' : language === 'fr' ? 'Soumission Réussie!' : 'Application Submitted!',
    successDesc: language === 'ar' ? 'شكراً لك! سنتواصل معك خلال ٢٤-٤٨ ساعة.' : language === 'fr' ? 'Merci pour votre intérêt! Nous vous contacterons dans 24-48 heures.' : 'Thank you for your interest! We\'ll be in touch within 24-48 hours.',
    close: language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close',
    needMoreOptions: language === 'ar' ? 'تحتاج المزيد؟' : language === 'fr' ? 'Besoin de plus d\'options?' : 'Need more options?',
    detailedForm: language === 'ar' ? 'املأ النموذج المفصل' : language === 'fr' ? 'Remplir le formulaire détaillé' : 'Fill out the detailed form'
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast({
        title: language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : language === 'fr' ? 'Veuillez remplir les champs requis' : 'Please fill in required fields',
        variant: 'destructive'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Save to database
      const {
        error: dbError
      } = await supabase.from('service_applications').insert({
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
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : language === 'fr' ? 'Une erreur s\'est produite. Veuillez réessayer.' : 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
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
    title: language === 'ar' ? 'تصميم احترافي مخصص' : language === 'fr' ? 'Design Luxueux Personnalisé' : 'Custom Luxury Design',
    description: language === 'ar' ? 'تصميم فريد يعكس هويتك ويميزك عن الآخرين' : language === 'fr' ? 'Design unique qui reflète votre marque personnelle' : 'Unique design that reflects your personal brand and sets you apart from competitors'
  }, {
    icon: Smartphone,
    title: language === 'ar' ? 'متوافق مع الجوال' : language === 'fr' ? 'Mobile First' : 'Mobile First',
    description: language === 'ar' ? 'تجربة مثالية على جميع الأجهزة' : language === 'fr' ? 'Expérience parfaite sur tous les appareils' : 'Perfect experience across all devices, from mobile to desktop'
  }, {
    icon: Zap,
    title: language === 'ar' ? 'سرعة عالية' : language === 'fr' ? 'Ultra Rapide' : 'Lightning Fast',
    description: language === 'ar' ? 'تحميل سريع يبقي الزوار على موقعك' : language === 'fr' ? 'Chargement rapide pour garder les visiteurs engagés' : 'Fast loading keeps visitors engaged and improves your search rankings'
  }, {
    icon: Layout,
    title: language === 'ar' ? 'معرض أعمال احترافي' : language === 'fr' ? 'Portfolio Interactif' : 'Interactive Portfolio',
    description: language === 'ar' ? 'اعرض أعمالك بشكل احترافي لجذب الشراكات' : language === 'fr' ? 'Présentez votre travail professionnellement' : 'Showcase your work professionally to attract brand partnerships'
  }, {
    icon: TrendingUp,
    title: language === 'ar' ? 'مُحسّن للنتائج' : language === 'fr' ? 'Optimisé Conversion' : 'Conversion Optimized',
    description: language === 'ar' ? 'صفحات مصممة لتحويل الزوار إلى عملاء' : language === 'fr' ? 'Pages conçues pour convertir les visiteurs' : 'Pages designed to convert visitors into clients and partnerships'
  }, {
    icon: Globe,
    title: language === 'ar' ? 'دعم لغات متعددة' : language === 'fr' ? 'Support Multilingue' : 'Multi-language Support',
    description: language === 'ar' ? 'وصول عالمي بدعم لغات متعددة' : language === 'fr' ? 'Touchez une audience mondiale' : 'Reach a global audience with multi-language content support'
  }];
  const process = [{
    step: '01',
    title: language === 'ar' ? 'التعرف' : language === 'fr' ? 'Découverte' : 'Discovery',
    description: language === 'ar' ? 'نتعرف على هويتك وأهدافك' : language === 'fr' ? 'Nous comprenons votre marque et vos objectifs' : 'We understand your brand and goals'
  }, {
    step: '02',
    title: language === 'ar' ? 'التصميم' : language === 'fr' ? 'Design' : 'Design',
    description: language === 'ar' ? 'نصمم تجربة فريدة لك' : language === 'fr' ? 'Nous créons une expérience unique pour vous' : 'We craft a unique experience for you'
  }, {
    step: '03',
    title: language === 'ar' ? 'البرمجة' : language === 'fr' ? 'Développement' : 'Development',
    description: language === 'ar' ? 'نبني موقعك بأحدث التقنيات' : language === 'fr' ? 'Nous construisons avec les dernières technologies' : 'We build with cutting-edge tech'
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
            <span className="hidden sm:inline">{t.back}</span>
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
              {language === 'ar' ? <>مواقع فاخرة لصنّاع <br /><span className="text-rose-400">المحتوى</span></> : language === 'fr' ? <>Sites Premium pour <br /><span className="text-rose-400">Créateurs</span></> : <>Premium Content Creator<br /><span className="text-rose-400">Sites</span></>}
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
              {t.heroSubtitle}
            </p>
            <Button size="lg" className="rounded-full px-8 bg-white text-neutral-950 hover:bg-neutral-200" onClick={() => setIsModalOpen(true)}>
              {t.startProject}
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
              {t.whatYoullGet}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
              {language === 'ar' ? <>قسم رئيسي <span className="text-rose-400">مذهل</span></> : language === 'fr' ? <>Section Hero <span className="text-rose-400">Époustouflante</span></> : <>Stunning <span className="text-rose-400">Hero Section</span></>}
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              {t.heroDesc}
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
        }} className="relative max-w-4xl mx-auto" dir="ltr">
            <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl" dir="ltr">
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

            {/* Floating Stats Cards - Only on larger screens */}
            

            

            
          </motion.div>
        </div>
      </section>

      {/* Analytics Dashboard Section */}
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
              {t.platformStats}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
              {language === 'ar' ? <>لوحة <span className="text-rose-400">التحليلات</span></> : language === 'fr' ? <>Tableau de Bord <span className="text-rose-400">Analytique</span></> : <><span className="text-rose-400">Analytics</span> Dashboard</>}
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              {t.analyticsDesc}
            </p>
          </motion.div>

          {/* Dashboard Preview */}
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
        }} className="relative max-w-4xl mx-auto" dir="ltr">
            <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl p-6 md:p-8" dir="ltr">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-neutral-800/50 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-1">Total Followers</p>
                  <p className="text-2xl font-bold text-white">3.2M</p>
                  <p className="text-xs text-green-400">↑ 12% this month</p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-1">Engagement Rate</p>
                  <p className="text-2xl font-bold text-rose-400">8.5%</p>
                  <p className="text-xs text-green-400">↑ 2.3% vs avg</p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-1">Brand Deals</p>
                  <p className="text-2xl font-bold text-purple-400">50+</p>
                  <p className="text-xs text-neutral-500">Completed</p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-1">Avg. Views</p>
                  <p className="text-2xl font-bold text-cyan-400">450K</p>
                  <p className="text-xs text-green-400">↑ 18% this week</p>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="bg-neutral-800/50 rounded-xl p-4 h-48 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => <div key={i} className="flex-1 bg-rose-500/30 rounded-t" style={{
                height: `${height}%`
              }}>
                    <div className="w-full bg-rose-500 rounded-t" style={{
                  height: '60%'
                }} />
                  </div>)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
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
              {t.features}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
              {language === 'ar' ? <>مميزات <span className="text-rose-400">متميزة</span></> : language === 'fr' ? <>Fonctionnalités <span className="text-rose-400">Premium</span></> : <>Premium <span className="text-rose-400">Features</span></>}
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              {t.everythingYouNeed}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <motion.div key={feature.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-rose-500/30 transition-colors">
                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-neutral-400 text-sm">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* How It Works */}
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
              {t.ourProcess}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
              {language === 'ar' ? <>كيف <span className="text-rose-400">يعمل</span></> : language === 'fr' ? <>Comment Ça <span className="text-rose-400">Marche</span></> : <>How It <span className="text-rose-400">Works</span></>}
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              {t.fromConceptToLaunch}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {process.map((step, index) => <motion.div key={step.step} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="text-center relative">
                {index < process.length - 1 && <div dir="ltr" className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-neutral-800" />}
                <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-2xl mx-auto mb-4 flex items-center justify-center relative z-10">
                  <span className="text-xl font-bold text-rose-400">{step.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-sm">{step.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold mb-6">
              {language === 'ar' ? <>مستعد <span className="text-rose-400">للتميز؟</span></> : language === 'fr' ? <>Prêt à Vous <span className="text-rose-400">Démarquer?</span></> : <>Ready to <span className="text-rose-400">Stand Out?</span></>}
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8 md:mb-10 px-4">
              {t.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white px-8 md:px-10 py-5 md:py-6 text-base md:text-lg rounded-full w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
                {t.startYourProject}
              </Button>
              <Link to="/#services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 md:px-10 py-5 md:py-6 text-base md:text-lg rounded-full w-full">
                  {t.viewAllServices}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-neutral-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AYN</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Application Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          {isSuccess ? <div className="text-center py-8">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.successTitle}</h3>
              <p className="text-neutral-400 mb-6">{t.successDesc}</p>
              <Button onClick={handleCloseModal} className="bg-rose-500 hover:bg-rose-600">
                {t.close}
              </Button>
            </div> : <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">{t.formTitle}</DialogTitle>
                <DialogDescription className="text-neutral-400">{t.formDesc}</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.fullName} *</Label>
                  <Input id="fullName" required value={formData.fullName} onChange={e => setFormData({
                ...formData,
                fullName: e.target.value
              })} className="bg-neutral-800 border-neutral-700 text-white" placeholder={language === 'ar' ? 'اسمك' : language === 'fr' ? 'Votre nom' : 'Your name'} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email} *</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} className="bg-neutral-800 border-neutral-700 text-white" placeholder={language === 'ar' ? 'بريدك@email.com' : 'your@email.com'} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone} ({t.optional})</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({
                ...formData,
                phone: e.target.value
              })} className="bg-neutral-800 border-neutral-700 text-white" placeholder="+1 (555) 000-0000" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">{t.message} ({t.optional})</Label>
                  <Textarea id="message" value={formData.message} onChange={e => setFormData({
                ...formData,
                message: e.target.value
              })} className="bg-neutral-800 border-neutral-700 text-white resize-none" placeholder={language === 'ar' ? 'أخبرنا عن احتياجاتك...' : language === 'fr' ? 'Parlez-nous de vos besoins...' : 'Tell us about your needs...'} rows={3} />
                </div>
                
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                  {isSubmitting ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.submitting}
                    </> : t.submit}
                </Button>
                
                <p className="text-xs text-neutral-500 text-center">
                  {t.needMoreOptions}{' '}
                  <Link to="/services/content-creator-sites/apply" className="text-rose-400 hover:underline">
                    {t.detailedForm}
                  </Link>
                </p>
              </form>
            </>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default InfluencerSites;
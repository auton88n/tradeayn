import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Box, FileDown, Sparkles, Building2, Ruler, Layers, FileText, HardHat, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, createServiceSchema, createBreadcrumbSchema } from '@/components/SEO';
import EngineeringMockup from '@/components/services/EngineeringMockup';
const CivilEngineering = () => {
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
  const t = {
    back: language === 'ar' ? 'عودة' : language === 'fr' ? 'Retour' : 'Back',
    heroTitle: language === 'ar' ? 'أدوات الهندسة المدنية' : language === 'fr' ? 'Outils de Génie Civil' : 'Civil Engineering Tools',
    heroSubtitle: language === 'ar' ? 'حاسبات إنشائية احترافية مع تصور ثلاثي الأبعاد وتحليل مدعوم بالذكاء الاصطناعي لتصميم هياكل آمنة وفعالة.' : language === 'fr' ? 'Calculateurs structurels professionnels avec visualisation 3D et analyse IA pour des structures sûres et efficaces.' : 'Professional structural calculators with 3D visualization and AI-powered analysis for safe and efficient structural design.',
    tryNow: language === 'ar' ? 'جرب الآن' : language === 'fr' ? 'Essayer Maintenant' : 'Try Now',
    contactUs: language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Nous Contacter' : 'Contact Us',
    calculators: language === 'ar' ? 'الحاسبات' : language === 'fr' ? 'Calculateurs' : 'Calculators',
    calculatorsTitle: language === 'ar' ? 'حاسبات إنشائية احترافية' : language === 'fr' ? 'Calculateurs Structurels Pro' : 'Professional Structural Calculators',
    visualization: language === 'ar' ? 'التصور' : language === 'fr' ? 'Visualisation' : 'Visualization',
    visualization3D: language === 'ar' ? 'تصور ثلاثي الأبعاد تفاعلي' : language === 'fr' ? 'Visualisation 3D Interactive' : 'Interactive 3D Visualization',
    visualizationDesc: language === 'ar' ? 'شاهد تصاميمك الإنشائية بشكل ثلاثي الأبعاد مع تحليل الإجهادات والأحمال في الوقت الفعلي.' : language === 'fr' ? 'Visualisez vos conceptions structurelles en 3D avec une analyse des contraintes en temps réel.' : 'Visualize your structural designs in 3D with real-time stress and load analysis.',
    export: language === 'ar' ? 'التصدير' : language === 'fr' ? 'Export' : 'Export',
    exportTitle: language === 'ar' ? 'تصدير احترافي' : language === 'fr' ? 'Export Professionnel' : 'Professional Export',
    exportDesc: language === 'ar' ? 'صدّر تصاميمك بصيغة DXF للاستخدام في AutoCAD وبرامج CAD الأخرى، أو احصل على تقارير PDF مفصلة.' : language === 'fr' ? 'Exportez vos designs en DXF pour AutoCAD et autres logiciels CAO, ou obtenez des rapports PDF détaillés.' : 'Export your designs in DXF format for AutoCAD and other CAD software, or get detailed PDF reports.',
    features: language === 'ar' ? 'المميزات' : language === 'fr' ? 'Fonctionnalités' : 'Features',
    featuresTitle: language === 'ar' ? 'كل ما تحتاجه للتصميم الإنشائي' : language === 'fr' ? 'Tout pour la Conception Structurelle' : 'Everything for Structural Design',
    readyTitle: language === 'ar' ? 'جاهز للبدء؟' : language === 'fr' ? 'Prêt à Commencer?' : 'Ready to Get Started?',
    readyDesc: language === 'ar' ? 'ابدأ باستخدام أدوات الهندسة المدنية الاحترافية اليوم.' : language === 'fr' ? 'Commencez à utiliser les outils de génie civil professionnels dès aujourd\'hui.' : 'Start using professional civil engineering tools today.',
    formTitle: language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contactez-nous' : 'Contact Us',
    formDesc: language === 'ar' ? 'أخبرنا عن مشروعك وسنتواصل معك.' : language === 'fr' ? 'Parlez-nous de votre projet et nous vous contacterons.' : 'Tell us about your project and we\'ll get in touch.',
    fullName: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom Complet' : 'Full Name',
    email: language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email',
    phone: language === 'ar' ? 'رقم الجوال' : language === 'fr' ? 'Téléphone' : 'Phone',
    optional: language === 'ar' ? 'اختياري' : language === 'fr' ? 'optionnel' : 'optional',
    message: language === 'ar' ? 'رسالتك' : language === 'fr' ? 'Message' : 'Message',
    submit: language === 'ar' ? 'إرسال' : language === 'fr' ? 'Envoyer' : 'Submit',
    submitting: language === 'ar' ? 'جاري الإرسال...' : language === 'fr' ? 'Envoi...' : 'Submitting...',
    successTitle: language === 'ar' ? 'تم الإرسال!' : language === 'fr' ? 'Message Envoyé!' : 'Message Sent!',
    successDesc: language === 'ar' ? 'سنتواصل معك قريباً.' : language === 'fr' ? 'Nous vous contacterons bientôt.' : 'We\'ll be in touch soon.',
    close: language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close'
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error: dbError
      } = await supabase.from('service_applications').insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message || null,
        service_type: 'civil_engineering',
        status: 'new'
      });
      if (dbError) throw dbError;
      const {
        error: emailError
      } = await supabase.functions.invoke('send-application-email', {
        body: {
          applicantName: formData.fullName,
          applicantEmail: formData.email,
          serviceType: 'Civil Engineering Tools',
          formData: {
            'Full Name': formData.fullName,
            'Email': formData.email,
            'Phone': formData.phone || 'Not provided',
            'Message': formData.message || 'No message provided'
          }
        }
      });
      if (emailError) console.error('Email error:', emailError);
      setIsSuccess(true);
      toast({
        title: t.successTitle,
        description: t.successDesc
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSuccess(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      message: ''
    });
  };
  const calculators = [{
    icon: Building2,
    title: language === 'ar' ? 'حاسبة الأعمدة' : language === 'fr' ? 'Calculateur de Colonnes' : 'Column Calculator',
    description: language === 'ar' ? 'تصميم وتحليل الأعمدة الخرسانية المسلحة' : language === 'fr' ? 'Conception et analyse des colonnes en béton armé' : 'Design and analyze reinforced concrete columns'
  }, {
    icon: Layers,
    title: language === 'ar' ? 'حاسبة الكمرات' : language === 'fr' ? 'Calculateur de Poutres' : 'Beam Calculator',
    description: language === 'ar' ? 'حساب العزوم والقص والتسليح للكمرات' : language === 'fr' ? 'Calcul des moments, du cisaillement et du ferraillage' : 'Calculate moments, shear, and reinforcement for beams'
  }, {
    icon: Box,
    title: language === 'ar' ? 'حاسبة البلاطات' : language === 'fr' ? 'Calculateur de Dalles' : 'Slab Calculator',
    description: language === 'ar' ? 'تصميم البلاطات الخرسانية بأنواعها' : language === 'fr' ? 'Conception de dalles en béton de tous types' : 'Design concrete slabs of all types'
  }, {
    icon: FileText,
    title: language === 'ar' ? 'حاسبة الأساسات' : language === 'fr' ? 'Calculateur de Fondations' : 'Foundation Calculator',
    description: language === 'ar' ? 'تصميم الأساسات المنفردة والشريطية' : language === 'fr' ? 'Conception des fondations isolées et filantes' : 'Design isolated and strip foundations'
  }, {
    icon: Ruler,
    title: language === 'ar' ? 'حاسبة الجدران الاستنادية' : language === 'fr' ? 'Calculateur de Murs de Soutènement' : 'Retaining Wall Calculator',
    description: language === 'ar' ? 'تصميم جدران الاستناد مع تحليل الاستقرار' : language === 'fr' ? 'Conception des murs de soutènement avec analyse de stabilité' : 'Design retaining walls with stability analysis'
  }];
  const features = [{
    icon: Calculator,
    title: language === 'ar' ? '5 حاسبات احترافية' : language === 'fr' ? '5 Calculateurs Pro' : '5 Professional Calculators',
    description: language === 'ar' ? 'أعمدة، كمرات، بلاطات، أساسات، وجدران استنادية' : language === 'fr' ? 'Colonnes, poutres, dalles, fondations et murs de soutènement' : 'Columns, beams, slabs, foundations, and retaining walls'
  }, {
    icon: Box,
    title: language === 'ar' ? 'تصور ثلاثي الأبعاد' : language === 'fr' ? 'Visualisation 3D' : '3D Visualization',
    description: language === 'ar' ? 'شاهد تصاميمك بشكل تفاعلي' : language === 'fr' ? 'Visualisez vos conceptions de manière interactive' : 'View your designs interactively'
  }, {
    icon: FileDown,
    title: language === 'ar' ? 'تصدير DXF' : language === 'fr' ? 'Export DXF' : 'DXF Export',
    description: language === 'ar' ? 'للاستخدام في AutoCAD' : language === 'fr' ? 'Pour utilisation dans AutoCAD' : 'For use in AutoCAD'
  }, {
    icon: Sparkles,
    title: language === 'ar' ? 'تحليل بالذكاء الاصطناعي' : language === 'fr' ? 'Analyse IA' : 'AI Analysis',
    description: language === 'ar' ? 'توصيات ذكية للتصميم' : language === 'fr' ? 'Recommandations intelligentes' : 'Smart design recommendations'
  }, {
    icon: FileText,
    title: language === 'ar' ? 'تقارير PDF' : language === 'fr' ? 'Rapports PDF' : 'PDF Reports',
    description: language === 'ar' ? 'تقارير مفصلة للمشاريع' : language === 'fr' ? 'Rapports détaillés pour projets' : 'Detailed reports for projects'
  }, {
    icon: HardHat,
    title: language === 'ar' ? 'معايير البناء' : language === 'fr' ? 'Normes de Construction' : 'Building Codes',
    description: language === 'ar' ? 'متوافق مع ACI و Saudi Building Code' : language === 'fr' ? 'Conforme aux normes ACI et Saudi Building Code' : 'Compliant with ACI and Saudi Building Code'
  }];
  const breadcrumbSchema = createBreadcrumbSchema([{
    name: 'Home',
    url: 'https://aynn.io/'
  }, {
    name: 'Services',
    url: 'https://aynn.io/#services'
  }, {
    name: 'Civil Engineering',
    url: 'https://aynn.io/services/civil-engineering'
  }]);
  const serviceSchema = createServiceSchema({
    name: 'Civil Engineering Tools',
    description: 'Professional structural calculators with 3D visualization and AI-powered analysis.',
    url: 'https://aynn.io/services/civil-engineering'
  });
  return <>
      <SEO title="Civil Engineering Tools - Structural Calculators & 3D Visualization" description="Professional structural calculators for columns, beams, slabs, foundations, and retaining walls. Features 3D visualization and AI-powered analysis." canonical="/services/civil-engineering" keywords="civil engineering, structural calculator, beam calculator, column design, foundation calculator, 3D visualization, DXF export" jsonLd={{
      '@graph': [breadcrumbSchema, serviceSchema]
    }} />
      <div className="min-h-screen bg-neutral-950 text-white">
        {/* Back Button */}
        <Link to="/" className="fixed top-4 md:top-6 left-4 md:left-6 z-50">
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-full px-4 py-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.back}</span>
          </Button>
        </Link>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-6 py-20 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <motion.div initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.8
            }}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6">
                  {language === 'ar' ? <>أدوات <span className="text-cyan-400">الهندسة المدنية</span></> : language === 'fr' ? <>Outils de <span className="text-cyan-400">Génie Civil</span></> : <>Civil <span className="text-cyan-400">Engineering</span> Tools</>}
                </h1>
                <p className="text-lg md:text-xl text-neutral-400 mb-8">
                  {t.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/engineering">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg rounded-full">
                      <HardHat className="w-5 h-5 mr-2" />
                      {t.tryNow}
                    </Button>
                  </Link>
                  
                </div>
              </motion.div>

              {/* Right side - Engineering Mockup */}
              <motion.div initial={{
              opacity: 0,
              scale: 0.9
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              duration: 0.8,
              delay: 0.2
            }} className="flex justify-center">
                <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/50 border border-neutral-700/50 overflow-hidden">
                  <EngineeringMockup />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Calculators Section */}
        <section className="py-24 px-4 md:px-6 relative">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-4 block">
                {t.calculators}
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                {t.calculatorsTitle}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calculators.map((calc, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="group bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                    <calc.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{calc.title}</h3>
                  <p className="text-neutral-400">{calc.description}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* 3D Visualization Section */}
        <section className="py-24 px-4 md:px-6 bg-neutral-900/50">
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
                <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-4 block">
                  {t.visualization}
                </span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                  {t.visualization3D}
                </h2>
                <p className="text-lg text-neutral-400 mb-8">
                  {t.visualizationDesc}
                </p>
                <ul className="space-y-4">
                  {[language === 'ar' ? 'تحريك وتدوير بحرية كاملة' : language === 'fr' ? 'Rotation et déplacement libres' : 'Free rotation and movement', language === 'ar' ? 'عرض الإجهادات والتشوهات' : language === 'fr' ? 'Affichage des contraintes et déformations' : 'Stress and deformation display', language === 'ar' ? 'تصدير صور عالية الجودة' : language === 'fr' ? 'Export d\'images haute qualité' : 'High-quality image export'].map((item, i) => <li key={i} className="flex items-center gap-3 text-neutral-300">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      </div>
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
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-neutral-800 overflow-hidden relative">
                  {/* 3D Building visualization */}
                  <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=600&fit=crop" alt="Modern building architecture" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                  <motion.div className="absolute inset-0 flex items-center justify-center" animate={{
                  scale: [1, 1.05, 1]
                }} transition={{
                  duration: 4,
                  repeat: Infinity
                }}>
                    <div className="text-center">
                      <Box className="w-20 h-20 text-cyan-400 mx-auto mb-2" strokeWidth={1} />
                      <p className="text-cyan-400 text-sm font-medium">3D Structural View</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Export Section */}
        <section className="py-24 px-4 md:px-6">
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
                <div className="aspect-video rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 overflow-hidden relative">
                  {/* Blueprint/CAD visualization */}
                  <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=450&fit=crop" alt="Architectural blueprints and construction plans" className="w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <FileDown className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                      <div className="flex gap-4 justify-center">
                        <motion.div className="px-4 py-2 bg-cyan-500/20 rounded-lg text-cyan-400 text-sm font-medium border border-cyan-500/30" whileHover={{
                        scale: 1.05
                      }}>
                          .DXF
                        </motion.div>
                        <motion.div className="px-4 py-2 bg-blue-500/20 rounded-lg text-blue-400 text-sm font-medium border border-blue-500/30" whileHover={{
                        scale: 1.05
                      }}>
                          .PDF
                        </motion.div>
                      </div>
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
                <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-4 block">
                  {t.export}
                </span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                  {t.exportTitle}
                </h2>
                <p className="text-lg text-neutral-400 mb-8">
                  {t.exportDesc}
                </p>
                <ul className="space-y-4">
                  {[language === 'ar' ? 'ملفات DXF متوافقة مع AutoCAD' : language === 'fr' ? 'Fichiers DXF compatibles AutoCAD' : 'AutoCAD-compatible DXF files', language === 'ar' ? 'تقارير PDF تفصيلية' : language === 'fr' ? 'Rapports PDF détaillés' : 'Detailed PDF reports', language === 'ar' ? 'جاهز للطباعة والتنفيذ' : language === 'fr' ? 'Prêt pour impression et exécution' : 'Ready for printing and execution'].map((item, i) => <li key={i} className="flex items-center gap-3 text-neutral-300">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      {item}
                    </li>)}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 md:px-6 bg-neutral-900/50">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-4 block">
                {t.features}
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold">
                {t.featuresTitle}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            }} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-neutral-400 text-sm">{feature.description}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 md:px-6">
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
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                {t.readyTitle}
              </h2>
              <p className="text-lg text-neutral-400 mb-8">
                {t.readyDesc}
              </p>
              <Link to="/engineering">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-12 py-6 text-lg rounded-full">
                  <HardHat className="w-5 h-5 mr-2" />
                  {t.tryNow}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Contact Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
            {!isSuccess ? <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{t.formTitle}</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    {t.formDesc}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="fullName" className="text-white">{t.fullName}</Label>
                    <Input id="fullName" value={formData.fullName} onChange={e => setFormData({
                  ...formData,
                  fullName: e.target.value
                })} required className="bg-neutral-800 border-neutral-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">{t.email}</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} required className="bg-neutral-800 border-neutral-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">
                      {t.phone} <span className="text-neutral-500">({t.optional})</span>
                    </Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} className="bg-neutral-800 border-neutral-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-white">
                      {t.message} <span className="text-neutral-500">({t.optional})</span>
                    </Label>
                    <Textarea id="message" value={formData.message} onChange={e => setFormData({
                  ...formData,
                  message: e.target.value
                })} className="bg-neutral-800 border-neutral-700 text-white mt-1" rows={3} />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.submitting}</> : t.submit}
                  </Button>
                </form>
              </> : <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t.successTitle}</h3>
                <p className="text-neutral-400 mb-6">{t.successDesc}</p>
                <Button onClick={handleCloseModal} variant="outline" className="border-neutral-700">
                  {t.close}
                </Button>
              </div>}
          </DialogContent>
        </Dialog>
      </div>
    </>;
};
export default CivilEngineering;
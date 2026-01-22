import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Smartphone, BarChart3, Calendar, Wifi, Palette, Check, Loader2, Ticket, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';
import TicketingMockup from '@/components/services/TicketingMockup';

const Ticketing = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
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
    title: language === 'ar' ? 'نظام التذاكر الذكي' : language === 'fr' ? 'Système de Billetterie Intelligent' : 'Smart Ticketing System',
    subtitle: language === 'ar' ? 'بيع التذاكر أونلاين والتحقق بمسح QR من الجوال' : language === 'fr' ? 'Vendez des billets en ligne et validez par scan QR' : 'Sell tickets online and validate with phone QR scanning',
    heroDescription: language === 'ar' 
      ? 'نظام متكامل لإدارة الفعاليات: بيع التذاكر إلكترونياً، إرسال رموز QR للهواتف، والتحقق الفوري عند الدخول.'
      : language === 'fr' 
      ? 'Système complet de gestion d\'événements: vente de billets en ligne, codes QR mobiles et validation instantanée.'
      : 'Complete event management: online ticket sales, mobile QR codes, and instant validation at entry.',
    getStarted: language === 'ar' ? 'ابدأ الآن' : language === 'fr' ? 'Commencer' : 'Get Started',
    back: language === 'ar' ? 'العودة' : language === 'fr' ? 'Retour' : 'Back',
    howItWorks: language === 'ar' ? 'كيف يعمل' : language === 'fr' ? 'Comment ça marche' : 'How It Works',
    features: language === 'ar' ? 'المميزات' : language === 'fr' ? 'Fonctionnalités' : 'Features',
    applyNow: language === 'ar' ? 'قدم طلبك الآن' : language === 'fr' ? 'Postuler maintenant' : 'Apply Now'
  };

  const features = [
    {
      icon: QrCode,
      title: language === 'ar' ? 'تذاكر QR آمنة' : language === 'fr' ? 'Billets QR Sécurisés' : 'Secure QR Tickets',
      description: language === 'ar' ? 'رمز QR فريد ومشفر لكل تذكرة' : language === 'fr' ? 'Code QR unique et crypté pour chaque billet' : 'Unique, encrypted QR code for each ticket'
    },
    {
      icon: Smartphone,
      title: language === 'ar' ? 'مسح بالجوال' : language === 'fr' ? 'Scan Mobile' : 'Phone Scanning',
      description: language === 'ar' ? 'تحقق فوري باستخدام أي هاتف ذكي' : language === 'fr' ? 'Validation instantanée avec n\'importe quel smartphone' : 'Instant validation with any smartphone'
    },
    {
      icon: BarChart3,
      title: language === 'ar' ? 'لوحة تحكم مباشرة' : language === 'fr' ? 'Tableau de Bord en Direct' : 'Real-time Dashboard',
      description: language === 'ar' ? 'تتبع المبيعات والحضور والإيرادات لحظياً' : language === 'fr' ? 'Suivez les ventes, la participation et les revenus en direct' : 'Track sales, attendance, and revenue live'
    },
    {
      icon: Calendar,
      title: language === 'ar' ? 'إدارة فعاليات متعددة' : language === 'fr' ? 'Multi-événements' : 'Multi-Event Support',
      description: language === 'ar' ? 'إدارة جميع فعالياتك من لوحة واحدة' : language === 'fr' ? 'Gérez tous vos événements depuis un tableau de bord' : 'Manage all your events from one dashboard'
    },
    {
      icon: Wifi,
      title: language === 'ar' ? 'وضع بدون إنترنت' : language === 'fr' ? 'Mode Hors Ligne' : 'Offline Mode',
      description: language === 'ar' ? 'مسح التذاكر حتى بدون اتصال إنترنت' : language === 'fr' ? 'Scannez les billets même sans connexion' : 'Scan tickets even without internet connection'
    },
    {
      icon: Palette,
      title: language === 'ar' ? 'تخصيص العلامة التجارية' : language === 'fr' ? 'Personnalisation de Marque' : 'Custom Branding',
      description: language === 'ar' ? 'شعارك وألوانك على كل تذكرة' : language === 'fr' ? 'Votre logo et couleurs sur chaque billet' : 'Your logo and colors on every ticket'
    }
  ];

  const steps = [
    {
      number: '01',
      title: language === 'ar' ? 'أنشئ فعاليتك' : language === 'fr' ? 'Créez votre événement' : 'Create Your Event',
      description: language === 'ar' ? 'حدد التفاصيل والأسعار والسعة' : language === 'fr' ? 'Définissez les détails, prix et capacité' : 'Set up details, pricing, and capacity'
    },
    {
      number: '02',
      title: language === 'ar' ? 'بيع التذاكر' : language === 'fr' ? 'Vendez les billets' : 'Sell Tickets',
      description: language === 'ar' ? 'العملاء يشترون ويستلمون رموز QR' : language === 'fr' ? 'Les clients achètent et reçoivent des codes QR' : 'Customers purchase and receive QR codes'
    },
    {
      number: '03',
      title: language === 'ar' ? 'امسح وادخل' : language === 'fr' ? 'Scannez et entrez' : 'Scan & Enter',
      description: language === 'ar' ? 'فريقك يتحقق من التذاكر بالجوال' : language === 'fr' ? 'Votre équipe valide avec téléphone' : 'Staff validates tickets with phone camera'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error: dbError } = await supabase.from('service_applications').insert({
        service_type: 'ticketing',
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        message: formData.message?.trim() || null
      });

      if (dbError) throw dbError;

      await supabase.functions.invoke('send-application-email', {
        body: {
          service: 'Smart Ticketing System',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        }
      });

      setIsSuccess(true);
      toast({
        title: language === 'ar' ? 'تم الإرسال بنجاح' : 'Application Submitted',
        description: language === 'ar' ? 'سنتواصل معك قريباً' : "We'll contact you soon"
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى' : 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (isSuccess) {
      setIsSuccess(false);
      setFormData({ fullName: '', email: '', phone: '', message: '' });
    }
  };

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://ayn-insight-forge.lovable.app' },
      { '@type': 'ListItem', position: 2, name: 'Smart Ticketing System', item: 'https://ayn-insight-forge.lovable.app/services/ticketing' }
    ]
  };

  return (
    <>
      <SEO
        title={`${t.title} | AYN`}
        description={t.heroDescription}
        canonical="/services/ticketing"
        keywords="ticketing system, QR code tickets, event management, mobile scanning, ticket validation"
        jsonLd={breadcrumbSchema}
      />
      
      <div className="min-h-screen bg-background">
        {/* Back Button */}
        <div className="fixed top-4 left-4 z-50">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-mono text-purple-500 tracking-wider uppercase mb-4">
                    <Ticket className="w-4 h-4" />
                    {language === 'ar' ? 'جديد' : 'NEW'}
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {t.title}
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8">
                    {t.heroDescription}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      {t.getStarted}
                    </Button>
                    <Link to="/services/ticketing/apply">
                      <Button size="lg" variant="outline">
                        {t.applyNow}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="w-full max-w-2xl h-[500px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-6 flex items-center justify-center overflow-visible">
                  <TicketingMockup />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.howItWorks}</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.features}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-2xl bg-muted/50 border border-border hover:border-purple-500/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-12 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {language === 'ar' ? 'جاهز لإدارة فعالياتك؟' : language === 'fr' ? 'Prêt à gérer vos événements?' : 'Ready to manage your events?'}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                {language === 'ar' ? 'ابدأ اليوم وحوّل طريقة إدارة التذاكر لديك' : language === 'fr' ? 'Commencez aujourd\'hui et transformez votre gestion des billets' : 'Start today and transform your ticket management'}
              </p>
              <Button size="lg" onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                {t.getStarted}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Quick Apply Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-500" />
                {t.title}
              </DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أدخل بياناتك وسنتواصل معك' : language === 'fr' ? 'Entrez vos informations et nous vous contacterons' : 'Enter your details and we\'ll get in touch'}
              </DialogDescription>
            </DialogHeader>
            
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {language === 'ar' ? 'تم الإرسال!' : language === 'fr' ? 'Envoyé!' : 'Submitted!'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'سنتواصل معك قريباً' : language === 'fr' ? 'Nous vous contacterons bientôt' : "We'll contact you soon"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full Name'} *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email'} *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone'}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{language === 'ar' ? 'رسالة' : language === 'fr' ? 'Message' : 'Message'}</Label>
                  <Textarea
                    id="message"
                    rows={3}
                    value={formData.message}
                    onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إرسال' : language === 'fr' ? 'Envoyer' : 'Submit')}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Ticketing;
